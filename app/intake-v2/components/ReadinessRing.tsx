"use client";

import { useEffect, useState } from "react";

// Appointment hub's readiness ring — was a CSS `conic-gradient` disc,
// rebuilt as a real animated SVG stroke-progress circle per request. The
// ring starts empty and sweeps up to `percent` on mount/change, driven by
// a CSS transition on `stroke-dashoffset` (not a fixed-duration @keyframes
// animation) so it always animates *to* the current value correctly even
// if `percent` changes again mid-transition, and respects
// `prefers-reduced-motion` automatically via the `transition` media guard
// below.
//
// `animate={false}` skips that empty-to-percent sweep entirely, landing
// straight on the final value — for when this exact climb to 100 was
// just shown a moment ago (CompletionOverlay's counting ring, right
// before this screen mounts) and replaying it here would just be the
// same motion twice.
export function ReadinessRing({ percent, size = 92, stroke = 9, animate = true }: { percent: number; size?: number; stroke?: number; animate?: boolean }) {
  const [animated, setAnimated] = useState(animate ? 0 : percent);

  useEffect(() => {
    if (!animate) return;
    // Start the sweep on the frame after mount/update, not the same
    // frame — starting from 0 and immediately jumping to `percent` in
    // one paint would skip the transition entirely.
    const raf = requestAnimationFrame(() => setAnimated(percent));
    return () => cancelAnimationFrame(raf);
  }, [percent, animate]);

  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  // Without animation, always reflect `percent` directly rather than
  // the `animated` state — that state exists purely to drive the sweep
  // transition, and staying keyed to it here would freeze the ring at
  // whatever `percent` was on this render's first mount if a later
  // render changes `percent` again while still not animating.
  const offset = circumference * (1 - (animate ? animated : percent) / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#EDF0F3" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--iv2-brand)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="readiness-ring-arc"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-[66px] w-[66px] items-center justify-center gap-px rounded-full bg-[var(--iv2-surface)]">
          <span className="text-2xl leading-none font-bold text-[var(--iv2-text-primary)]">{percent}</span>
          <span className="text-[13px] leading-none font-semibold text-[var(--iv2-text-secondary)]">%</span>
        </div>
      </div>
    </div>
  );
}
