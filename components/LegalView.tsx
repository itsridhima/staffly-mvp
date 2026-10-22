"use client";

import { LEGAL_DOCS, LEGAL_UPDATED, type LegalDoc } from "@/lib/legal";

/** One policy document: Terms of Use, Privacy Policy or Refund & Cancellation Policy. */
export default function LegalView({ docId }: { docId: LegalDoc["id"] }) {
  const doc = LEGAL_DOCS[docId];
  return (
    <section className="space-y-4">
      <p className="muted text-sm">Last updated {LEGAL_UPDATED}</p>
      <article className="glass space-y-5 p-5 text-sm leading-relaxed">
        <p>{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="text-base font-bold">{s.heading}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {s.bullets && (
              <ul className="list-disc space-y-1.5 pl-5">
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>
    </section>
  );
}
