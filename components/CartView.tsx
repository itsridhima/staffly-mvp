"use client";

import { billBreakdown, formatINR, headcount } from "@/lib/pricing";
import type { SavedVenue } from "@/lib/profile";
import { roleInfo } from "@/lib/prototypeData";
import { formatDateLong, formatTimeRange } from "@/lib/time";
import type { BookingLine } from "@/lib/types";
import BillPanel from "./BillPanel";
import DemoTakeSlotButton from "./DemoTakeSlotButton";
import RoleIcon from "./RoleIcon";

interface Props {
  lines: BookingLine[];
  loginNote: string | null;
  /** The venue currently selected in Profile → Saved venues */
  venue: SavedVenue | null;
  onChangeVenue: () => void;
  onRemove: (id: string) => void;
  onAddAnother: () => void;
  onContinue: () => void;
  /** Only passed when developer tools are on */
  onDemoTake?: () => void;
}

/** Review booking: every role keeps its own date, shift length, timing and price. */
export default function CartView({ lines, loginNote, venue, onChangeVenue, onRemove, onAddAnother, onContinue, onDemoTake }: Props) {
  const bill = billBreakdown(lines);

  if (lines.length === 0) {
    return (
      <section className="glass space-y-3 p-6 text-center">
        <h2 className="text-xl font-bold">Your booking is empty</h2>
        <p className="muted text-sm">Open a role on the home screen, choose a shift and add workers.</p>
        <button type="button" onClick={onAddAnother} className="btn-primary px-5 py-3">
          Browse roles
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black">Review booking</h2>
      <p className="muted -mt-2 text-sm">
        {headcount(lines)} {headcount(lines) === 1 ? "worker" : "workers"} across {lines.length} {lines.length === 1 ? "shift" : "shifts"}
      </p>

      <ul className="space-y-3">
        {lines.map((l) => (
          <li key={l.id} className="glass p-4">
            <div className="flex items-start gap-3">
              <span className="glass-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <RoleIcon role={l.role} className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-bold">
                  {l.qty} × {roleInfo(l.role).label}
                </div>
                <div className="muted">
                  {l.length}-hour shift · {formatDateLong(l.date)}
                </div>
                <div className="muted">{formatTimeRange(l.startMinutes, l.length)}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatINR(bill.lines.find((b) => b.lineId === l.id)?.amount ?? 0)}</div>
                <div className="muted text-xs">excl. GST</div>
                <button
                  type="button"
                  onClick={() => onRemove(l.id)}
                  aria-label={`Remove ${roleInfo(l.role).label}`}
                  className="mt-1 text-xs font-semibold text-red-600 underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <section className="glass flex items-center gap-3 p-4" aria-label="Shift location">
        <span className="glass-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
            <path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <div className="muted text-xs">Shift location</div>
          {venue ? (
            <>
              <div className="font-bold">{venue.label}</div>
              <div className="muted truncate">{venue.address}</div>
            </>
          ) : (
            <div className="font-semibold">No venue added. Workers won&apos;t know where to go.</div>
          )}
        </div>
        <button type="button" onClick={onChangeVenue} className="btn-ghost shrink-0 px-3 py-2 text-sm">
          {venue ? "Change" : "Add venue"}
        </button>
      </section>

      <BillPanel lines={lines} dark title="Summary" />
      <p className="muted text-xs">GST is added on the payment page.</p>

      {loginNote && <p className="glass px-4 py-3 text-sm">{loginNote}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={onAddAnother} className="btn-ghost px-4 py-3">
          Add another role
        </button>
        <button type="button" onClick={onContinue} className="btn-primary flex-1 px-4 py-3">
          Continue
        </button>
      </div>
      {onDemoTake && <DemoTakeSlotButton onClick={onDemoTake} />}
    </section>
  );
}
