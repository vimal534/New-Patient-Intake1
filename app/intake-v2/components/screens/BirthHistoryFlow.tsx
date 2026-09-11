"use client";

import { ReactNode, useRef, useState } from "react";
import { Ctx } from "../../ctx";
import { formatDigits } from "../../format";
import { BirthHistory } from "../../types";
import { ChevronDownIcon, InfoIcon } from "../Icons";
import { scrollIntoComfortableView } from "../motion";
import { Eyebrow, InputField, OptionPill, Reveal } from "../ui";

const DELIVERY_TYPES = ["Vaginal", "C-Section", "Unknown"];
const YES_NO_UNKNOWN = ["Yes", "No", "Unknown"];

type Section = {
  key: string;
  eyebrow: string;
  title: string;
  copy: string;
  // Whichever fields gate moving on to the next section — free text
  // (gestational age, hospital, weights, formula type) never gates;
  // there's no natural "done typing" signal to advance on, so those
  // stay optional and can be filled in any time without holding up
  // the rest of the flow.
  complete: (b: BirthHistory) => boolean;
};

export const BIRTH_SECTION_COUNT = 4;

const SECTIONS: Section[] = [
  {
    key: "pregnancy",
    eyebrow: "Birth & prenatal history",
    title: "Tell us about the pregnancy",
    copy: "This helps us provide the right care. You can skip any question if you'd rather not share today.",
    complete: (b) => !!b.pregnancyIllness && !!b.pregnancyInfections && !!b.pregnancyMeds && !!b.pregnancySubstances,
  },
  {
    key: "delivery",
    eyebrow: "Birth & prenatal history",
    title: "Tell us about the delivery",
    copy: "Share what you know about your baby's delivery.",
    complete: (b) => !!b.deliveryType && !!b.deliveryComplications && !!b.hospitalizationComplications,
  },
  {
    key: "newborn",
    eyebrow: "Birth & prenatal history",
    title: "Newborn status",
    copy: "Weight trend and hearing/metabolic screen results are relevant to today's visit.",
    complete: (b) => !!b.jaundice && !!b.hearingTest && !!b.heelPrick,
  },
  {
    key: "feeding",
    eyebrow: "Birth & prenatal history",
    title: "How is the baby feeding?",
    copy: "Tell us about your baby's feeding and daily habits.",
    complete: (b) => !!b.breastfeeding && !!b.formulaFed && b.wetDiapers.trim().length > 0 && b.bowelMovements.trim().length > 0,
  },
];

function useBirth(ctx: Ctx) {
  const { state, update } = ctx;
  return { birth: state.birth, update };
}

// Question label + optional hint on the left, a compact Yes/No pill
// pair on the right — one question per FieldCard (Pregnancy section).
function YesNoInline({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-base font-bold text-[var(--iv2-text-primary)]">{label}</div>
        {hint ? <div className="mt-1 text-sm leading-[1.4] text-[var(--iv2-text-muted)]">{hint}</div> : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <OptionPill label="Yes" selected={value === "Yes"} onClick={() => onChange("Yes")} />
        <OptionPill label="No" selected={value === "No"} onClick={() => onChange("No")} />
      </div>
    </div>
  );
}

// A bordered white field card — the "How is the baby feeding?"
// section wraps each question in its own card (with a required
// asterisk + a one-line explainer under the label) instead of sharing
// one Card with dividers, matching that section's reference design.
function FieldCard({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-[var(--iv2-border)] bg-white p-4">{children}</div>;
}

function FieldLabel({ label, required, optional, hint }: { label: string; required?: boolean; optional?: boolean; hint?: string }) {
  return (
    <div className="mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[15px] font-bold text-[var(--iv2-text-primary)]">
          {label} {required ? <span className="text-[var(--iv2-danger)]">*</span> : null}
        </div>
        {optional ? <OptionalBadge /> : null}
      </div>
      {hint ? <div className="mt-0.5 text-sm leading-[1.4] text-[var(--iv2-text-muted)]">{hint}</div> : null}
    </div>
  );
}

// Small gray pill marking a field as not required — the visual
// counterpart to FieldLabel's red required asterisk.
function OptionalBadge() {
  return (
    <span className="shrink-0 rounded-full bg-[var(--iv2-surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--iv2-text-muted)]">Optional</span>
  );
}

// Multi-line free text — used for the "tell us about the
// complications" follow-up, the one place in this flow that needs
// more than a single input line.
function Textarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      aria-label={placeholder}
      className="w-full resize-none rounded-xl border border-[var(--iv2-border)] bg-white px-3.5 py-3 text-[15px] font-medium text-[var(--iv2-text-primary)] outline-none transition-colors focus:border-[var(--iv2-brand)] focus:outline-2 focus:outline-[var(--iv2-brand)] focus:-outline-offset-2 hover:border-[var(--iv2-text-muted)]"
    />
  );
}

