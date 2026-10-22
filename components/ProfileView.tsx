"use client";

import { formatINR } from "@/lib/pricing";
import { STATUS_LABEL } from "@/lib/tracking";
import type { Booking } from "@/lib/types";
import { useAuth } from "./AuthProvider";

interface Props {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  onOpenBooking: (reference: string) => void;
  onLogin: () => void;
}

function createdLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ProfileView({ bookings, loading, error, onOpenBooking, onLogin }: Props) {
  const { configured, user, ready, signOut } = useAuth();
  const newestFirst = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-5">
      <section className="glass-dark p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-black ring-1 ring-white/25">
            {(user?.email?.[0] ?? "G").toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-black">Employer profile</h1>
            <p className="truncate text-sm text-sky-200">
              {user?.email ?? (configured ? "Not signed in" : "Guest (demo): login isn't set up on this copy")}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {configured && ready && !user && (
            <button type="button" onClick={onLogin} className="btn-primary px-4 py-2 text-sm">
              Log in
            </button>
          )}
          {user && (
            <button type="button" onClick={() => signOut()} className="rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold text-white">
              Sign out
            </button>
          )}
        </div>
      </section>

      <section aria-label="My bookings" className="space-y-3">
        <h2 className="text-xl font-black">My bookings</h2>

        {configured && ready && !user ? (
          <div className="glass space-y-3 p-5 text-sm">
            <p>Log in to see your bookings and track your workers.</p>
            <button type="button" onClick={onLogin} className="btn-primary px-4 py-2">
              Log in
            </button>
          </div>
        ) : loading ? (
          <p className="muted text-sm">Loading your bookings…</p>
        ) : newestFirst.length === 0 ? (
          <div className="glass p-5 text-sm">
            <p className="font-semibold">No bookings yet</p>
            <p className="muted">When you book workers, they will appear here with live-style tracking.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {newestFirst.map((b) => (
              <li key={b.reference}>
                <button type="button" onClick={() => onOpenBooking(b.reference)} className="glass w-full p-4 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-lg font-bold">{b.reference}</div>
                      <div className="muted text-xs">{createdLabel(b.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatINR(b.bill.grandTotal)}</div>
                      <div className="muted text-xs">incl. GST</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="pill">{b.workers.length} {b.workers.length === 1 ? "worker" : "workers"}</span>
                    {Array.from(new Set(b.workers.map((w) => STATUS_LABEL[w.status]))).map((s) => (
                      <span key={s} className="pill text-blue-800">{s}</span>
                    ))}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      </section>
    </div>
  );
}
