"use client";

import { useState } from "react";
import { HELP_ITEMS, HELP_TOPIC_LABEL, type HelpTopic, itemsForTopic, searchHelp } from "@/lib/helpContent";
import SubPageHeader from "./SubPageHeader";

interface Props {
  onOpenBookings: () => void;
  onAskAssistant: () => void;
  onBack: () => void;
}

const TOPICS: HelpTopic[] = ["faq", "booking", "account", "payment"];

export default function HelpView({ onOpenBookings, onAskAssistant, onBack }: Props) {
  const [topic, setTopic] = useState<HelpTopic>("faq");
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;
  const items = searching ? searchHelp(HELP_ITEMS, query) : itemsForTopic(topic);

  return (
    <section className="space-y-4">
      <SubPageHeader title="Help & Support" onBack={onBack} />

      <ul className="space-y-3">
        <li>
          <button type="button" onClick={onOpenBookings} className="glass flex w-full items-center gap-3 p-4 text-left">
            <span className="glass-dark flex h-11 w-11 items-center justify-center rounded-2xl" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M5 5h14v15H5z" />
                <path d="M8 3v4M16 3v4M5 10h14" />
              </svg>
            </span>
            <span className="flex-1">
              <span className="block font-bold">Help with a booking</span>
              <span className="muted block text-xs">Open My bookings to track, rate or check a shift</span>
            </span>
            <span aria-hidden className="muted">›</span>
          </button>
        </li>
        <li>
          <button type="button" onClick={onAskAssistant} className="glass flex w-full items-center gap-3 p-4 text-left">
            <span className="glass-dark flex h-11 w-11 items-center justify-center rounded-2xl" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M4 5h16v11H9l-5 4z" />
              </svg>
            </span>
            <span className="flex-1">
              <span className="block font-bold">Ask Staffly</span>
              <span className="muted block text-xs">Chat about booking, prices and tracking</span>
            </span>
            <span aria-hidden className="muted">›</span>
          </button>
        </li>
      </ul>

      <h2 className="text-lg font-black">Get help with other questions</h2>

      <div>
        <label htmlFor="help-search" className="sr-only">
          Search help
        </label>
        <input
          id="help-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="neu-inset w-full px-4 py-3"
        />
      </div>

      {!searching && (
        <div role="tablist" aria-label="Help topics" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={topic === t}
              onClick={() => setTopic(t)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${topic === t ? "glass-dark" : "neu"}`}
            >
              {HELP_TOPIC_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="glass p-4 text-sm">
          No answers match “{query}”. Try fewer words, or ask Staffly.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id}>
              <details className="glass group p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                  {i.q}
                  <span aria-hidden className="muted transition group-open:rotate-180">⌄</span>
                </summary>
                <p className="muted mt-3 text-sm leading-relaxed">{i.a}</p>
              </details>
            </li>
          ))}
        </ul>
      )}

      <p className="muted text-sm">
        Can&apos;t find your answer?{" "}
        <button type="button" onClick={onAskAssistant} className="font-semibold text-blue-700 underline">
          Ask Staffly
        </button>
        .
      </p>
    </section>
  );
}