// Small "ⓘ ..." note under a field — matches the reference's inline
// explainer for why a question is asked.
function FieldNote({ text }: { text: string }) {
  return (
    <div className="mt-2.5 flex items-start gap-1.5 text-[13px] leading-[1.4] text-[var(--iv2-text-muted)]">
      <InfoIcon size={14} color="#98A2B3" />
      <span>{text}</span>
    </div>
  );
}

// Left-aligned pills, content-sized — used inside a FieldCard for any
// single-select question (Yes/No, Yes/No/Unknown, ...).
function PillOptionRow({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => (
        <OptionPill key={opt} label={opt} selected={value === opt} onClick={() => onChange(opt)} />
      ))}
    </div>
  );
}

function TriPillRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <PillOptionRow value={value} onChange={onChange} options={YES_NO_UNKNOWN} />;
}

function YesNoPillRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <PillOptionRow value={value} onChange={onChange} options={["Yes", "No"]} />;
}

// Numeric input with a fixed "per day" suffix box, matching the
// reference — InputField doesn't support a suffix, so this is its own
// small layout rather than extending that shared component for one
// screen's needs.
function SuffixInput({
  value,
  onChange,
  onBlur,
  placeholder,
  suffix,
  inputMode = "numeric",
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  suffix: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div
      className="flex h-13 w-full min-w-0 overflow-hidden rounded-xl border border-[var(--iv2-border)] transition-colors focus-within:border-[var(--iv2-brand)] focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-[var(--iv2-brand)] hover:border-[var(--iv2-text-muted)]"
      style={{ height: 52 }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-label={placeholder}
        className="h-full min-w-0 flex-1 border-none bg-[#FBFBFC] px-3.5 text-[17px] font-semibold text-[var(--iv2-text-primary)] outline-none"
      />
      <div className="flex shrink-0 items-center border-l border-[var(--iv2-border)] bg-[var(--iv2-surface-muted)] px-3.5 text-[15px] font-semibold text-[var(--iv2-text-muted)]">
        {suffix}
      </div>
    </div>
  );
}

// Thin wrapper over SuffixInput for the two diaper-count fields.
function PerDayInput({ value, onChange, onBlur, placeholder }: { value: string; onChange: (v: string) => void; onBlur: () => void; placeholder: string }) {
  return <SuffixInput value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} suffix="per day" />;
}

// Birth/discharge weight — two separate lb/oz inputs side by side
// (per design review) instead of one combined free-text "6 lb 14 oz"
// line, so each unit gets its own numeric field with its own suffix.
// Neither is gated (not required to advance), so no onBlur hookup.
function SplitWeightInput({
  lb,
  oz,
  onChangeLb,
  onChangeOz,
}: {
  lb: string;
  oz: string;
  onChangeLb: (v: string) => void;
  onChangeOz: (v: string) => void;
}) {
  return (
    <div className="flex gap-2.5">
      <div className="min-w-0 flex-1">
        <SuffixInput value={lb} onChange={(v) => onChangeLb(formatDigits(v, 2))} placeholder="e.g. 6" suffix="lb" />
      </div>
      <div className="min-w-0 flex-1">
        <SuffixInput value={oz} onChange={(v) => onChangeOz(formatDigits(v, 2))} placeholder="e.g. 14" suffix="oz" />
      </div>
    </div>
  );
}

