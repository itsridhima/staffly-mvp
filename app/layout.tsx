import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Staffly – Book shift staff (prototype)",
  description: "Prototype: book pre-onboarded frontline staff for a shift. Demo data only.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
