"use client";

import { useState } from "react";
import { type BookingFilter, bookingSummary, FILTER_LABEL, filterBookings, newestFirst, totalLabel } from "@/lib/bookingFilters";
import { STATUS_LABEL } from "@/lib/tracking";
import { formatDateLong } from "@/lib/time";
import type { Booking } from "@/lib/types";
import EmptyState from "./EmptyState";
import SubPageHeader from "./SubPageHeader";

interface Props {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  onOpenBooking: (reference: string) => void;
  onBookNow: () => void;
  onBack: () => void;
}

const FILTERS: BookingFilter[] = ["all", "upcoming", "completed", "multiple"];

export default function MyBookingsView({ bookings, loading, error, onOpenBooking, onBookNow, onBack }: Props) {
  const [filter, setFilter] = useState<BookingFilter>("all");
  const shown = newestFirst(filterBookings(bookings, filter));

  return (
    <section className="space-y-4">
      <SubPageHeader title="My bookings" onBack={onBack} />

      <div role="tablist" aria-label="Filter bookings" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${filter === f ? "glass-dark" : "neu"}`}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted text-sm">Loading your bookings…</p>
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings yet" body="Make your first booking and it will show up here with live-style tracking." actionLabel="Book now" onAction={onBookNow} />
      ) : shown.length === 0 ? (
        <EmptyState title={`No ${FILTER_LABEL[filter].toLowerCase()}`} body="Try another filter." actionLabel="Show all bookings" onAction={() => setFilter("all")} />
      ) : (
        <ul className="space-y-3">
          {shown.map((b) => {
            const statuses = Array.from(new Set(b.workers.map((w) => STATUS_LABEL[w.status])));
            const dates = Array.from(new Set(b.lines.map((l) => l.date))).sort();
            return (
              <li key={b.reference}>
                <button type="button" onClick={() => onOpenBooking(b.reference)} className="glass w-full space-y-2 p-4 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-lg font-bold">{b.reference}</div>
                      <div className="muted text-xs">
                        {dates.length === 1 ? formatDateLong(dates[0]) : `${formatDateLong(dates[0])} + ${dates.length - 1} more`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{totalLabel(b)}</div>
                      <div className="muted text-xs">incl. GST</div>
                    </div>
                  </div>
                  <p className="text-sm">{bookingSummary(b)}</p>
                  {b.venue && <p className="muted text-xs">At {b.venue.label}</p>}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="pill">
                      {b.workers.length} {b.workers.length === 1 ? "worker" : "workers"}
                    </span>
                    {statuses.map((s) => (
                      <span key={s} className="pill text-blue-800">
                        {s}
                      </span>
                    ))}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}
    </section>
  );
}
