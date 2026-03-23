import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  onDelta: (deltaText: string) => void;
  onDone: () => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error("请求过于频繁，请稍后再试");
    if (resp.status === 402) throw new Error("AI服务额度不足");
    throw new Error("AI服务暂时不可用");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  // Filter state: strip leading parenthesized reasoning blocks AND <think>...</think> blocks
  let fullText = "";
  let insideParen = false;
  let parenDepth = 0;
  let isLeading = true;

  // <think> block filter state
  let insideThink = false;
  let thinkTagBuffer = "";
  let detectingTag = false;

  function filterAndEmit(content: string) {
    for (let i = 0; i < content.length; i++) {
      const ch = content[i];

      // === Phase 1: Detect and strip <think>...</think> blocks at any position ===
      if (detectingTag) {
        thinkTagBuffer += ch;
        // Check if we're building "<think>" opening tag
        if ("<think>".startsWith(thinkTagBuffer)) {
          if (thinkTagBuffer === "<think>") {
            // Confirmed opening tag - enter think mode
            insideThink = true;
            detectingTag = false;
            thinkTagBuffer = "";
          }
          continue;
        }
        // Check if we're building "</think>" closing tag inside think block
        if (insideThink && "</think>".startsWith(thinkTagBuffer)) {
          if (thinkTagBuffer === "</think>") {
            insideThink = false;
            detectingTag = false;
            thinkTagBuffer = "";
          }
          continue;
        }
        // Not a valid tag - flush buffer
        const buf = thinkTagBuffer;
        detectingTag = false;
        thinkTagBuffer = "";
        if (!insideThink) {
          for (const bc of buf) {
            emitChar(bc);
          }
        }
        continue;
      }

      if (ch === '<') {
        detectingTag = true;
        thinkTagBuffer = "<";
        continue;
      }

      if (insideThink) continue; // Skip content inside <think> blocks

      // === Phase 2: Strip leading parenthesized reasoning blocks ===
      emitChar(ch);
    }
  }

  function emitChar(ch: string) {
    if (isLeading) {
      // Skip leading whitespace/newlines
      if (fullText.length === 0 && (ch === '\n' || ch === '\r' || ch === ' ')) return;

      // Detect opening paren at the start
      if (fullText.length === 0 && (ch === '（' || ch === '(')) {
        insideParen = true;
        parenDepth = 1;
        fullText += ch;
        return;
      }

      if (insideParen) {
        fullText += ch;
        if (ch === '（' || ch === '(') parenDepth++;
        if (ch === '）' || ch === ')') {
          parenDepth--;
          if (parenDepth <= 0) {
            fullText = "";
            insideParen = false;
            isLeading = true;
          }
        }
        return;
      }

      // No more leading parens - stop filtering
      isLeading = false;
    }

    fullText += ch;
    onDelta(ch);
  }

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) filterAndEmit(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) filterAndEmit(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
