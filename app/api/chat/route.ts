import { NextRequest, NextResponse } from "next/server";
import { chatLimiter } from "@/lib/rate-limit";
import { getUserIdFromRequest } from "@/lib/auth";

// TRADEOFF (OpenAI vs Anthropic): OpenAI's gpt-4o-mini is the default because it
// is the cheapest capable option for short tutoring turns and has a stable
// chat-completions API callable with plain fetch (no SDK dependency). Anthropic
// Sonnet gives warmer long-form corrections but costs more per message and
// needs its own client. OPENAI_MODEL is overridable for experiments.

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;
const UPSTREAM_TIMEOUT_MS = 30_000;

const SYSTEM_PROMPTS = {
  korean: `You are a friendly Korean tutor for a beginner (TOPIK I) learner. Reply mostly in Korean with short English glosses where helpful. Keep replies under 80 words, ask one follow-up question to keep the conversation going, and gently correct mistakes by showing the right form. Use hangul with romanization in parentheses on first use of a new word.`,
  french: `You are a friendly French tutor for an A1/A2 learner. Reply mostly in French with short English glosses where helpful. Keep replies under 80 words, ask one follow-up question to keep the conversation going, and gently correct mistakes by showing the right form.`,
} as const;

type Language = keyof typeof SYSTEM_PROMPTS;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function getClientKey(req: NextRequest, userId: string | null): string {
  if (userId) return `user:${userId}`;
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "The chat partner is not configured yet (missing OPENAI_API_KEY). Reviews still work — ask the app owner to add the key.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { messages, language } = (body as {
    messages?: unknown;
    language?: unknown;
  }) ?? {};

  if (language !== "korean" && language !== "french") {
    return NextResponse.json(
      { error: 'language must be "korean" or "french".' },
      { status: 400 }
    );
  }
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES
  ) {
    return NextResponse.json(
      { error: `messages must be a non-empty array (max ${MAX_MESSAGES}).` },
      { status: 400 }
    );
  }
  const clean: ChatMessage[] = [];
  for (const m of messages) {
    const role = (m as { role?: unknown } | null)?.role;
    const content = (m as { content?: unknown } | null)?.content;
    if (
      typeof m !== "object" ||
      m === null ||
      (role !== "user" && role !== "assistant") ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return NextResponse.json(
        { error: "Each message needs role (user|assistant) and content." },
        { status: 400 }
      );
    }
    clean.push({ role, content: content.trim().slice(0, MAX_CHARS) });
  }

  // Rate limit AFTER validation (don't burn quota on malformed requests).
  const userId = await getUserIdFromRequest(req);
  const key = getClientKey(req, userId);
  const rl = chatLimiter.check(key);
  if (!rl.allowed) {
    const hours = Math.max(1, Math.ceil(rl.resetMs / 3_600_000));
    return NextResponse.json(
      {
        error: `Daily chat limit reached (15 messages). Try again in about ${hours} hour${hours === 1 ? "" : "s"} — reviews are unlimited.`,
        remaining: 0,
      },
      { status: 429 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[language as Language] },
          ...clean,
        ],
      }),
      signal: controller.signal,
    });

    if (!upstream.ok) {
      console.error("OpenAI error:", upstream.status);
      return NextResponse.json(
        {
          error:
            "The AI partner is having trouble right now. Please try again in a minute — your reviews are unaffected.",
          remaining: rl.remaining,
        },
        { status: 502 }
      );
    }

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json(
        {
          error: "Got an empty reply from the AI partner. Try sending your message again.",
          remaining: rl.remaining,
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ reply, remaining: rl.remaining });
  } catch (e) {
    console.error("Chat upstream failure:", e);
    return NextResponse.json(
      {
        error:
          "Could not reach the AI partner (network timeout). Check your connection and try again.",
        remaining: rl.remaining,
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
