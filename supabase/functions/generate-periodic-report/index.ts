import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ReportRequest {
  user_id?: string;
  report_type?: "daily" | "weekly" | "monthly";
  // When called by cron, process all eligible users
  cron_trigger?: boolean;
}

function getPeriodRange(type: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  if (type === "daily") {
    start = new Date(now);
    start.setDate(start.getDate() - 1);
  } else if (type === "monthly") {
    start = new Date(now);
    start.setMonth(start.getMonth() - 1);
  } else {
    // weekly
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  }
  return { start, end };
}

async function generateReportForUser(
  supabase: any,
  userId: string,
  reportType: string,
  apiKey: string,
  skipCooldown: boolean = false
) {
  const { start, end } = getPeriodRange(reportType);
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  // Check cooldown (skip for manual triggers)
  if (!skipCooldown) {
    const cooldownHours = reportType === "daily" ? 20 : reportType === "weekly" ? 120 : 600;
    const cooldownMs = cooldownHours * 3600000;
    const { data: existing } = await supabase
      .from("periodic_reports")
      .select("id")
      .eq("user_id", userId)
      .eq("report_type", reportType)
      .gte("created_at", new Date(Date.now() - cooldownMs).toISOString())
      .limit(1);

    if (existing?.length) {
      console.log(`Skipping ${reportType} report for ${userId}: cooldown not expired (${cooldownHours}h)`);
      return null;
    }
  }

  // Fetch all relevant data in parallel
  const [emotionsRes, assessmentsRes, memoriesRes, plantsRes, profileRes, conversationsRes, entitiesRes] = await Promise.all([
    supabase.from("emotion_states")
      .select("dominant_emotion, valence, anxiety_score, desire_score, arousal, created_at")
      .eq("user_id", userId)
      .gte("created_at", startISO).lte("created_at", endISO)
      .order("created_at", { ascending: true }),
    supabase.from("assessment_results")
      .select("scale_type, total_score, max_score, severity, ai_summary, created_at")
      .eq("user_id", userId)
      .gte("created_at", startISO).lte("created_at", endISO)
      .order("created_at", { ascending: false }),
    supabase.from("user_memories")
      .select("category, content, importance, created_at")
      .eq("user_id", userId)
      .gte("created_at", startISO).lte("created_at", endISO)
      .order("importance", { ascending: false })
      .limit(20),
    supabase.from("plants")
      .select("mood_type, content, created_at")
      .eq("user_id", userId)
      .gte("created_at", startISO).lte("created_at", endISO)
      .order("created_at", { ascending: false }),
    supabase.from("profiles")
      .select("display_name, life_stage, garden_level, total_seeds")
      .eq("user_id", userId).single(),
    supabase.from("chat_messages")
      .select("role, created_at")
      .eq("user_id", userId)
      .gte("created_at", startISO).lte("created_at", endISO),
    supabase.from("knowledge_entities")
      .select("name, entity_type, mention_count")
      .eq("user_id", userId)
      .order("mention_count", { ascending: false })
      .limit(10),
  ]);

  const emotions = emotionsRes.data || [];
  const assessments = assessmentsRes.data || [];
  const memories = memoriesRes.data || [];
  const plants = plantsRes.data || [];
  const profile = profileRes.data;
  const messages = conversationsRes.data || [];
  const entities = entitiesRes.data || [];

  // Skip if too little data
  const dataPoints = emotions.length + assessments.length + plants.length + messages.length;
  console.log(`Data for ${userId}: emotions=${emotions.length}, assessments=${assessments.length}, plants=${plants.length}, messages=${messages.length}, total=${dataPoints}`);
  if (dataPoints < 2) {
    console.log(`Skipping report: insufficient data (${dataPoints} < 2)`);
    return null;
  }

  // Build data summary
  const periodLabel = reportType === "daily" ? "日报" : reportType === "weekly" ? "周报" : "月报";
  const dateRange = `${start.toLocaleDateString("zh-CN")} ~ ${end.toLocaleDateString("zh-CN")}`;

  const dataParts: string[] = [];
  dataParts.push(`报告类型: ${periodLabel}, 时间范围: ${dateRange}`);

  if (profile) {
    dataParts.push(`用户: ${profile.display_name || "匿名"}, 生命阶段: ${profile.life_stage || "未设置"}, 花园等级: Lv.${profile.garden_level}`);
  }

  if (emotions.length) {
    const avgValence = (emotions.reduce((s: number, e: any) => s + e.valence, 0) / emotions.length).toFixed(2);
    const avgAnxiety = (emotions.reduce((s: number, e: any) => s + e.anxiety_score, 0) / emotions.length * 100).toFixed(0);
    const emotionCounts: Record<string, number> = {};
    emotions.forEach((e: any) => { emotionCounts[e.dominant_emotion] = (emotionCounts[e.dominant_emotion] || 0) + 1; });
    const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e, c]) => `${e}(${c}次)`).join(", ");
    dataParts.push(`情绪记录: ${emotions.length}条 | 平均效价: ${avgValence} | 平均焦虑: ${avgAnxiety}% | 主要情绪: ${topEmotions}`);

    // Trend
    if (emotions.length >= 3) {
      const firstHalf = emotions.slice(0, Math.floor(emotions.length / 2));
      const secondHalf = emotions.slice(Math.floor(emotions.length / 2));
      const v1 = firstHalf.reduce((s: number, e: any) => s + e.valence, 0) / firstHalf.length;
      const v2 = secondHalf.reduce((s: number, e: any) => s + e.valence, 0) / secondHalf.length;
      dataParts.push(`情绪趋势: ${v2 > v1 ? "好转↑" : v2 < v1 ? "下降↓" : "稳定→"} (前半均值${v1.toFixed(2)}→后半${v2.toFixed(2)})`);
    }
  }

  if (assessments.length) {
    const assessStr = assessments.map((a: any) => {
      const d = new Date(a.created_at).toLocaleDateString("zh-CN");
      return `${d}: ${a.scale_type} ${a.total_score}/${a.max_score}(${a.severity})`;
    }).join("; ");
    dataParts.push(`评估记录: ${assessStr}`);
  }

  if (plants.length) {
    const moodCounts: Record<string, number> = {};
    plants.forEach((p: any) => { moodCounts[p.mood_type] = (moodCounts[p.mood_type] || 0) + 1; });
    dataParts.push(`花园种子: ${plants.length}颗 | 心情分布: ${Object.entries(moodCounts).map(([m, c]) => `${m}(${c})`).join(", ")}`);
  }

  if (messages.length) {
    const userMsgs = messages.filter((m: any) => m.role === "user").length;
    dataParts.push(`对话互动: ${userMsgs}条用户消息, ${messages.length - userMsgs}条AI回复`);
  }

  if (memories.length) {
    const catCounts: Record<string, number> = {};
    memories.forEach((m: any) => { catCounts[m.category] = (catCounts[m.category] || 0) + 1; });
    dataParts.push(`新增记忆: ${memories.length}条 | 分类: ${Object.entries(catCounts).map(([c, n]) => `${c}(${n})`).join(", ")}`);
  }

  if (entities.length) {
    dataParts.push(`关注对象: ${entities.map((e: any) => `${e.name}(${e.entity_type})`).join(", ")}`);
  }

  const systemPrompt = `你是明禾陪伴的心理健康${periodLabel}生成引擎。请基于用户数据生成专业、温暖的${periodLabel}。

输出JSON格式（直接输出，不要代码块包裹）：
{
  "title": "${periodLabel}标题（如：本周心理状态总览）",
  "period": "${dateRange}",
  "overall_mood": "整体情绪描述（20字内）",
  "mood_score": 0-100,
  "highlights": ["本周期亮点（限3条，每条20字内）"],
  "concerns": ["需关注事项（限2条，每条20字内，无则空数组）"],
  "emotion_summary": "情绪变化分析（80字内）",
  "behavior_insights": "行为模式洞察（60字内）",
  "recommendations": [
    {"action": "具体建议（20字内）", "reason": "原因（15字内）", "priority": "高/中/低"}
  ],
  "encouragement": "温暖鼓励语（30字内）",
  "next_goals": ["下一周期建议目标（限2条，15字内）"]
}

规则：
- recommendations限3-4条，必须具体可行
- 语言温暖但专业，避免空泛建议
- 基于实际数据，不要臆测
- 数据不足的维度说"数据较少，建议多记录"
- 不要提及任何技术术语或模型名称`;

  const userPrompt = dataParts.join("\n");

  const response = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    console.error("AI error:", response.status, await response.text());
    return null;
  }

  const aiData = await response.json();
  const content = aiData.choices?.[0]?.message?.content || "";

  // Parse JSON
  const clean = content.replace(/[\x00-\x1F\x7F]/g, (ch: string) =>
    ch === '\n' || ch === '\r' || ch === '\t' ? ch : ''
  );

  let report;
  try {
    report = JSON.parse(clean);
  } catch {
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || clean.match(/\{[\s\S]*\}/);
    if (match) {
      report = JSON.parse(match[1] || match[0]);
    } else {
      console.error("Failed to parse report JSON");
      return null;
    }
  }

  // Save to database
  const { data: saved, error } = await supabase.from("periodic_reports").insert({
    user_id: userId,
    report_type: reportType,
    report_data: report,
    summary: report.encouragement || report.overall_mood || "",
    period_start: startISO,
    period_end: endISO,
    is_read: false,
  }).select("id").single();

  if (error) {
    console.error("Save report error:", error);
    return null;
  }

  // Also save as a memory for chat context
  await supabase.from("user_memories").insert({
    user_id: userId,
    category: "periodic_report",
    content: `${periodLabel}(${dateRange}): 情绪${report.overall_mood || ""}，${report.emotion_summary || ""}。建议: ${(report.recommendations || []).map((r: any) => r.action).join("；")}`.slice(0, 500),
    importance: reportType === "monthly" ? 9 : reportType === "weekly" ? 7 : 5,
    source: "periodic_report",
  });

  return saved?.id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body: ReportRequest = await req.json();

    if (body.cron_trigger) {
      // Cron mode: find all users with report preferences and generate
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, report_frequency")
        .not("report_frequency", "is", null);

      const results: string[] = [];
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun
      const dayOfMonth = now.getDate();

      for (const p of profiles || []) {
        const freqs: string[] = p.report_frequency || ["weekly"];
        for (const freq of freqs) {
          // daily: every day; weekly: Sunday; monthly: 1st
          if (freq === "daily" ||
              (freq === "weekly" && dayOfWeek === 0) ||
              (freq === "monthly" && dayOfMonth === 1)) {
            try {
              const id = await generateReportForUser(supabase, p.user_id, freq, LOVABLE_API_KEY);
              if (id) results.push(`${p.user_id}:${freq}:${id}`);
            } catch (e) {
              console.error(`Report gen failed for ${p.user_id}:`, e);
            }
          }
        }
      }

      return new Response(JSON.stringify({ generated: results.length, details: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Manual trigger for a specific user
    let userId = body.user_id;
    if (!userId) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await anonClient.auth.getUser(token);
        userId = user?.id;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "未认证" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reportType = body.report_type || "weekly";
    const reportId = await generateReportForUser(supabase, userId, reportType, LOVABLE_API_KEY, true);

    return new Response(JSON.stringify({ success: !!reportId, report_id: reportId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("periodic report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
