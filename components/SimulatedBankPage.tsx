"use client";

import { billBreakdown, formatINR } from "@/lib/pricing";
import type { BookingLine } from "@/lib/types";
import DemoTakeSlotButton from "./DemoTakeSlotButton";

interface Props {
  lines: BookingLine[];
  onApprove: () => void;
  onDecline: () => void;
  onDemoTake: () => void;
}

export default function SimulatedBankPage({ lines, onApprove, onDecline, onDemoTake }: Props) {
  const bill = billBreakdown(lines);
  return (
    <section className="space-y-4">
      <div className="rounded-3xl border-2 border-dashed border-sky-400 bg-sky-50/80 p-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-sky-800">Simulated bank page (prototype)</p>
        <h2 className="text-xl font-bold">Approve payment of {formatINR(bill.grandTotal)}?</h2>
        <p className="mt-1 text-sm text-slate-700">This is a fake bank screen. No real bank is contacted and no money moves.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onDecline} className="btn-ghost px-4 py-3">
            Decline
          </button>
          <button type="button" onClick={onApprove} className="btn-primary flex-1 px-4 py-3">
            Approve payment
          </button>
        </div>
      </div>
      <DemoTakeSlotButton onClick={onDemoTake} />
    </section>
  );
}
