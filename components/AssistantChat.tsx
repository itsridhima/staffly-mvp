"use client";

import { useEffect, useRef, useState } from "react";
import type { Order, ShiftLength } from "@/lib/types";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  step: string;
  length: ShiftLength;
  date: string;
  order: Order;
}

const ERRORS: Record<string, string> = {
  not_configured:
    "The assistant isn't switched on yet: the Anthropic API key hasn't been added to .env.local on this computer.",
  rate_limited: "You've asked a lot of questions in a short time. Please wait a few minutes and try again.",
  busy: "The assistant is busy right now. Please try again in a moment.",
  bad_key: "The assistant's API key was rejected. Please check the key in .env.local.",
};

const SUGGESTIONS = ["How does booking work?", "What does each role cost?", "Are the payments real?"];

export default function AssistantChat({ step, length, date, order }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context: { step, length, date, order } }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      const reply =
        res.ok && data.reply
          ? data.reply
          : (data.error && ERRORS[data.error]) || "Sorry, something went wrong. Please try again.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I couldn't reach the assistant. Check your connection." }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-20 rounded-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-lg"
      >
        Need help? Ask Staffly
      </button>
    );
  }

  return (
    <section
      aria-label="Staffly assistant"
      className="fixed bottom-4 right-4 z-20 flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col rounded-2xl border border-stone-300 bg-white shadow-xl"
    >
      <header className="flex items-center justify-between rounded-t-2xl bg-emerald-700 px-4 py-3 text-white">
        <div>
          <div className="font-semibold">Staffly assistant</div>
          <div className="text-xs opacity-90">AI helper · prototype · can&apos;t book for you</div>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="px-2 text-xl">
          ×
        </button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm" aria-live="polite">
        {messages.length === 0 && (
          <div>
            <p className="mb-2 text-stone-600">Hi! Ask me how booking works, prices, or what to do on this screen.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-emerald-600 px-3 py-1 text-emerald-800 hover:bg-emerald-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${
              m.role === "user" ? "ml-auto bg-emerald-600 text-white" : "bg-stone-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        {busy && <div className="w-fit rounded-2xl bg-stone-100 px-3 py-2 text-stone-500">Thinking…</div>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-stone-200 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={600}
          placeholder="Type your question"
          aria-label="Your question"
          className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-stone-300"
        >
          Send
        </button>
      </form>
    </section>
  );
}
