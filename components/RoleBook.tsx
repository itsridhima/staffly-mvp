"use client";

import { useMemo, useState } from "react";
import { getSlots } from "@/lib/availability";
import { formatINR, lineTotal } from "@/lib/pricing";
import { BOOKABLE_DAYS_AHEAD, maxQuantity, roleInfo } from "@/lib/prototypeData";
import { addDays, formatDateLong, formatTimeRange, parseTime } from "@/lib/time";
import type { BookingLine, Ledger, LineSpec, RoleId, ShiftLength } from "@/lib/types";
import QuantityStepper from "./QuantityStepper";
import SlotList from "./SlotList";

interface Props {
  role: RoleId;
  today: string;
  /** Lines already in the booking: their workers count as taken when checking slots. */
  cart: BookingLine[];
  ledger: Ledger;
  onAdd: (spec: LineSpec) => void;
}

/** Per-role booking: shift length -> date -> start time -> slots -> number of workers -> add. */
export default function RoleBook({ role, today, cart, ledger, onAdd }: Props) {
  const info = roleInfo(role);
  const [length, setLength] = useState<ShiftLength>(5);
  const [date, setDate] = useState(() => addDays(today, 1)); // tomorrow: not affected by today's clock
  const [startTime, setStartTime] = useState("12:00");
  const [shownStart, setShownStart] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [qty, setQty] = useState(1);

  const requested = parseTime(startTime);
  const max = maxQuantity(role);
  const dates = Array.from({ length: BOOKABLE_DAYS_AHEAD + 1 }, (_, i) => addDays(today, i));

  const slots = useMemo(() => {
    if (shownStart === null) return null;
    return getSlots({ role, qty, length, date }, shownStart, ledger, new Date(), cart);
  }, [shownStart, role, qty, length, date, ledger, cart]);

  const chosen = slots?.find((s) => s.startMinutes === selected && s.available) ?? null;

  function resetSlots() {
    setShownStart(null);
    setSelected(null);
  }

  return (
    <div className="space-y-4">
      <section className="glass space-y-3 p-4">
        <h3 className="font-bold">1. Shift length</h3>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Shift length">
          {([5, 8] as ShiftLength[]).map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={length === l}
              onClick={() => {
                setLength(l);
                resetSlots();
              }}
              className={`px-4 py-3 text-left ${length === l ? "glass-dark" : "neu"}`}
            >
              <span className="block font-bold">{l}-hour shift</span>
              <span className={`block text-sm ${length === l ? "text-sky-200" : "muted"}`}>{formatINR(info.price[l])} per person</span>
            </button>
          ))}
        </div>
      </section>

      <section className="glass space-y-3 p-4">
        <h3 className="font-bold">2. Date</h3>
        <label className="sr-only" htmlFor="shift-date">
          Date
        </label>
        <select
          id="shift-date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            resetSlots();
          }}
          className="neu-inset w-full px-3 py-3"
        >
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatDateLong(d)}
              {d === today ? " (today)" : ""}
            </option>
          ))}
        </select>
      </section>

      <section className="glass space-y-3 p-4">
        <h3 className="font-bold">3. Start time</h3>
        <p className="muted text-sm">Type when you want this shift to start. We&apos;ll show that time and nearby start times.</p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="start-time" className="sr-only">
              Start time
            </label>
            <input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                resetSlots();
              }}
              className="neu-inset w-full px-3 py-3"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!Number.isNaN(requested)) {
                setShownStart(requested);
                setSelected(null);
              }
            }}
            disabled={Number.isNaN(requested)}
            className="btn-primary px-4 py-3"
          >
            Show available slots
          </button>
        </div>
        {Number.isNaN(requested) && <p className="text-sm text-red-700">Please enter a valid start time.</p>}
      </section>

      {slots && (
        <section className="glass space-y-3 p-4">
          <h3 className="font-bold">4. Pick a slot</h3>
          {slots.length === 0 ? (
            <p className="muted text-sm">No slots fit that start time. Try an earlier time.</p>
          ) : (
            <SlotList options={slots} length={length} selected={selected} onSelect={setSelected} />
          )}
        </section>
      )}

      {slots && (
        <section className="glass space-y-3 p-4">
          <h3 className="font-bold">5. How many workers?</h3>
          <div className="flex items-center justify-between gap-3">
            <QuantityStepper
              label={info.label}
              value={qty}
              max={max}
              onChange={(v) => {
                setQty(Math.max(1, Math.min(max, v)));
              }}
            />
            <span className="muted text-sm">up to {max} in the demo</span>
          </div>
          {selected !== null && !chosen && (
            <p className="text-sm text-amber-700">That slot isn&apos;t available for {qty} {qty === 1 ? "worker" : "workers"}. Pick another slot or change the number.</p>
          )}
        </section>
      )}

      <section className="glass-dark p-4">
        {chosen && selected !== null ? (
          <>
            <p className="text-sm text-sky-200">Adding to your booking</p>
            <p className="font-bold">
              {qty} × {info.label}
            </p>
            <p className="text-sm text-sky-100">
              {length}-hour shift · {formatDateLong(date)} · {formatTimeRange(selected, length)}
            </p>
            <p className="mt-1 text-2xl font-black">
              {formatINR(lineTotal({ role, qty, length }))} <span className="text-xs font-normal text-sky-200">excl. GST</span>
            </p>
          </>
        ) : (
          <p className="text-sm text-sky-100">Choose a shift, date, start time and an available slot to add this role.</p>
        )}
        <button
          type="button"
          disabled={!chosen}
          onClick={() => selected !== null && onAdd({ role, qty, length, date, startMinutes: selected })}
          className="btn-primary mt-3 w-full px-4 py-3"
        >
          Add to booking
        </button>
      </section>
    </div>
  );
}
