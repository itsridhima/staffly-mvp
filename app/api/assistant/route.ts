import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { buildSystemPrompt, sanitizeContext } from "@/lib/assistantKnowledge";

export const runtime = "nodejs";

// Default model; override with ANTHROPIC_MODEL in .env.local if you want a cheaper/faster one.
const DEFAULT_MODEL = "claude-opus-5-5";
const MAX_MESSAGES = 10;
const MAX_CHARS = 600;

// Very small per-IP limit so a public demo can't run up a bill. (In-memory: resets on restart.)
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 30;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_REQUESTS;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function cleanMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: ChatMessage[] = [];
  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") continue;
    const content = m.content.trim().slice(0, MAX_CHARS);
    if (content) cleaned.push({ role: m.role, content });
  }
  // The API needs the conversation to start with, and end on, a user turn.
  while (cleaned.length > 0 && cleaned[0].role !== "user") cleaned.shift();
  return cleaned.length > 0 && cleaned[cleaned.length - 1].role === "user" ? cleaned : [];
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { messages?: unknown; context?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const messages = cleanMessages(body.messages);
  if (messages.length === 0) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const client = new Anthropic({ apiKey });
  const system = buildSystemPrompt(sanitizeContext(body.context));

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system,
      messages,
      // Short answers don't need deep reasoning; keeps replies fast and cheap.
      output_config: { effort: "low" },
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ reply: "Sorry, I can't help with that one. Please ask me about booking shift staff." });
    }

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return NextResponse.json({ reply: reply || "Sorry, I couldn't come up with an answer. Please try again." });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "bad_key" }, { status: 502 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "busy" }, { status: 503 });
    }
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
