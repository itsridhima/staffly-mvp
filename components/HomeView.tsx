"use client";

import { formatINR, headcount, billBreakdown } from "@/lib/pricing";
import { ROLES } from "@/lib/prototypeData";
import type { BookingLine, RoleId } from "@/lib/types";
import RoleIcon from "./RoleIcon";

interface Props {
  lines: BookingLine[];
  greetingName: string | null;
  notificationCount: number;
  onOpenRole: (role: RoleId) => void;
  onOpenCart: () => void;
  onOpenNotifications: () => void;
}

export default function HomeView({ lines, greetingName, notificationCount, onOpenRole, onOpenCart, onOpenNotifications }: Props) {
  const bill = billBreakdown(lines);
  const people = headcount(lines);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="glass-dark flex h-9 w-9 items-center justify-center rounded-xl text-lg font-black">S</span>
            <h1 className="text-2xl font-black tracking-tight">Staffly</h1>
          </div>
          <p className="muted mt-1 text-sm">
            {greetingName ? `Hi ${greetingName}, who do you need for your next shift?` : "Book trained staff for your next shift."}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label={`Notifications${notificationCount ? `, ${notificationCount} new` : ""}`}
          className="neu relative flex h-11 w-11 items-center justify-center"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-6 w-6">
            <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7z" />
            <path d="M10 20a2 2 0 0 0 4 0" />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {notificationCount}
            </span>
          )}
        </button>
      </header>

      <section className="glass-dark p-5" aria-label="Your booking summary">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-sky-200">Your booking</p>
            {people === 0 ? (
              <p className="mt-1 text-xl font-bold">Nothing added yet</p>
            ) : (
              <>
                <p className="mt-1 text-3xl font-black">{formatINR(bill.itemTotal)}</p>
                <p className="text-xs text-sky-200">excl. GST · {people} {people === 1 ? "worker" : "workers"} · {lines.length} {lines.length === 1 ? "shift" : "shifts"}</p>
              </>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-sky-100">
          {people === 0
            ? "Choose a role below. You can add several roles, each with its own shift."
            : "Add more roles or review your booking."}
        </p>
        <button
          type="button"
          onClick={onOpenCart}
          disabled={people === 0}
          className="btn-primary mt-4 w-full px-4 py-3 disabled:opacity-60"
        >
          Review booking
        </button>
      </section>

      <section aria-label="Categories">
        <h2 className="mb-3 text-lg font-bold">Categories</h2>
        <ul className="grid grid-cols-3 gap-3">
          {ROLES.map((role) => (
            <li key={role.id}>
              <button
                type="button"
                onClick={() => onOpenRole(role.id)}
                className="neu flex h-full w-full flex-col items-center gap-2 px-2 py-4 text-center hover:brightness-105"
              >
                <span className="glass-dark flex h-12 w-12 items-center justify-center rounded-2xl">
                  <RoleIcon role={role.id} />
                </span>
                <span className="text-xs font-semibold leading-tight">{role.shortLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Roles and prices">
        <h2 className="mb-3 text-lg font-bold">Roles &amp; prices</h2>
        <ul className="space-y-3">
          {ROLES.map((role) => (
            <li key={role.id}>
              <button type="button" onClick={() => onOpenRole(role.id)} className="glass flex w-full items-center gap-3 p-3 text-left">
                <span className="glass-dark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                  <RoleIcon role={role.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{role.label}</span>
                  <span className="muted block text-xs">
                    {formatINR(role.price[5])} / 5h · {formatINR(role.price[8])} / 8h · excl. GST
                  </span>
                </span>
                <span aria-hidden className="muted shrink-0 text-xl">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
