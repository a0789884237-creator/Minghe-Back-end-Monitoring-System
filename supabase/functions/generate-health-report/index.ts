import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 心理健康风险评估模型元数据（按年龄段分组，含关键变量与模型精度）
const MODEL_META: Record<string, { model: string; auc: number; topVars: string[] }> = {
  under_3_proxy: {
    model: "XGBoost", auc: 0.868,
    topVars: ["晚间照管异常(29.1%)", "年龄(14.9%)", "白天照管异常(4.9%)", "屏幕时间异常(3.7%)", "未吃母乳(3.5%)", "就医次数(3.5%)", "不能说完整句(3.3%)", "不能数数(3.2%)", "睡眠异常(2.9%)", "不能走路(2.6%)"],
  },
  age_4_6_proxy: {
    model: "LightGBM", auc: 0.852,
    topVars: ["外出游玩频率低(15.1%)", "买书频率低(13.6%)", "年龄(10.6%)", "睡眠正常(8.9%)", "不能读简单句(8.5%)", "幼儿园类型(8.0%)", "不能数到100(6.7%)", "体重异常(5.6%)", "时间概念缺乏(5.5%)", "不承担家务(5.4%)"],
  },
  age_7_12_proxy: {
    model: "LightGBM", auc: 0.775,
    topVars: ["放弃看电视频率低(11.0%)", "不承担家务(9.3%)", "期望成绩(6.8%)", "课外辅导费(6.8%)", "年级(3.9%)", "数学成绩差(3.5%)", "生病处理方式(2.8%)", "农业户口(2.4%)", "是否重点班(2.0%)", "语文成绩差(1.9%)"],
  },
  age_13_17_self: {
    model: "XGBoost", auc: 0.987,
    topVars: ["觉得生活无法继续(41.1%)", "情绪低落(11.2%)", "悲伤难过(9.3%)", "睡眠不好(5.1%)", "感到孤独(4.1%)", "不感到愉快(3.4%)", "生活不快乐(3.2%)", "无午睡习惯(1.9%)", "做事费劲(1.5%)", "健康状况差(1.5%)"],
  },
  age_18_25_self: {
    model: "LightGBM", auc: 0.998,
    topVars: ["感到孤独(23.5k)", "睡眠不好(20.6k)", "做事费劲(16.9k)", "不感到愉快(16.9k)", "情绪低落(16.1k)", "生活不快乐(14.6k)", "悲伤难过(12.1k)", "觉得生活无法继续(11.1k)", "邻居信任度低(4.0k)", "生活意义低(3.9k)"],
  },
  age_26_35_self: {
    model: "LightGBM", auc: 0.998,
    topVars: ["睡眠不好(31.3k)", "感到孤独(21.7k)", "生活不快乐(21.0k)", "不感到愉快(20.1k)", "做事费劲(19.0k)", "情绪低落(18.4k)", "觉得生活无法继续(16.2k)", "悲伤难过(13.5k)", "年龄(4.6k)", "幸福感低(3.7k)"],
  },
  age_36_44_self: {
    model: "LightGBM", auc: 0.996,
    topVars: ["睡眠不好(33.5k)", "生活不快乐(23.3k)", "做事费劲(18.6k)", "感到孤独(17.1k)", "不感到愉快(16.7k)", "情绪低落(16.0k)", "悲伤难过(13.2k)", "觉得生活无法继续(9.6k)", "幸福感低(4.7k)", "生活意义低(4.4k)"],
  },
  age_45_59_self: {
    model: "XGBoost", auc: 0.998,
    topVars: ["悲伤难过(26.0%)", "觉得生活无法继续(17.1%)", "感到孤独(11.4%)", "情绪低落(8.8%)", "做事费劲(7.9%)", "生活不快乐(6.0%)", "睡眠不好(5.7%)", "不感到愉快(5.4%)", "身体不适异常(1.5%)", "幸福感低(1.0%)"],
  },
  age_60_74_self: {
    model: "RandomForest", auc: 0.990,
    topVars: ["悲伤难过(19.9%)", "觉得生活无法继续(14.7%)", "做事费劲(10.9%)", "感到孤独(10.3%)", "情绪低落(8.5%)", "生活不快乐(7.4%)", "睡眠不好(7.0%)", "不感到愉快(5.8%)", "幸福感低(1.7%)", "生活意义低(1.7%)"],
  },
  age_75plus_self: {
    model: "Ensemble", auc: 0.729,
    topVars: ["生活意义低(48.2%)", "年龄(36.1%)", "健康状况差(22.1%)", "睡眠异常(12.0%)", "日常生活困难(10.3%)", "睡眠正常(8.7%)", "农业户口(7.0%)", "不能独立外出(6.7%)", "不能独立购物(6.7%)", "不能做饭(5.4%)"],
  },
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assessmentData, ageGroup, answers, riskResult } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Get model metadata for this age group
    const meta = MODEL_META[ageGroup.id] || { model: "Unknown", auc: 0, topVars: [] };

    // Fetch user history context (concise)
    let userCtx = "";
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (authHeader) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);
        const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await anonClient.auth.getUser(token);
        if (user) {
          const [profileRes, prevRes] = await Promise.all([
            supabase.from("profiles").select("display_name, life_stage").eq("user_id", user.id).single(),
            supabase.from("assessment_results").select("scale_type, total_score, severity, created_at")
              .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
          ]);
          const parts: string[] = [];
          if (profileRes.data) parts.push(`用户: ${profileRes.data.display_name || "匿名"}, 阶段: ${profileRes.data.life_stage || "未设置"}`);
          if (prevRes.data?.length) {
            parts.push("历史评估: " + prevRes.data.map((a: any) => {
              const d = new Date(a.created_at).toLocaleDateString("zh-CN");
              return `${d}[${a.scale_type}]${a.total_score}分/${a.severity}`;
            }).join("; "));
          }
          if (parts.length) userCtx = "\n用户历史: " + parts.join(" | ");
        }
      } catch (e) { console.error("Context fetch error:", e); }
    }

    // Concise, accuracy-focused prompt
    const systemPrompt = `你是明禾陪伴的心理健康风险评估报告引擎。核心原则：**准确性优先**。

**严格禁止：在输出中绝对不能提及任何技术模型名称（如CFPS、XGBoost、LightGBM、RandomForest、CES-D、IMHI等）。所有表述必须使用自然语言，如"根据您的作答和综合分析"、"基于评估数据"等。**

你的分析必须严格基于：
1. 内部评估数据模型的变量重要性排序（精度${meta.auc}）
2. 用户的实际作答数据
3. 科学心理学证据

【本年龄段关键评估维度（按重要性降序，仅供内部分析参考，不要在输出中提及）】
${meta.topVars.map((v, i) => `${i + 1}. ${v}`).join("\n")}

【输出要求】直接输出JSON，不要代码块包裹：
{
  "report_title": "心理健康评估报告",
  "generated_at": "时间描述",
  "overall_assessment": {
    "summary": "基于评估数据的精准总结（80字内，不提及任何模型名称）",
    "risk_level": "正常/低风险/中风险/高风险/危机",
    "confidence": 0.0-1.0
  },
  "imhi_analysis": [
    {"dimension": "维度名", "signal_strength": 0.0-1.0, "level": "正常/轻度/中度/重度", "findings": "基于数据的发现（40字内）", "evidence": "具体数据支撑"}
  ],
  "risk_factors": ["风险因素（限3条）"],
  "protective_factors": ["保护因素（限3条）"],
  "detailed_report": "专业分析报告（150字内），引用具体变量得分，绝对不提及任何模型名称",
  "recommendations": [
    {"category": "分类", "suggestion": "具体建议（30字内）", "priority": "高/中/低"}
  ],
  "follow_up": "跟进建议（30字内）"
}

规则：
- imhi_analysis限4-5个最相关维度（不要凑8个）
- recommendations限3-4条
- 每个结论必须有数据证据
- 危机题项得分≥3时必须标注危机级别
- 年龄适配：${ageGroup.proxy ? "代答模式，关注发育和照护" : "自评模式，关注情绪和社会功能"}
- 再次强调：输出文本中严禁出现CFPS、XGBoost、LightGBM、RandomForest、CES-D、IMHI等任何技术术语`;

    const userPrompt = `年龄段: ${ageGroup.label}(${ageGroup.age}) ${ageGroup.proxy ? "[家长代答]" : "[自评]"}
风险得分: ${riskResult.riskScore}/100 | 等级: ${riskResult.riskLevel} | 概率: ${(riskResult.riskProbability * 100).toFixed(1)}%
${riskResult.cesdScore !== undefined ? `情绪量表得分: ${riskResult.cesdScore}/${riskResult.cesdMax}` : ""}
各维度: ${riskResult.dimensions.map((d: any) => `${d.name}${d.score}/${d.maxScore}(${d.level})`).join(" | ")}
风险因素: ${riskResult.riskFactors.length > 0 ? riskResult.riskFactors.join("；") : "无"}
答题数据:
${assessmentData}${userCtx}`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI Gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: response.status === 429 ? "请求过于频繁，请稍后再试" : "AI服务暂时不可用" }), {
        status: response.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Clean control characters and parse JSON
    const clean = content.replace(/[\x00-\x1F\x7F]/g, (ch: string) =>
      ch === '\n' || ch === '\r' || ch === '\t' ? ch : ''
    );

    let report;
    try {
      report = JSON.parse(clean);
    } catch {
      const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        report = JSON.parse(jsonMatch[1]);
      } else {
        const braceMatch = clean.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          report = JSON.parse(braceMatch[0]);
        } else {
          throw new Error("Failed to parse AI response as JSON");
        }
      }
    }

    // Save results to DB
    if (authHeader) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);
        const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await anonClient.auth.getUser(token);
        if (user) {
          const [latestRes] = await Promise.all([
            supabase.from("assessment_results").select("id").eq("user_id", user.id)
              .order("created_at", { ascending: false }).limit(1).single(),
          ]);
          if (latestRes.data) {
            await supabase.from("assessment_results")
              .update({ ai_summary: report.detailed_report || report.overall_assessment?.summary })
              .eq("id", latestRes.data.id);
          }
          await supabase.from("user_memories").insert({
            user_id: user.id,
            category: "health_assessment",
            content: `评估报告(${ageGroup.label}): ${riskResult.riskLevel}，${report.overall_assessment?.summary || ""}`.slice(0, 500),
            importance: riskResult.riskScore > 50 ? 9 : 6,
            source: "risk_assessment",
          });
        }
      } catch (e) { console.error("Save error:", e); }
    }

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-health-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
