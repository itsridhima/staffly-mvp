"use client";

import { useMemo, useState } from "react";
import { type CrewMember, crewFromBookings, MAX_FAVOURITES, type ProfileData } from "@/lib/profile";
import { roleInfo, WORKERS } from "@/lib/prototypeData";
import { formatDateLong } from "@/lib/time";
import type { Booking, RoleId } from "@/lib/types";
import EmptyState from "./EmptyState";
import RoleIcon from "./RoleIcon";
import SubPageHeader from "./SubPageHeader";

interface Props {
  bookings: Booking[];
  profile: ProfileData;
  onToggleFavourite: (workerId: string) => void;
  onRebook: (role: RoleId) => void;
  onBookNow: () => void;
  onBack: () => void;
}

type Tab = "favourites" | "worked";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" />
    </svg>
  );
}

export default function CrewView({ bookings, profile, onToggleFavourite, onRebook, onBookNow, onBack }: Props) {
  const [tab, setTab] = useState<Tab>("worked");
  const crew = useMemo(() => crewFromBookings(bookings), [bookings]);

  // A favourite may not have worked a booking in this browser yet, so list favourites from the worker directory too.
  const favourites: CrewMember[] = useMemo(() => {
    return profile.favourites
      .map((id) => {
        const worked = crew.find((c) => c.worker.id === id);
        if (worked) return worked;
        const worker = WORKERS.find((w) => w.id === id);
        return worker ? { worker, role: worker.role, shifts: 0, completed: 0, lastShiftDate: "" } : null;
      })
      .filter((c): c is CrewMember => c !== null);
  }, [profile.favourites, crew]);

  const list = tab === "favourites" ? favourites : crew;

  return (
    <section className="space-y-4">
      <SubPageHeader title="Your crew" subtitle="Workers you've had on your shifts" onBack={onBack} />

      <div role="tablist" aria-label="Crew" className="neu-inset grid grid-cols-2 gap-1 p-1">
        {(
          [
            ["worked", `Worked with you (${crew.length})`],
            ["favourites", `Favourites (${favourites.length})`],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${tab === id ? "glass-dark" : "muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        tab === "worked" ? (
          <EmptyState title="Workers who've been on your shifts appear here" body="Why not make a booking right away?" actionLabel="Book now" onAction={onBookNow} />
        ) : (
          <EmptyState title="No favourites yet" body="Tap the heart on a worker you liked. You can save up to 50." />
        )
      ) : (
        <ul className="space-y-3">
          {list.map((m) => {
            const fav = profile.favourites.includes(m.worker.id);
            return (
              <li key={m.worker.id} className="glass p-4">
                <div className="flex items-start gap-3">
                  <span className="glass-dark flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold" aria-hidden>
                    {m.worker.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="font-bold">{m.worker.name}</div>
                    <div className="flex items-center gap-1.5 text-blue-700">
                      <RoleIcon role={m.role} className="h-4 w-4" />
                      {roleInfo(m.role).label}
                    </div>
                    <div className="muted text-xs">
                      {m.shifts > 0
                        ? `${m.shifts} ${m.shifts === 1 ? "shift" : "shifts"} · last ${formatDateLong(m.lastShiftDate)}`
                        : "Not booked yet in this browser"}
                    </div>
                    <div className="muted text-xs">{m.worker.skills.join(" · ")}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleFavourite(m.worker.id)}
                    disabled={!fav && profile.favourites.length >= MAX_FAVOURITES}
                    aria-pressed={fav}
                    aria-label={fav ? `Remove ${m.worker.name} from favourites` : `Add ${m.worker.name} to favourites`}
                    className={fav ? "text-rose-500" : "muted"}
                  >
                    <Heart filled={fav} />
                  </button>
                </div>
                <button type="button" onClick={() => onRebook(m.role)} className="btn-ghost mt-3 w-full px-4 py-2 text-sm">
                  Book {roleInfo(m.role).shortLabel} again
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="muted text-xs">
        Prototype: booking a role again doesn&apos;t guarantee the same worker. Workers are demo data.
      </p>
    </section>
  );
}
