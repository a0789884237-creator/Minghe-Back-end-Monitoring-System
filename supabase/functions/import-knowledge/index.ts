import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Import PsyQA-format counseling data into the knowledge base.
 * Accepts: { items: Array<{ question, description?, answer_text, keywords?, strategy_labels?, category? }> }
 * Or: { psyqa_url: string } to fetch and parse PsyQA JSON from URL
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

    if (body.psyqa_url) {
      // Fetch and parse PsyQA JSON
      const resp = await fetch(body.psyqa_url);
      const psyqaData = await resp.json();

      for (const entry of psyqaData) {
        const keywords = entry.keywords
          ? entry.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
          : [];

        for (const ans of (entry.answers || [])) {
          // Extract unique strategy labels
          const labels = ans.labels_sequence
            ? [...new Set(ans.labels_sequence.map((l: any) => l.type))]
            : [];

          items.push({
            question: entry.question,
            description: entry.description || null,
            answer_text: ans.answer_text,
            keywords,
            strategy_labels: labels,
            category: inferCategory(keywords, entry.question),
            source: "psyqa",
          });
        }
      }
    } else if (body.items?.length) {
      items = body.items;
    } else {
      return new Response(JSON.stringify({ error: "No data provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch insert (chunks of 50)
    let inserted = 0;
    let errors = 0;
    for (let i = 0; i < items.length; i += 50) {
      const batch = items.slice(i, i + 50).map(item => ({
        question: item.question,
        description: item.description || null,
        answer_text: item.answer_text,
        keywords: item.keywords || [],
        strategy_labels: item.strategy_labels || [],
        category: item.category || "general",
        source: item.source || "manual",
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
    console.error("import-knowledge error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function inferCategory(keywords: string[], question: string): string {
  const text = keywords.join(" ") + " " + question;
  if (/抑郁|低落|消沉|无望|绝望/.test(text)) return "depression";
  if (/焦虑|紧张|恐惧|担心|害怕/.test(text)) return "anxiety";
  if (/恋爱|感情|分手|暗恋|表白|婚姻/.test(text)) return "relationship";
  if (/人际|社交|朋友|同学|同事|孤独/.test(text)) return "social";
  if (/工作|职业|压力|职场|辞职|裁员/.test(text)) return "career";
  if (/学习|考试|成绩|学业|升学/.test(text)) return "academic";
  if (/家庭|父母|亲子|原生家庭/.test(text)) return "family";
  if (/自我|自卑|自信|价值|意义/.test(text)) return "self_esteem";
  if (/睡眠|失眠|噩梦/.test(text)) return "sleep";
  if (/创伤|PTSD|虐待|暴力/.test(text)) return "trauma";
  return "general";
}
