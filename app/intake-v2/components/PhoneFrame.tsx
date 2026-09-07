"use client";

import { ReactNode } from "react";

// Device-preview bezel for /intake-v2 — full-bleed on an actual phone
// (no border, fills the real viewport) but a black rounded phone frame
// centered on a neutral background once there's room for one. Same
// convention as /tap-intake's own PhoneFrame.tsx: a *fixed* height on
// the `sm:` breakpoint, not `min-h-*` — a min-height lets the frame grow
// past its own box once content is tall, which would push scroll
// ownership up to the page instead of staying inside this frame's own
// `flex-1 overflow-auto` content area (and would let a BottomSheet's
// `absolute inset-0` bleed past the visible "phone" outline instead of
// stopping at it).
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-[#EAECF0] sm:px-6 sm:py-10">
      <div
        className="iv2-root relative h-dvh w-full overflow-hidden bg-[#FBFBFC] font-[family-name:var(--font-inter)] sm:h-[932px] sm:w-[430px] sm:rounded-[52px] sm:border-[10px] sm:border-[#14161b] sm:shadow-[0_24px_60px_rgba(16,24,40,0.35)]"
      >
        {children}
      </div>
    </div>
  );
}
