import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SMILE_BASE = "https://raw.githubusercontent.com/qiuhuachuan/smile/main/data";

/**
 * Batch import SmileChat multi-turn dialogue data.
 * Accepts: { start: number, end: number, batch_size?: number }
 * e.g. { start: 0, end: 499 } imports files 0.json through 499.json
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { start = 0, end = 499, batch_size = 20 } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let imported = 0;
    let failed = 0;
    let skipped = 0;

    // Process in batches to avoid overwhelming GitHub
    for (let batchStart = start; batchStart <= end; batchStart += batch_size) {
      const batchEnd = Math.min(batchStart + batch_size - 1, end);
      const ids = Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i);

      // Fetch files in parallel within batch
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          const resp = await fetch(`${SMILE_BASE}/${id}.json`);
          if (!resp.ok) return null;
          return { id, data: await resp.json() };
        })
      );

      const rows: any[] = [];
      for (const result of results) {
        if (result.status !== "fulfilled" || !result.value) { failed++; continue; }
        const { data: dialogue } = result.value;

        if (!Array.isArray(dialogue) || dialogue.length < 2) { skipped++; continue; }

        // Extract first client message as question
        const clientMsgs = dialogue.filter((m: any) => m.role === "client");
        const counselorMsgs = dialogue.filter((m: any) => m.role === "counselor");

        if (!clientMsgs.length || !counselorMsgs.length) { skipped++; continue; }

        const question = clientMsgs[0].content;
        // Combine first 2 counselor responses for richer answer
        const answer = counselorMsgs.slice(0, 2).map((m: any) => m.content).join("\n\n");

        // Extract description from subsequent client messages (shows more context)
        const description = clientMsgs.length > 1
          ? clientMsgs.slice(1, 3).map((m: any) => m.content).join(" ")
          : null;

        // Infer keywords from content
        const keywords = inferKeywords(question + " " + (description || ""));

        rows.push({
          question,
          description,
          answer_text: answer.slice(0, 2000),
          keywords,
          strategy_labels: extractStrategies(counselorMsgs),
          category: inferCategory(question + " " + (description || "")),
          source: "smilechat",
        });
      }

      // Batch insert
      if (rows.length) {
        const { error } = await supabase.from("counseling_knowledge").insert(rows);
        if (error) {
          console.error("Insert error:", error.message);
          failed += rows.length;
        } else {
          imported += rows.length;
        }
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      imported,
      failed,
      skipped,
      range: `${start}-${end}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("batch-import error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function inferKeywords(text: string): string[] {
  const kwMap: Record<string, RegExp> = {
    "焦虑": /焦虑|紧张|担心|害怕|恐惧|不安/,
    "抑郁": /抑郁|低落|消沉|无望|绝望|没意思/,
    "压力": /压力|累|疲惫|喘不过气|受不了/,
    "恋爱": /恋爱|感情|分手|暗恋|表白|喜欢的人|男朋友|女朋友/,
    "人际": /人际|社交|朋友|同学|同事|孤独|合群/,
    "家庭": /家庭|父母|妈妈|爸爸|家里|亲子|原生/,
    "学业": /学习|考试|成绩|高考|学校|作业|学业/,
    "工作": /工作|职业|职场|辞职|裁员|上班|领导/,
    "自我": /自卑|自信|价值|意义|迷茫|方向/,
    "睡眠": /睡眠|失眠|睡不着|噩梦|熬夜/,
    "情绪": /情绪|生气|愤怒|难过|哭|崩溃/,
    "创伤": /创伤|虐待|暴力|PTSD|伤害/,
  };
  const found: string[] = [];
  for (const [kw, re] of Object.entries(kwMap)) {
    if (re.test(text)) found.push(kw);
  }
  return found.length ? found : ["心理健康"];
}

function extractStrategies(counselorMsgs: any[]): string[] {
  const strategies = new Set<string>();
  const text = counselorMsgs.map((m: any) => m.content).join(" ");

  if (/理解|感受到|听到你|能感受/.test(text)) strategies.add("Empathy");
  if (/建议|可以试试|不妨|方法/.test(text)) strategies.add("Direct Guidance");
  if (/看起来|似乎|可能是|其实/.test(text)) strategies.add("Interpretation");
  if (/没关系|不必|很正常|勇敢/.test(text)) strategies.add("Approval and Reassurance");
  if (/你觉得|你认为|想想看|是什么/.test(text)) strategies.add("Open Question");

  return [...strategies];
}

function inferCategory(text: string): string {
  if (/抑郁|低落|消沉|无望|绝望/.test(text)) return "depression";
  if (/焦虑|紧张|恐惧|担心|害怕/.test(text)) return "anxiety";
  if (/恋爱|感情|分手|暗恋|表白|婚姻/.test(text)) return "relationship";
  if (/人际|社交|朋友|同学|同事|孤独/.test(text)) return "social";
  if (/工作|职业|压力|职场|辞职|裁员/.test(text)) return "career";
  if (/学习|考试|成绩|学业|升学|高考/.test(text)) return "academic";
  if (/家庭|父母|亲子|原生家庭/.test(text)) return "family";
  if (/自我|自卑|自信|价值|意义|迷茫/.test(text)) return "self_esteem";
  if (/睡眠|失眠|噩梦/.test(text)) return "sleep";
  if (/创伤|PTSD|虐待|暴力/.test(text)) return "trauma";
  return "general";
}
