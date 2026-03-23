import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Import CPsyCounD-format multi-turn counseling dialogues into counseling_knowledge.
 * 
 * Accepts:
 * - { cpscoun_url: string } - fetch CPsyCounD JSON from URL (HuggingFace dataset)
 * - { dialogues: Array<{ report, dialogue: Array<{role, content}> }> } - direct data
 * 
 * Each multi-turn dialogue is condensed into Q&A format for RAG retrieval:
 * - question: client's presenting problem (first 1-2 client messages)
 * - answer_text: counselor's key interventions (concatenated counselor responses)
 * - strategy_labels: extracted therapeutic techniques
 * - category: inferred problem category
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    let items: any[] = [];

    if (body.cpscoun_url) {
      // Fetch CPsyCounD JSON from URL
      const resp = await fetch(body.cpscoun_url);
      if (!resp.ok) throw new Error(`Failed to fetch: ${resp.status}`);
      const data = await resp.json();
      
      // CPsyCounD format: array of { report, dialogue: [{role, content}] }
      const dialogues = Array.isArray(data) ? data : (data.data || data.dialogues || []);
      
      for (const entry of dialogues) {
        const dialogue = entry.dialogue || entry.conversation || entry.messages || [];
        if (!dialogue.length) continue;

        // Extract client messages as the "question" (presenting problem)
        const clientMsgs = dialogue
          .filter((m: any) => m.role === "client" || m.role === "user" || m.role === "来访者")
          .map((m: any) => m.content);
        
        // Extract counselor messages as the "answer" (therapeutic response)
        const counselorMsgs = dialogue
          .filter((m: any) => m.role === "counselor" || m.role === "assistant" || m.role === "咨询师")
          .map((m: any) => m.content);

        if (!clientMsgs.length || !counselorMsgs.length) continue;

        // Use first 1-2 client messages as the presenting problem
        const question = clientMsgs.slice(0, 2).join("\n");
        
        // Concatenate counselor's key responses (first 3 for depth, not overwhelming)
        const answerText = counselorMsgs.slice(0, 4).join("\n---\n");
        
        // Extract strategy labels from counselor content
        const strategies = extractStrategies(counselorMsgs.join(" "));
        
        // Extract keywords from client content
        const keywords = extractKeywords(clientMsgs.join(" "));

        // Infer category
        const category = inferCategory(keywords, question);

        items.push({
          question: question.slice(0, 1000),
          description: entry.report?.slice(0, 500) || null,
          answer_text: answerText.slice(0, 3000),
          keywords,
          strategy_labels: strategies,
          category,
          source: "cpsycound",
        });
      }
    } else if (body.dialogues?.length) {
      // Direct format
      for (const d of body.dialogues) {
        items.push({
          question: d.question || d.client_message || "",
          description: d.description || d.report || null,
          answer_text: d.answer_text || d.counselor_response || "",
          keywords: d.keywords || [],
          strategy_labels: d.strategy_labels || [],
          category: d.category || "general",
          source: d.source || "cpsycound",
        });
      }
    } else {
      return new Response(JSON.stringify({ error: "No data provided. Use cpscoun_url or dialogues." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch insert (chunks of 30 to avoid payload limits)
    let inserted = 0;
    let errors = 0;
    for (let i = 0; i < items.length; i += 30) {
      const batch = items.slice(i, i + 30).map(item => ({
        question: item.question,
        description: item.description,
        answer_text: item.answer_text,
        keywords: item.keywords,
        strategy_labels: item.strategy_labels,
        category: item.category,
        source: item.source,
      }));

      const { error } = await supabase.from("counseling_knowledge").insert(batch);
      if (error) {
        console.error("Batch insert error:", error);
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      total: items.length,
      inserted,
      errors,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-cpsycound error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractStrategies(text: string): string[] {
  const strategies: string[] = [];
  const patterns: [RegExp, string][] = [
    [/共情|理解你|感受到|听起来/, "empathy_reflection"],
    [/认知|想法|信念|思维/, "cognitive_restructuring"],
    [/苏格拉底|证据|其他可能|换个角度/, "socratic_questioning"],
    [/行为|尝试|行动|实验|练习/, "behavioral_activation"],
    [/正念|呼吸|放松|冥想/, "mindfulness"],
    [/情绪|感受|体验|觉察/, "emotion_focused"],
    [/关系|互动|沟通|表达/, "interpersonal"],
    [/安全|热线|危机|伤害/, "crisis_intervention"],
    [/资源|优势|力量|过去/, "resource_activation"],
    [/目标|计划|方向|改变/, "goal_setting"],
  ];
  for (const [regex, label] of patterns) {
    if (regex.test(text)) strategies.push(label);
  }
  return [...new Set(strategies)];
}

function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  const patterns: [RegExp, string][] = [
    [/焦虑|紧张|担心|害怕|恐惧/, "焦虑"],
    [/抑郁|低落|消沉|难过|悲伤/, "抑郁"],
    [/压力|忙|累|疲惫|倦怠/, "压力"],
    [/关系|朋友|同事|家人|父母|伴侣/, "人际关系"],
    [/工作|职业|职场|升职|裁员/, "职业"],
    [/学习|考试|成绩|学业/, "学业"],
    [/睡眠|失眠|噩梦/, "睡眠"],
    [/自信|自卑|自我|价值/, "自我认同"],
    [/愤怒|生气|烦躁|暴躁/, "愤怒"],
    [/孤独|寂寞|隔离/, "孤独"],
  ];
  for (const [regex, label] of patterns) {
    if (regex.test(text)) keywords.push(label);
  }
  return [...new Set(keywords)];
}

function inferCategory(keywords: string[], question: string): string {
  const text = keywords.join(" ") + " " + question;
  if (/抑郁|低落|消沉|无望|绝望/.test(text)) return "depression";
  if (/焦虑|紧张|恐惧|担心|害怕/.test(text)) return "anxiety";
  if (/恋爱|感情|分手|暗恋|表白|婚姻|伴侣/.test(text)) return "relationship";
  if (/人际|社交|朋友|同学|同事|孤独/.test(text)) return "social";
  if (/工作|职业|压力|职场|辞职|裁员/.test(text)) return "career";
  if (/学习|考试|成绩|学业|升学/.test(text)) return "academic";
  if (/家庭|父母|亲子|原生家庭/.test(text)) return "family";
  if (/自我|自卑|自信|价值|意义/.test(text)) return "self_esteem";
  if (/睡眠|失眠|噩梦/.test(text)) return "sleep";
  if (/创伤|PTSD|虐待|暴力/.test(text)) return "trauma";
  return "general";
}
