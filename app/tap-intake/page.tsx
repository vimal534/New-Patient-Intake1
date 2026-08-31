"use client";

import { useState } from "react";
import { VisitContext, useVisitReducer, useVisit, SECTION_ORDER, SECTION_LABELS } from "./state";
import { SectionKey, MEDICAL_CATEGORY_KEYS, PatientType } from "./types";
import { IntroScreen } from "./components/IntroScreen";
import { ReturningHome } from "./components/ReturningHome";
import { ConfirmDetailsScreen } from "./components/ConfirmDetailsScreen";
import { VisitCompleteScreen } from "./components/VisitCompleteScreen";
import { DemoScenarioSwitcher } from "./components/DemoScenarioSwitcher";
import { ConcernSection } from "./components/ConcernSection";
import { SymptomsSection } from "./components/SymptomsSection";
import { ChildDetailsSection } from "./components/ChildDetailsSection";
import { MedicalHistorySection } from "./components/MedicalHistorySection";
import { GuardianSection } from "./components/GuardianSection";
import { CoverageSection } from "./components/CoverageSection";
import { PaymentSection } from "./components/PaymentSection";
import { ConsentsSection } from "./components/ConsentsSection";
import { VisitSummaryPanel } from "./components/VisitSummaryPanel";
import { ProgressSummary } from "./components/ProgressSummary";
import { PhoneFrame } from "./components/PhoneFrame";
import { SectionShell } from "./components/ui";

export default function TapIntakePage() {
  const [state, dispatch] = useVisitReducer();
  return (
    <VisitContext.Provider value={{ state, dispatch }}>
      <Shell />
    </VisitContext.Provider>
  );
}

function Shell() {
  const { state, dispatch } = useVisit();
  // Three one-time UI beats ahead of the flow — none hold visit data, so
  // they live as local state rather than in visitState.
  const [introDone, setIntroDone] = useState(false);
  const [returningHomeDone, setReturningHomeDone] = useState(false);
  const [confirmDetailsDone, setConfirmDetailsDone] = useState(false);
  const [sentToProvider, setSentToProvider] = useState(false);

  // A real patient's app already knows who they are (a lookup or a magic
  // link) — there's no real-world "are you new or returning" screen to
  // show. That prominent choice only ever existed for demoing this
  // prototype, so it's gone as its own step: Intro's "Next" goes straight
  // into the fuller "new patient" scenario, and DemoScenarioSwitcher (a
  // small floating control inside the main flow below) is how a demo
  // switches to "returning" instead.
  if (!introDone) {
    return (
      <IntroScreen
        onNext={() => {
          dispatch({ type: "SET_PATIENT_TYPE", patientType: "new" });
          dispatch({ type: "SET_ACTIVE_SECTION", key: "concern" });
          setIntroDone(true);
        }}
      />
    );
  }

  if (!state.patientType) {
    // Unreachable in practice — SET_PATIENT_TYPE dispatches in the same
    // batch as setIntroDone(true) above, so patientType is already set by
    // the render where introDone flips true. Kept as a narrowing guard
    // (everything below assumes non-null patientType) and a safe no-op
    // fallback rather than a real screen, should that assumption ever break.
    return null;
  }

  // Returning patients see who/what's on file before landing on a
  // question — new patients skip this (there's no record yet to show).
  if (state.patientType === "returning" && !returningHomeDone) {
    return <ReturningHome onStart={() => setReturningHomeDone(true)} />;
  }

  // Then confirm contact/emergency-contact are still accurate — also
  // returning-patient only, for the same reason. Only after this does the
  // active section become "concern" (Reason for Visit).
  if (state.patientType === "returning" && !confirmDetailsDone) {
    return (
      <ConfirmDetailsScreen
        onConfirm={() => {
          setConfirmDetailsDone(true);
          dispatch({ type: "SET_ACTIVE_SECTION", key: "concern" });
        }}
        onBack={() => setReturningHomeDone(false)}
      />
    );
  }

  // DemoScenarioSwitcher's handler — restarts the whole visit fresh into
  // the chosen scenario. Mirrors exactly what the old Welcome screen used
  // to dispatch (SET_PATIENT_TYPE, then either SET_ACTIVE_SECTION for a
  // new patient or PRESET_ON_FILE for a returning one), plus resetting
  // the three local UI-beat flags below — those aren't reducer state, so
  // RESTART alone can't touch them, and stale true values would skip
  // straight past ReturningHome/ConfirmDetailsScreen into a blank
  // activeSection.
  function switchScenario(type: PatientType) {
    dispatch({ type: "RESTART" });
    dispatch({ type: "SET_PATIENT_TYPE", patientType: type });
    if (type === "returning") {
      dispatch({ type: "PRESET_ON_FILE" });
    } else {
      dispatch({ type: "SET_ACTIVE_SECTION", key: "concern" });
    }
    setReturningHomeDone(false);
    setConfirmDetailsDone(false);
    setSentToProvider(false);
  }

  const order = SECTION_ORDER[state.patientType];
  const allReady = order.every((k) => state.sectionStatus[k] === "ready");

  // Once everything's ready AND the guardian has actually tapped "Send to
  // Dr. Reyes" (not just reached the summary), swap to a dedicated
  // full-bleed confirmation screen — see VisitCompleteScreen.
  if (allReady && sentToProvider) {
    return <VisitCompleteScreen />;
  }

  return (
    <PhoneFrame>
      {/* Directly under the status bar, outside the scrollable area — so
          it's always visible, not just sticky-while-scrolling, and reads
          as part of the app chrome rather than page content. */}
      {!allReady ? <ProgressSummary /> : null}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-lg font-bold text-[var(--color-ink)]">Brightline Pediatrics — Check-in</h1>
        </header>

        {allReady ? (
          <VisitSummaryPanel mode="full" onSend={() => setSentToProvider(true)} />
        ) : (
          <>
            <div className="space-y-3">
              {order
                .filter((key) => state.sectionStatus[key] === "ready" || key === state.activeSection)
                .map((key) => (
                  <SectionRenderer key={key} sectionKey={key} />
                ))}
            </div>
            <LockedSectionsList order={order} />
          </>
        )}
      </div>

      <DemoScenarioSwitcher onSwitch={switchScenario} />
    </PhoneFrame>
  );
}

