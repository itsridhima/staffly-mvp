"use client";

import type { SlotOption } from "@/lib/availability";
import { formatINR } from "@/lib/pricing";
import { formatTimeRange } from "@/lib/time";
import type { ShiftLength } from "@/lib/types";

interface Props {
  options: SlotOption[];
  length: ShiftLength;
  onSelect: (startMinutes: number) => void;
  heading?: string;
}

export default function SlotList({ options, length, onSelect, heading }: Props) {
  return (
    <div>
      {heading && <h3 className="mb-2 font-semibold">{heading}</h3>}
      <ul className="space-y-2">
        {options.map((o) => (
          <li key={o.startMinutes}>
            <button
              type="button"
              disabled={!o.available}
              onClick={() => onSelect(o.startMinutes)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left ${
                o.available
                  ? "border-emerald-600 bg-white hover:bg-emerald-50"
                  : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400"
              }`}
            >
              <span>
                <span className="block font-medium">{formatTimeRange(o.startMinutes, length)}</span>
                <span className="block text-sm">
                  {o.available ? "Available" : `Unavailable: ${o.reason ?? "no staff free"}`}
                </span>
              </span>
              <span className="whitespace-nowrap text-right">
                <span className="block font-semibold">{formatINR(o.total)}</span>
                <span className="block text-xs">excl. GST</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
