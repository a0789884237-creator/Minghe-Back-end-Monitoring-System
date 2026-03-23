import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

/**
 * Mem0-style memory extraction + update pipeline
 * + Zep-style knowledge graph extraction
 * + Emote-AI desire/anxiety emotion modeling
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, user_id } = await req.json();
    if (!user_id || !messages?.length) {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const recentMessages = messages.slice(-8);
    const conversationText = recentMessages.map((m: any) => `${m.role}: ${m.content}`).join("\n");

    // Fetch existing memories for deduplication (Mem0 Phase 2)
    const { data: existingMemories } = await supabase
      .from("user_memories")
      .select("id, content, category, importance, decay_score")
      .eq("user_id", user_id)
      .order("importance", { ascending: false })
      .limit(50);

    const existingMemoryList = (existingMemories || [])
      .map((m: any) => `[${m.category}] ${m.content}`)
      .join("\n");

    // Single LLM call extracts: memories + entities/relations + emotion state
    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一个多功能AI分析器，需要同时完成三项任务：

【任务1：Mem0记忆提取】
从对话中提取用户的关键信息。每条记忆20字以内。
- 与已有记忆对比，执行操作：ADD（新增）、UPDATE（更新已有记忆的id）、DELETE（删除过时记忆的id）、NOOP（无需操作）
- 已有记忆列表：
${existingMemoryList || "（空）"}

【任务2：Zep知识图谱】
提取对话中提到的实体（人物、地点、事件、概念）和它们之间的关系。

【任务3：情绪认知建模】
基于欲望-焦虑双轴模型分析用户当前情绪状态：
- desire_score (0-1): 欲望/动机强度。高=有明确目标和追求，低=无力感
- anxiety_score (0-1): 焦虑/压力程度。高=紧张不安，低=放松平静
- valence (-1到1): 情感效价。正=积极，负=消极
- arousal (0-1): 唤醒度。高=激动兴奋，低=平静低沉
- dominant_emotion: 综合判定的主要情绪`
          },
          {
            role: "user",
            content: `请分析以下对话：\n${conversationText}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_all",
            description: "Extract memories, knowledge graph, and emotion state",
            parameters: {
              type: "object",
              properties: {
                memory_operations: {
                  type: "array",
                  description: "Mem0-style memory operations",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string", enum: ["ADD", "UPDATE", "DELETE", "NOOP"] },
                      target_id: { type: "string", description: "ID of existing memory for UPDATE/DELETE, empty for ADD" },
                      category: { type: "string", enum: ["emotion", "preference", "event", "health", "relationship"] },
                      content: { type: "string" },
                      importance: { type: "integer", minimum: 1, maximum: 10 }
                    },
                    required: ["action", "category", "content", "importance"]
                  }
                },
                entities: {
                  type: "array",
                  description: "Knowledge graph entities",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      entity_type: { type: "string", enum: ["person", "place", "event", "concept", "emotion", "activity"] },
                      attributes: { type: "object" }
                    },
                    required: ["name", "entity_type"]
                  }
                },
                relations: {
                  type: "array",
                  description: "Knowledge graph edges",
                  items: {
                    type: "object",
                    properties: {
                      source: { type: "string" },
                      target: { type: "string" },
                      relation: { type: "string" },
                      context: { type: "string" }
                    },
                    required: ["source", "target", "relation"]
                  }
                },
                emotion_state: {
                  type: "object",
                  properties: {
                    desire_score: { type: "number", minimum: 0, maximum: 1 },
                    anxiety_score: { type: "number", minimum: 0, maximum: 1 },
                    valence: { type: "number", minimum: -1, maximum: 1 },
                    arousal: { type: "number", minimum: 0, maximum: 1 },
                    dominant_emotion: { type: "string" }
                  },
                  required: ["desire_score", "anxiety_score", "valence", "arousal", "dominant_emotion"]
                }
              },
              required: ["memory_operations", "entities", "relations", "emotion_state"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_all" } }
      }),
    });

    if (!response.ok) {
      console.error("DeepSeek extraction failed:", response.status);
      return new Response(JSON.stringify({ ok: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ ok: true, extracted: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = JSON.parse(toolCall.function.arguments);
    const stats = { memories_added: 0, memories_updated: 0, memories_deleted: 0, entities: 0, relations: 0, emotion: false };

    // === Phase 1: Mem0 Memory Operations ===
    if (result.memory_operations?.length) {
      for (const op of result.memory_operations) {
        try {
          if (op.action === "ADD") {
            await supabase.from("user_memories").insert({
              user_id, category: op.category, content: op.content,
              importance: op.importance, source: "chat", decay_score: 1.0
            });
            stats.memories_added++;
          } else if (op.action === "UPDATE" && op.target_id) {
            await supabase.from("user_memories")
              .update({ content: op.content, importance: op.importance, decay_score: 1.0 })
              .eq("id", op.target_id).eq("user_id", user_id);
            stats.memories_updated++;
          } else if (op.action === "DELETE" && op.target_id) {
            await supabase.from("user_memories")
              .delete().eq("id", op.target_id).eq("user_id", user_id);
            stats.memories_deleted++;
          }
        } catch (e) {
          console.error("Memory op failed:", op.action, e);
        }
      }

      // Mem0 decay: reduce decay_score for old unaccessed memories
      try {
        await supabase.rpc("decay_old_memories_fn", { p_user_id: user_id });
      } catch {
        // Function doesn't exist yet, skip decay
      }
    }

    // === Phase 2: Zep Knowledge Graph ===
    if (result.entities?.length) {
      for (const entity of result.entities) {
        // Upsert: increment mention_count if exists
        const { data: existing } = await supabase
          .from("knowledge_entities")
          .select("id, mention_count")
          .eq("user_id", user_id)
          .eq("name", entity.name)
          .single();

        if (existing) {
          await supabase.from("knowledge_entities")
            .update({
              mention_count: (existing.mention_count || 0) + 1,
              last_mentioned_at: new Date().toISOString(),
              attributes: entity.attributes || {}
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("knowledge_entities").insert({
            user_id, name: entity.name,
            entity_type: entity.entity_type,
            attributes: entity.attributes || {}
          });
        }
        stats.entities++;
      }
    }

    if (result.relations?.length) {
      for (const rel of result.relations) {
        // Upsert: increase weight if same relation exists
        const { data: existing } = await supabase
          .from("knowledge_edges")
          .select("id, weight")
          .eq("user_id", user_id)
          .eq("source_entity", rel.source)
          .eq("target_entity", rel.target)
          .eq("relation", rel.relation)
          .single();

        if (existing) {
          await supabase.from("knowledge_edges")
            .update({ weight: (existing.weight || 1) + 0.5, context: rel.context })
            .eq("id", existing.id);
        } else {
          await supabase.from("knowledge_edges").insert({
            user_id, source_entity: rel.source, target_entity: rel.target,
            relation: rel.relation, context: rel.context || "", weight: 1.0
          });
        }
        stats.relations++;
      }
    }

    // === Phase 3: Emotion State ===
    if (result.emotion_state) {
      const es = result.emotion_state;
      await supabase.from("emotion_states").insert({
        user_id,
        desire_score: es.desire_score,
        anxiety_score: es.anxiety_score,
        valence: es.valence,
        arousal: es.arousal,
        dominant_emotion: es.dominant_emotion,
        source: "chat"
      });
      stats.emotion = true;
    }

    return new Response(JSON.stringify({ ok: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-memories error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
