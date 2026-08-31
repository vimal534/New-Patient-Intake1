"use client";

import { useState } from "react";
import { useVisit } from "../state";
import { PatientType } from "../types";
import { ON_FILE_RECORD } from "../mockData";
import { PhoneFrame } from "./PhoneFrame";
import { DemoScenarioSwitcher } from "./DemoScenarioSwitcher";
import { Checkbox, PrimaryButton, TextLink } from "./ui";

const PASSPORT_BENEFITS = [
  "Never start over at a new practice",
  "Travels with you anywhere",
  "Revoke or delete any time",
];

// What actually goes in the Passport — the card's own copy promises "you
// decide what to share, with whom," so "Make it my Passport" opens this
// picker instead of just saving everything silently. All default checked
// (opt-out, not opt-in) since that's what a guardian who just tapped the
// button clearly wants; unchecking is for the rarer case they'd rather
// leave something out.
const PASSPORT_CATEGORY_KEYS = ["healthHistory", "medications", "contact", "insurance"] as const;
type PassportCategoryKey = (typeof PASSPORT_CATEGORY_KEYS)[number];
const PASSPORT_CATEGORY_LABELS: Record<PassportCategoryKey, string> = {
  healthHistory: "Health history",
  medications: "Medications & allergies",
  contact: "Guardian & emergency contact",
  insurance: "Insurance details",
};

// The screen shown once every section is ready and the guardian has tapped
// "Send to Dr. Reyes" on the Visit Summary (see VisitSummaryPanel's onSend).
// A dedicated full-bleed moment of its own — own PhoneFrame, like
// IntroScreen/ReturningHome/AboutYouScreen — rather than just another
// card appended to the checklist, since "you're done" deserves more weight
// than a list item ever could.
//
// Redesigned from a reference screen the guardian responded to strongly:
// a checkmark + a personalized headline/subtitle carry the actual
// confirmation, with one soft, skippable upsell below it instead of just
// stopping there. Right after finishing is when a guardian is most
// receptive to "keep this for next time" — not a hard sell earlier in the
// flow, and not nothing at all once they're done.
//
// "Make it my Passport" doesn't save silently — the card's own copy
// promises "you decide what to share, with whom," so tapping it opens a
// one-step category picker (all checked by default) before landing on the
// saved confirmation, which then names what's actually being shared.
//
// The floating DemoScenarioSwitcher matches the original reference — the
// same one used throughout the main flow, so a demo can restart into
// either scenario from this screen too, not just from mid-flow.
//
// `onBack` is still passed in from page.tsx (it reopens the Visit Summary
// checklist via setReviewingSummary(true)) but is intentionally not
// destructured/rendered here anymore — the "‹ Today's Visit" header was
// removed per request, leaving this a purely terminal screen with no way
// back except restarting via the demo switcher below.
export function VisitCompleteScreen({
  onSwitchScenario,
}: {
  onBack: () => void;
  onSwitchScenario: (type: PatientType) => void;
}) {
  const { state } = useVisit();
  const isReturning = state.patientType === "returning";
  const childName = state.child.name || "your child";
  const knowsChildName = state.child.name.length > 0;
  // Single-provider clinic demo — same "Dr. Reyes" VisitSummaryPanel already
  // hardcodes in its "Ready for Dr. Reyes" line, reused here so the two
  // screens agree on who the visit is with.
  const provider = ON_FILE_RECORD.nextVisit.provider;
  // Only returning patients have a real scheduled next-visit date on file;
  // a new patient's appointment isn't modeled yet, so it gets a generic
  // (still warm) "your visit" instead of fabricating a date.
  const whenLabel = isReturning ? ON_FILE_RECORD.nextVisit.date.toLowerCase() : "your visit";

  const [passportState, setPassportState] = useState<"offer" | "options" | "saved">("offer");
  const [selected, setSelected] = useState<Record<PassportCategoryKey, boolean>>({
    healthHistory: true,
    medications: true,
    contact: true,
    insurance: true,
  });
  const selectedCount = PASSPORT_CATEGORY_KEYS.filter((k) => selected[k]).length;
  const selectedLabels = PASSPORT_CATEGORY_KEYS.filter((k) => selected[k]).map((k) => PASSPORT_CATEGORY_LABELS[k]);

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8 pt-6">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/15">
            <span className="text-3xl font-bold text-teal" aria-hidden="true">
              ✓
            </span>
          </div>
          <h1 className="mt-5 text-[26px] font-bold leading-tight text-ink">All set for {whenLabel}.</h1>
          <p className="mt-2 text-sm text-muted">
            {provider} has everything {knowsChildName ? `${childName} needs` : "they need"}.
          </p>
        </div>

        {passportState === "offer" || passportState === "saved" ? (
          <div className="mt-2 rounded-2xl border border-teal/30 bg-teal/5 p-5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-teal">One more thing</div>
            <h2 className="text-lg font-bold text-ink">Save this as your Passport.</h2>
            <p className="mt-1.5 text-sm text-muted">
              Next time {knowsChildName ? `${childName} sees` : "you see"} any doctor, you start at 90% done. You
              decide what to share, with whom.
            </p>
            <ul className="mt-3 space-y-1.5">
              {PASSPORT_BENEFITS.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-ink">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                  {line}
                </li>
              ))}
            </ul>

            {passportState === "offer" ? (
              <div className="mt-4">
                <PrimaryButton onClick={() => setPassportState("options")}>Make it my Passport</PrimaryButton>
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal text-[11px] font-bold text-white">
                    ✓
                  </span>
                  Saved to your Passport
                </div>
                <div className="mt-1 text-xs text-muted">Sharing: {selectedLabels.join(", ")}</div>
              </div>
            )}
          </div>
        ) : null}

        {passportState === "options" ? (
          <div className="mt-2 rounded-2xl border border-teal/30 bg-teal/5 p-5">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-teal">You decide what to share</div>
            <h2 className="text-lg font-bold text-ink">What&apos;s in your Passport?</h2>
            <p className="mt-1.5 text-sm text-muted">
              Every practice {knowsChildName ? childName : "your child"} visits still has to request access — this
              just decides what&apos;s available to share. Change it anytime.
            </p>

            <div className="mt-3 space-y-1 rounded-xl bg-white p-1">
              {PASSPORT_CATEGORY_KEYS.map((key) => (
                <div key={key} className="rounded-lg px-2 hover:bg-background">
                  <Checkbox
                    label={PASSPORT_CATEGORY_LABELS[key]}
                    checked={selected[key]}
                    onChange={(v) => setSelected((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4">
              <PrimaryButton disabled={selectedCount === 0} onClick={() => setPassportState("saved")}>
                {selectedCount === 0 ? "Select at least one" : `Confirm & Save (${selectedCount})`}
              </PrimaryButton>
            </div>
            <div className="mt-3 text-center">
              <TextLink onClick={() => setPassportState("offer")}>Back</TextLink>
            </div>
          </div>
        ) : null}
      </div>

      <DemoScenarioSwitcher onSwitch={onSwitchScenario} />
    </PhoneFrame>
  );
}
