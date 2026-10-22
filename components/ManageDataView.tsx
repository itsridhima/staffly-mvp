"use client";

import { useState } from "react";
import { KEYS } from "@/lib/localStore";
import { buildDataExport, EMPTY_PROFILE, type ProfileData } from "@/lib/profile";
import type { Booking } from "@/lib/types";
import { useAuth } from "./AuthProvider";

interface Props {
  profile: ProfileData;
  bookings: Booking[];
  onSaveProfile: (next: ProfileData) => Promise<string | null>;
}

/** Download your data, clear your saved profile, or clear this device. */
export default function ManageDataView({ profile, bookings, onSaveProfile }: Props) {
  const { user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  function download() {
    const data = buildDataExport(profile, bookings, { email: user?.email, phone: user?.phone });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "staffly-my-data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMessage("Your data was downloaded as staffly-my-data.json.");
  }

  async function clearProfile() {
    const err = await onSaveProfile(EMPTY_PROFILE);
    setConfirmClear(false);
    setMessage(err ? "Couldn't clear your profile. Please try again." : "Your saved profile (name, venues and favourites) was cleared.");
  }

  function clearDevice() {
    try {
      for (const key of [KEYS.cart, KEYS.demoLedger, KEYS.notificationsSeen]) localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    window.location.reload();
  }

  return (
    <section className="space-y-4">
      <div className="glass space-y-3 p-5">
        <h2 className="font-bold">Download my data</h2>
        <p className="muted text-sm">Get a file with your profile and bookings.</p>
        <button type="button" onClick={download} className="btn-primary px-4 py-3">
          Download my data
        </button>
      </div>
      <div className="glass space-y-3 p-5">
        <h2 className="font-bold">Clear my saved profile</h2>
        <p className="muted text-sm">Removes your name, venue details, saved venues and favourites. Your bookings are kept.</p>
        {confirmClear ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmClear(false)} className="btn-ghost flex-1 px-4 py-3">
              Keep
            </button>
            <button type="button" onClick={clearProfile} className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-bold text-white">
              Yes, clear it
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmClear(true)} className="btn-ghost px-4 py-3 text-red-700">
            Clear saved profile
          </button>
        )}
      </div>
      <div className="glass space-y-3 p-5">
        <h2 className="font-bold">Clear this device</h2>
        <p className="muted text-sm">Empties your current, unconfirmed booking and saved settings on this device, then reloads.</p>
        <button type="button" onClick={clearDevice} className="btn-ghost px-4 py-3">
          Clear this device
        </button>
      </div>
      <p className="muted text-xs">Deleting your whole account and booking history isn&apos;t available in the app yet.</p>
      {message && (
        <p role="status" className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {message}
        </p>
      )}
    </section>
  );
}
