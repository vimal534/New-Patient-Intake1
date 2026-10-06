"use client";

import { forwardRef, useEffect, useRef } from "react";
import gsap from "gsap";
import { Ctx } from "../../ctx";
import { FlowKey } from "../../types";
import { ChevronRightIcon, MailIcon } from "../Icons";
import { dur, prefersReducedMotion } from "../motion";
import { CheckIcon } from "../ui";

// Each topic's screen isn't the same FlowKey in every scenario — a
// returning patient's personal info AND insurance both live on one
// "confirmInfo" screen, a new-patient minor's own info is the five-step
// Patient Information wizard's own first step ("patientConfirm") not
// "personal", etc. — so each row lists its candidates most- to
// least-specific; the first one actually present in the current flow
// is where that row goes. A topic with no candidate in this flow at
// all (Health history/Forms & consent on the Sports scenario, which
// has neither as its own step) just doesn't render its row rather than
// linking to a step that doesn't exist for this visit.
const CHECKLIST: { label: string; detail: string; candidates: FlowKey[] }[] = [
  { label: "Personal information", detail: "Your details are saved", candidates: ["personal", "patientConfirm", "confirmInfo"] },
  { label: "Insurance & coverage", detail: "Coverage verified", candidates: ["coverage", "confirmInfo"] },
  { label: "Health history", detail: "Information submitted", candidates: ["health"] },
  { label: "Forms & consent", detail: "All set", candidates: ["consent"] },
  { label: "Payment", detail: "Payment method saved", candidates: ["payment"] },
];

// Screen 15 — Success. No header. A two-layer hero (light-green halo
// behind a solid-green circle) with a few decorative confetti flecks,
// then straight into the checklist of what this visit's intake
// actually covered — no appointment/provider/location recap here,
// that's already been confirmed earlier in the flow and repeating it
// on the last screen just delays the one thing this screen is for.
// Each checklist row jumps back to that section (this is what
// replaces the Final Review screen we removed — a quick glance back,
// not a gate) and carries a one-line status under its label, and a
// "What happens next?" info box closes things out.
//
// A tapped row doesn't just navigate there (page.tsx's `go`) — it opens
// that section in review mode via `reviewSection` (straight into its
// editable state, no extra "Update" tap first), and that section's
// footer becomes "Save and return" instead of the normal onboarding
// Continue, landing back here — same scroll position — rather than
// carrying on to whatever's next in the original flow order. See
// IntakeState.reviewingFromSuccess and page.tsx's footerFor override.
export function SuccessScreen({ ctx }: { ctx: Ctx }) {
  const { update, reviewSection, flow } = ctx;
  const checklist = CHECKLIST.map((item) => ({ ...item, target: item.candidates.find((c) => flow.includes(c)) })).filter(
    (item): item is (typeof CHECKLIST)[number] & { target: FlowKey } => item.target != null
  );

  // A quiet entrance for the hero on mount — the circle pops in with a
  // touch of overshoot (a real "landed" moment, not just a fade) and
  // the confetti flecks burst outward a beat after it, staggered so
  // they read as scattering rather than all appearing at once. Skipped
  // entirely under prefers-reduced-motion — both end up in their
  // resting state instantly instead.
  const circleRef = useRef<HTMLDivElement | null>(null);
  const confettiRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (circleRef.current) {
      gsap.fromTo(circleRef.current, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: dur(0.55), ease: "back.out(1.8)" });
    }
    if (confettiRef.current) {
      gsap.fromTo(
        confettiRef.current.children,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: dur(0.45), ease: "back.out(2.4)", stagger: 0.045, delay: dur(0.15) }
      );
    }
  }, []);

  return (
    <div className="px-6 pt-10 pb-6 text-center">
      <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
        <Confetti ref={confettiRef} />
        <div ref={circleRef} className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--iv2-success)] shadow-[0_8px_20px_rgba(6,118,71,0.32)]">
            <CheckIcon size={26} color="#fff" strokeWidth={3.2} />
          </div>
        </div>
      </div>

      <div className="mb-2 text-[26px] leading-[1.2] font-bold text-[var(--iv2-text-primary)]">You&apos;re all set!</div>
      <div className="mb-7 text-base leading-[1.5] text-[var(--iv2-text-secondary)]">We&apos;ll see you soon.</div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-bold text-[var(--iv2-text-primary)]">What&apos;s complete</div>
        <div className="flex items-center gap-1 rounded-full bg-[var(--iv2-success-surface)] px-3 py-1 text-[13px] font-bold text-[var(--iv2-success)]">
          <CheckIcon size={11} color="var(--iv2-success)" strokeWidth={3} />
          All set
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {checklist.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => reviewSection(item.target)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-[var(--iv2-border)] bg-[var(--iv2-surface)] px-4 py-2.5 text-left transition-shadow duration-150 hover:shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          >
            <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
              <CheckIcon size={12} color="var(--iv2-success)" strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-[var(--iv2-text-primary)]">{item.label}</div>
              <div className="text-[12px] text-[var(--iv2-text-secondary)]">{item.detail}</div>
            </span>
            <ChevronRightIcon />
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--iv2-success-surface)] p-4 text-left">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success)]">
          <MailIcon size={14} color="#fff" />
        </span>
        <div>
          <div className="text-base font-bold text-[var(--iv2-text-primary)]">What happens next?</div>
          <div className="mt-0.5 text-[15px] leading-[1.45] text-[var(--iv2-text-secondary)]">
            You&apos;ll receive a confirmation and any important updates from your care team by text or email.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => update({ completing: true })}
        className="mt-6 h-14 w-full cursor-pointer rounded-2xl border-none bg-[var(--iv2-brand)] text-base font-bold text-white"
      >
        Done
      </button>

      <div className="mt-4 text-[15px] text-[var(--iv2-text-muted)]">
        Need to make a change? <span className="font-semibold text-[var(--iv2-brand)]">Contact your clinic</span>
      </div>
    </div>
  );
}

