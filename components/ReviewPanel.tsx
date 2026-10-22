"use client";

import type { Order, Slot } from "@/lib/types";
import BillPanel from "./BillPanel";
import DemoTakeSlotButton from "./DemoTakeSlotButton";
import ShiftSummary from "./ShiftSummary";

interface Props {
  order: Order;
  slot: Slot;
  onContinue: () => void;
  onBack: () => void;
  onDemoTake: () => void;
}

export default function ReviewPanel({ order, slot, onContinue, onBack, onDemoTake }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Review your booking</h2>
      <ShiftSummary slot={slot} />
      <BillPanel order={order} length={slot.length} title="Workers" />
      <p className="text-sm text-stone-600">GST is added on the next page.</p>
      <div className="flex gap-2">
        <button type="button" onClick={onBack} className="rounded-xl border border-stone-300 px-4 py-3 font-medium">
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white"
        >
          Continue
        </button>
      </div>
      <DemoTakeSlotButton onClick={onDemoTake} />
    </section>
  );
}