// Which fields make up each section's "X of Y marked 'Yes'" review
// summary — free-text/measurement fields (gestational age, hospital,
// delivery type, weights, formula type, diaper counts) are left out
// since they aren't Yes/No answers.
function reviewRowsFor(sectionIdx: number, birth: BirthHistory): { label: string; value: string }[] {
  switch (sectionIdx) {
    case 0:
      return [
        { label: "Illness during pregnancy", value: birth.pregnancyIllness },
        { label: "Infections during pregnancy", value: birth.pregnancyInfections },
        { label: "Medications during pregnancy", value: birth.pregnancyMeds },
        { label: "Substance use during pregnancy", value: birth.pregnancySubstances },
      ];
    case 1:
      return [
        { label: "Complications during delivery", value: birth.deliveryComplications },
        { label: "Complications during hospitalization", value: birth.hospitalizationComplications },
      ];
    case 2:
      return [
        { label: "Jaundice at birth", value: birth.jaundice },
        { label: "Passed newborn hearing test", value: birth.hearingTest },
        { label: "Metabolic / heel-prick screen done", value: birth.heelPrick },
      ];
    case 3:
      return [
        { label: "Breastfeeding", value: birth.breastfeeding },
        { label: "Formula fed", value: birth.formulaFed },
      ];
    default:
      return [];
  }
}

