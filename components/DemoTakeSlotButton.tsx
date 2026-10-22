"use client";

/** Prototype-only tool: stands in for a second manager booking at the same moment. */
export default function DemoTakeSlotButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-3 text-sm">
      <p className="mb-2 text-amber-900">
        <strong>Demo tool (prototype only):</strong> Staffly has no real second user yet, so use this button to
        pretend another manager just booked these workers.
      </p>
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg border border-amber-500 bg-white px-3 py-1.5 font-medium text-amber-900 hover:bg-amber-100"
      >
        Simulate another manager booking this slot
      </button>
    </div>
  );
}
