import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content } = await req.json();
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not configured");

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
            content: `你是一位专业的心理分析师。分析用户输入的心情文本，返回JSON格式的分析结果。
必须使用以下工具返回结果。`
          },
          { role: "user", content }
        ],
        tools: [{
          type: "function",
          function: {
            name: "mood_analysis",
            description: "返回情绪分析结果",
            parameters: {
              type: "object",
              properties: {
                mood_type: { type: "string", enum: ["happy", "calm", "anxious", "sad", "angry", "hopeful", "grateful", "lonely"], description: "主要情绪类型" },
                bloom_color: { type: "string", description: "对应花朵的HSL颜色值，如 hsl(350, 60%, 65%)" },
                growth_stage: { type: "number", description: "初始成长阶段 0-30" },
                analysis: { type: "string", description: "简短的情绪分析和建议，50字以内" },
                emoji: { type: "string", description: "一个代表情绪的emoji" },
                plant_name: { type: "string", description: "为这颗种子取一个诗意的中文名字" }
              },
              required: ["mood_type", "bloom_color", "growth_stage", "analysis", "emoji", "plant_name"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "mood_analysis" } }
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("DeepSeek error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("DeepSeek API error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-mood error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
