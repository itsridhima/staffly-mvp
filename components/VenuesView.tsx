"use client";

import { useState } from "react";
import { MAX_VENUES, type ProfileData, type SavedVenue, validateVenue } from "@/lib/profile";
import EmptyState from "./EmptyState";
import SubPageHeader from "./SubPageHeader";

interface Props {
  profile: ProfileData;
  error: string | null;
  onAdd: (input: { label: string; address: string; pincode?: string }) => void;
  onUpdate: (id: string, input: { label: string; address: string; pincode?: string }) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  onBack: () => void;
}

interface Draft {
  id: string | null; // null = new venue
  label: string;
  address: string;
  pincode: string;
}

export default function VenuesView({ profile, error, onAdd, onUpdate, onRemove, onSelect, onBack }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavedVenue | null>(null);
  const full = profile.venues.length >= MAX_VENUES;

  function submit() {
    if (!draft) return;
    const input = { label: draft.label, address: draft.address, pincode: draft.pincode };
    const problem = validateVenue(input);
    if (problem) {
      setFormError(problem);
      return;
    }
    if (draft.id) onUpdate(draft.id, input);
    else onAdd(input);
    setDraft(null);
    setFormError(null);
  }

  return (
    <section className="space-y-4">
      <SubPageHeader
        title="Saved venues"
        subtitle="Where should workers go?"
        onBack={onBack}
        action={
          profile.venues.length > 0 && (
            <button type="button" disabled={full} onClick={() => setDraft({ id: null, label: "", address: "", pincode: "" })} className="btn-ghost px-3 py-2 text-sm disabled:opacity-50">
              + Add
            </button>
          )
        }
      />

      {profile.venues.length === 0 ? (
        <EmptyState
          title="No venue saved yet"
          body="Save your café, restaurant or hotel so workers know where to report. It shows on your booking."
          actionLabel="Add venue"
          onAction={() => setDraft({ id: null, label: "", address: "", pincode: "" })}
        />
      ) : (
        <ul className="space-y-3">
          {profile.venues.map((v) => {
            const selected = v.id === profile.selectedVenueId;
            return (
              <li key={v.id} className="glass relative p-4">
                <div className="flex items-start gap-3">
                  <span className="glass-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
                      <path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{v.label}</span>
                      {selected && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">SELECTED</span>}
                    </div>
                    <p className="muted">
                      {v.address}
                      {v.pincode ? ` – ${v.pincode}` : ""}
                    </p>
                    {!selected && (
                      <button type="button" onClick={() => onSelect(v.id)} className="mt-2 text-sm font-semibold text-blue-700 underline">
                        Use for bookings
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Options for ${v.label}`}
                    aria-expanded={menuFor === v.id}
                    onClick={() => setMenuFor(menuFor === v.id ? null : v.id)}
                    className="neu flex h-9 w-9 items-center justify-center font-bold"
                  >
                    ⋯
                  </button>
                </div>
                {menuFor === v.id && (
                  <div className="glass absolute right-4 top-14 z-10 w-36 overflow-hidden text-sm">
                    <button
                      type="button"
                      className="block w-full px-4 py-3 text-left font-semibold"
                      onClick={() => {
                        setDraft({ id: v.id, label: v.label, address: v.address, pincode: v.pincode ?? "" });
                        setMenuFor(null);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="block w-full px-4 py-3 text-left font-semibold text-red-700"
                      onClick={() => {
                        setConfirmDelete(v);
                        setMenuFor(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {full && <p className="muted text-xs">You can save up to {MAX_VENUES} venues.</p>}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40" role="dialog" aria-modal="true" aria-label={draft.id ? "Edit venue" : "Add venue"}>
          <form
            className="glass w-full max-w-lg space-y-3 rounded-b-none p-5"
            style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, background: "rgba(250,252,255,0.97)" }}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black">{draft.id ? "Edit venue" : "Add venue"}</h2>
              <button type="button" onClick={() => { setDraft(null); setFormError(null); }} aria-label="Close" className="px-2 text-xl">
                ×
              </button>
            </div>
            <label className="block text-sm font-semibold" htmlFor="venue-label">
              Name (like “Main café”)
            </label>
            <input id="venue-label" value={draft.label} maxLength={30} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className="neu-inset w-full px-3 py-3" />
            <label className="block text-sm font-semibold" htmlFor="venue-address">
              Full address
            </label>
            <textarea id="venue-address" value={draft.address} maxLength={200} rows={3} onChange={(e) => setDraft({ ...draft, address: e.target.value })} className="neu-inset w-full px-3 py-3" />
            <label className="block text-sm font-semibold" htmlFor="venue-pin">
              Pincode (optional)
            </label>
            <input
              id="venue-pin"
              inputMode="numeric"
              value={draft.pincode}
              maxLength={6}
              onChange={(e) => setDraft({ ...draft, pincode: e.target.value.replace(/\D/g, "") })}
              className="neu-inset w-full px-3 py-3"
            />
            {formError && (
              <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                {formError}
              </p>
            )}
            <button type="submit" className="btn-primary w-full px-4 py-3">
              {draft.id ? "Save changes" : "Save venue"}
            </button>
          </form>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="alertdialog" aria-modal="true" aria-label="Delete venue">
          <div className="glass w-full max-w-sm space-y-3 p-5" style={{ background: "rgba(250,252,255,0.97)" }}>
            <h2 className="text-lg font-black">Delete {confirmDelete.label}?</h2>
            <p className="muted text-sm">Existing bookings keep the address they were made with.</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1 px-4 py-3">
                Keep
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemove(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-bold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
