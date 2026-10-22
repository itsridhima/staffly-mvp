"use client";

import { useEffect, useState } from "react";
import { SEARCH_HINTS } from "@/lib/search";
import Icon from "./icons";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** Search box that stays pinned under the header while the page scrolls. The hint text rotates. */
export default function SearchBar({ value, onChange }: Props) {
  const [hint, setHint] = useState(0);

  useEffect(() => {
    if (value) return;
    const t = setInterval(() => setHint((h) => (h + 1) % SEARCH_HINTS.length), 3200);
    return () => clearInterval(t);
  }, [value]);

  return (
    <div className="sticky top-0 z-20 -mx-4 bg-[rgba(234,242,255,0.92)] px-4 py-2 backdrop-blur">
      <label htmlFor="home-search" className="sr-only">
        Search roles and tasks
      </label>
      <div className="neu-inset flex items-center gap-2 px-4">
        <Icon name="search" className="h-5 w-5 shrink-0 text-slate-500" />
        <input
          id="home-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={SEARCH_HINTS[hint]}
          autoComplete="off"
          className="w-full bg-transparent py-3 outline-none"
        />
        {value && (
          <button type="button" onClick={() => onChange("")} aria-label="Clear search" className="muted shrink-0 p-1">
            <Icon name="close" className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
