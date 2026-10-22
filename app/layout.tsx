import type { Metadata, Viewport } from "next";
import AuthProvider from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Staffly – Book shift staff (prototype)",
  description: "Prototype: book pre-onboarded frontline staff for a shift. Demo data only.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
