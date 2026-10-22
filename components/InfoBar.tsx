"use client";

import { useEffect, useState } from "react";
import { INFO_FACTS, type NextShift } from "@/lib/home";
import { formatINR } from "@/lib/pricing";
import { roleInfo } from "@/lib/prototypeData";
import { formatDateLong, formatTime, toDateString } from "@/lib/time";
import Icon from "./icons";

interface Props {
  nextShift: NextShift | null;
  /** The booking being built (not yet confirmed) */
  cart: { people: number; shifts: number; total: number } | null;
  onOpenShift: (reference: string) => void;
  onOpenCart: () => void;
}

function whenLabel(date: string, startMinutes: number, now: Date): string {
  const today = toDateString(now);
  const day = date === today ? "Today" : formatDateLong(date);
  return `${day} · ${formatTime(startMinutes)}`;
}

/**
 * One slim card before the roles. It shows the most useful true thing right now:
 * your next shift, then a booking in progress, otherwise short facts about how Staffly works.
 */
export default function InfoBar({ nextShift, cart, onOpenShift, onOpenCart }: Props) {
  const [fact, setFact] = useState(0);
  const showFacts = !nextShift && !cart;

  useEffect(() => {
    if (!showFacts) return;
    const t = setInterval(() => setFact((f) => (f + 1) % INFO_FACTS.length), 5000);
    return () => clearInterval(t);
  }, [showFacts]);

  if (nextShift) {
    const info = roleInfo(nextShift.role);
    return (
      <button type="button" onClick={() => onOpenShift(nextShift.reference)} className="glass-dark flex w-full items-center gap-3 p-4 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Icon name="clock" className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-sky-200">Your next shift</span>
          <span className="block truncate font-bold">
            {nextShift.qty} × {info.shortLabel} · {nextShift.statusLabel}
          </span>
          <span className="block text-sm text-sky-100">{whenLabel(nextShift.date, nextShift.startMinutes, new Date())}</span>
        </span>
        <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-sky-200" />
      </button>
    );
  }

  if (cart) {
    return (
      <button type="button" onClick={onOpenCart} className="glass-dark flex w-full items-center gap-3 p-4 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Icon name="booking" className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-sky-200">Booking in progress</span>
          <span className="block truncate font-bold">
            {cart.shifts} {cart.shifts === 1 ? "shift" : "shifts"} · {cart.people} {cart.people === 1 ? "worker" : "workers"} · {formatINR(cart.total)}
          </span>
          <span className="block text-sm text-sky-100">Review your booking</span>
        </span>
        <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-sky-200" />
      </button>
    );
  }

  const current = INFO_FACTS[fact];
  return (
    <section className="glass-dark p-4" aria-label="Good to know" aria-live="off">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <Icon name="info" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{current.title}</p>
          <p className="text-sm text-sky-100">{current.body}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {INFO_FACTS.map((f, i) => (
          <button
            key={f.title}
            type="button"
            aria-label={`Show tip ${i + 1} of ${INFO_FACTS.length}`}
            aria-current={i === fact}
            onClick={() => setFact(i)}
            className={`h-1.5 rounded-full transition-all ${i === fact ? "w-6 bg-white" : "w-3 bg-white/40"}`}
          />
        ))}
      </div>
    </section>
  );
}
