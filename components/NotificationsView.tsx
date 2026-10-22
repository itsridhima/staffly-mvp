"use client";

import type { AppNotification } from "@/lib/notifications";
import { cleanText } from "@/lib/prototypeData";

interface Props {
  items: AppNotification[];
  onOpen: (reference: string) => void;
  onBack: () => void;
}

export default function NotificationsView({ items, onOpen, onBack }: Props) {
  return (
    <section className="space-y-4">
      <button type="button" onClick={onBack} className="btn-ghost px-4 py-2 text-sm">
        ← Back
      </button>
      <h1 className="text-2xl font-black">Notifications</h1>
      <p className="muted -mt-2 text-xs">Updates about your workers and bookings.</p>
      {items.length === 0 ? (
        <div className="glass p-5 text-sm">
          <p className="font-semibold">Nothing new</p>
          <p className="muted">Updates about your workers (on the way, replacement arranged, shift completed) show up here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => onOpen(n.reference)} className="glass w-full p-4 text-left">
                <div className="font-bold">{n.title}</div>
                <div className="text-sm">{cleanText(n.body)}</div>
                <div className="muted mt-1 text-xs">
                  {new Date(n.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · {n.reference}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
