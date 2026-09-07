import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, Caveat } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Signature-only face for /intake-v2's consent screen — see
// docs/redesign-concepts/design_handoff_patient_intake/README.md's
// Typography section ("the signature uses Caveat 500 (38px) and is the
// only exception"). Loaded globally like the other two faces rather than
// scoped to that route, since next/font/google requires a module-level
// call.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "HealthPro Clinic — Check-in",
  description: "Pre-visit check-in for your upcoming appointment",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${inter.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
