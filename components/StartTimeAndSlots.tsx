"use client";

import type { SlotOption } from "@/lib/availability";
import type { ShiftLength } from "@/lib/types";
import SlotList from "./SlotList";

interface Props {
  startTime: string;
  onStartTime: (v: string) => void;
  onShowSlots: () => void;
  canShow: boolean;
  timeInvalid: boolean;
  slots: SlotOption[] | null;
  length: ShiftLength;
  onSelect: (startMinutes: number) => void;
}

export default function StartTimeAndSlots({
  startTime,
  onStartTime,
  onShowSlots,
  canShow,
  timeInvalid,
  slots,
  length,
  onSelect,
}: Props) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold">3. When do you need them?</h2>
      <p className="mb-3 text-sm text-stone-600">
        Enter the time you want the shift to start. We&apos;ll show that time and nearby start times.
      </p>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label htmlFor="start-time" className="block text-sm font-medium text-stone-700">
            Start time
          </label>
          <input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => onStartTime(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2"
          />
        </div>
        <button
          type="button"
          onClick={onShowSlots}
          disabled={!canShow || timeInvalid}
          className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:bg-stone-300"
        >
          Show available slots
        </button>
      </div>
      {!canShow && <p className="mt-2 text-sm text-stone-500">Add at least one worker above first.</p>}
      {timeInvalid && <p className="mt-2 text-sm text-red-700">Please enter a valid start time.</p>}

      {slots && (
        <div className="mt-4">
          {slots.length === 0 ? (
            <p className="text-sm text-stone-600">No slots fit that start time. Try an earlier time.</p>
          ) : (
            <SlotList options={slots} length={length} onSelect={onSelect} heading="Pick a slot" />
          )}
        </div>
      )}
    </section>
  );
}
