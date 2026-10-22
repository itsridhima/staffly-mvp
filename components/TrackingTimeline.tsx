import { STATUS_DESCRIPTION, STATUS_LABEL } from "@/lib/tracking";
import type { TrackedWorker, TrackingStatus } from "@/lib/types";

type StepKey = TrackingStatus | "rated";

const STEPS: { key: StepKey; label: string; description: string }[] = [
  { key: "booked", label: STATUS_LABEL.booked, description: STATUS_DESCRIPTION.booked },
  { key: "confirmation_check", label: STATUS_LABEL.confirmation_check, description: STATUS_DESCRIPTION.confirmation_check },
  { key: "on_the_way", label: STATUS_LABEL.on_the_way, description: STATUS_DESCRIPTION.on_the_way },
  { key: "replacement_arranged", label: STATUS_LABEL.replacement_arranged, description: STATUS_DESCRIPTION.replacement_arranged },
  { key: "on_duty", label: STATUS_LABEL.on_duty, description: STATUS_DESCRIPTION.on_duty },
  { key: "completed", label: STATUS_LABEL.completed, description: STATUS_DESCRIPTION.completed },
  { key: "rated", label: STATUS_LABEL.rate, description: STATUS_DESCRIPTION.rate },
];

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function TrackingTimeline({ tracked }: { tracked: TrackedWorker }) {
  const eventFor = (key: StepKey) => [...tracked.history].reverse().find((h) => h.status === key);
  const reached = (key: StepKey) => Boolean(eventFor(key));
  const replacedPath = reached("replacement_arranged");
  const pastConfirm = reached("on_the_way") || reached("on_duty");

  // Steps 3 and 4 are alternatives: one of them is skipped once the other path is taken.
  const isSkipped = (key: StepKey) =>
    !reached(key) &&
    ((key === "on_the_way" && replacedPath) || (key === "replacement_arranged" && pastConfirm));

  const currentIndex = STEPS.findIndex((s) => !reached(s.key) && !isSkipped(s.key));

  return (
    <ol aria-label={`Tracking for ${tracked.trackingId}`}>
      {STEPS.map((step, i) => {
        const event = eventFor(step.key);
        const done = Boolean(event);
        const skipped = isSkipped(step.key);
        const current = i === currentIndex;
        const isLast = i === STEPS.length - 1;

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "btn-primary"
                    : current
                      ? "border-2 border-blue-500 bg-white text-blue-600"
                      : skipped
                        ? "border border-dashed border-slate-300 bg-white text-slate-300"
                        : "neu-inset text-slate-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {!isLast && <span className={`my-0.5 w-0.5 flex-1 ${done ? "bg-blue-400" : "bg-slate-200"}`} />}
            </div>
            <div className={`pb-4 text-sm ${done || current ? "" : "text-slate-400"}`}>
              <div className="font-semibold">
                {step.label}
                {step.key === "replacement_arranged" && !done && !skipped && (
                  <span className="muted ml-1 text-xs font-normal">(only if needed)</span>
                )}
                {skipped && <span className="ml-1 text-xs font-normal">(not needed)</span>}
                {current && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Next</span>}
              </div>
              {done && event ? (
                <>
                  <div className="muted text-xs">{timeLabel(event.at)}</div>
                  {event.note && <div>{event.note}</div>}
                </>
              ) : (
                !skipped && <div className="text-xs">{step.description}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
