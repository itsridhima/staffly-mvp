"use client";

import type { ProfileData } from "@/lib/profile";
import BottomSheet from "./BottomSheet";
import Icon from "./icons";

interface Props {
  open: boolean;
  profile: ProfileData;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onManage: () => void;
  onClose: () => void;
}

/** Switch the venue workers are booked for, add a new one, or manage them. */
export default function VenueSheet({ open, profile, onSelect, onAdd, onManage, onClose }: Props) {
  return (
    <BottomSheet open={open} title="Where should workers go?" onClose={onClose}>
      {profile.venues.length === 0 ? (
        <div className="space-y-3">
          <p className="muted text-sm">Save your café, restaurant or hotel so workers know where to report. It shows on your booking.</p>
          <button type="button" onClick={onAdd} className="btn-primary w-full px-4 py-3">
            Add venue
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {profile.venues.map((v) => {
              const selected = v.id === profile.selectedVenueId;
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(v.id)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left ${selected ? "glass-dark" : "neu"}`}
                  >
                    <Icon name="pin" className="h-5 w-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{v.label}</span>
                      <span className={`block truncate text-sm ${selected ? "text-sky-200" : "muted"}`}>{v.address}</span>
                    </span>
                    {selected && <span className="text-xs font-bold">Selected</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex gap-2">
            <button type="button" onClick={onAdd} className="btn-ghost flex-1 px-4 py-3 text-sm">
              Add venue
            </button>
            <button type="button" onClick={onManage} className="btn-ghost flex-1 px-4 py-3 text-sm">
              Manage venues
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
