"use client";

interface Props {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}

export default function QuantityStepper({ label, value, max, onChange }: Props) {
  if (value === 0) {
    return (
      <button
        type="button"
        onClick={() => onChange(1)}
        aria-label={`Add ${label}`}
        className="rounded-lg border border-emerald-600 px-5 py-1.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50"
      >
        ADD
      </button>
    );
  }
  return (
    <div className="flex items-center rounded-lg bg-emerald-600 text-white">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label={`Remove one ${label}`}
        className="px-3 py-1.5 text-lg font-bold"
      >
        –
      </button>
      <span className="min-w-6 text-center text-sm font-bold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Add one more ${label}`}
        className="px-3 py-1.5 text-lg font-bold disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
