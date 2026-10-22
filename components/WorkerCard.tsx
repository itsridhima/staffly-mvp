import { roleInfo } from "@/lib/prototypeData";
import type { Worker } from "@/lib/types";

export default function WorkerCard({ worker }: { worker: Worker }) {
  const initials = worker.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <article className="flex gap-3 rounded-xl border border-stone-200 bg-white p-3">
      <div
        aria-hidden
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800"
      >
        {initials}
      </div>
      <div className="text-sm">
        <div className="font-semibold">{worker.name}</div>
        <div>{roleInfo(worker.role).label}</div>
        <div className="text-stone-600">
          {worker.yearsExperience} {worker.yearsExperience === 1 ? "year" : "years"} experience ·{" "}
          {worker.languages.join(", ")}
        </div>
        <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
          Staffly-onboarded (prototype)
        </span>
      </div>
    </article>
  );
}
