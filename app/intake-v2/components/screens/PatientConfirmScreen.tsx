"use client";

import { ReactNode } from "react";
import { Ctx } from "../../ctx";
import { formatAgeFromDob } from "../../format";
import { InfoIcon } from "../Icons";
import { Card, InfoNote, ScreenCopy, ScreenTitle } from "../ui";

// "MM/DD/YYYY" → "Jun 12, 2026" — deterministic given the string
// itself (not the current date), so safe to call during render.
function formatDobDisplay(dob: string): string {
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// First + last initial ("Emma Rodriguez" → "ER") for the identity
// avatar — falls back to just the first letter for a single-word name.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Fact = { label: string; value: ReactNode; sub?: string; center?: boolean };

// One fact's label/value/sub — `bare` drops this card's own border/
// background (for when it's one column of a CombinedFactCard sharing
// a single outer box rather than standing on its own). Now that the
// box only ever holds DOB + Gender (Reason for visit moved up into
// the header pill), each column has enough room that the sizes only
// need one notch down from standalone, not two.
// `leftPad` gives this column's left edge extra breathing room — only
// the DOB column (the box's own leading edge, not up against a
// divider like the other one) needs it. `center` middle-aligns the
// Gender column.
function FactCard({ label, value, sub, bare, leftPad, center }: Fact & { bare?: boolean; leftPad?: boolean }) {
  return (
    <div className={`${bare ? `${leftPad ? "pl-4 pr-3" : "px-3"} py-3.5` : "rounded-xl border border-[var(--iv2-border)] bg-[var(--iv2-surface)] p-3.5"} ${center ? "text-center" : ""}`}>
      <div className={bare ? "text-[12px] text-[var(--iv2-text-muted)]" : "text-[13px] text-[var(--iv2-text-muted)]"}>{label}</div>
      <div className={bare ? "mt-1 text-[15px] leading-[1.25] font-bold text-[var(--iv2-text-primary)]" : "mt-1 text-base font-bold text-[var(--iv2-text-primary)]"}>{value}</div>
      {sub ? <div className={bare ? "mt-0.5 text-[12px] text-[var(--iv2-text-muted)]" : "mt-0.5 text-sm text-[var(--iv2-text-muted)]"}>{sub}</div> : null}
    </div>
  );
}

// Every fact in one bordered box, each column split from the next by a
// single center line, rather than a separate bordered box per fact.
// `weights` gives each column a different share of the row instead of
// splitting it evenly — the first column here gets the extra share
// its `leftPad` costs it, so its value still fits on one line rather
// than trading that breathing room for a wrap.
function CombinedFactCard({ facts, className, weights }: { facts: Fact[]; className?: string; weights?: number[] }) {
  return (
    <div
      className={`grid divide-x divide-[var(--iv2-border-subtle)] rounded-xl border border-[var(--iv2-border)] bg-[var(--iv2-surface)] ${className ?? ""}`}
      style={{ gridTemplateColumns: weights ? weights.map((w) => `${w}fr`).join(" ") : `repeat(${facts.length}, minmax(0, 1fr))` }}
    >
      {facts.map((fact, i) => (
        <FactCard key={fact.label} {...fact} bare leftPad={i === 0} />
      ))}
    </div>
  );
}

// Patient Information wizard — Step 1 of 3. Everything on this card is
// already known before the patient ever sees it — the basics and
// reason for visit from the appointment record — so it's one combined
// read-only confirmation card, each fact its own bordered mini-card,
// rather than a form the patient fills in field by field.
export function PatientConfirmScreen({ ctx }: { ctx: Ctx }) {
  const { state } = ctx;
  const dobDisplay = formatDobDisplay(state.personal.dob);
  const age = formatAgeFromDob(state.personal.dob);

  return (
    <div className="px-6 pt-5 pb-6">
      <ScreenTitle className="mb-2 leading-[1.28]">Let&apos;s confirm the patient&apos;s information</ScreenTitle>
      <ScreenCopy className="mb-6">We&apos;ve pre-filled this from your appointment. Let us know if anything looks wrong.</ScreenCopy>

      <Card>
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[19px] font-bold text-white"
            style={{ background: "var(--iv2-brand-gradient)" }}
            aria-hidden
          >
            {initialsOf(state.scheduling.patientName)}
          </span>
          <div>
            <div className="text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.scheduling.patientName}</div>
            <div className="mt-1 text-[13px] font-semibold text-[var(--iv2-text-secondary)]">{state.scheduling.reason}</div>
          </div>
        </div>

        <CombinedFactCard
          className="mt-4"
          weights={[1.2, 1]}
          facts={[
            { label: "DOB", value: dobDisplay || state.personal.dob, sub: age ?? undefined },
            { label: "Gender", value: state.sexAssignedAtBirth || "—", center: true },
          ]}
        />
      </Card>

      <div className="mt-4">
        <InfoNote>
          <InfoIcon size={26} />
          <div className="text-[15px] leading-[1.5] text-[var(--iv2-brand)]">
            This information is read-only here. Let your care team know at check-in if anything needs to change.
          </div>
        </InfoNote>
      </div>
    </div>
  );
}
