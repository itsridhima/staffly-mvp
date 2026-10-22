"use client";

import { useState } from "react";
import { normalizeIndianPhone } from "@/lib/phone";
import { type ProfileData, VENUE_TYPE_LABEL, type VenueType } from "@/lib/profile";
import { useAuth } from "./AuthProvider";
import SubPageHeader from "./SubPageHeader";

interface Props {
  profile: ProfileData;
  onSave: (next: ProfileData) => Promise<string | null>;
  onBack: () => void;
}

const TYPES = Object.keys(VENUE_TYPE_LABEL) as VenueType[];

export default function EditProfileView({ profile, onSave, onBack }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState(profile.name);
  const [venueName, setVenueName] = useState(profile.venueName);
  const [venueType, setVenueType] = useState<VenueType | "">(profile.venueType);
  const [phone, setPhone] = useState(profile.contactPhone ? profile.contactPhone.slice(3) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError(null);
    let contactPhone = "";
    if (phone.trim()) {
      const normalized = normalizeIndianPhone(phone);
      if (!normalized) {
        setError("Enter a valid 10-digit Indian mobile number, or leave it empty.");
        return;
      }
      contactPhone = normalized;
    }
    setSaving(true);
    const err = await onSave({ ...profile, name: name.trim(), venueName: venueName.trim(), venueType, contactPhone });
    setSaving(false);
    if (err) setError("Your changes couldn't be saved. Please try again.");
    else onBack();
  }

  return (
    <section className="space-y-4">
      <SubPageHeader title="Edit profile" onBack={onBack} />
      <form
        className="glass space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <label htmlFor="p-name" className="block text-sm font-semibold">
            Your name
          </label>
          <input id="p-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ridhima" className="neu-inset mt-1 w-full px-3 py-3" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="p-venue" className="block text-sm font-semibold">
            Venue name
          </label>
          <input id="p-venue" value={venueName} maxLength={60} onChange={(e) => setVenueName(e.target.value)} placeholder="e.g. Blue Door Café" className="neu-inset mt-1 w-full px-3 py-3" autoComplete="organization" />
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">Venue type</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={venueType === t}
                onClick={() => setVenueType(venueType === t ? "" : t)}
                className={`px-3 py-3 text-sm font-semibold ${venueType === t ? "glass-dark" : "neu"}`}
              >
                {VENUE_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="p-phone" className="block text-sm font-semibold">
            Venue contact number (optional)
          </label>
          <div className="neu-inset mt-1 flex items-center gap-2 px-3">
            <span className="font-semibold text-slate-600">+91</span>
            <input id="p-phone" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className="w-full bg-transparent py-3 outline-none" />
          </div>
        </div>
        <div className="muted text-xs">
          Sign-in: {user?.email ?? user?.phone ?? "guest"}. This can&apos;t be changed here.
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <button type="submit" disabled={saving} className="btn-primary w-full px-4 py-3">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </section>
  );
}
