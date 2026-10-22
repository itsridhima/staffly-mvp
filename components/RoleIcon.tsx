import type { RoleId } from "@/lib/types";

// Simple line icons drawn for each role (no photos of people).
const PATHS: Record<RoleId, string[]> = {
  waiter: ["M3 17h18", "M5 17a7 7 0 0 1 14 0", "M12 8V6", "M10.5 6h3"],
  kitchen_helper: ["M5 10h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z", "M3 10h18", "M9 6c0-1 1-1 1-2", "M14 6c0-1 1-1 1-2"],
  dishwasher: ["M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z", "M9.5 14a2.5 2.5 0 0 0 2.5 2.5"],
  food_runner: ["M4 12h13", "M13 7l5 5-5 5", "M4 7h5", "M4 17h5"],
  takeaway_packer: ["M6 8h12l1 12H5z", "M9 8a3 3 0 0 1 6 0", "M9.5 13h5"],
  cleaner: ["M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z", "M19 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"],
};

export default function RoleIcon({ role, className = "h-7 w-7" }: { role: RoleId; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[role].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
