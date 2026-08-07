"use client";

import { useEffect, useState } from "react";

export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 4,
}: {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    // Wait a tick so the browser commits the 0% state first — otherwise
    // there's nothing for the stroke-dashoffset transition to animate from.
    // A timeout (not requestAnimationFrame) so this still fires if the tab
    // is backgrounded when the page first loads.
    const timer = window.setTimeout(() => setDisplay(value), 30);
    return () => window.clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - display / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E8EEF3"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-teal)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[18px] font-bold text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
          {value}%
        </span>
      </div>
    </div>
  );
}
