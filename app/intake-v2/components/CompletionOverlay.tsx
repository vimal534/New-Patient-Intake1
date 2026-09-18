"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import { dur, prefersReducedMotion } from "./motion";

const SIZE = 176;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Full-screen "wrapping things up" moment between Success's "Done" tap
// and landing back on the hub — a glowing ring counts up to 100% while
// this text plays, rather than the two screens cutting straight into
// each other. `onDone` fires once, after the count finishes plus a
// short beat to let 100% register, rather than this component toggling
// its own visibility — mirroring Toast's callback-driven auto-hide
// instead of local show/hide state.
export function CompletionOverlay({ onDone }: { onDone: () => void }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: 100,
      duration: dur(1.6),
      ease: "power1.inOut",
      onUpdate: () => setPercent(Math.round(counter.value)),
      onComplete: () => {
        window.setTimeout(onDone, prefersReducedMotion() ? 0 : 350);
      },
    });
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDone is a fresh closure every render; re-running the count on that alone would restart it from 0.
  }, []);

  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  return (
    <div className="absolute inset-0 z-[95] flex flex-col items-center justify-center bg-[var(--iv2-surface)]" aria-live="polite">
      <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
        <div className="absolute inset-0 rounded-full bg-[var(--iv2-brand)] opacity-25 blur-2xl" aria-hidden />
        <svg width={SIZE} height={SIZE} className="relative -rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--iv2-border)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--iv2-brand)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute text-[34px] font-bold text-[var(--iv2-brand)]">{percent}</div>
      </div>
      <div className="mt-6 text-base font-semibold text-[var(--iv2-text-secondary)]">Getting your visit ready</div>
    </div>
  );
}
