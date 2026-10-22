"use client";

import { useEffect, useRef, useState } from "react";
import type { BookingLine } from "@/lib/types";

interface Msg {
  role: "user" | "assistant";
  content: string;
  /** "faq" = scripted answer (AI off or unavailable) */
  source?: "ai" | "faq";
}

interface Props {
  view: string;
  lines: BookingLine[];
}

const SUGGESTIONS = ["How does booking work?", "What does each role cost?", "How does tracking work?"];

export default function AssistantChat({ view, lines }: Props) {
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
        body: JSON.stringify({
          messages: next.map(({ role, content: c }) => ({ role, content: c })),
          context: {
            view,
            lines: lines.map(({ role, qty, length, date, startMinutes }) => ({ role, qty, length, date, startMinutes })),
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { reply?: string; source?: "ai" | "faq" };
      const reply = res.ok && data.reply ? data.reply : "Sorry, something went wrong. Please try again.";
      setMessages([...next, { role: "assistant", content: reply, source: res.ok ? data.source : undefined }]);
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
        className="btn-primary fixed bottom-28 right-4 z-40 px-4 py-3 text-sm"
      >
        Need help? Ask Staffly
      </button>
    );
  }

  return (
    <section
      aria-label="Staffly assistant"
      className="glass fixed bottom-4 right-4 z-40 flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden"
    >
      <header className="glass-dark flex items-center justify-between rounded-none px-4 py-3">
        <div>
          <div className="font-bold">Staffly assistant</div>
          <div className="text-xs text-sky-200">AI helper · prototype · can&apos;t book for you</div>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="px-2 text-xl">
          ×
        </button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm" aria-live="polite">
        {messages.length === 0 && (
          <div>
            <p className="muted mb-2">Hi! Ask me how booking works, prices, tracking, or what to do on this screen.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="pill text-blue-800">
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
              m.role === "user" ? "btn-primary ml-auto rounded-2xl" : "neu-inset"
            }`}
          >
            {m.content}
            {m.source === "faq" && <div className="muted mt-1 text-xs">Quick answer (AI helper not available)</div>}
          </div>
        ))}
        {busy && <div className="neu-inset muted w-fit px-3 py-2">Thinking…</div>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-white/60 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={600}
          placeholder="Type your question"
          aria-label="Your question"
          className="neu-inset flex-1 px-3 py-2 text-sm"
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn-primary px-4 py-2 text-sm">
          Send
        </button>
      </form>
    </section>
  );
}
