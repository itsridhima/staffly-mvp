"use client";

/** Developer tool (only shown with ?dev=1): stands in for another business booking the same workers at the same moment. */
export default function DemoTakeSlotButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-400 bg-amber-50/80 p-3 text-sm">
      <p className="mb-2 text-amber-900">
        <strong>Developer tools:</strong> use this to test the &ldquo;slot no longer available&rdquo; screen. It books out the
        workers for the first item in your booking, as if another business had booked them first.
      </p>
      <button
        type="button"
        onClick={onClick}
        className="rounded-xl border border-amber-500 bg-white px-3 py-1.5 font-medium text-amber-900 hover:bg-amber-100"
      >
        Book out the first item
      </button>
    </div>
  );
}
