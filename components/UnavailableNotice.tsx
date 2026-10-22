"use client";

import type { SlotOption } from "@/lib/availability";
import { formatTimeRange } from "@/lib/time";
import type { ShiftLength } from "@/lib/types";
import SlotList from "./SlotList";

interface Props {
  reason: string;
  takenStart: number;
  length: ShiftLength;
  alternatives: SlotOption[];
  onSelectAlternative: (startMinutes: number) => void;
  onChangeOrder: () => void;
}

export default function UnavailableNotice({
  reason,
  takenStart,
  length,
  alternatives,
  onSelectAlternative,
  onChangeOrder,
}: Props) {
  return (
    <section className="space-y-4">
      <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-red-900">
        <h2 className="text-lg font-semibold">Sorry, this slot is no longer available</h2>
        <p className="mt-1 text-sm">
          {formatTimeRange(takenStart, length)} can&apos;t be booked right now ({reason}). Nothing was booked and
          nothing was charged.
        </p>
      </div>

      {alternatives.length > 0 ? (
        <SlotList
          options={alternatives}
          length={length}
          onSelect={onSelectAlternative}
          heading="Nearest available alternatives"
        />
      ) : (
        <p className="rounded-xl bg-stone-100 p-4 text-sm">
          No nearby start times can fit your whole order. Try another date or fewer workers.
        </p>
      )}

      <button type="button" onClick={onChangeOrder} className="w-full rounded-xl border border-stone-300 px-4 py-3 font-medium">
        Change date, time or crew
      </button>
    </section>
  );
}