// Inline, per-section "Review your answers" bar — replaces the old
// separate full-page BirthReviewScreen. Sits at the bottom of each
// section once that section is complete, collapsed by default;
// tapping "View details" expands the same label/value rows the old
// review screen showed, without leaving the section.
function ReviewBar({
  sectionIdx,
  birth,
  expanded,
  onToggle,
}: {
  sectionIdx: number;
  birth: BirthHistory;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rows = reviewRowsFor(sectionIdx, birth);
  const yes = rows.filter((r) => r.value === "Yes").length;

  return (
    <div className="mt-5 overflow-hidden rounded-2xl bg-[var(--iv2-brand-tint)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-none bg-transparent p-4 text-left"
      >
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-[var(--iv2-text-primary)]">Review your answers</div>
          <div className="mt-0.5 text-[13px] text-[var(--iv2-text-secondary)]">
            {yes} of {rows.length} marked &quot;Yes&quot;
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-sm font-bold text-[var(--iv2-brand)]">
          View details
          <span className="flex transition-transform" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            <ChevronDownIcon size={16} color="var(--iv2-brand)" />
          </span>
        </div>
      </button>
      {expanded ? (
        <div className="flex flex-col gap-1.5 border-t border-[rgba(0,0,0,0.06)] px-4 pt-3 pb-4">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-[var(--iv2-text-secondary)]">{r.label}</span>
              <span className="font-semibold text-[var(--iv2-text-primary)]">{r.value || "-"}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Birth & Prenatal History — spec Part 2, items 10-14, redesigned as
// ONE continuous flow instead of 5 separate screen-per-section steps:
// only sections up to `state.birthSection` are revealed; a section
// remains fully visible and editable once passed (never collapses);
// answering the last gating question in the current section advances
// to the next one automatically and scrolls it into view — no
// Continue button appears until every section is done. Each section
// carries its own inline, collapsible "Review your answers" bar
// (ReviewBar above) once it's complete, in place of a separate
// full-page review step at the end of the flow.
export function BirthHistoryFlowScreen({ ctx }: { ctx: Ctx }) {
  const { state } = ctx;
  const { birth, update } = useBirth(ctx);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [reviewOpen, setReviewOpen] = useState<Record<number, boolean>>({});
  const toggleReview = (i: number) => setReviewOpen((prev) => ({ ...prev, [i]: !prev[i] }));

  const setAndCheck = (patch: Partial<BirthHistory>, sectionIdx: number) => {
    const nextBirth = { ...birth, ...patch };
    update({ birth: nextBirth });
    if (sectionIdx !== state.birthSection) return; // editing an earlier, already-passed section in place
    if (!SECTIONS[sectionIdx].complete(nextBirth)) return;
    window.setTimeout(() => {
      update({ birthSection: sectionIdx + 1 });
      window.setTimeout(() => {
        const nextSection = sectionRefs.current[sectionIdx + 1];
        if (nextSection) scrollIntoComfortableView(nextSection);
      }, 60);
    }, 300);
  };

  const visibleCount = Math.min(state.birthSection + 1, SECTIONS.length);
  const indices = Array.from({ length: visibleCount }, (_, i) => i);

  return (
    <div className="px-6 pt-8 pb-6">
      {indices.map((i) => (
        <div
          key={SECTIONS[i].key}
          ref={(el) => {
            sectionRefs.current[i] = el;
          }}
          className={i > 0 ? "mt-9" : ""}
        >
          {i === 1 || i === 3 ? null : <Eyebrow>{SECTIONS[i].eyebrow}</Eyebrow>}
          <div className="mb-1 text-base font-bold text-[var(--iv2-text-primary)]">{SECTIONS[i].title}</div>
          {SECTIONS[i].copy ? (
            <div className="mb-6 text-sm leading-[1.4] text-[var(--iv2-text-secondary)]">{SECTIONS[i].copy}</div>
          ) : (
            <div className="mb-6" />
          )}

          {i === 0 ? (
            <>
            <div className="flex flex-col gap-3.5">
              <FieldCard>
                <YesNoInline
                  label="Any illness during pregnancy?"
                  hint="Examples: high blood pressure, diabetes, thyroid, etc."
                  value={birth.pregnancyIllness}
                  onChange={(v) => setAndCheck({ pregnancyIllness: v }, i)}
                />
              </FieldCard>
              <FieldCard>
                <YesNoInline
                  label="Any infections during pregnancy?"
                  hint="Examples: COVID-19, flu, urinary tract infection, etc."
                  value={birth.pregnancyInfections}
                  onChange={(v) => setAndCheck({ pregnancyInfections: v }, i)}
                />
              </FieldCard>
              <FieldCard>
                <YesNoInline
                  label="Any medications taken during pregnancy?"
                  hint="Includes prescription, over-the-counter, vitamins or supplements."
                  value={birth.pregnancyMeds}
                  onChange={(v) => setAndCheck({ pregnancyMeds: v }, i)}
                />
                {birth.pregnancyMeds === "Yes" ? (
                  <Reveal className="mt-3.5 rounded-xl bg-[var(--iv2-brand-surface)] p-3.5">
                    <InputField
                      label="List medications"
                      value={birth.pregnancyMedsList}
                      placeholder="Medication names"
                      onChange={(v) => update({ birth: { ...birth, pregnancyMedsList: v } })}
                    />
                  </Reveal>
                ) : null}
              </FieldCard>
              <FieldCard>
                <YesNoInline
                  label="Recreational drugs, alcohol or tobacco use during pregnancy?"
                  hint="Includes marijuana, alcohol, tobacco or other substances."
                  value={birth.pregnancySubstances}
                  onChange={(v) => setAndCheck({ pregnancySubstances: v }, i)}
                />
              </FieldCard>
            </div>
            {SECTIONS[0].complete(birth) ? (
              <ReviewBar sectionIdx={0} birth={birth} expanded={!!reviewOpen[0]} onToggle={() => toggleReview(0)} />
            ) : null}
            </>
          ) : null}

          {i === 1 ? (
            <>
            <div className="flex flex-col gap-3.5">
              <FieldCard>
                <FieldLabel label="Gestational age at birth" required hint="How many weeks pregnant were you when your baby was born?" />
                <SuffixInput
                  value={birth.deliveryGestationalAge}
                  placeholder="e.g. 39"
                  suffix="weeks"
                  onChange={(v) => update({ birth: { ...birth, deliveryGestationalAge: v } })}
                />
              </FieldCard>

              <FieldCard>
                <FieldLabel label="Hospital" optional hint="Where was your baby delivered?" />
                <InputField
                  ariaLabel="Hospital"
                  value={birth.deliveryHospital}
                  placeholder="Hospital name"
                  onChange={(v) => update({ birth: { ...birth, deliveryHospital: v } })}
                />
              </FieldCard>

              <FieldCard>
                <FieldLabel label="Delivery type" required hint="How was your baby delivered?" />
                <PillOptionRow value={birth.deliveryType} options={DELIVERY_TYPES} onChange={(v) => update({ birth: { ...birth, deliveryType: v } })} />
              </FieldCard>

              <FieldCard>
                <FieldLabel label="Complications during delivery" required hint="Were there any complications during the delivery?" />
                <PillOptionRow
                  value={birth.deliveryComplications}
                  options={YES_NO_UNKNOWN}
                  onChange={(v) => setAndCheck({ deliveryComplications: v }, i)}
                />
                {birth.deliveryComplications === "Yes" ? (
                  <Reveal className="mt-3.5 rounded-xl bg-[var(--iv2-brand-surface)] p-3.5">
                    <FieldLabel label="Tell us about the complications" optional hint="Share any details you know." />
                    <Textarea
                      value={birth.deliveryComplicationsDetails}
                      placeholder="e.g. bleeding, infection, prolonged labor, etc."
                      onChange={(v) => update({ birth: { ...birth, deliveryComplicationsDetails: v } })}
                    />
                  </Reveal>
                ) : null}
              </FieldCard>

              <FieldCard>
                <FieldLabel label="Complications during hospitalization" required hint="Were there any complications while your baby was in the hospital?" />
                <PillOptionRow
                  value={birth.hospitalizationComplications}
                  options={YES_NO_UNKNOWN}
                  onChange={(v) => setAndCheck({ hospitalizationComplications: v }, i)}
                />
                {birth.hospitalizationComplications === "Yes" ? (
                  <Reveal className="mt-3.5 rounded-xl bg-[var(--iv2-brand-surface)] p-3.5">
                    <FieldLabel label="Tell us about the complications" optional hint="Share any details you know." />
                    <Textarea
                      value={birth.hospitalizationComplicationsDetails}
                      placeholder="e.g. NICU stay, feeding issues, etc."
                      onChange={(v) => update({ birth: { ...birth, hospitalizationComplicationsDetails: v } })}
                    />
                  </Reveal>
                ) : null}
              </FieldCard>
            </div>
            {SECTIONS[1].complete(birth) ? (
              <ReviewBar sectionIdx={1} birth={birth} expanded={!!reviewOpen[1]} onToggle={() => toggleReview(1)} />
            ) : null}
            </>
          ) : null}

          {i === 2 ? (
            <>
            <div className="flex flex-col gap-3.5">
              <FieldCard>
                <FieldLabel label="Birth weight" required hint="Enter your baby's weight at birth." />
                <SplitWeightInput
                  lb={birth.birthWeightLb}
                  oz={birth.birthWeightOz}
                  onChangeLb={(v) => update({ birth: { ...birth, birthWeightLb: v } })}
                  onChangeOz={(v) => update({ birth: { ...birth, birthWeightOz: v } })}
                />
              </FieldCard>
              <FieldCard>
                <FieldLabel label="Discharge weight" hint="Enter the weight at hospital discharge (if known)." />
                <SplitWeightInput
                  lb={birth.dischargeWeightLb}
                  oz={birth.dischargeWeightOz}
                  onChangeLb={(v) => update({ birth: { ...birth, dischargeWeightLb: v } })}
                  onChangeOz={(v) => update({ birth: { ...birth, dischargeWeightOz: v } })}
                />
              </FieldCard>
              <FieldCard>
                <FieldLabel label="Jaundice at birth?" required hint="Did your baby have jaundice after birth?" />
                <YesNoPillRow value={birth.jaundice} onChange={(v) => setAndCheck({ jaundice: v }, i)} />
              </FieldCard>
              <FieldCard>
                <FieldLabel label="Passed newborn hearing test?" required hint="Did your baby pass the hearing test in the hospital?" />
                <YesNoPillRow value={birth.hearingTest} onChange={(v) => setAndCheck({ hearingTest: v }, i)} />
              </FieldCard>
              <FieldCard>
                <FieldLabel label="Metabolic / heel-prick screen done?" required hint="Was the newborn metabolic (heel-prick) screening test completed?" />
                <YesNoPillRow value={birth.heelPrick} onChange={(v) => setAndCheck({ heelPrick: v }, i)} />
              </FieldCard>
            </div>
            {SECTIONS[2].complete(birth) ? (
              <ReviewBar sectionIdx={2} birth={birth} expanded={!!reviewOpen[2]} onToggle={() => toggleReview(2)} />
            ) : null}
            </>
          ) : null}

          {i === 3 ? (
            <>
            <div className="flex flex-col gap-3.5">
              <FieldCard>
                <FieldLabel label="Breastfeeding?" required hint="Includes nursing at the breast or pumped breast milk." />
                <TriPillRow value={birth.breastfeeding} onChange={(v) => setAndCheck({ breastfeeding: v }, i)} />
              </FieldCard>
              <FieldCard>
                <FieldLabel label="Formula fed?" required hint="Includes formula or mixed feeding." />
                <TriPillRow value={birth.formulaFed} onChange={(v) => setAndCheck({ formulaFed: v }, i)} />
              </FieldCard>
              <FieldCard>
                <FieldLabel label="Formula type" hint="If formula fed, let us know the type (e.g. Similac, Enfamil, etc.)." />
                <InputField
                  ariaLabel="Formula type"
                  value={birth.formulaType}
                  placeholder="e.g. Similac Advance"
                  onChange={(v) => update({ birth: { ...birth, formulaType: v } })}
                />
                <FieldNote text="This helps us understand your baby's nutrition." />
              </FieldCard>

              <div className="mt-2">
                <div className="mb-1 text-base font-bold text-[var(--iv2-text-primary)]">Diapers per day</div>
                <div className="mb-3.5 text-sm leading-[1.4] text-[var(--iv2-text-secondary)]">
                  Tell us about your baby&apos;s diaper changes and bowel movements.
                </div>
                <div className="flex flex-col gap-3">
                  <FieldCard>
                    <FieldLabel label="Wet diapers per day" required hint="Average number of wet diapers in 24 hours." />
                    <PerDayInput
                      value={birth.wetDiapers}
                      placeholder="e.g. 6"
                      onChange={(v) => update({ birth: { ...birth, wetDiapers: v } })}
                      onBlur={() => setAndCheck({}, i)}
                    />
                    <FieldNote text="This helps us know if your baby is well hydrated." />
                  </FieldCard>
                  <FieldCard>
                    <FieldLabel label="Bowel movements per day" required hint="Average number of bowel movements in 24 hours." />
                    <PerDayInput
                      value={birth.bowelMovements}
                      placeholder="e.g. 2"
                      onChange={(v) => update({ birth: { ...birth, bowelMovements: v } })}
                      onBlur={() => setAndCheck({}, i)}
                    />
                    <FieldNote text="Let us know what's typical for your baby." />
                  </FieldCard>
                </div>
              </div>
            </div>
            {SECTIONS[3].complete(birth) ? (
              <ReviewBar sectionIdx={3} birth={birth} expanded={!!reviewOpen[3]} onToggle={() => toggleReview(3)} />
            ) : null}
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
