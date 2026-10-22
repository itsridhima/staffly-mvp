"use client";

import { formatINR } from "@/lib/pricing";
import type { RoleInfo } from "@/lib/prototypeData";
import RoleIcon from "./RoleIcon";

interface Props {
  role: RoleInfo;
  /** Real availability tag, for example "Today from 4:00 PM" */
  tag: string;
  onOpen: () => void;
  onAdd: () => void;
}

/** A role card: icon, name, starting price, when the next shift can start, and an Add button. */
export default function RoleTile({ role, tag, onOpen, onAdd }: Props) {
  return (
    <div className="neu flex h-full flex-col items-center gap-2 p-2.5 text-center">
      <button type="button" onClick={onOpen} aria-label={`${role.label}, from ${formatINR(role.price[5])}. ${tag}. Open details`} className="flex w-full flex-1 flex-col items-center gap-1.5 pt-1.5">
        <span className="glass-dark flex h-12 w-12 items-center justify-center rounded-2xl">
          <RoleIcon role={role.id} />
        </span>
        <span className="text-xs font-bold leading-tight">{role.shortLabel}</span>
        <span className="muted text-[0.7rem] leading-tight">from {formatINR(role.price[5])}</span>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold leading-tight text-emerald-700">{tag}</span>
      </button>
      <button type="button" onClick={onAdd} aria-label={`Add ${role.label}`} className="w-full rounded-xl border border-blue-300 bg-white/80 py-1.5 text-xs font-bold text-blue-700">
        Add
      </button>
    </div>
  );
}
