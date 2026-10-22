"use client";

import { APP_VERSION } from "@/lib/appInfo";
import { paymentsSummary } from "@/lib/bookingFilters";
import { formatINR } from "@/lib/pricing";
import { type ProfileData, selectedVenue, VENUE_TYPE_LABEL } from "@/lib/profile";
import type { Booking } from "@/lib/types";
import { useAuth } from "./AuthProvider";

export type ProfileTarget = "payments" | "venues" | "edit-profile" | "account";

interface Props {
  profile: ProfileData;
  /** Name from the sign-in account, used until the employer sets their own */
  accountName: string | null;
  avatarUrl: string | null;
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  onOpen: (target: ProfileTarget) => void;
  onLogin: () => void;
}

function Icon({ d }: { d: string[] }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-6 w-6">
      {d.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  );
}

const ICONS = {
  payments: ["M3 7h18v12H3z", "M3 11h18", "M7 15h3"],
  venue: ["M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z", "M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"],
  edit: ["M4 20h4L19 9l-4-4L4 16z", "M13.5 6.5l4 4"],
  account: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21c0-4 4-6 8-6s8 2 8 6"],
};

export default function ProfileView({ profile, accountName, avatarUrl, bookings, loading, error, onOpen, onLogin }: Props) {
  const { configured, user, ready, signOut } = useAuth();
  const name = profile.name || accountName || "Your profile";
  const contact = user?.email ?? user?.phone ?? (configured ? "Not signed in" : "Guest · saved on this device only");
  const pay = paymentsSummary(bookings);
  const venue = selectedVenue(profile);
  const needsLogin = configured && ready && !user;

  // My shifts, Crew and Help are bottom tabs now, so they are not repeated here.
  const tiles: { target: ProfileTarget; title: string; sub: string; icon: string[] }[] = [
    {
      target: "payments",
      title: "Payments",
      sub: loading ? "Loading…" : pay.count ? `${pay.count} ${pay.count === 1 ? "bill" : "bills"} · ${formatINR(pay.total)}` : "No bills yet",
      icon: ICONS.payments,
    },
    { target: "venues", title: "Saved venues", sub: venue ? `${venue.label} selected` : "Add where workers should go", icon: ICONS.venue },
  ];

  const rows: { target: ProfileTarget; title: string; sub: string; icon: string[] }[] = [
    { target: "edit-profile", title: "Edit profile", sub: "Name, venue and contact details", icon: ICONS.edit },
    { target: "account", title: "Manage account", sub: "Log out, policies and your data", icon: ICONS.account },
  ];

  if (needsLogin) {
    return (
      <div className="space-y-5">
        <section className="glass-dark space-y-4 p-6 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25">
            <Icon d={ICONS.account} />
          </span>
          <div>
            <h2 className="text-xl font-black">Welcome to Staffly</h2>
            <p className="mt-1 text-sm text-sky-100">Book pre-onboarded waiters, kitchen helpers, cleaners and more for 5 or 8 hour shifts, up to 14 days ahead. If a worker can&apos;t come, we arrange a replacement.</p>
          </div>
          <button type="button" onClick={onLogin} className="btn-primary w-full px-4 py-3">
            Log in or sign up
          </button>
        </section>
        <p className="muted pb-2 text-center text-xs">Staffly · version {APP_VERSION}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="glass-dark p-5">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover ring-1 ring-white/25" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-black ring-1 ring-white/25">
              {(name[0] ?? "S").toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-black">{name}</h2>
            <p className="truncate text-sm text-sky-200">{contact}</p>
            {(profile.venueName || profile.venueType) && (
              <p className="truncate text-sm text-sky-100">
                {profile.venueName}
                {profile.venueName && profile.venueType ? " · " : ""}
                {profile.venueType ? VENUE_TYPE_LABEL[profile.venueType] : ""}
              </p>
            )}
          </div>
          {!needsLogin && (
            <button type="button" onClick={() => onOpen("edit-profile")} aria-label="Edit profile" className="pill pill-dark">
              Edit
            </button>
          )}
        </div>
        {needsLogin && (
          <button type="button" onClick={onLogin} className="btn-primary mt-4 w-full px-4 py-3">
            Log in
          </button>
        )}
        {!needsLogin && !profile.name && !profile.venueName && (
          <button type="button" onClick={() => onOpen("edit-profile")} className="mt-4 w-full rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold">
            Complete your profile
          </button>
        )}
      </section>

      {needsLogin ? (
        <div className="glass space-y-3 p-5 text-sm">
          <p className="font-semibold">Log in to see your bookings, payments and crew.</p>
          <button type="button" onClick={onLogin} className="btn-primary px-4 py-2">
            Log in
          </button>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3" aria-label="Shortcuts">
            {tiles.map((t) => (
              <li key={t.target}>
                <button type="button" onClick={() => onOpen(t.target)} className="glass flex h-full w-full flex-col gap-2 p-4 text-left">
                  <span className="glass-dark flex h-11 w-11 items-center justify-center rounded-2xl">
                    <Icon d={t.icon} />
                  </span>
                  <span className="font-bold">{t.title}</span>
                  <span className="muted text-xs">{t.sub}</span>
                </button>
              </li>
            ))}
          </ul>

          <section aria-label="Manage account">
            <h2 className="muted mb-2 text-sm font-semibold">Manage account</h2>
            <ul className="glass divide-y divide-slate-200/70 overflow-hidden">
              {rows.map((r) => (
                <li key={r.target}>
                  <button type="button" onClick={() => onOpen(r.target)} className="flex w-full items-center gap-3 px-4 py-4 text-left">
                    <span className="text-blue-700">
                      <Icon d={r.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{r.title}</span>
                      <span className="muted block truncate text-xs">{r.sub}</span>
                    </span>
                    <span aria-hidden className="muted">›</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {user && (
            <button type="button" onClick={() => signOut()} className="btn-ghost w-full px-4 py-3 text-red-700">
              Log out
            </button>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <p className="muted pb-2 text-center text-xs">Staffly · version {APP_VERSION}</p>
    </div>
  );
}
