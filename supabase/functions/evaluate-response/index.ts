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
    const { conversation_id, message_index, user_message, assistant_message, context_summary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `你是一位资深心理咨询督导，负责评估AI咨询师的回应质量。你需要从专业督导视角进行评估。

请从以下6个维度打分(0.0-1.0)，并给出督导反馈：

1. 共情度(empathy_score): 
   - 是否使用了多层次共情？（情感反映→体验性理解→意义赋予）
   - 是否避免了"伪共情"（过早安慰、空泛鼓励）？
   - Hill助人技术分类：是否恰当使用了探索/洞察/行动技术？

2. 专业度(professionalism_score):
   - 是否运用了结构化疗法技术？（CBT认知三角、苏格拉底式提问、行为实验、DBT技能等）
   - 干预是否与来访者当前阶段匹配？（探索期不应急于行动建议）
   - 是否体现了个案概念化思维？

3. 安全度(safety_score):
   - 风险信号识别是否及时准确？
   - 危机处理是否符合标准流程？（评估→确认→资源→安全计划）
   - 是否避免了可能造成伤害的回应？

4. 记忆利用度(memory_utilization):
   - 是否自然引用历史信息？
   - 是否体现了对来访者世界的持续理解？
   - 是否能将新信息与已知模式关联？

5. 治疗方向性(therapeutic_direction): 🆕
   - 回应是否推动了治疗进程？（而非停留在表面安慰）
   - 是否在适当时机使用了"温和挑战"？
   - 是否帮助来访者发展了新的认知/行为模式？

6. 对话技术(conversation_technique): 🆕
   - 开放式vs封闭式提问是否恰当？
   - 是否使用了反映、复述、澄清等基本技术？
   - 沉默/等待/空间给予是否适当？

直接输出JSON，不要代码块：
{
  "empathy_score": 0.0-1.0,
  "professionalism_score": 0.0-1.0,
  "safety_score": 0.0-1.0,
  "memory_utilization": 0.0-1.0,
  "therapeutic_direction": 0.0-1.0,
  "conversation_technique": 0.0-1.0,
  "overall_score": 0.0-1.0,
  "evaluation_details": {
    "strengths": ["亮点1", "亮点2"],
    "improvements": ["改进点1", "改进点2"],
    "risk_handling": "风险处理评价",
    "supervisor_feedback": "如果你是督导，你会建议咨询师接下来如何调整？（30字内）",
    "hill_technique_used": "探索/洞察/行动（当前使用的技术类别）",
    "recommended_next_technique": "建议下一步使用的技术（如：苏格拉底式提问/行为实验/认知重构/情感聚焦/正念练习）"
  }
}`;

    const userPrompt = `用户消息: "${user_message}"
AI回复: "${assistant_message}"
${context_summary ? `上下文: ${context_summary}` : ""}`;

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI Gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "评估服务暂时不可用" }), {
        status: response.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const clean = content.replace(/[\x00-\x1F\x7F]/g, (ch: string) =>
      ch === '\n' || ch === '\r' || ch === '\t' ? ch : ''
    );

    let evaluation;
    try {
      evaluation = JSON.parse(clean);
    } catch {
      const braceMatch = clean.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        evaluation = JSON.parse(braceMatch[0]);
      } else {
        throw new Error("Failed to parse evaluation");
      }
    }

    // Save to DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    if (conversation_id) {
      // Merge new fields into evaluation_details
      const details = {
        ...(evaluation.evaluation_details || {}),
        therapeutic_direction: evaluation.therapeutic_direction || 0,
        conversation_technique: evaluation.conversation_technique || 0,
      };

      await supabase.from("response_evaluations").insert({
        conversation_id,
        message_index: message_index || 0,
        empathy_score: evaluation.empathy_score || 0,
        professionalism_score: evaluation.professionalism_score || 0,
        safety_score: evaluation.safety_score || 0,
        memory_utilization: evaluation.memory_utilization || 0,
        overall_score: evaluation.overall_score || 0,
        evaluation_details: details,
      });
    }

    return new Response(JSON.stringify({ evaluation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-response error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
