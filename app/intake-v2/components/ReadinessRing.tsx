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
export function ReadinessRing({ percent, size = 92, stroke = 9 }: { percent: number; size?: number; stroke?: number }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    // Start the sweep on the frame after mount/update, not the same
    // frame — starting from 0 and immediately jumping to `percent` in
    // one paint would skip the transition entirely.
    const raf = requestAnimationFrame(() => setAnimated(percent));
    return () => cancelAnimationFrame(raf);
  }, [percent]);

  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animated / 100);

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
        <div className="flex h-[66px] w-[66px] items-center justify-center gap-px rounded-full bg-white">
          <span className="text-2xl leading-none font-bold text-[var(--iv2-text-primary)]">{percent}</span>
          <span className="text-[13px] leading-none font-semibold text-[var(--iv2-text-secondary)]">%</span>
        </div>
      </div>
    </div>
  );
}
