import { ROLES } from "./prototypeData";
import type { RoleId } from "./types";

/**
 * Role search. Matches role names and the tasks listed for each role, plus a few everyday words
 * managers use ("server", "dishes", "mop"). Role names rank above task matches.
 */

const SYNONYMS: Record<RoleId, string[]> = {
  waiter: ["server", "steward", "serving", "captain", "table service"],
  kitchen_helper: ["kitchen", "prep", "helper", "commis", "chopping", "cook helper"],
  dishwasher: ["dishes", "dish", "washing", "pot", "plate", "utensil", "cutlery"],
  food_runner: ["runner", "busser", "bussing", "tables", "clearing"],
  takeaway_packer: ["takeaway", "packing", "pack", "delivery", "parcel", "handover", "order"],
  cleaner: ["clean", "mop", "sweep", "washroom", "toilet", "floor", "housekeeping"],
};

function words(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2);
}

interface Indexed {
  id: RoleId;
  title: string;
  extra: string;
}

const INDEX: Indexed[] = ROLES.map((r) => ({
  id: r.id,
  title: `${r.label} ${r.shortLabel}`.toLowerCase(),
  extra: [r.overview, ...r.includes, ...SYNONYMS[r.id]].join(" ").toLowerCase(),
}));

/** Roles that match the query, best match first. Empty query returns no results. */
export function searchRoles(query: string): RoleId[] {
  const terms = words(query);
  if (terms.length === 0) return [];
  const scored: { id: RoleId; score: number }[] = [];
  for (const entry of INDEX) {
    let score = 0;
    let matched = 0;
    for (const t of terms) {
      if (entry.title.includes(t)) {
        score += 3;
        matched++;
      } else if (entry.extra.includes(t)) {
        score += 1;
        matched++;
      }
    }
    // Every word typed must match something in the role.
    if (matched === terms.length) scored.push({ id: entry.id, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.id);
}

/** Example searches shown as rotating hints. */
export const SEARCH_HINTS = ["Search 'cleaner'", "Search 'wash dishes'", "Search 'waiter'", "Search 'kitchen help'", "Search 'takeaway packing'"];
