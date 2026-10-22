"use client";

interface Props {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
}

export default function QuantityStepper({ label, value, min = 1, max, onChange }: Props) {
  return (
    <div className="neu-inset inline-flex items-center gap-1 p-1">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Remove one ${label}`}
        className="neu flex h-10 w-10 items-center justify-center text-xl font-bold text-blue-700 disabled:opacity-40"
      >
        –
      </button>
      <span className="min-w-10 text-center text-lg font-bold" aria-live="polite" aria-label={`${value} ${label}`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Add one more ${label}`}
        className="neu flex h-10 w-10 items-center justify-center text-xl font-bold text-blue-700 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
