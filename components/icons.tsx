export type IconName =
  | "home"
  | "shifts"
  | "booking"
  | "crew"
  | "help"
  | "search"
  | "bell"
  | "user"
  | "back"
  | "pin"
  | "chevronDown"
  | "chevronRight"
  | "close"
  | "plus"
  | "clock"
  | "bolt"
  | "info"
  | "refresh";

// Simple outline icons (24x24, 1.8 stroke) so the whole app shares one look.
const PATHS: Record<IconName, string[]> = {
  home: ["M4 11l8-7 8 7", "M6 10v10h12V10", "M10 20v-5h4v5"],
  shifts: ["M5 5h14v15H5z", "M8 3v4M16 3v4M5 10h14", "M9 14h2M13 14h2M9 17h2"],
  booking: ["M6 8h12l1 12H5z", "M9 8a3 3 0 0 1 6 0"],
  crew: ["M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5", "M17 5.5a3 3 0 0 1 0 5.5", "M18 14.8c2.2.6 3.5 2.3 3.5 5.2"],
  help: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7", "M12 17h.01"],
  search: ["M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z", "M20 20l-4-4"],
  bell: ["M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7z", "M10 20a2 2 0 0 0 4 0"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21c0-4 4-6 8-6s8 2 8 6"],
  back: ["M15 5l-7 7 7 7"],
  pin: ["M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z", "M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"],
  chevronDown: ["M6 9l6 6 6-6"],
  chevronRight: ["M9 5l7 7-7 7"],
  close: ["M6 6l12 12M18 6L6 18"],
  plus: ["M12 5v14M5 12h14"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7v5l3 2"],
  bolt: ["M13 3L5 13h6l-1 8 8-10h-6z"],
  info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 11v5", "M12 8h.01"],
  refresh: ["M20 11a8 8 0 1 0-2 5.3", "M20 5v6h-6"],
};

interface Props {
  name: IconName;
  className?: string;
  /** Soft fill inside the outline, used for the active tab */
  filled?: boolean;
}

export default function Icon({ name, className = "h-6 w-6", filled = false }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      fillOpacity={filled ? 0.16 : undefined}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