// A scatter of small confetti flecks around the hero circle — dashes
// and dots mixed, in more of a spread of brand/accent colors — pure
// decoration; no data behind it. Each mark sits in its own <g> with
// `transformBox: fill-box` so the entrance animation's `scale` tween
// (see the ref effect above) grows it from its own center rather than
// the shared SVG origin, which is what makes each piece read as
// popping outward in place instead of all sliding in from one corner.
const Confetti = forwardRef<SVGSVGElement>(function Confetti(_props, ref) {
  const marks: { x: number; y: number; rotate?: number; color: string; shape: "line" | "dot"; size?: number }[] = [
    { x: 6, y: 8, rotate: -35, color: "var(--iv2-brand)", shape: "line" },
    { x: 92, y: 4, rotate: 30, color: "#F59E0B", shape: "line" },
    { x: -8, y: 40, rotate: 10, color: "#16A34A", shape: "line" },
    { x: 104, y: 42, rotate: -10, color: "#0D9488", shape: "line" },
    { x: 4, y: 80, rotate: 50, color: "#F59E0B", shape: "line" },
    { x: 92, y: 84, rotate: -50, color: "#16A34A", shape: "line" },
    { x: 32, y: -6, color: "#EC4899", shape: "dot", size: 3 },
    { x: 76, y: 98, color: "#7C3AED", shape: "dot", size: 3 },
    { x: -4, y: 62, color: "var(--iv2-brand)", shape: "dot", size: 2.5 },
  ];
  return (
    <svg ref={ref} width="112" height="100" viewBox="0 0 112 100" className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2" aria-hidden>
      {marks.map((m, i) => (
        <g key={i} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          {m.shape === "line" ? (
            <line
              x1={m.x}
              y1={m.y}
              x2={m.x + 8}
              y2={m.y}
              stroke={m.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              transform={`rotate(${m.rotate ?? 0} ${m.x + 4} ${m.y})`}
            />
          ) : (
            <circle cx={m.x} cy={m.y} r={m.size ?? 2.5} fill={m.color} />
          )}
        </g>
      ))}
    </svg>
  );
});
