"use client";

import type { Tab } from "@/lib/navigation";
import Icon, { type IconName } from "./icons";

interface Props {
  active: Tab | null;
  /** Number of workers in the current booking (badge on Booking) */
  bookingCount: number;
  /** Red dot on Shifts when there is news about a worker */
  shiftsDot: boolean;
  onSelect: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "shifts", label: "Shifts", icon: "shifts" },
  { id: "booking", label: "Booking", icon: "booking" },
  { id: "crew", label: "Crew", icon: "crew" },
  { id: "help", label: "Help", icon: "help" },
];

/** A flat, full-width bar of five equal tabs (icon above label), like a standard app tab bar. */
export default function BottomNav({ active, bookingCount, shiftsDot, onSelect }: Props) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300/70 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((t) => {
          const isActive = active === t.id;
          const count = t.id === "booking" ? bookingCount : 0;
          const dot = t.id === "shifts" && shiftsDot;
          return (
            <li key={t.id} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                aria-current={isActive ? "page" : undefined}
                aria-label={count > 0 ? `${t.label}, ${count} ${count === 1 ? "worker" : "workers"} in your booking` : dot ? `${t.label}, new updates` : t.label}
                className={`flex w-full flex-col items-center gap-0.5 px-1 pb-2 pt-2 text-[0.7rem] font-semibold ${
                  isActive ? "text-[#0a2150]" : "text-slate-500"
                }`}
              >
                <span className="relative">
                  <Icon name={t.icon} className="h-6 w-6" filled={isActive} />
                  {count > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[0.6rem] font-bold leading-none text-white">
                      {count}
                    </span>
                  )}
                  {dot && <span className="absolute -right-1 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
                </span>
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
