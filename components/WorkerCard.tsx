import { displayName, roleInfo } from "@/lib/prototypeData";
import { STATUS_LABEL } from "@/lib/tracking";
import { formatDateLong, formatTimeRange } from "@/lib/time";
import type { BookingLine, TrackedWorker } from "@/lib/types";
import RoleIcon from "./RoleIcon";

interface Props {
  tracked: TrackedWorker;
  line: BookingLine;
  /** Show the status chip (My bookings) */
  showStatus?: boolean;
}

export default function WorkerCard({ tracked, line, showStatus = false }: Props) {
  const { worker } = tracked;
  const name = displayName(worker.name);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  const wasReplaced = tracked.replaced.length > 0;
  return (
    <article className="glass p-4">
      <div className="flex gap-3">
        <div
          aria-hidden
          className="glass-dark flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-base font-bold">{name}</div>
              <div className="flex items-center gap-1.5 text-blue-700">
                <RoleIcon role={tracked.role} className="h-4 w-4" />
                {roleInfo(tracked.role).label}
              </div>
            </div>
            {showStatus && (
              <span className="pill shrink-0 text-blue-800">{STATUS_LABEL[tracked.status]}</span>
            )}
          </div>

          <div className="muted mt-1">
            {worker.yearsExperience} {worker.yearsExperience === 1 ? "year" : "years"} experience · {worker.languages.join(", ")}
          </div>

          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Skill set">
            {worker.skills.map((s) => (
              <li key={s} className="pill">
                {s}
              </li>
            ))}
          </ul>

          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            <dt className="muted">Contact</dt>
            <dd>Shared by Staffly before the shift</dd>
            <dt className="muted">Tracking ID</dt>
            <dd className="font-mono font-semibold">{tracked.trackingId}</dd>
            <dt className="muted">Date</dt>
            <dd>{formatDateLong(line.date)}</dd>
            <dt className="muted">Shift</dt>
            <dd>
              {formatTimeRange(line.startMinutes, line.length)} ({line.length} hours)
            </dd>
          </dl>

          {wasReplaced && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Replaces {tracked.replaced.map((r) => displayName(r.worker.name)).join(", ")} (booking cancelled). Same tracking ID.
            </p>
          )}

          <span className="mt-2 inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
            Staffly-onboarded
          </span>
        </div>
      </div>
    </article>
  );
}
