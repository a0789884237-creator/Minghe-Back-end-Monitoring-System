import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { user_id, messages, assistant_response } = await req.json();
    if (!user_id || !messages?.length) {
      return new Response(JSON.stringify({ error: "Missing data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing formulation
    const { data: existing } = await supabase
      .from("case_formulations")
      .select("*")
      .eq("user_id", user_id)
      .single();

    // Build context for AI analysis
    const recentDialog = messages.slice(-10).map((m: any) => `${m.role}: ${m.content}`).join("\n");
    const existingStr = existing ? JSON.stringify({
      presenting_problems: existing.presenting_problems,
      core_beliefs: existing.core_beliefs,
      automatic_thoughts: existing.automatic_thoughts,
      emotions: existing.emotions,
      behaviors: existing.behaviors,
      triggering_factors: existing.triggering_factors,
      maintaining_factors: existing.maintaining_factors,
      protective_factors: existing.protective_factors,
      therapy_goals: existing.therapy_goals,
      current_stage: existing.current_stage,
      risk_level: existing.risk_level,
    }) : "无（首次概念化）";

    const systemPrompt = `你是一位临床心理学督导，负责基于对话内容更新来访者的个案概念化。

当前个案概念化：
${existingStr}

请基于最新对话内容，更新个案概念化。输出严格JSON格式（直接输出，不要代码块）：
{
  "presenting_problems": ["主要问题（最多5个，每个20字内）"],
  "core_beliefs": ["核心信念/图式（最多3个，如'我不够好''世界是危险的'）"],
  "automatic_thoughts": ["自动化思维模式（最多5个，如'灾难化思维''非黑即白'）"],
  "emotions": ["当前主要情绪（最多5个）"],
  "behaviors": ["关键行为模式（最多5个，如'社交回避''过度工作'）"],
  "triggering_factors": ["触发因素（最多4个）"],
  "maintaining_factors": ["维持因素（最多4个，如'回避行为强化焦虑'）"],
  "protective_factors": ["保护因素（最多4个，如'有稳定的社交支持'）"],
  "therapy_goals": ["治疗目标（最多3个，SMART原则）"],
  "current_stage": "exploration|understanding|intervention|consolidation|termination",
  "risk_level": "low|moderate|high|critical",
  "progress_notes": "本次对话要点与变化（50字内）"
}

规则：
- 保持已有信息的连续性，只在有新证据时更新
- 不要删除之前的关键信息，但可以修正
- core_beliefs 要符合CBT认知模型（Beck的认知三角）
- 用中文，简洁专业
- 如果信息不足，保留原有内容不变
- current_stage 根据对话深度和治疗进展判断`;

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `最近对话：\n${recentDialog}\n\nAI最新回复：${(assistant_response || "").slice(0, 500)}` },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error("AI error:", response.status);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let formulation;
    try {
      const clean = content.replace(/[\x00-\x1F\x7F]/g, (ch: string) =>
        ch === '\n' || ch === '\r' || ch === '\t' ? ch : ''
      );
      formulation = JSON.parse(clean);
    } catch {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      if (match) {
        formulation = JSON.parse(match[1] || match[0]);
      } else {
        console.error("Failed to parse formulation JSON");
        return new Response(JSON.stringify({ error: "Parse failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const sessionCount = (existing?.session_count || 0) + 1;

    if (existing) {
      await supabase.from("case_formulations").update({
        presenting_problems: formulation.presenting_problems || existing.presenting_problems,
        core_beliefs: formulation.core_beliefs || existing.core_beliefs,
        automatic_thoughts: formulation.automatic_thoughts || existing.automatic_thoughts,
        emotions: formulation.emotions || existing.emotions,
        behaviors: formulation.behaviors || existing.behaviors,
        triggering_factors: formulation.triggering_factors || existing.triggering_factors,
        maintaining_factors: formulation.maintaining_factors || existing.maintaining_factors,
        protective_factors: formulation.protective_factors || existing.protective_factors,
        therapy_goals: formulation.therapy_goals || existing.therapy_goals,
        current_stage: formulation.current_stage || existing.current_stage,
        risk_level: formulation.risk_level || existing.risk_level,
        progress_notes: formulation.progress_notes || existing.progress_notes,
        session_count: sessionCount,
      }).eq("user_id", user_id);
    } else {
      await supabase.from("case_formulations").insert({
        user_id,
        ...formulation,
        session_count: 1,
      });
    }

    return new Response(JSON.stringify({ success: true, session_count: sessionCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("case formulation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