// Renders every not-yet-reached section as one merged, compact block
// (shared border, hairline dividers) instead of individual rows each
// carrying the full space-y-3 gap used between active/ready cards — see
// the comment on SectionShell's `lockedPosition` prop for why.
function LockedSectionsList({ order }: { order: SectionKey[] }) {
  const { state } = useVisit();
  const lockedKeys = order.filter((key) => state.sectionStatus[key] !== "ready" && key !== state.activeSection);
  if (lockedKeys.length === 0) return null;

  return (
    <div className="mt-3">
      {lockedKeys.map((key, i) => (
        <SectionShell
          key={key}
          title={SECTION_LABELS[key]}
          status="locked"
          lockedPosition={
            lockedKeys.length === 1 ? "only" : i === 0 ? "first" : i === lockedKeys.length - 1 ? "last" : "middle"
          }
        />
      ))}
    </div>
  );
}

function SectionRenderer({ sectionKey }: { sectionKey: SectionKey }) {
  const { state, dispatch } = useVisit();
  const order = state.patientType ? SECTION_ORDER[state.patientType] : [];
  const status = state.sectionStatus[sectionKey];
  const displayStatus = status === "ready" ? "ready" : sectionKey === state.activeSection ? "active" : "locked";

  // Dispatches into the reducer rather than computing the frontier here:
  // this fires right after a MARK_SECTION_READY/CONFIRM_*_NO_CHANGE
  // dispatch in the same handler, and the component's own `state` is still
  // one render behind at that point. Computing "next" from sectionStatus
  // read off this closure would pick the section that was JUST completed
  // right back up again. The reducer sees its own true latest state, so
  // ADVANCE_TO_FRONTIER there is never stale.
  function goToNext() {
    dispatch({ type: "ADVANCE_TO_FRONTIER", order });
  }

  return (
    <SectionShell
      title={SECTION_LABELS[sectionKey]}
      status={displayStatus}
      summaryLine={displayStatus === "ready" ? summaryFor(sectionKey, state) : undefined}
      onReopen={() => dispatch({ type: "REOPEN_SECTION", key: sectionKey })}
    >
      {displayStatus === "active" ? <SectionBody sectionKey={sectionKey} onDone={goToNext} /> : null}
    </SectionShell>
  );
}

function SectionBody({ sectionKey, onDone }: { sectionKey: SectionKey; onDone: () => void }) {
  switch (sectionKey) {
    case "concern":
      return <ConcernSection onDone={onDone} />;
    case "symptoms":
      return <SymptomsSection onDone={onDone} />;
    case "childDetails":
      return <ChildDetailsSection onDone={onDone} />;
    case "medicalHistory":
      return <MedicalHistorySection onDone={onDone} />;
    case "guardian":
      return <GuardianSection onDone={onDone} />;
    case "coverage":
      return <CoverageSection onDone={onDone} />;
    case "payment":
      return <PaymentSection onDone={onDone} />;
    case "consents":
      return <ConsentsSection onDone={onDone} />;
    default:
      return null;
  }
}

function summaryFor(key: SectionKey, state: ReturnType<typeof useVisit>["state"]): string {
  const name = state.child.name || "Child";
  switch (key) {
    case "concern":
      return [state.concern.reason, ...state.concern.structuredSymptoms.filter((t) => t !== state.concern.reason)]
        .filter(Boolean)
        .join(" · ");
    case "symptoms":
      return `${Object.keys(state.symptomAnswers).length} details captured`;
    case "childDetails":
      return `${name}${state.child.age !== null ? `, age ${state.child.age}` : ""}`;
    case "medicalHistory": {
      const entryCount = MEDICAL_CATEGORY_KEYS.reduce((sum, cat) => sum + state.medicalHistory.detail[cat].length, 0);
      return entryCount > 0 ? `${entryCount} detail${entryCount === 1 ? "" : "s"} captured` : "Nothing to report";
    }
    case "guardian":
      return [state.guardian.name, state.guardian.relationship].filter(Boolean).join(" · ");
    case "coverage":
      return [state.coverage.payer, state.coverage.policyNumber].filter(Boolean).join(" · ");
    case "payment":
      return state.payment.method === "on_file"
        ? `Card on file · •••• ${state.payment.cardLast4}`
        : state.payment.method === "new_card"
          ? "New card added"
          : "Pay at visit";
    case "consents":
      return `Signed by ${state.guardian.name || "guardian"}`;
    default:
      return "";
  }
}
