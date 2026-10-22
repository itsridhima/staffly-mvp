"use client";

import { BOOKABLE_DAYS_AHEAD } from "@/lib/prototypeData";
import { addDays, formatDateLong } from "@/lib/time";
import type { ShiftLength } from "@/lib/types";

interface Props {
  length: ShiftLength;
  date: string;
  today: string;
  onLength: (l: ShiftLength) => void;
  onDate: (d: string) => void;
}

export default function ShiftBasics({ length, date, today, onLength, onDate }: Props) {
  const dates = Array.from({ length: BOOKABLE_DAYS_AHEAD + 1 }, (_, i) => addDays(today, i));
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">1. Shift length and date</h2>
      <div className="flex gap-2" role="radiogroup" aria-label="Shift length">
        {([5, 8] as ShiftLength[]).map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={length === l}
            onClick={() => onLength(l)}
            className={`flex-1 rounded-xl border px-4 py-3 font-medium ${
              length === l ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-stone-300 hover:bg-stone-50"
            }`}
          >
            {l}-hour shift
          </button>
        ))}
      </div>
      <label className="mt-3 block text-sm font-medium text-stone-700" htmlFor="shift-date">
        Date
      </label>
      <select
        id="shift-date"
        value={date}
        onChange={(e) => onDate(e.target.value)}
        className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
      >
        {dates.map((d) => (
          <option key={d} value={d}>
            {formatDateLong(d)}
            {d === today ? " (today)" : ""}
          </option>
        ))}
      </select>
    </section>
  );
}
