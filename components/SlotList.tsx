"use client";

import type { SlotOption } from "@/lib/availability";
import { formatINR } from "@/lib/pricing";
import { formatTimeRange } from "@/lib/time";
import type { ShiftLength } from "@/lib/types";

interface Props {
  options: SlotOption[];
  length: ShiftLength;
  selected?: number | null;
  onSelect: (startMinutes: number) => void;
  heading?: string;
}

export default function SlotList({ options, length, selected = null, onSelect, heading }: Props) {
  return (
    <div>
      {heading && <h3 className="mb-2 font-semibold">{heading}</h3>}
      <ul className="space-y-2">
        {options.map((o) => {
          const isSelected = selected === o.startMinutes;
          return (
            <li key={o.startMinutes}>
              <button
                type="button"
                disabled={!o.available}
                aria-pressed={isSelected}
                onClick={() => onSelect(o.startMinutes)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
                  o.available
                    ? isSelected
                      ? "glass-dark"
                      : "neu hover:brightness-105"
                    : "neu-inset cursor-not-allowed text-slate-400"
                }`}
              >
                <span>
                  <span className="block font-semibold">{formatTimeRange(o.startMinutes, length)}</span>
                  <span
                    className={`block text-sm ${
                      o.available ? (isSelected ? "text-sky-200" : o.fewLeft ? "font-semibold text-amber-600" : "text-emerald-600") : ""
                    }`}
                  >
                    {o.available
                      ? isSelected
                        ? "Selected"
                        : o.fewLeft
                          ? "Available · Few left"
                          : "Available"
                      : `Unavailable: ${o.reason ?? "no staff free"}`}
                  </span>
                </span>
                <span className="whitespace-nowrap text-right">
                  <span className="block text-lg font-bold">{formatINR(o.total)}</span>
                  <span className={`block text-xs ${isSelected ? "text-sky-200" : "muted"}`}>excl. GST</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
