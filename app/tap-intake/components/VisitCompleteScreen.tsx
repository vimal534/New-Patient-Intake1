"use client";

import { useState } from "react";
import { useVisit } from "../state";
import { ON_FILE_RECORD } from "../mockData";
import { PhoneFrame } from "./PhoneFrame";
import { PrimaryButton, TextLink } from "./ui";

const PASSPORT_BENEFITS = [
  "Never start over at a new practice",
  "Travels with you anywhere",
  "Revoke or delete any time",
];

// The screen shown once every section is ready and the guardian has tapped
// "Send to Dr. Reyes" on the Visit Summary (see VisitSummaryPanel's onSend).
// A dedicated full-bleed moment of its own — own PhoneFrame, like
// IntroScreen/ReturningHome/ConfirmDetailsScreen — rather than just another
// card appended to the checklist, since "you're done" deserves more weight
// than a list item ever could.
//
// Redesigned from a reference screen the guardian responded to strongly:
// a checkmark + a personalized headline/subtitle carry the actual
// confirmation, with one soft, skippable upsell below it instead of just
// stopping there. Right after finishing is when a guardian is most
// receptive to "keep this for next time" — not a hard sell earlier in the
// flow, and not nothing at all once they're done.
export function VisitCompleteScreen() {
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

  const [passportState, setPassportState] = useState<"offer" | "saved" | "dismissed">("offer");

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8 pt-10">
        {/* Grouped as one flex-1 block instead of just the hero, so
            dismissing the Passport card ("Maybe later") re-centers what's
            left in the available space rather than stranding a tall empty
            gap below a now-shorter, top-anchored screen. */}
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

        {passportState !== "dismissed" ? (
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
              <>
                <div className="mt-4">
                  <PrimaryButton onClick={() => setPassportState("saved")}>Make it my Passport</PrimaryButton>
                </div>
                <div className="mt-3 text-center">
                  <TextLink onClick={() => setPassportState("dismissed")}>Maybe later</TextLink>
                </div>
              </>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-teal">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal text-[11px] font-bold text-white">
                  ✓
                </span>
                Saved to your Passport
              </div>
            )}
          </div>
        ) : null}
      </div>
    </PhoneFrame>
  );
}
