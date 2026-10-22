"use client";

import { billBreakdown, formatINR } from "@/lib/pricing";
import type { BookingLine } from "@/lib/types";
import DemoTakeSlotButton from "./DemoTakeSlotButton";

interface Props {
  lines: BookingLine[];
  onApprove: () => void;
  onDecline: () => void;
  /** Only passed when developer tools are on */
  onDemoTake?: () => void;
}

/** Final confirmation step before the booking is made. */
export default function SimulatedBankPage({ lines, onApprove, onDecline, onDemoTake }: Props) {
  const bill = billBreakdown(lines);
  return (
    <section className="space-y-4">
      <div className="glass space-y-3 p-5">
        <h2 className="text-xl font-bold">Confirm your payment of {formatINR(bill.grandTotal)}</h2>
        <p className="muted text-sm">
          Online payment isn&apos;t switched on yet, so no money will be taken. Confirming makes your booking and assigns your workers.
        </p>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onDecline} className="btn-ghost px-4 py-3">
            Cancel
          </button>
          <button type="button" onClick={onApprove} className="btn-primary flex-1 px-4 py-3">
            Confirm payment
          </button>
        </div>
      </div>
      {onDemoTake && <DemoTakeSlotButton onClick={onDemoTake} />}
    </section>
  );
}
