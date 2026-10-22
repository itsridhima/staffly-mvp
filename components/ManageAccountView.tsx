"use client";

import type { LegalDoc } from "@/lib/legal";
import { useAuth } from "./AuthProvider";

interface Props {
  onOpenDoc: (id: LegalDoc["id"]) => void;
  onOpenData: () => void;
}

function Row({ icon, label, onClick }: { icon: string[]; label: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-4 text-left">
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

/** Log out, the policies, and a link to Manage data. Policies and data open as their own screens. */
export default function ManageAccountView({ onOpenDoc, onOpenData }: Props) {
  const { user, signOut } = useAuth();
  return (
    <section className="space-y-5">
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
          <Row icon={["M6 3h9l4 4v14H6z", "M9 12h6M9 16h6"]} label="Terms of Use" onClick={() => onOpenDoc("terms")} />
          <Row icon={["M7 11V8a5 5 0 0 1 10 0v3", "M5 11h14v9H5z"]} label="Privacy Policy" onClick={() => onOpenDoc("privacy")} />
          <Row icon={["M5 5h14v15H5z", "M8 3v4M16 3v4M9.5 12.5l5 5M14.5 12.5l-5 5"]} label="Refund & Cancellation Policy" onClick={() => onOpenDoc("refund")} />
          <Row icon={["M5 7h14", "M9 7V4h6v3", "M7 7l1 13h8l1-13"]} label="Manage data" onClick={onOpenData} />
        </ul>
      </div>
    </section>
  );
}
