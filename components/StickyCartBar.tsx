"use client";

import { formatINR } from "@/lib/pricing";
import Icon from "./icons";

interface Props {
  shifts: number;
  total: number;
  onOpen: () => void;
}

/** Appears above the bottom bar once something has been added to the booking. */
export default function StickyCartBar({ shifts, total, onOpen }: Props) {
  return (
    <div className="fixed inset-x-0 z-30 px-4" style={{ bottom: "calc(4.1rem + env(safe-area-inset-bottom))" }}>
      <button type="button" onClick={onOpen} className="btn-primary mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="flex items-center gap-2">
          <Icon name="booking" className="h-5 w-5" />
          <span className="font-bold">
            {shifts} {shifts === 1 ? "shift" : "shifts"} · {formatINR(total)}
          </span>
          <span className="text-xs font-medium opacity-90">excl. GST</span>
        </span>
        <span className="flex items-center gap-1 font-bold">
          View booking
          <Icon name="chevronRight" className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
