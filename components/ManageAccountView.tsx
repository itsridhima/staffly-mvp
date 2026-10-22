"use client";

import { useState } from "react";
import { KEYS } from "@/lib/localStore";
import { buildDataExport, EMPTY_PROFILE, type ProfileData } from "@/lib/profile";
import type { Booking } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import SubPageHeader from "./SubPageHeader";

interface Props {
  profile: ProfileData;
  bookings: Booking[];
  onSaveProfile: (next: ProfileData) => Promise<string | null>;
  onBack: () => void;
}

type Section = null | "terms" | "privacy" | "refund" | "data";

const DOCS: Record<"terms" | "privacy" | "refund", { title: string; body: string }> = {
  terms: {
    title: "Terms of Use",
    body: "Staffly's Terms of Use haven't been written yet. They will appear here before Staffly launches.",
  },
  privacy: {
    title: "Privacy Policy",
    body: "Staffly's Privacy Policy hasn't been written yet. In this prototype your profile is stored in your sign-in account (or in this browser if you're a guest) and your bookings in your account. A full policy will appear here before launch.",
  },
  refund: {
    title: "Refund & Cancellation Policy",
    body: "Refund and cancellation rules haven't been decided yet, so there is nothing to show here. In this prototype nothing is actually charged.",
  },
};

function Row({ icon, label, onClick, danger = false }: { icon: string[]; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-4 text-left ${danger ? "text-red-700" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-6 w-6 text-blue-700">
          {icon.map((p) => (
            <path key={p} d={p} />
          ))}
        </svg>
        <span className="flex-1 font-semibold">{label}</span>
        <span aria-hidden className="muted">›</span>
      </button>
    </li>
  );
}

export default function ManageAccountView({ profile, bookings, onSaveProfile, onBack }: Props) {
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<Section>(null);
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

  if (section && section !== "data") {
    const doc = DOCS[section];
    return (
      <section className="space-y-4">
        <SubPageHeader title={doc.title} onBack={() => setSection(null)} />
        <div className="glass space-y-2 p-5 text-sm leading-relaxed">
          <p>{doc.body}</p>
          <p className="muted text-xs">Prototype placeholder: this is not a real legal document.</p>
        </div>
      </section>
    );
  }

  if (section === "data") {
    return (
      <section className="space-y-4">
        <SubPageHeader title="Manage data" onBack={() => { setSection(null); setMessage(null); }} />
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
          <p className="muted text-sm">Empties your current booking and temporary demo data on this device, then reloads.</p>
          <button type="button" onClick={clearDevice} className="btn-ghost px-4 py-3">
            Clear this device
          </button>
        </div>
        <p className="muted text-xs">
          Deleting your whole account and booking history isn&apos;t available in this prototype yet.
        </p>
        {message && (
          <p role="status" className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">
            {message}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <SubPageHeader title="Manage account" onBack={onBack} />

      {user && (
        <div>
          <h2 className="muted mb-2 text-sm font-semibold">Actions</h2>
          <ul className="glass overflow-hidden">
            <Row icon={["M10 4H5v16h5", "M15 8l4 4-4 4", "M9 12h10"]} label="Log out" onClick={() => signOut()} />
          </ul>
        </div>
      )}

      <div>
        <h2 className="muted mb-2 text-sm font-semibold">Policies & others</h2>
        <ul className="glass divide-y divide-slate-200/70 overflow-hidden">
          <Row icon={["M6 3h9l4 4v14H6z", "M9 12h6M9 16h6"]} label="Terms of Use" onClick={() => setSection("terms")} />
          <Row icon={["M7 11V8a5 5 0 0 1 10 0v3", "M5 11h14v9H5z"]} label="Privacy Policy" onClick={() => setSection("privacy")} />
          <Row icon={["M5 5h14v15H5z", "M8 3v4M16 3v4M9.5 12.5l5 5M14.5 12.5l-5 5"]} label="Refund & Cancellation Policy" onClick={() => setSection("refund")} />
          <Row icon={["M5 7h14", "M9 7V4h6v3", "M7 7l1 13h8l1-13"]} label="Manage data" onClick={() => setSection("data")} />
        </ul>
      </div>
    </section>
  );
}
