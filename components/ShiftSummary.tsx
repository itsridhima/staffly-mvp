import { formatDateLong, formatTimeRange } from "@/lib/time";
import type { Slot } from "@/lib/types";

export default function ShiftSummary({ slot }: { slot: Slot }) {
  return (
    <div className="rounded-xl bg-stone-100 px-4 py-3 text-sm">
      <div className="font-semibold">{formatDateLong(slot.date)}</div>
      <div>
        {formatTimeRange(slot.startMinutes, slot.length)} · {slot.length}-hour shift
      </div>
    </div>
  );
}
