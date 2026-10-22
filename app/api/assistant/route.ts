import { NextResponse } from "next/server";
import { buildSystemPrompt, sanitizeContext } from "@/lib/assistantKnowledge";
import { faqAnswer } from "@/lib/faq";

export const runtime = "nodejs";

// Default model (fast, no extra "thinking" delay); override with GEMINI_MODEL in .env.local.
// If it fails (the free tier is sometimes overloaded), we try the backup model once.
const DEFAULT_MODEL = "gemini-flash-lite-latest";
const BACKUP_MODEL = "gemini-3.5-flash";
const MAX_MESSAGES = 10;
const MAX_CHARS = 600;

// Very small per-IP limit so a public demo can't run up usage. (In-memory: resets on restart.)
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
  // The conversation must start with, and end on, a user turn.
  while (cleaned.length > 0 && cleaned[0].role !== "user") cleaned.shift();
  return cleaned.length > 0 && cleaned[cleaned.length - 1].role === "user" ? cleaned : [];
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  promptFeedback?: { blockReason?: string };
}

async function askGemini(apiKey: string, model: string, system: string, messages: ChatMessage[]): Promise<string | null> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      // Thinking tokens count toward this limit, so leave plenty of room for the visible answer.
      generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`gemini_${res.status}`);
  const data = (await res.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) return null;
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("")
    .trim();
  return text || null;
}

export async function POST(request: Request) {
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

  const context = sanitizeContext(body.context);
  const lastQuestion = messages[messages.length - 1].content;
  const basic = () => NextResponse.json({ reply: faqAnswer(lastQuestion, context), source: "faq" });

  // No key (or too many questions): fall back to the scripted answers, which cost nothing.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("assistant: GEMINI_API_KEY is not set, using scripted answers");
    return basic();
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (rateLimited(ip)) return basic();

  const system = buildSystemPrompt(context);
  const models = [process.env.GEMINI_MODEL || DEFAULT_MODEL, BACKUP_MODEL];
  for (const model of [...new Set(models)]) {
    try {
      const reply = await askGemini(apiKey, model, system, messages);
      if (!reply) return basic();
      return NextResponse.json({ reply, source: "ai" });
    } catch (error) {
      console.error(`assistant: ${model} failed:`, error instanceof Error ? error.message : error);
    }
  }
  // Bad key, free-tier limit, outage, or timeout: the booking assistant should still answer.
  return basic();
}
