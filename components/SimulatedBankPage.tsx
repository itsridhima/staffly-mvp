"use client";

import { billBreakdown, formatINR } from "@/lib/pricing";
import type { Order, ShiftLength } from "@/lib/types";
import DemoTakeSlotButton from "./DemoTakeSlotButton";

interface Props {
  order: Order;
  length: ShiftLength;
  onApprove: () => void;
  onDecline: () => void;
  onDemoTake: () => void;
}

export default function SimulatedBankPage({ order, length, onApprove, onDecline, onDemoTake }: Props) {
  const bill = billBreakdown(order, length);
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50 p-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-sky-800">Simulated bank page (prototype)</p>
        <h2 className="text-lg font-semibold">Approve payment of {formatINR(bill.grandTotal)}?</h2>
        <p className="mt-1 text-sm text-stone-700">
          This is a fake bank screen. No real bank is contacted and no money moves.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-xl border border-stone-300 bg-white px-4 py-3 font-medium"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="flex-1 rounded-xl bg-sky-700 px-4 py-3 font-semibold text-white"
          >
            Approve payment
          </button>
        </div>
      </div>
      <DemoTakeSlotButton onClick={onDemoTake} />
    </section>
  );
}
