"use client";

import { useState } from "react";
import { formatINR } from "@/lib/pricing";
import { roleInfo, sampleRating } from "@/lib/prototypeData";
import type { BookingLine, Ledger, LineSpec, RoleId } from "@/lib/types";
import RoleBook from "./RoleBook";
import RoleIcon from "./RoleIcon";

type Tab = "overview" | "reviews" | "book";

interface Props {
  role: RoleId;
  today: string;
  cart: BookingLine[];
  ledger: Ledger;
  onBack: () => void;
  onAdd: (spec: LineSpec) => void;
}

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} out of 5 stars`} className="text-amber-400">
      {"★".repeat(n)}
      <span className="text-slate-300">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export default function RoleView({ role, today, cart, ledger, onBack, onAdd }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const info = roleInfo(role);
  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "reviews", label: "Reviews" },
    { id: "book", label: "Book" },
  ];

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} aria-label="Back to home" className="neu flex h-11 w-11 items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>

      <section className="glass-dark relative overflow-hidden p-5">
        <div aria-hidden className="absolute -right-6 -top-6 h-36 w-36 rounded-full bg-sky-400/25 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/10 text-sky-100 ring-1 ring-white/20">
            <RoleIcon role={role} className="h-11 w-11" />
          </span>
          <div>
            <h1 className="text-2xl font-black leading-tight">{info.label}</h1>
            <p className="mt-1 text-sm text-sky-200">
              <span className="text-amber-300">★ {sampleRating(role)}</span> sample rating
            </p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <span className="pill pill-dark">{formatINR(info.price[5])} · 5 hours</span>
          <span className="pill pill-dark">{formatINR(info.price[8])} · 8 hours</span>
          <span className="pill pill-dark">per person · excl. GST</span>
        </div>
      </section>

      <div role="tablist" aria-label="Role details" className="neu-inset grid grid-cols-3 gap-1 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === t.id ? "glass-dark" : "muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="space-y-4">
          <section className="glass space-y-3 p-5">
            <h2 className="text-lg font-bold">About this role</h2>
            <p className="text-sm leading-relaxed">{info.overview}</p>
            <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {info.includes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span aria-hidden className="mt-0.5 text-blue-600">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="muted text-xs">Description is prototype copy based on the role name.</p>
          </section>
          <button type="button" onClick={() => setTab("book")} className="btn-primary w-full px-4 py-4 text-base">
            Book {info.shortLabel}
          </button>
        </div>
      )}

      {tab === "reviews" && (
        <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" className="space-y-4">
          <section className="glass space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Reviews</h2>
              <span className="pill text-amber-600">★ {sampleRating(role)} average (sample)</span>
            </div>
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Sample reviews: prototype, not from real customers.
            </p>
            <ul className="space-y-3">
              {info.sampleReviews.map((r) => (
                <li key={r.text} className="neu-inset p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.who}</span>
                    <Stars n={r.stars} />
                  </div>
                  <p className="mt-1">{r.text}</p>
                </li>
              ))}
            </ul>
          </section>
          <button type="button" onClick={() => setTab("book")} className="btn-primary w-full px-4 py-4 text-base">
            Book {info.shortLabel}
          </button>
        </div>
      )}

      {tab === "book" && (
        <div role="tabpanel" id="panel-book" aria-labelledby="tab-book">
          <RoleBook role={role} today={today} cart={cart} ledger={ledger} onAdd={onAdd} />
        </div>
      )}
    </div>
  );
}
