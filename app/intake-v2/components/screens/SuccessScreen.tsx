"use client";

import { Ctx } from "../../ctx";
import { FlowKey } from "../../types";
import { ChevronRightIcon, InfoIcon, LocationIcon } from "../Icons";
import { CheckIcon } from "../ui";

const CHECKLIST: { label: string; jump: FlowKey }[] = [
  { label: "Personal information", jump: "personal" },
  { label: "Insurance & coverage", jump: "coverage" },
  { label: "Health history", jump: "health" },
  { label: "Forms & consent", jump: "consent" },
  { label: "Payment", jump: "payment" },
];

// Screen 15 — Success. No header. Restyled to a richer reference: a
// two-layer hero (light-green halo behind a solid-green circle) with a
// few decorative confetti flecks, a date-badge appointment card, a
// bordered checklist card whose rows jump back to that section (this is
// what replaces the Final Review screen we removed — a quick glance
// back, not a gate), and a "What happens next?" info box.
export function SuccessScreen({ ctx }: { ctx: Ctx }) {
  const { reset, state, go } = ctx;

  return (
    <div className="px-6 pt-10 pb-6 text-center">
      <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
        <Confetti />
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--iv2-success)]">
            <CheckIcon size={26} color="#fff" strokeWidth={3.2} />
          </div>
        </div>
      </div>

      <div className="mb-2 text-[28px] leading-[1.2] font-bold text-[var(--iv2-text-primary)]">You&apos;re ready for your visit</div>
      <div className="text-base leading-[1.5] text-[var(--iv2-text-secondary)]">Your care team has what they need.</div>
      <div className="mb-7 text-base leading-[1.5] text-[var(--iv2-text-secondary)]">See you soon!</div>

      <div className="flex items-center gap-4 rounded-2xl bg-[var(--iv2-brand-tint)] p-4 text-left">
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-white py-2">
          <div className="text-[11px] font-bold tracking-[0.04em] text-[var(--iv2-brand)] uppercase">Jun</div>
          <div className="text-2xl font-bold text-[var(--iv2-text-primary)]">11</div>
          <div className="text-[11px] font-semibold text-[var(--iv2-text-muted)] uppercase">Wed</div>
        </div>
        <div className="h-14 w-px bg-[var(--iv2-border)]" />
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold text-[var(--iv2-text-primary)]">8:00 AM</div>
          <div className="text-base font-semibold text-[var(--iv2-text-primary)]">Dr. Sarah Jenkins</div>
          <div className="text-[15px] text-[var(--iv2-text-secondary)]">Main St. Clinic</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <LocationIcon size={14} />
            <div className="text-[13px] text-[var(--iv2-text-secondary)]">123 Main Street, Anytown, TX</div>
          </div>
        </div>
      </div>

      <div className="mt-7 mb-3 flex items-center justify-between">
        <div className="text-lg font-bold text-[var(--iv2-text-primary)]">What&apos;s complete</div>
        <div className="flex items-center gap-1 rounded-full bg-[var(--iv2-success-surface)] px-3 py-1 text-[13px] font-bold text-[var(--iv2-success)]">
          <CheckIcon size={11} color="var(--iv2-success)" strokeWidth={3} />
          All set
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-[var(--iv2-border)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {CHECKLIST.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={() => go(item.jump)}
            className={`flex w-full cursor-pointer items-center gap-3 p-4 text-left ${i > 0 ? "border-t border-[var(--iv2-border-subtle)]" : ""}`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
              <CheckIcon size={13} color="var(--iv2-success)" strokeWidth={3} />
            </span>
            <span className="flex-1 text-base font-semibold text-[var(--iv2-text-primary)]">{item.label}</span>
            <ChevronRightIcon />
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--iv2-brand-tint)] p-4 text-left">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand)]">
          <InfoIcon size={13} color="#fff" />
        </span>
        <div>
          <div className="text-base font-bold text-[var(--iv2-text-primary)]">What happens next?</div>
          <div className="mt-0.5 text-[15px] leading-[1.45] text-[var(--iv2-text-secondary)]">
            You&apos;ll receive a confirmation and any important updates from your care team.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => reset(state.scenario)}
        className="mt-6 h-14 w-full cursor-pointer rounded-full border-none bg-[var(--iv2-brand)] text-base font-bold text-white"
      >
        Done
      </button>

      <div className="mt-4 text-[15px] text-[var(--iv2-text-muted)]">
        Need to make a change? <span className="font-semibold text-[var(--iv2-brand)]">Contact your clinic</span>
      </div>
    </div>
  );
}

// A handful of small confetti flecks around the hero circle — pure
// decoration, purely visual per the reference; no data behind it.
function Confetti() {
  const marks = [
    { x: 6, y: 8, rotate: -35, color: "#16A34A" },
    { x: 90, y: 10, rotate: 30, color: "#16A34A" },
    { x: -6, y: 46, rotate: 10, color: "#F59E0B" },
    { x: 102, y: 46, rotate: -10, color: "#F59E0B" },
    { x: 8, y: 82, rotate: 50, color: "#16A34A" },
    { x: 88, y: 84, rotate: -50, color: "#F59E0B" },
  ];
  return (
    <svg width="112" height="100" viewBox="0 0 112 100" className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2" aria-hidden>
      {marks.map((m, i) => (
        <line
          key={i}
          x1={m.x}
          y1={m.y}
          x2={m.x + 8}
          y2={m.y}
          stroke={m.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          transform={`rotate(${m.rotate} ${m.x + 4} ${m.y})`}
        />
      ))}
    </svg>
  );
}
