import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * Hybrid search with LLM semantic reranking:
 * 1. Retrieve ~10 candidates via keyword/category matching
 * 2. Use Gemini Flash Lite to rerank by semantic relevance
 * 3. Return top N results
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, match_count = 3 } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Step 1: Retrieve candidates via keyword strategies ──
    const candidates: any[] = [];
    const seenIds = new Set<string>();
    const keywordTags = inferKeywordTags(query);
    const category = inferCategory(query);
    const terms = extractKeyTerms(query);
    const CANDIDATE_LIMIT = 10;

    // 1a: Keyword tag overlap
    if (keywordTags.length) {
      const { data } = await supabase
        .from("counseling_knowledge")
        .select("id, question, answer_text, keywords, strategy_labels")
        .overlaps("keywords", keywordTags)
        .limit(CANDIDATE_LIMIT);

      for (const r of data || []) {
        if (!seenIds.has(r.id)) {
          seenIds.add(r.id);
          candidates.push(r);
        }
      }
    }

    // 1b: Category matching
    if (candidates.length < CANDIDATE_LIMIT && category !== "general") {
      const { data } = await supabase
        .from("counseling_knowledge")
        .select("id, question, answer_text, keywords, strategy_labels")
        .eq("category", category)
        .limit(CANDIDATE_LIMIT - candidates.length);

      for (const r of data || []) {
        if (!seenIds.has(r.id)) {
          seenIds.add(r.id);
          candidates.push(r);
        }
      }
    }

    // 1c: ILIKE text search
    if (candidates.length < CANDIDATE_LIMIT && terms.length) {
      for (const term of terms.slice(0, 3)) {
        if (candidates.length >= CANDIDATE_LIMIT) break;
        const { data } = await supabase
          .from("counseling_knowledge")
          .select("id, question, answer_text, keywords, strategy_labels")
          .ilike("question", `%${term}%`)
          .limit(3);

        for (const r of data || []) {
          if (!seenIds.has(r.id)) {
            seenIds.add(r.id);
            candidates.push(r);
          }
        }
      }
    }

    // If no candidates found, return empty
    if (!candidates.length) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If only a few candidates, skip reranking
    if (candidates.length <= match_count) {
      return new Response(JSON.stringify({
        results: candidates.map(r => ({ ...formatResult(r), search_type: "keyword" })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 2: LLM Semantic Reranking ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: return keyword results without reranking
      return new Response(JSON.stringify({
        results: candidates.slice(0, match_count).map(r => ({ ...formatResult(r), search_type: "keyword" })),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const candidateList = candidates.map((c, i) =>
        `[${i}] Q: ${c.question}`
      ).join("\n");

      const rerankResp = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "你是一个语义相关性评估器。给定用户问题和候选咨询案例列表，返回最相关的案例编号（按相关性从高到低排序）。只输出编号，用逗号分隔，不要解释。",
            },
            {
              role: "user",
              content: `用户问题：${query}\n\n候选案例：\n${candidateList}\n\n请返回最相关的${match_count}个案例编号（逗号分隔）：`,
            },
          ],
          max_tokens: 50,
          temperature: 0,
        }),
      });

      if (rerankResp.ok) {
        const rerankData = await rerankResp.json();
        const rankText = rerankData.choices?.[0]?.message?.content || "";
        const indices = rankText.match(/\d+/g)?.map(Number).filter((n: number) => n >= 0 && n < candidates.length) || [];

        if (indices.length) {
          const reranked = indices.slice(0, match_count).map((idx: number) => ({
            ...formatResult(candidates[idx]),
            search_type: "semantic_rerank",
          }));

          // Fill remaining slots if reranking returned fewer results
          if (reranked.length < match_count) {
            const usedIndices = new Set(indices);
            for (let i = 0; i < candidates.length && reranked.length < match_count; i++) {
              if (!usedIndices.has(i)) {
                reranked.push({ ...formatResult(candidates[i]), search_type: "keyword" });
              }
            }
          }

          return new Response(JSON.stringify({ results: reranked }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    } catch (e) {
      console.warn("Reranking failed, using keyword results:", e);
    }

    // Fallback: return keyword-ordered results
    return new Response(JSON.stringify({
      results: candidates.slice(0, match_count).map(r => ({ ...formatResult(r), search_type: "keyword" })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-knowledge error:", e);
    return new Response(JSON.stringify({ results: [], error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatResult(r: any) {
  return {
    id: r.id,
    question: r.question,
    answer_text: r.answer_text?.slice(0, 500) || "",
    keywords: r.keywords,
    strategy_labels: r.strategy_labels,
  };
}

function extractKeyTerms(query: string): string[] {
  const stopWords = new Set(["的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好", "自己", "这", "吗", "呢", "啊", "吧", "么", "被", "把", "给"]);
  const patterns = query.match(/[\u4e00-\u9fff]{2,4}/g) || [];
  return patterns.filter(p => !stopWords.has(p)).slice(0, 6);
}

function inferKeywordTags(query: string): string[] {
  const kwMap: Record<string, RegExp> = {
    "焦虑": /焦虑|紧张|担心|害怕|恐惧|不安|慌/,
    "抑郁": /抑郁|低落|消沉|无望|绝望|没意思|不想活/,
    "压力": /压力|累|疲惫|喘不过气|受不了|崩溃/,
    "恋爱": /恋爱|感情|分手|暗恋|表白|男朋友|女朋友|喜欢/,
    "人际": /人际|社交|朋友|同学|同事|孤独|合群/,
    "家庭": /家庭|父母|妈妈|爸爸|家里|亲子|原生/,
    "学业": /学习|考试|成绩|高考|学校|作业|学业/,
    "工作": /工作|职业|职场|辞职|裁员|上班|领导/,
    "自我": /自卑|自信|价值|意义|迷茫|方向/,
    "睡眠": /睡眠|失眠|睡不着|噩梦|熬夜/,
    "情绪": /情绪|生气|愤怒|难过|哭|崩溃|烦躁/,
  };
  const found: string[] = [];
  for (const [kw, re] of Object.entries(kwMap)) {
    if (re.test(query)) found.push(kw);
  }
  return found;
}

function inferCategory(query: string): string {
  if (/抑郁|低落|消沉|无望|绝望/.test(query)) return "depression";
  if (/焦虑|紧张|恐惧|担心|害怕/.test(query)) return "anxiety";
  if (/恋爱|感情|分手|暗恋|表白|婚姻|男朋友|女朋友/.test(query)) return "relationship";
  if (/人际|社交|朋友|同学|同事|孤独/.test(query)) return "social";
  if (/工作|职业|压力|职场|辞职|裁员/.test(query)) return "career";
  if (/学习|考试|成绩|学业|升学|高考/.test(query)) return "academic";
  if (/家庭|父母|亲子|原生家庭/.test(query)) return "family";
  if (/自我|自卑|自信|价值|意义|迷茫/.test(query)) return "self_esteem";
  if (/睡眠|失眠|噩梦/.test(query)) return "sleep";
  return "general";
}
