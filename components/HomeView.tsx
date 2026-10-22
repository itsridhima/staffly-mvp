"use client";

import { useMemo, useState } from "react";
import { earliestLabel, earliestStart } from "@/lib/earliest";
import { type BookAgainPreset, bookAgainPresets, nextShift } from "@/lib/home";
import type { LegalDoc } from "@/lib/legal";
import { billBreakdown, formatINR, headcount } from "@/lib/pricing";
import { displayName, roleInfo, ROLES } from "@/lib/prototypeData";
import { searchRoles } from "@/lib/search";
import type { Booking, BookingLine, Ledger, RoleId, Worker } from "@/lib/types";
import Icon from "./icons";
import InfoBar from "./InfoBar";
import RoleIcon from "./RoleIcon";
import RoleTile from "./RoleTile";
import SearchBar from "./SearchBar";
import SectionHeader from "./SectionHeader";
import ServiceCard from "./ServiceCard";

interface Props {
  lines: BookingLine[];
  bookings: Booking[];
  ledger: Ledger;
  /** Favourite workers, already looked up */
  favourites: Worker[];
  onOpenRole: (role: RoleId) => void;
  onQuickAdd: (role: RoleId, preset?: BookAgainPreset) => void;
  onOpenCart: () => void;
  onOpenBooking: (reference: string) => void;
  onOpenShifts: () => void;
  onOpenCrew: () => void;
  onOpenHelp: () => void;
  onOpenDoc: (id: LegalDoc["id"]) => void;
}

export default function HomeView({
  lines,
  bookings,
  ledger,
  favourites,
  onOpenRole,
  onQuickAdd,
  onOpenCart,
  onOpenBooking,
  onOpenShifts,
  onOpenCrew,
  onOpenHelp,
  onOpenDoc,
}: Props) {
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;

  // Real availability tags ("Today from 4:00 PM"), recalculated when bookings change.
  const tags = useMemo(() => {
    const now = new Date();
    return Object.fromEntries(ROLES.map((r) => [r.id, earliestLabel(earliestStart(r.id, ledger, now, lines), now)])) as Record<RoleId, string>;
  }, [ledger, lines]);

  const upcoming = useMemo(() => nextShift(bookings, new Date()), [bookings]);
  const presets = useMemo(() => bookAgainPresets(bookings), [bookings]);
  const results = useMemo(() => searchRoles(query), [query]);

  const people = headcount(lines);
  const cart = people > 0 ? { people, shifts: lines.length, total: billBreakdown(lines).itemTotal } : null;

  return (
    <>
      <SearchBar value={query} onChange={setQuery} />

      <div className="space-y-6 pt-2">
        {searching ? (
          <section aria-label="Search results">
            <SectionHeader title={results.length ? "Roles matching your search" : "No match"} subtitle={`“${query.trim()}”`} />
            {results.length === 0 ? (
              <div className="glass space-y-3 p-5 text-sm">
                <p className="font-semibold">We couldn&apos;t find a role for that.</p>
                <p className="muted">Try a role name like “waiter” or a task like “wash dishes”, or ask for help.</p>
                <button type="button" onClick={onOpenHelp} className="btn-ghost px-4 py-2 text-sm">
                  Get help
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {results.map((id) => {
                  const role = roleInfo(id);
                  return (
                    <li key={id} className="glass flex items-center gap-3 p-3">
                      <button type="button" onClick={() => onOpenRole(id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="glass-dark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                          <RoleIcon role={id} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold">{role.label}</span>
                          <span className="muted block text-xs">
                            from {formatINR(role.price[5])} · {tags[id]}
                          </span>
                        </span>
                      </button>
                      <button type="button" onClick={() => onQuickAdd(id)} aria-label={`Add ${role.label}`} className="shrink-0 rounded-xl border border-blue-300 bg-white/80 px-4 py-2 text-sm font-bold text-blue-700">
                        Add
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : (
          <>
            <InfoBar nextShift={upcoming} cart={cart} onOpenShift={onOpenBooking} onOpenCart={onOpenCart} />

            <section aria-label="Roles">
              <SectionHeader title="Book staff" subtitle="Pick a role. Tags show the next free shift." />
              <ul className="grid grid-cols-3 gap-3">
                {ROLES.map((role) => (
                  <li key={role.id}>
                    <RoleTile role={role} tag={tags[role.id]} onOpen={() => onOpenRole(role.id)} onAdd={() => onQuickAdd(role.id)} />
                  </li>
                ))}
              </ul>
            </section>

            {presets.length > 0 && (
              <section aria-label="Book again">
                <SectionHeader title="Book again" subtitle="Repeat a past shift in one tap" actionLabel="See all" onAction={onOpenShifts} />
                <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
                  {presets.map((p) => (
                    <ServiceCard key={p.id} preset={p} onAdd={() => onQuickAdd(p.role, p)} />
                  ))}
                </div>
              </section>
            )}

            {favourites.length > 0 && (
              <section aria-label="Your crew">
                <SectionHeader title="Your crew" subtitle="Workers you've saved" actionLabel="See all" onAction={onOpenCrew} />
                <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
                  {favourites.map((w) => {
                    const name = displayName(w.name);
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => onQuickAdd(w.role)}
                        aria-label={`Book ${roleInfo(w.role).label} like ${name}`}
                        className="glass flex w-28 shrink-0 snap-start flex-col items-center gap-1.5 p-3 text-center"
                      >
                        <span className="glass-dark flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold">
                          {name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <span className="w-full truncate text-sm font-bold">{name.split(" ")[0]}</span>
                        <span className="muted w-full truncate text-xs">{roleInfo(w.role).shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section aria-label="Help">
              <button type="button" onClick={onOpenHelp} className="glass flex w-full items-center gap-3 p-4 text-left">
                <span className="glass-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                  <Icon name="help" className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">Need help with a shift?</span>
                  <span className="muted block text-sm">Ask Staffly, read the FAQ, or see how refunds work.</span>
                </span>
                <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-slate-400" />
              </button>
              <p className="muted mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                <button type="button" onClick={() => onOpenDoc("refund")} className="underline">
                  Refund &amp; Cancellation
                </button>
                <button type="button" onClick={() => onOpenDoc("terms")} className="underline">
                  Terms of Use
                </button>
                <button type="button" onClick={() => onOpenDoc("privacy")} className="underline">
                  Privacy Policy
                </button>
              </p>
            </section>
          </>
        )}
      </div>
    </>
  );
}
