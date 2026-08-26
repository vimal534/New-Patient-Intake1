"use client";

import { ReactNode } from "react";
import { StatusBar } from "@/app/components/StatusBar";

// The single mobile-app presentation shell for tap-intake — status bar plus
// a narrow card that fills the viewport on a phone and becomes a centered,
// rounded, shadowed "phone" on a wider screen (same pattern as the root app
// and /pediatric). Every screen renders inside this now, so the section
// flow matches the intro splash instead of switching to a wide desktop
// layout. `relative` so a child sheet/overlay (see SummaryBar) can confine
// itself to the card's bounds with `absolute` instead of covering the
// whole browser viewport.
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 justify-center bg-background px-0 sm:px-6 sm:py-8">
      <div className="relative flex min-h-screen w-full max-w-[402px] flex-col overflow-hidden bg-white sm:min-h-[874px] sm:rounded-[40px] sm:shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
        <StatusBar />
        {children}
      </div>
    </div>
  );
}
