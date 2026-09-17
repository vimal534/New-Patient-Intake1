"use client";

import { Ctx } from "../../ctx";
import { CalendarIcon, InfoIcon, LocationIcon, ClockIcon, ArrowRightIcon, CardIcon, UserIcon } from "../Icons";
import { ReadinessRing } from "../ReadinessRing";
import { Button } from "../ui";
import { YosiHealthLogo } from "../YosiHealthLogo";

const INSTRUCTIONS = [
  { n: 1, title: "Arrive 10 minutes early", body: "Give yourself time to park and find the suite." },
  { n: 2, title: "Bring your ID", body: "We confirm identity at the front desk before your visit." },
];

// Screen 2 — Appointment hub. Owns its own header/background, no
// check-in progress chrome (README: "no check-in progress chrome").
// Every action here enters the check-in flow via ctx.next().
export function WelcomeScreen({ ctx }: { ctx: Ctx }) {
  const { isRet, state } = ctx;
  const readiness = state.intakeCompleted ? 100 : isRet ? 80 : 35;
  const chips = isRet
    ? [
        { label: "Confirmed", color: "var(--iv2-brand)", bg: "var(--iv2-brand-tint)" },
        { label: "Most info on file", color: "var(--iv2-success)", bg: "var(--iv2-success-surface)" },
      ]
    : [
        { label: "Confirmed", color: "var(--iv2-brand)", bg: "var(--iv2-brand-tint)" },
        { label: "Complete intake", color: "var(--iv2-warning)", bg: "var(--iv2-warning-surface)" },
      ];

  return (
    <div className="min-h-full bg-[var(--iv2-surface-muted)]">
      <div className="flex items-start justify-between gap-4 bg-[var(--iv2-surface)] px-6 pt-6 pb-[22px]">
        <div>
          <div className="text-[13px] font-semibold tracking-[0.08em] text-[var(--iv2-text-muted)] uppercase">Good morning</div>
          <div className="mt-1.5 text-[32px] leading-[1.15] font-bold text-[var(--iv2-text-primary)]">{state.scheduling.patientName.split(" ")[0]}</div>
        </div>
        <YosiHealthLogo className="mt-2" />
      </div>

      <div className="px-5 pt-5.5 pb-7">
        <div className="mb-2.5 text-xs font-semibold tracking-[0.08em] text-[var(--iv2-text-muted)] uppercase">Your visit</div>

        <div className="overflow-hidden rounded-[20px] border border-[var(--iv2-border)] bg-[var(--iv2-surface)] transition-shadow duration-150 hover:shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex items-start gap-4 p-5.5">
            <div className="min-w-0 flex-1">
              <div className="text-2xl leading-[1.2] font-bold text-[var(--iv2-text-primary)]">{state.scheduling.reason}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <div key={c.label} className="rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ color: c.color, backgroundColor: c.bg }}>
                    {c.label}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
                  <UserIcon size={20} color="var(--iv2-brand)" />
                </div>
                <div>
                  <div className="text-base font-semibold text-[var(--iv2-text-primary)]">{state.scheduling.providerName}</div>
                  <div className="text-[15px] text-[var(--iv2-text-secondary)]">{state.scheduling.providerSpecialty}</div>
                </div>
              </div>
            </div>
            <div className="shrink-0 text-center">
              <ReadinessRing percent={readiness} />
              <div className="mt-2.5 text-[11px] font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Readiness</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 border-t border-[var(--iv2-border-subtle)] p-4">
            <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px] bg-[var(--iv2-brand-tint)]" style={{ height: 38, width: 38 }}>
              <CalendarIcon color="var(--iv2-brand)" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Date</div>
              <div className="mt-0.5 text-base text-[var(--iv2-text-primary)]">{state.scheduling.dateShort}</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 border-t border-[var(--iv2-border-subtle)] p-4">
            <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px] bg-[var(--iv2-brand-tint)]" style={{ height: 38, width: 38 }}>
              <LocationIcon color="var(--iv2-brand)" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Location</div>
              <div className="mt-0.5 text-base text-[var(--iv2-text-primary)]">
                {state.scheduling.clinicName}, {state.scheduling.clinicAddress}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 border-t border-[var(--iv2-border-subtle)] p-4">
            <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[10px] bg-[var(--iv2-brand-tint)]" style={{ height: 38, width: 38 }}>
              <ClockIcon color="var(--iv2-brand)" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Start time</div>
              <div className="mt-0.5 text-base text-[var(--iv2-text-primary)]">{state.scheduling.startTime}</div>
            </div>
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded-[10px] border border-[var(--iv2-border)] bg-[var(--iv2-surface)] px-3.5 py-2.5 text-[15px] font-semibold text-[var(--iv2-brand)]"
              onClick={() => ctx.update({ privacyOpen: true })}
            >
              Add
            </button>
          </div>

          <div className="p-5.5 pt-5">
            <Button onClick={ctx.next} className="h-14 w-full">
              {isRet ? "Resume check-in" : "Start check-in"}
              <ArrowRightIcon />
            </Button>
          </div>
        </div>

        <div className="mt-6.5 mb-2.5 text-xs font-semibold tracking-[0.08em] text-[var(--iv2-text-muted)] uppercase">What to do</div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3.5 rounded-[18px] border border-[var(--iv2-border)] bg-[var(--iv2-surface)] p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iv2-warning-surface)]">
              <CardIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-semibold text-[var(--iv2-text-primary)]">Copay due</div>
              <div className="mt-px text-[15px] text-[var(--iv2-text-secondary)]">Collected during check-in</div>
            </div>
            <button
              type="button"
              onClick={ctx.next}
              className="shrink-0 cursor-pointer rounded-[10px] border-none bg-[var(--iv2-warning)] px-4 py-2.5 text-[15px] font-semibold text-white"
            >
              Pay $40
            </button>
          </div>

          <div className="flex items-center gap-3.5 rounded-[18px] border border-[var(--iv2-border)] bg-[var(--iv2-surface)] p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iv2-brand-tint)]">
              <ArrowUploadIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-semibold text-[var(--iv2-text-primary)]">ID and insurance</div>
              <div className="mt-px text-[15px] text-[var(--iv2-text-secondary)]">
                {isRet ? "On file from your last visit" : "Photo ID and insurance card"}
              </div>
            </div>
            <button
              type="button"
              onClick={ctx.next}
              className="shrink-0 cursor-pointer rounded-[10px] border border-[var(--iv2-border)] bg-[var(--iv2-surface)] px-4 py-2.5 text-[15px] font-semibold text-[var(--iv2-text-primary)]"
            >
              {isRet ? "Review" : "Add"}
            </button>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-[var(--iv2-border)] bg-[var(--iv2-surface)]">
            <div className="flex items-center gap-2.5 border-b border-[var(--iv2-border-subtle)] p-4">
              <InfoIcon size={22} />
              <div className="text-[17px] font-semibold text-[var(--iv2-text-primary)]">Before you arrive</div>
            </div>
            {INSTRUCTIONS.map((ins) => (
              <div key={ins.n} className="flex gap-3 border-b border-[var(--iv2-border-subtle)] p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)] text-[13px] font-bold text-[var(--iv2-brand)]">
                  {ins.n}
                </div>
                <div>
                  <div className="text-base font-semibold text-[var(--iv2-text-primary)]">{ins.title}</div>
                  <div className="mt-0.5 text-[15px] leading-[1.45] text-[var(--iv2-text-secondary)]">{ins.body}</div>
                </div>
              </div>
            ))}
            <div className="p-4 pt-3.5">
              <button
                type="button"
                onClick={() => ctx.update({ acked: true })}
                className="flex h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none text-base font-semibold"
                style={{
                  backgroundColor: state.acked ? "var(--iv2-success-surface)" : "var(--iv2-brand-tint)",
                  color: state.acked ? "var(--iv2-success)" : "var(--iv2-brand)",
                }}
              >
                {state.acked ? "✓ Got it" : "Got it, I understand"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5.5 text-[15px] text-[var(--iv2-text-muted)]">Need to reschedule or cancel?</div>
      </div>
    </div>
  );
}

function ArrowUploadIcon() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4M7 9l5-5 5 5" stroke="var(--iv2-brand)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3.5h16V16" stroke="var(--iv2-brand)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
