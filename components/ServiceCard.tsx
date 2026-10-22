"use client";

import type { BookAgainPreset } from "@/lib/home";
import { formatINR, lineTotal } from "@/lib/pricing";
import { roleInfo } from "@/lib/prototypeData";
import { formatTime } from "@/lib/time";
import RoleIcon from "./RoleIcon";

interface Props {
  preset: BookAgainPreset;
  onAdd: () => void;
}

/** A "Book again" card: the same role, number of workers, shift length and usual start time. */
export default function ServiceCard({ preset, onAdd }: Props) {
  const info = roleInfo(preset.role);
  return (
    <div className="glass flex w-40 shrink-0 snap-start flex-col gap-2 p-3">
      <span className="glass-dark flex h-10 w-10 items-center justify-center rounded-xl">
        <RoleIcon role={preset.role} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">
          {preset.qty} × {info.shortLabel}
        </p>
        <p className="muted text-xs">
          {preset.length}h · {formatTime(preset.startMinutes)}
        </p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-sm font-bold">
          {formatINR(lineTotal({ role: preset.role, qty: preset.qty, length: preset.length }))}
        </span>
        <button type="button" onClick={onAdd} aria-label={`Add ${preset.qty} ${info.label} again`} className="rounded-xl border border-blue-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-blue-700">
          Add
        </button>
      </div>
    </div>
  );
}
