"use client";

import { useState } from "react";
import { displayName } from "@/lib/prototypeData";
import type { TrackedWorker } from "@/lib/types";

interface Props {
  tracked: TrackedWorker;
  onSubmit: (stars: number, note: string) => void;
}

export default function RatingForm({ tracked, onSubmit }: Props) {
  const [stars, setStars] = useState(0);
  const [note, setNote] = useState("");

  if (tracked.rating) {
    return (
      <div className="neu-inset p-3 text-sm">
        <div className="font-semibold">
          You rated {displayName(tracked.worker.name)}: {"★".repeat(tracked.rating.stars)}
          <span className="text-slate-300">{"★".repeat(5 - tracked.rating.stars)}</span>
        </div>
        {tracked.rating.note && <p className="muted mt-1">&ldquo;{tracked.rating.note}&rdquo;</p>}
      </div>
    );
  }

  if (tracked.status !== "completed") return null;

  return (
    <form
      className="neu-inset space-y-2 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (stars > 0) onSubmit(stars, note);
      }}
    >
      <div className="font-semibold">Rate your experience with {displayName(tracked.worker.name)}</div>
      <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setStars(n)}
            className={`text-3xl leading-none ${n <= stars ? "text-amber-400" : "text-slate-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <label className="block text-sm">
        <span className="sr-only">Optional note</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
          rows={2}
          placeholder="Optional: anything you'd like to add"
          className="w-full rounded-xl border border-white bg-white/70 px-3 py-2"
        />
      </label>
      <button type="submit" disabled={stars === 0} className="btn-primary px-4 py-2 text-sm">
        Submit rating
      </button>
    </form>
  );
}
