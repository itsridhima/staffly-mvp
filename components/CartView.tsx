"use client";

import { billBreakdown, formatINR, headcount } from "@/lib/pricing";
import { roleInfo } from "@/lib/prototypeData";
import { formatDateLong, formatTimeRange } from "@/lib/time";
import type { BookingLine } from "@/lib/types";
import BillPanel from "./BillPanel";
import DemoTakeSlotButton from "./DemoTakeSlotButton";
import RoleIcon from "./RoleIcon";

interface Props {
  lines: BookingLine[];
  loginNote: string | null;
  onRemove: (id: string) => void;
  onAddAnother: () => void;
  onContinue: () => void;
  onDemoTake: () => void;
}

/** Review booking: every role keeps its own date, shift length, timing and price. */
export default function CartView({ lines, loginNote, onRemove, onAddAnother, onContinue, onDemoTake }: Props) {
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
      <DemoTakeSlotButton onClick={onDemoTake} />
    </section>
  );
}
