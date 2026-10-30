const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_MESSAGE_LENGTH = 1500;
const MAX_HISTORY_TURNS = 10;

const SYSTEM_PROMPT =
  "You are a friendly academic tutor for university students. " +
  "Answer academic doubts clearly and accurately in simple English. " +
  "If the student asks in Tamil or requests Tamil, also provide the same explanation in simple Tamil after the English version. " +
  "For Mathematics, Physics, Chemistry and Computer Science, break the answer into step-by-step explanations with numbered steps. " +
  "Use plain text (no markdown headings). Keep answers concise but complete. " +
  "If a question is not academic, gently redirect the student to ask about their studies.";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const history: ChatMessage[] = Array.isArray(body?.history) ? body.history : [];

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return json({ error: `Enter a question of up to ${MAX_MESSAGE_LENGTH} characters.` }, 400);
    }

    for (const msg of history) {
      if (msg.role !== "user" && msg.role !== "assistant") {
        return json({ error: "Invalid chat history." }, 400);
      }
      if (typeof msg.content !== "string" || msg.content.length > MAX_MESSAGE_LENGTH) {
        return json({ error: "Invalid chat history." }, 400);
      }
    }

    const trimmedHistory = history.slice(-MAX_HISTORY_TURNS * 2);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return json({ error: "The AI chat is not configured yet. Please check back soon." }, 503);
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...trimmedHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: message },
        ],
      }),
    });
    if (!aiResponse.ok) {
      return json({ error: "The AI service could not answer right now." }, 502);
    }

    const result = await aiResponse.json();
    const text = result?.choices?.[0]?.message?.content;
    if (typeof text !== "string") {
      return json({ error: "The AI service returned an unexpected answer." }, 502);
    }

    return json({ text });
  } catch {
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
