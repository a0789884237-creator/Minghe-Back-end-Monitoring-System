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
            content: `你是GuardianAI安全分析师。分析用户提交的可疑信息（如诈骗短信、杀猪盘、有害信息等），进行风险评估。使用工具返回结构化结果。`
          },
          { role: "user", content: `请分析以下信息的风险:\n\n${content}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "security_report",
            description: "返回安全风险评估报告",
            parameters: {
              type: "object",
              properties: {
                risk_score: { type: "number", description: "风险分数 0-100，越高越危险" },
                risk_level: { type: "string", enum: ["safe", "low", "medium", "high", "critical"], description: "风险等级" },
                threat_type: { type: "string", description: "威胁类型，如：投资诈骗、钓鱼链接、情感操控等" },
                analysis: { type: "string", description: "详细分析说明" },
                tips: { type: "array", items: { type: "string" }, description: "安全建议列表，3-5条" }
              },
              required: ["risk_score", "risk_level", "threat_type", "analysis", "tips"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "security_report" } }
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
    console.error("security-check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
