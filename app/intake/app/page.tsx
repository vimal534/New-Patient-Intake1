"use client";

import { useEffect, useState } from "react";
import { PhoneFrame } from "@/app/tap-intake/components/PhoneFrame";
import { DemographicsModule } from "../modules/demographics/DemographicsModule";
import { SogiModule } from "../modules/sogi/SogiModule";
import { GuardianModule } from "../modules/guardian/GuardianModule";
import { InsuranceModule } from "../modules/insurance/InsuranceModule";
import { GuarantorModule } from "../modules/guarantor/GuarantorModule";
import { ReasonForVisitModule } from "../modules/reasonForVisit/ReasonForVisitModule";
import { MedicationsModule } from "../modules/medications/MedicationsModule";
import { AllergiesModule } from "../modules/allergies/AllergiesModule";
import { ReviewModule } from "../modules/review/ReviewModule";
import { WelcomeBackModule } from "../modules/welcomeBack/WelcomeBackModule";
import { MchatRfModule } from "../modules/screeners/mchatRf/MchatRfModule";
import { MchatRfFollowupModule } from "../modules/screeners/mchatRf/MchatRfFollowupModule";
import { Asq3Module } from "../modules/screeners/asq3/Asq3Module";
import { Phq2Module } from "../modules/screeners/phq/Phq2Module";
import { Phq9Module } from "../modules/screeners/phq/Phq9Module";
import { ScreenerId, screenerEligibility } from "../lib/screener/eligibility";
import { AnswerState } from "../lib/schema/types";
import { IntakeSnapshot, loadIntakeSnapshot, saveIntakeSnapshot } from "../lib/data-source/localSnapshot";
import {
  AllergyIntoleranceDraft,
  DemographicsRecordDraft,
  GuarantorRecordDraft,
  GuardianRecordDraft,
  InsuranceRecordDraft,
  MedicationStatementDraft,
  PatientRecord,
  ReasonForVisitDraft,
  SogiRecordDraft,
} from "../lib/data-source/types";

// This is the first PHI-bearing screen — reachable only after proxy.ts has
// confirmed the device-verification cookie. First checks (client-only,
// via an effect — localStorage isn't available during server render)
// whether this device remembers a completed intake; if so it opens on
// Welcome Back instead of Demographics. Otherwise, Phase 3's 9 modules
// (Demographics through Review & Submit) plus Phase 4's screener engine —
// screenerEligibility() first runs right after Reason for Visit, since
// that's the first point both the patient's DOB (Demographics) and any
// behavioral-concern flag (Reason for Visit) are available, and returns
// an ORDERED LIST. It's then RE-RUN after every screener completes
// (`goToNextScreener` below) rather than frozen into a queue up front —
// PHQ-9 only becomes eligible once PHQ-2 exists AND scored high enough,
// an answer that doesn't exist at the first call. See docs/architecture.md.
const DEMO_PATIENT_ID = "demo-patient-ana";

type Step =
  | "welcomeBack"
  | "demographics"
  | "sogi"
  | "guardian"
  | "insurance"
  | "guarantor"
  | "reasonForVisit"
  | "asq3"
  | "mchatRf"
  | "mchatRfFollowup"
  | "phq2"
  | "phq9"
  | "medications"
  | "allergies"
  | "review"
  | "done";

const SCREENER_STEP: Record<ScreenerId, Step> = {
  "asq-3": "asq3",
  "mchat-rf": "mchatRf",
  "phq-2": "phq2",
  "phq-9": "phq9",
};

