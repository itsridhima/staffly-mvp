"use client";

import type { BookAgainPreset } from "@/lib/home";
import { roleInfo } from "@/lib/prototypeData";
import type { BookingLine, Ledger, LineSpec, RoleId } from "@/lib/types";
import BottomSheet from "./BottomSheet";
import RoleBook from "./RoleBook";
import RoleIcon from "./RoleIcon";

interface Props {
  role: RoleId | null;
  preset?: BookAgainPreset;
  today: string;
  cart: BookingLine[];
  ledger: Ledger;
  onAdd: (spec: LineSpec) => void;
  onSeeDetails: (role: RoleId) => void;
  onClose: () => void;
}

/** The booking form in a bottom sheet, so a role can be added without leaving the page. */
export default function QuickBookSheet({ role, preset, today, cart, ledger, onAdd, onSeeDetails, onClose }: Props) {
  const info = role ? roleInfo(role) : null;
  return (
    <BottomSheet open={role !== null} title={info ? `Book ${info.shortLabel}` : "Book"} onClose={onClose}>
      {role && info && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="glass-dark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
              <RoleIcon role={role} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{info.label}</p>
              <button type="button" onClick={() => onSeeDetails(role)} className="text-sm font-bold text-blue-700">
                Overview and reviews
              </button>
            </div>
          </div>
          <RoleBook role={role} today={today} cart={cart} ledger={ledger} onAdd={onAdd} preset={preset} />
        </div>
      )}
    </BottomSheet>
  );
}
