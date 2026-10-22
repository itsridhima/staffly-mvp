import { roleInfo, WORKERS } from "./prototypeData";
import type { Booking, BookingVenue, RoleId, Worker } from "./types";

export type VenueType = "cafe" | "restaurant" | "hotel" | "other";

export const VENUE_TYPE_LABEL: Record<VenueType, string> = {
  cafe: "Café",
  restaurant: "Restaurant",
  hotel: "Hotel",
  other: "Other",
};

export interface SavedVenue {
  id: string;
  /** e.g. "Main café" */
  label: string;
  address: string;
  pincode?: string;
}

export interface ProfileData {
  name: string;
  /** Contact number for the venue (E.164), optional */
  contactPhone: string;
  venueName: string;
  venueType: VenueType | "";
  venues: SavedVenue[];
  selectedVenueId: string | null;
  /** Worker ids marked as favourites */
  favourites: string[];
}

export const MAX_VENUES = 5;
export const MAX_FAVOURITES = 50;

export const EMPTY_PROFILE: ProfileData = {
  name: "",
  contactPhone: "",
  venueName: "",
  venueType: "",
  venues: [],
  selectedVenueId: null,
  favourites: [],
};

const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Turn whatever was stored (account metadata or local storage) into a safe profile. */
export function parseProfile(raw: unknown, workers: Worker[] = WORKERS): ProfileData {
  const r = (raw ?? {}) as Record<string, unknown>;
  const venues: SavedVenue[] = [];
  if (Array.isArray(r.venues)) {
    for (const item of r.venues.slice(0, MAX_VENUES)) {
      const v = (item ?? {}) as Record<string, unknown>;
      const id = clean(v.id, 40);
      const label = clean(v.label, 30);
      const address = clean(v.address, 200);
      if (!id || !label || !address) continue;
      const pincode = clean(v.pincode, 6);
      venues.push({ id, label, address, ...(/^\d{6}$/.test(pincode) ? { pincode } : {}) });
    }
  }
  const selected = typeof r.selectedVenueId === "string" && venues.some((v) => v.id === r.selectedVenueId) ? r.selectedVenueId : venues[0]?.id ?? null;
  const known = new Set(workers.map((w) => w.id));
  const favourites = Array.isArray(r.favourites)
    ? Array.from(new Set(r.favourites.filter((f): f is string => typeof f === "string" && known.has(f)))).slice(0, MAX_FAVOURITES)
    : [];
  const type = r.venueType;
  return {
    name: clean(r.name, 60),
    contactPhone: /^\+91\d{10}$/.test(clean(r.contactPhone, 14)) ? clean(r.contactPhone, 14) : "",
    venueName: clean(r.venueName, 60),
    venueType: type === "cafe" || type === "restaurant" || type === "hotel" || type === "other" ? type : "",
    venues,
    selectedVenueId: selected,
    favourites,
  };
}

export type VenueInput = { label: string; address: string; pincode?: string };

/** Returns an error message, or null if the venue details are fine. */
export function validateVenue(input: VenueInput): string | null {
  if (!input.label.trim()) return "Give this venue a short name, like “Main café”.";
  if (input.label.trim().length > 30) return "The name can be up to 30 characters.";
  if (input.address.trim().length < 5) return "Enter the full address so workers can find you.";
  if (input.address.trim().length > 200) return "The address can be up to 200 characters.";
  if (input.pincode && input.pincode.trim() && !/^\d{6}$/.test(input.pincode.trim())) return "A pincode has 6 digits.";
  return null;
}

export function addVenue(profile: ProfileData, input: VenueInput, id: string): ProfileData {
  if (profile.venues.length >= MAX_VENUES || validateVenue(input)) return profile;
  const venue: SavedVenue = {
    id,
    label: input.label.trim(),
    address: input.address.trim(),
    ...(input.pincode?.trim() ? { pincode: input.pincode.trim() } : {}),
  };
  // The first venue is selected automatically.
  return { ...profile, venues: [...profile.venues, venue], selectedVenueId: profile.selectedVenueId ?? id };
}

export function updateVenue(profile: ProfileData, id: string, input: VenueInput): ProfileData {
  if (validateVenue(input)) return profile;
  return {
    ...profile,
    venues: profile.venues.map((v) =>
      v.id === id
        ? { id, label: input.label.trim(), address: input.address.trim(), ...(input.pincode?.trim() ? { pincode: input.pincode.trim() } : {}) }
        : v,
    ),
  };
}

export function removeVenue(profile: ProfileData, id: string): ProfileData {
  const venues = profile.venues.filter((v) => v.id !== id);
  const selectedVenueId = profile.selectedVenueId === id ? venues[0]?.id ?? null : profile.selectedVenueId;
  return { ...profile, venues, selectedVenueId };
}

export function selectVenue(profile: ProfileData, id: string): ProfileData {
  return profile.venues.some((v) => v.id === id) ? { ...profile, selectedVenueId: id } : profile;
}

export function selectedVenue(profile: ProfileData): SavedVenue | null {
  return profile.venues.find((v) => v.id === profile.selectedVenueId) ?? null;
}

export function toBookingVenue(venue: SavedVenue | null): BookingVenue | undefined {
  if (!venue) return undefined;
  return { label: venue.label, address: venue.pincode ? `${venue.address} – ${venue.pincode}` : venue.address };
}

export function toggleFavourite(profile: ProfileData, workerId: string): ProfileData {
  const has = profile.favourites.includes(workerId);
  if (!has && profile.favourites.length >= MAX_FAVOURITES) return profile;
  return {
    ...profile,
    favourites: has ? profile.favourites.filter((f) => f !== workerId) : [...profile.favourites, workerId],
  };
}

export interface CrewMember {
  worker: Worker;
  role: RoleId;
  shifts: number;
  completed: number;
  /** YYYY-MM-DD of the most recent shift */
  lastShiftDate: string;
}

/** Everyone currently assigned to the employer's shifts (replaced workers are not included). */
export function crewFromBookings(bookings: Booking[]): CrewMember[] {
  const byWorker = new Map<string, CrewMember>();
  for (const booking of bookings) {
    for (const tw of booking.workers) {
      const line = booking.lines.find((l) => l.id === tw.lineId);
      if (!line) continue;
      const existing = byWorker.get(tw.worker.id);
      const completed = tw.status === "completed" ? 1 : 0;
      if (existing) {
        existing.shifts += 1;
        existing.completed += completed;
        if (line.date > existing.lastShiftDate) existing.lastShiftDate = line.date;
      } else {
        byWorker.set(tw.worker.id, { worker: tw.worker, role: tw.role, shifts: 1, completed, lastShiftDate: line.date });
      }
    }
  }
  return [...byWorker.values()].sort((a, b) => b.lastShiftDate.localeCompare(a.lastShiftDate) || a.worker.name.localeCompare(b.worker.name));
}

export function roleLabelOf(role: RoleId): string {
  return roleInfo(role).label;
}

/** Everything we hold about the employer, for the "Download my data" button. */
export function buildDataExport(profile: ProfileData, bookings: Booking[], account: { email?: string | null; phone?: string | null }) {
  return {
    exportedAt: new Date().toISOString(),
    note: "Your Staffly data: profile and bookings.",
    account: { email: account.email ?? null, phone: account.phone ?? null },
    profile,
    bookings,
  };
}
