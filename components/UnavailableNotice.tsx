"use client";

import type { SlotOption } from "@/lib/availability";
import { roleInfo } from "@/lib/prototypeData";
import { formatDateLong, formatTimeRange } from "@/lib/time";
import type { BookingLine } from "@/lib/types";
import SlotList from "./SlotList";

interface Props {
  line: BookingLine;
  reason: string;
  alternatives: SlotOption[];
  onSelectAlternative: (startMinutes: number) => void;
  onBackToBooking: () => void;
}

export default function UnavailableNotice({ line, reason, alternatives, onSelectAlternative, onBackToBooking }: Props) {
  return (
    <section className="space-y-4">
      <div role="alert" className="rounded-3xl border border-red-300 bg-red-50/90 p-5 text-red-900">
        <h2 className="text-lg font-bold">Sorry, this slot is no longer available</h2>
        <p className="mt-1 text-sm">
          {line.qty} × {roleInfo(line.role).label} on {formatDateLong(line.date)}, {formatTimeRange(line.startMinutes, line.length)}, can&apos;t be booked right now ({reason}).
          Nothing was booked and nothing was charged. Your other items are unchanged.
        </p>
      </div>

      {alternatives.length > 0 ? (
        <SlotList
          options={alternatives}
          length={line.length}
          onSelect={onSelectAlternative}
          heading={`Nearest available alternatives for ${roleInfo(line.role).shortLabel}`}
        />
      ) : (
        <p className="glass p-4 text-sm">
          No nearby start times can fit this item. Go back to your booking to remove it or choose another date or fewer workers.
        </p>
      )}

      <button type="button" onClick={onBackToBooking} className="btn-ghost w-full px-4 py-3">
        Back to my booking
      </button>
    </section>
  );
}