export default function IntakeAppPage() {
  // Starts "null" (renders nothing) until the mount-only effect below
  // decides between "welcomeBack" and "demographics" — avoids a flash of
  // the cold-start Demographics screen for a device that's actually
  // recognized.
  const [step, setStep] = useState<Step | null>(null);
  const [snapshot, setSnapshot] = useState<IntakeSnapshot | null>(null);
  // True once the Welcome Back fast path is taken — Review's "On file"
  // badges should reflect that this data really is on file even though
  // it came from device memory, not a fresh Demographics match.
  const [usedWelcomeBackFastPath, setUsedWelcomeBackFastPath] = useState(false);

  useEffect(() => {
    // localStorage is an external system (unavailable during server
    // render) — the state update belongs in a callback the effect
    // triggers, not synchronously in the effect body itself, same pattern
    // used for PinPad's lockout tick and the coded-search debounce.
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const existing = loadIntakeSnapshot(DEMO_PATIENT_ID);
      if (existing) {
        setSnapshot(existing);
        setStep("welcomeBack");
      } else {
        setStep("demographics");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Each module hands its full saved answers back through onComplete —
  // partly so a later module can reuse an earlier one's data (Guardian
  // reuses Demographics' match, Guarantor reuses Guardian/Insurance), and
  // partly so Review & Submit has everything to summarize without
  // re-querying every write source.
  const [matchedPatient, setMatchedPatient] = useState<PatientRecord | null>(null);
  const [demographicsData, setDemographicsData] = useState<DemographicsRecordDraft | null>(null);
  const [sogiData, setSogiData] = useState<SogiRecordDraft>(null);
  const [guardianData, setGuardianData] = useState<GuardianRecordDraft | null>(null);
  const [insuranceData, setInsuranceData] = useState<InsuranceRecordDraft | null>(null);
  const [guarantorData, setGuarantorData] = useState<GuarantorRecordDraft | null>(null);
  const [reasonForVisitData, setReasonForVisitData] = useState<ReasonForVisitDraft | null>(null);
  const [medicationsData, setMedicationsData] = useState<MedicationStatementDraft[]>([]);
  const [allergiesData, setAllergiesData] = useState<AllergyIntoleranceDraft[]>([]);
  // Which items an M-CHAT-R/F "medium" (3-7) result flags — the Follow-Up
  // module re-asks exactly these, not the full 20-item set again.
  const [mchatAtRiskKeys, setMchatAtRiskKeys] = useState<string[]>([]);
  // Cross-screener answers screenerEligibility() reads (reasonForVisit,
  // phq2Score, ...) and which screeners are already done, so re-running
  // the resolver after each one doesn't loop back into a completed one.
  const [screenerAnswers, setScreenerAnswers] = useState<AnswerState>({});
  const [completedScreeners, setCompletedScreeners] = useState<ScreenerId[]>([]);

  // Re-evaluates eligibility against the latest answers (merging in
  // whatever the screener that just finished contributed) and routes to
  // the next still-eligible, not-yet-completed screener in registry
  // order — or Medications once none remain. This re-check, not a queue
  // frozen at Reason for Visit, is what lets PHQ-9's eligibility depend
  // on PHQ-2's own just-given score.
  function goToNextScreener(newAnswers: AnswerState, justCompleted: ScreenerId | null) {
    const mergedAnswers = { ...screenerAnswers, ...newAnswers };
    const nowCompleted = justCompleted ? [...completedScreeners, justCompleted] : completedScreeners;
    setScreenerAnswers(mergedAnswers);
    setCompletedScreeners(nowCompleted);
    const asOf = new Date().toISOString().slice(0, 10);
    const eligible = screenerEligibility(demographicsData?.dob ?? "", asOf, mergedAnswers);
    const remaining = eligible.filter((s) => !nowCompleted.includes(s.id));
    setStep(remaining.length > 0 ? SCREENER_STEP[remaining[0].id] : "medications");
  }

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <header className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--color-brand)]">Patient intake</div>
          <h1 className="text-lg font-bold text-[var(--color-ink)]">Brightline Pediatrics — Check-in</h1>
        </header>

        {step === "welcomeBack" && snapshot ? (
          <WelcomeBackModule
            snapshot={snapshot}
            onConfirm={() => {
              // Fast path: pre-load everything the snapshot carries and
              // skip straight to Reason for Visit — the genuinely
              // visit-specific part (why you're here today, current
              // medications/allergies) still gets asked fresh every time.
              setDemographicsData(snapshot.demographics);
              setSogiData(snapshot.sogi);
              setGuardianData(snapshot.guardian);
              setInsuranceData(snapshot.insurance);
              setGuarantorData(snapshot.guarantor);
              setUsedWelcomeBackFastPath(true);
              setStep("reasonForVisit");
            }}
            onStartFresh={() => setStep("demographics")}
          />
        ) : null}

        {step === "demographics" ? (
          <DemographicsModule
            patientId={DEMO_PATIENT_ID}
            onComplete={(matched, data) => {
              setMatchedPatient(matched);
              setDemographicsData(data);
              setStep("sogi");
            }}
          />
        ) : null}

        {step === "sogi" ? (
          <SogiModule
            patientId={DEMO_PATIENT_ID}
            onComplete={(data) => {
              setSogiData(data);
              setStep("guardian");
            }}
          />
        ) : null}

        {step === "guardian" ? (
          <GuardianModule
            patientId={DEMO_PATIENT_ID}
            matchedPatient={matchedPatient}
            onComplete={(data) => {
              setGuardianData(data);
              setStep("insurance");
            }}
          />
        ) : null}

        {step === "insurance" ? (
          <InsuranceModule
            patientId={DEMO_PATIENT_ID}
            onComplete={(data) => {
              setInsuranceData(data);
              setStep("guarantor");
            }}
          />
        ) : null}

        {step === "guarantor" ? (
          <GuarantorModule
            patientId={DEMO_PATIENT_ID}
            guardianInfo={guardianData?.guardian ?? null}
            subscriberInfo={
              insuranceData
                ? { subscriberName: insuranceData.subscriberName, patientRelationToSubscriber: insuranceData.patientRelationToSubscriber }
                : null
            }
            onComplete={(data) => {
              setGuarantorData(data);
              setStep("reasonForVisit");
            }}
          />
        ) : null}

        {step === "reasonForVisit" ? (
          <ReasonForVisitModule
            patientId={DEMO_PATIENT_ID}
            onComplete={(data) => {
              setReasonForVisitData(data);
              // Phase 4 — first eligibility check, the moment both inputs
              // it needs (DOB, reason for visit) exist. Same
              // evaluateCondition() every field/module-level condition in
              // this app uses, at a third tier: which screener applies.
              goToNextScreener({ reasonForVisit: data.reasons }, null);
            }}
          />
        ) : null}

        {step === "asq3" ? (
          <Asq3Module patientId={DEMO_PATIENT_ID} onComplete={() => goToNextScreener({}, "asq-3")} />
        ) : null}

        {step === "mchatRf" ? (
          <MchatRfModule
            patientId={DEMO_PATIENT_ID}
            onComplete={(result) => {
              // 0-2 (low): done, next screener (or Medications). 3-7
              // (medium): Follow-Up module, scoped to exactly the at-risk
              // items — "mchat-rf" isn't marked complete until that
              // finishes too. 8+ (high): refer — also proceeds (this pass
              // doesn't stop intake), but the flag is saved for Phase 5's
              // provider summary to surface.
              if (result.band === "medium") {
                setMchatAtRiskKeys(result.atRiskKeys);
                setStep("mchatRfFollowup");
              } else {
                goToNextScreener({}, "mchat-rf");
              }
            }}
          />
        ) : null}

        {step === "mchatRfFollowup" ? (
          <MchatRfFollowupModule
            patientId={DEMO_PATIENT_ID}
            atRiskKeys={mchatAtRiskKeys}
            onComplete={() => goToNextScreener({}, "mchat-rf")}
          />
        ) : null}

        {step === "phq2" ? (
          <Phq2Module
            patientId={DEMO_PATIENT_ID}
            onComplete={(score) => {
              // Writes phq2Score into the shared answer bag *before*
              // re-checking eligibility — this is what lets PHQ-9's
              // `requiresPriorAnswer: {gte: 3}` see it.
              goToNextScreener({ phq2Score: score }, "phq-2");
            }}
          />
        ) : null}

        {step === "phq9" ? (
          <Phq9Module patientId={DEMO_PATIENT_ID} onComplete={() => goToNextScreener({}, "phq-9")} />
        ) : null}

        {step === "medications" ? (
          <MedicationsModule
            patientId={DEMO_PATIENT_ID}
            onComplete={(meds) => {
              setMedicationsData(meds);
              setStep("allergies");
            }}
          />
        ) : null}

        {step === "allergies" ? (
          <AllergiesModule
            patientId={DEMO_PATIENT_ID}
            onComplete={(allergies) => {
              setAllergiesData(allergies);
              setStep("review");
            }}
          />
        ) : null}

        {step === "review" ? (
          <ReviewModule
            patientId={DEMO_PATIENT_ID}
            demographics={demographicsData}
            demographicsMatched={!!matchedPatient || usedWelcomeBackFastPath}
            sogi={sogiData}
            guardian={guardianData}
            guardianMatched={!!matchedPatient?.guardian || usedWelcomeBackFastPath}
            insurance={insuranceData}
            guarantor={guarantorData}
            reasonForVisit={reasonForVisitData}
            medications={medicationsData}
            allergies={allergiesData}
            onEdit={setStep}
            onSubmit={() => {
              // Everything required to reach Review is guaranteed
              // non-null by that point (each module gates Continue on
              // being complete) — the snapshot only exists to power next
              // time's Welcome Back, not to re-derive anything this run.
              if (demographicsData && guardianData && insuranceData && guarantorData) {
                saveIntakeSnapshot({
                  savedAt: new Date().toISOString(),
                  patientId: DEMO_PATIENT_ID,
                  demographics: demographicsData,
                  sogi: sogiData,
                  guardian: guardianData,
                  insurance: insuranceData,
                  guarantor: guarantorData,
                });
              }
              setStep("done");
            }}
          />
        ) : null}

        {step === "done" ? (
          <div className="rounded-xl border border-[var(--color-line)] bg-white px-5 py-6 text-center">
            <div className="mb-2 text-2xl">✓</div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">Submitted</div>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Thanks — your check-in is complete. A staff member will call you back shortly.
            </p>
          </div>
        ) : null}
      </div>
    </PhoneFrame>
  );
}
