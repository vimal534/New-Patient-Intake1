"use client";

import { useEffect, useRef, useState } from "react";
import { Ctx } from "./ctx";
import { scrollToTop } from "./components/motion";
import { FLOW_NEW, FLOW_NEW_ADOLESCENT, FLOW_NEW_INFANT, FLOW_RET, FLOW_RETURNING_SICK, FLOW_RETURNING_SPORTS, FLOW_RETURNING_WELL, HEADER_TITLE, PCT, REVIEW_TITLE, initialState } from "./constants";
import { DemoScenarioId, FlowKey, IntakeState, Patch } from "./types";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { OtpScreen } from "./components/screens/OtpScreen";
import { VerifyIntroScreen } from "./components/screens/VerifyIntroScreen";
import { IdentityFallbackScreen } from "./components/screens/IdentityFallbackScreen";
import { PhoneFrame } from "./components/PhoneFrame";
import { WelcomeScreen } from "./components/screens/WelcomeScreen";
import { PersonalScreen } from "./components/screens/PersonalScreen";
import { EmergencyScreen } from "./components/screens/EmergencyScreen";
import { VisitScreen } from "./components/screens/VisitScreen";
import { CoverageScreen } from "./components/screens/CoverageScreen";
import { OcrScreen } from "./components/screens/OcrScreen";
import { HealthScreen } from "./components/screens/HealthScreen";
import { ListReviewScreen } from "./components/screens/ListReviewScreen";
import { PaymentScreen } from "./components/screens/PaymentScreen";
import { ConsentScreen } from "./components/screens/ConsentScreen";
import { SuccessScreen } from "./components/screens/SuccessScreen";
import { PatientConfirmScreen } from "./components/screens/PatientConfirmScreen";
import { GuardianIdScanScreen } from "./components/screens/GuardianIdScanScreen";
import { GuardianIdReviewScreen } from "./components/screens/GuardianIdReviewScreen";
import { PatientContactScreen } from "./components/screens/PatientContactScreen";
import { PatientDemographicsScreen } from "./components/screens/PatientDemographicsScreen";
import { PatientEmergencyScreen } from "./components/screens/PatientEmergencyScreen";
import { PatientReviewScreen } from "./components/screens/PatientReviewScreen";
import { SurgeriesScreen } from "./components/screens/SurgeriesScreen";
import { FamilyHistoryScreen } from "./components/screens/FamilyHistoryScreen";
import { PediQuestionsScreen } from "./components/screens/PediQuestionsScreen";
import { BirthHistoryFlowScreen, BIRTH_SECTION_COUNT } from "./components/screens/BirthHistoryFlow";
import { ConsentDiscloseScreen } from "./components/screens/ConsentDiscloseScreen";
import { SocialHistoryScreen } from "./components/screens/SocialHistoryScreen";
import { SubstanceUseScreen } from "./components/screens/SubstanceUseScreen";
import { GynHistoryScreen } from "./components/screens/GynHistoryScreen";
import { ConfirmInfoScreen } from "./components/screens/ConfirmInfoScreen";
import { ConfirmAdditionalScreen } from "./components/screens/ConfirmAdditionalScreen";
import { ConsentOnFileScreen } from "./components/screens/ConsentOnFileScreen";
import { InsuranceManualScreen } from "./components/screens/InsuranceManualScreen";
import { PpeFormScreen } from "./components/screens/PpeFormScreen";
import { PaymentMethodsSheet } from "./components/sheets/PaymentMethodsSheet";
import { AddCardSheet } from "./components/sheets/AddCardSheet";
import { RemoveConfirmSheet } from "./components/sheets/RemoveConfirmSheet";
import { TextSheet } from "./components/sheets/TextSheet";
import { DemoButton, DemoSheet } from "./components/sheets/DemoSheet";
import { Toast } from "./components/Toast";

const CONSENT_TEXT =
  "I authorize the clinicians of Main St. Clinic to provide the medical care I request. Assignment of benefits: I authorize payment of insurance benefits directly to the practice and accept responsibility for amounts not covered by my plan. Privacy: I acknowledge receipt of the notice of privacy practices describing how my health information may be used and disclosed for treatment, payment and health-care operations.";
const PRIVACY_TEXT =
  "Everything you share during check-in goes only to your care team at Main St. Clinic and is stored encrypted. We never sell your health information, and you can ask the practice for a copy or correction at any time.";
const FINANCIAL_TEXT =
  "You are responsible for any copay, coinsurance, deductible, or balance not covered by your insurance plan. Payment is expected at the time of service unless other arrangements have been made with the practice. A fee may apply for missed appointments not cancelled at least 24 hours in advance.";

// Given a state's scenario/coverageChanging/manualEntry, which flow array
// applies — mirrors the prototype's `flow()` method. Pure function (no
// `this`) so it can be called both from render and from inside a
// functional setState updater without a stale closure.
function flowFor(s: Pick<IntakeState, "scenario" | "demoScenarioId" | "coverageChanging" | "manualEntry">): FlowKey[] {
  if (s.demoScenarioId === "new-infant") return FLOW_NEW_INFANT;
  if (s.demoScenarioId === "new-adolescent") return FLOW_NEW_ADOLESCENT;
  if (s.demoScenarioId === "returning-well") return FLOW_RETURNING_WELL;
  if (s.demoScenarioId === "returning-sick") return FLOW_RETURNING_SICK;
  if (s.demoScenarioId === "returning-sports") return FLOW_RETURNING_SPORTS;
  if (s.scenario !== "returning") return FLOW_NEW;
  if (!s.coverageChanging && !s.manualEntry) return FLOW_RET;
  const f = [...FLOW_RET];
  f.splice(f.indexOf("coverage") + 1, 0, "ocr");
  return f;
}

export default function IntakeV2Page() {
  const [state, setState] = useState<IntakeState>(() => initialState("returning"));

  const update = (patch: Patch) =>
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));

  // Cheap pure computation — no need to memoize; recomputing on every
  // render also sidesteps having to keep a dependency array in sync.
  const flow = flowFor(state);
  const key = flow[state.idx];
  const isRet = state.scenario === "returning";

  const startEligibility = () => {
    update({ eligibility: "pending" });
    window.setTimeout(() => update({ eligibility: "done" }), 3200);
  };

  const next = () => {
    if (key === "coverage" && state.eligibility === "idle") startEligibility();
    setState((s) => {
      const f = flowFor(s);
      return { ...s, idx: Math.min(s.idx + 1, f.length - 1) };
    });
  };
  const back = () =>
    setState((s) => {
      // A Health History category's focused page isn't its own flow
      // step — it's an in-place view swap within "health" (see
      // HealthScreen.tsx's CategoryFocusPage). Back from there means
      // "return to the summary," not "leave the health step."
      if (s.hhEditing) return { ...s, hhEditing: null };
      // Reviewing a section from the final summary (SuccessScreen's
      // checklist) means "back" should return there too, not step one
      // position earlier in flow order — that earlier screen may not
      // even be where the patient came from. (The scroll-position
      // restore this implies happens separately, in the effect below —
      // it reacts to `reviewingFromSuccess` flipping off while landing
      // on "success", rather than this function reaching into a ref.)
      if (s.reviewingFromSuccess) {
        const f = flowFor(s);
        const i = f.indexOf("success");
        return { ...s, reviewingFromSuccess: false, idx: i >= 0 ? i : s.idx };
      }
      // Same idea, one level down — reviewing a step from
      // PatientReviewScreen's own "Edit" links returns there, not to
      // whatever sits one position earlier in the wizard.
      if (s.reviewingFromPatientReview) {
        const f = flowFor(s);
        const i = f.indexOf("patientReview");
        return { ...s, reviewingFromPatientReview: false, idx: i >= 0 ? i : s.idx };
      }
      return { ...s, idx: Math.max(s.idx - 1, 0) };
    });
  const go = (target: FlowKey) =>
    setState((s) => {
      const f = flowFor(s);
      const i = f.indexOf(target);
      return i >= 0 ? { ...s, idx: i } : s;
    });
  const reset = (demoScenarioId: DemoScenarioId) =>
    setState(initialState(demoScenarioId.startsWith("new") ? "new" : "returning", demoScenarioId));
  const showToast = (message: string) => setState((s) => ({ ...s, toastMessage: message, toastId: s.toastId + 1 }));

  // Jumping in from SuccessScreen's checklist — lands on the target
  // step and flags review mode (swaps that step's footer/header, see
  // footerFor and the Header title below; the summary's scroll offset
  // is captured separately, by an effect watching "success" itself
  // rather than this function reaching into a ref at click-time), and
  // for sections that otherwise sit behind their own read-only "on
  // file" view before any fields are editable, opens straight into
  // that editable state so there's no extra "Update" tap needed first.
  const reviewSection = (target: FlowKey) =>
    setState((s) => {
      const f = flowFor(s);
      const i = f.indexOf(target);
      if (i < 0) return s;
      return {
        ...s,
        reviewingFromSuccess: true,
        idx: i,
        ...(target === "confirmInfo" ? { confirmInfoEditing: true } : {}),
        ...(target === "confirmAdditional" ? { confirmAdditionalEditing: true } : {}),
        ...(target === "consentOnFile" ? { consentOnFileEditing: true } : {}),
        ...(target === "personal" && s.scenario === "returning" ? { editingPersonal: true } : {}),
        ...(target === "coverage" && s.scenario === "returning" ? { coverageChanging: true } : {}),
        ...(target === "consent" && s.scenario === "returning" ? { policiesEditing: true } : {}),
      };
    });
  const returnToSummary = () =>
    setState((s) => {
      const f = flowFor(s);
      const i = f.indexOf("success");
      return { ...s, reviewingFromSuccess: false, idx: i >= 0 ? i : s.idx };
    });

  // Same pair as reviewSection/returnToSummary, scoped to
  // PatientReviewScreen's own "Edit" links instead of the final
  // summary's checklist — none of this wizard's steps sit behind a
  // read-only "on file" view first, so unlike reviewSection there's no
  // per-target editing flag to force open here.
  const reviewPatientSection = (target: FlowKey) =>
    setState((s) => {
      const f = flowFor(s);
      const i = f.indexOf(target);
      return i >= 0 ? { ...s, reviewingFromPatientReview: true, idx: i } : s;
    });
  const returnToPatientReview = () =>
    setState((s) => {
      const f = flowFor(s);
      const i = f.indexOf("patientReview");
      return { ...s, reviewingFromPatientReview: false, idx: i >= 0 ? i : s.idx };
    });

  // Six-digit auto-fill on the verification screen — README: "The code
  // auto-fills one digit every 260ms." One long-lived interval (mirrors
  // the prototype's componentDidMount timer) that only writes while the
  // otp screen is actually showing and incomplete.
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((s) => {
        const currentKey = flowFor(s)[s.idx];
        if (currentKey === "otp" && s.otp.length < 6) {
          return { ...s, otp: "017722".slice(0, s.otp.length + 1) };
        }
        return s;
      });
    }, 260);
    return () => window.clearInterval(id);
  }, []);

  const ctx: Ctx = {
    state,
    update,
    next,
    back,
    go,
    reviewSection,
    returnToSummary,
    reviewPatientSection,
    returnToPatientReview,
    isRet,
    flow,
    key,
    startEligibility,
    reset,
    showToast,
  };

  // PCT is a flat, hand-tuned map keyed by FlowKey — fine for a step
  // that only ever appears in roughly one relative position across the
  // scenarios that use it, but "payment" now sits right after Insurance
  // in four differently-shaped flows (early for the two new-patient
  // scenarios, mid-flow for returning well/sick, early-mid for sports),
  // so one static number can't fit all of them. Interpolate it instead,
  // from whatever sits immediately before/after it in THIS flow —
  // falling back to the static table (its old near-the-end position)
  // for the legacy FLOW_RET/FLOW_NEW fallbacks, which are unreachable
  // from the demo picker but keep their own payment placement.
  const paymentPercent = (): number => {
    const prev = PCT[flow[state.idx - 1]];
    const next = PCT[flow[state.idx + 1]];
    if (prev != null && next != null) return Math.round((prev + next) / 2);
    if (prev != null) return prev;
    return PCT.payment ?? 0;
  };
  const percent = key === "payment" ? paymentPercent() : (PCT[key] ?? 0);
  const showHeader = !state.identityFallbackOpen && !["verifyIntro", "otp", "welcome", "success"].includes(key);

  // Moving to a new section/screen (forward via Continue, or back)
  // always lands the patient at its top — title and first question —
  // rather than wherever the previous screen happened to be scrolled
  // to. Keyed on `key` alone (the flow step), so it never fires for
  // in-place progress within one screen (a Health History category
  // opening, Birth History revealing its next section) — only an
  // actual step change.
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  // The one exception to "always land at the top": returning to the
  // final summary from a section reviewSection sent the patient into —
  // that should put them back wherever they were reading the checklist,
  // not reset to the very top of the whole screen. successScrollRef
  // tracks the summary's own scroll offset continuously (a plain scroll
  // listener, only while "success" is the active screen) rather than
  // reviewSection reaching into it at click-time, since reviewSection
  // is handed to screens through `ctx` and any ctx-bundled function
  // that touches a ref trips the "no ref access during render" rule the
  // moment that bundle is passed into footerFor(ctx) below.
  const successScrollRef = useRef(0);
  useEffect(() => {
    if (key !== "success" || !scrollAreaRef.current) return;
    const el = scrollAreaRef.current;
    const onScroll = () => {
      successScrollRef.current = el.scrollTop;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [key]);

  // Same reasoning for "did we just come back from reviewing a
  // section": tracked here, from state (`reviewingFromSuccess` flipping
  // off while landing back on "success"), rather than a ref set inside
  // back()/returnToSummary() — those are ctx-bundled too.
  const wasReviewingRef = useRef(false);
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const wasReviewing = wasReviewingRef.current;
    wasReviewingRef.current = state.reviewingFromSuccess;
    if (key === "success" && wasReviewing && !state.reviewingFromSuccess) {
      scrollAreaRef.current.scrollTop = successScrollRef.current;
      return;
    }
    scrollToTop(scrollAreaRef.current);
  }, [key, state.reviewingFromSuccess]);

  // Footer configuration per screen — ported 1:1 from the prototype's
  // renderVals() footer block.
  const footer = footerFor(ctx);

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col">
        {showHeader ? (
          <Header
            percent={percent}
            timeLeft={isRet ? "About 2 min left" : "About 4–5 min left"}
            onBack={back}
            title={
              state.reviewingFromSuccess
                ? REVIEW_TITLE[key] ?? `Review ${(HEADER_TITLE[key] ?? "section").toLowerCase()}`
                : state.reviewingFromPatientReview
                  ? `Review ${(HEADER_TITLE[key] ?? "section").toLowerCase()}`
                  : HEADER_TITLE[key]
            }
          />
        ) : null}

        <div ref={scrollAreaRef} className="flex-1 overflow-auto">
          {state.identityFallbackOpen ? <IdentityFallbackScreen ctx={ctx} /> : null}
          {!state.identityFallbackOpen && key === "verifyIntro" ? <VerifyIntroScreen ctx={ctx} /> : null}
          {key === "otp" ? <OtpScreen ctx={ctx} /> : null}
          {key === "welcome" ? <WelcomeScreen ctx={ctx} /> : null}
          {key === "personal" ? <PersonalScreen ctx={ctx} /> : null}
          {key === "emergency" ? <EmergencyScreen ctx={ctx} /> : null}
          {key === "patientConfirm" ? <PatientConfirmScreen ctx={ctx} /> : null}
          {key === "guardianIdScan" ? <GuardianIdScanScreen ctx={ctx} /> : null}
          {key === "guardianIdReview" ? <GuardianIdReviewScreen ctx={ctx} /> : null}
          {key === "patientContact" ? <PatientContactScreen ctx={ctx} /> : null}
          {key === "patientDemographics" ? <PatientDemographicsScreen ctx={ctx} /> : null}
          {key === "patientEmergency" ? <PatientEmergencyScreen ctx={ctx} /> : null}
          {key === "patientReview" ? <PatientReviewScreen ctx={ctx} /> : null}
          {key === "visit" ? <VisitScreen ctx={ctx} /> : null}
          {key === "coverage" ? <CoverageScreen ctx={ctx} /> : null}
          {key === "ocr" ? <OcrScreen ctx={ctx} /> : null}
          {key === "health" ? <HealthScreen ctx={ctx} /> : null}
          {key === "healthSurgeries" ? <SurgeriesScreen ctx={ctx} /> : null}
          {key === "healthFamily" ? <FamilyHistoryScreen ctx={ctx} /> : null}
          {key === "pediQuestions" ? <PediQuestionsScreen ctx={ctx} /> : null}
          {key === "birthHistory" ? <BirthHistoryFlowScreen ctx={ctx} /> : null}
          {key === "socialHistory" ? <SocialHistoryScreen ctx={ctx} /> : null}
          {key === "substanceUse" ? <SubstanceUseScreen ctx={ctx} /> : null}
          {key === "gynHistory" ? <GynHistoryScreen ctx={ctx} /> : null}
          {key === "confirmInfo" ? <ConfirmInfoScreen ctx={ctx} /> : null}
          {key === "confirmAdditional" ? <ConfirmAdditionalScreen ctx={ctx} /> : null}
          {key === "consentOnFile" ? <ConsentOnFileScreen ctx={ctx} /> : null}
          {key === "insuranceManual" ? <InsuranceManualScreen ctx={ctx} /> : null}
          {key === "ppeForm" ? <PpeFormScreen ctx={ctx} /> : null}
          {key === "medications" ? <ListReviewScreen ctx={ctx} kind="medications" /> : null}
          {key === "allergies" ? <ListReviewScreen ctx={ctx} kind="allergies" /> : null}
          {key === "consentDisclose" ? <ConsentDiscloseScreen ctx={ctx} /> : null}
          {key === "payment" ? <PaymentScreen ctx={ctx} /> : null}
          {key === "consent" ? <ConsentScreen ctx={ctx} /> : null}
          {key === "success" ? <SuccessScreen ctx={ctx} /> : null}
        </div>

        <Footer
          primaryLabel={footer.primaryLabel}
          onPrimary={footer.primary}
          primaryDisabled={footer.primaryDisabled}
          secondaryLabel={footer.secondaryLabel}
          onSecondary={footer.secondary}
          tertiaryLabel={footer.tertiaryLabel}
          onTertiary={footer.tertiary}
        />
      </div>

      <PaymentMethodsSheet ctx={ctx} />
      <AddCardSheet ctx={ctx} />
      <RemoveConfirmSheet ctx={ctx} />
      <TextSheet open={state.consentFullOpen} title="Consent to treatment" body={CONSENT_TEXT} onClose={() => update({ consentFullOpen: false })} zIndex={74} />
      <TextSheet open={state.privacyOpen} title="How your information is used" body={PRIVACY_TEXT} onClose={() => update({ privacyOpen: false })} zIndex={74} />
      <TextSheet open={state.financialOpen} title="Financial policy" body={FINANCIAL_TEXT} onClose={() => update({ financialOpen: false })} zIndex={74} />
      {!state.identityFallbackOpen && key === "verifyIntro" ? <DemoButton onOpen={() => update({ demoOpen: true })} /> : null}
      <DemoSheet ctx={ctx} />
      {state.toastMessage ? (
        <Toast key={state.toastId} message={state.toastMessage} onDone={() => update({ toastMessage: null })} />
      ) : null}
    </PhoneFrame>
  );
}

type FooterConfig = {
  primaryLabel: string | null;
  primary?: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string | null;
  secondary?: () => void;
  tertiaryLabel?: string | null;
  tertiary?: () => void;
};

// Footer button config per screen — ported 1:1 from the prototype
// script's renderVals() footer block (see that file's `if (key === ...)`
// chain) so behavior stays checkable line-by-line against the source.
function footerFor(ctx: Ctx): FooterConfig {
  const { state, isRet, update, next, go } = ctx;
  const key = ctx.key;

  // Reviewing a section from the final summary replaces whatever that
  // section's normal footer would be — no "Continue" onward through the
  // rest of the flow, no per-screen "Update"/"Everything looks correct"
  // toggle (reviewSection already opened it straight into its editable
  // state), just the one action the spec calls for: save whatever's
  // changed (or isn't) and go back to the summary. Unconditional across
  // every reviewable key, since `reviewingFromSuccess` is only ever true
  // while inside one of those sections in the first place.
  if (state.reviewingFromSuccess) {
    return { primaryLabel: "Save and return", primary: ctx.returnToSummary };
  }
  // Same override, one level down — reviewing a step from
  // PatientReviewScreen's own "Edit" links.
  if (state.reviewingFromPatientReview) {
    return { primaryLabel: "Save and return to review", primary: ctx.returnToPatientReview };
  }

  if (key === "otp") {
    return { primaryLabel: "Continue", primaryDisabled: state.otp.length < 6, primary: next };
  }
  if (key === "verifyIntro" || key === "welcome" || key === "success" || key === "guardianIdScan") {
    // guardianIdScan has no footer of its own — its "Scan…"/"Enter
    // details manually" actions live in the screen body (matching
    // CoverageScreen's own scan-capture screen, which has no footer
    // either), and the camera-capture state auto-advances on its own.
    return { primaryLabel: null };
  }
  if (key === "patientConfirm") {
    return { primaryLabel: "Looks right", primaryDisabled: state.personal.dob.length !== 10 || !state.sexAssignedAtBirth, primary: next };
  }
  if (key === "guardianIdReview") {
    const g = state.guardian1;
    return { primaryLabel: "Looks right", primaryDisabled: !g.name.trim() || (g.dob ?? "").length !== 10, primary: next };
  }
  if (key === "patientContact") {
    return { primaryLabel: "Looks right", primaryDisabled: !state.personal.address.trim(), primary: next };
  }
  if (key === "patientDemographics") {
    // Fully deferrable, same shape as SocialHistoryScreen's own
    // "Skip for today" — nothing here blocks moving on.
    return { primaryLabel: "Continue", primary: next, secondaryLabel: "I'll complete this later", secondary: next };
  }
  if (key === "patientEmergency") {
    return { primaryLabel: "Continue", primary: next, secondaryLabel: "I'll add this later", secondary: next };
  }
  if (key === "patientReview") {
    return { primaryLabel: "Continue", primary: next };
  }
  if (key === "healthSurgeries") {
    return { primaryLabel: "Continue", primaryDisabled: !(state.surgeries.length || state.surgeriesNone), primary: next };
  }
  if (key === "healthFamily") {
    return { primaryLabel: "Continue", primaryDisabled: !(state.familyHistory.length || state.familyNone), primary: next };
  }
  if (key === "pediQuestions") {
    const ready = state.pediAccompanying.trim() && state.pediHomeLanguage.trim() && state.pediPoolFenced && state.pediGunsSafe;
    return { primaryLabel: "Continue", primaryDisabled: !ready, primary: next };
  }
  if (key === "birthHistory") {
    // Sections reveal themselves progressively as each one's answered
    // (no Continue between them) — the footer only appears once every
    // section is done.
    if (state.birthSection < BIRTH_SECTION_COUNT) {
      return { primaryLabel: null };
    }
    return { primaryLabel: "Continue", primary: next };
  }
  if (key === "consentDisclose") {
    return { primaryLabel: "Continue", primaryDisabled: state.consentDiscloseYes === null, primary: next };
  }
  if (key === "socialHistory") {
    // Entirely deferrable — spec Part 3, item 10.
    return { primaryLabel: "Continue", primary: next, secondaryLabel: "Skip for today — ask at next well visit", secondary: next };
  }
  if (key === "substanceUse") {
    const su = state.substance;
    const ready = su.tobaccoUse && su.otherTobaccoProducts && su.tobaccoScreeningDate.length === 10 && su.alcoholLevel && su.illicitDrugUse;
    return { primaryLabel: "Continue", primaryDisabled: !ready, primary: next };
  }
  if (key === "gynHistory") {
    const g = state.gyn;
    const ready =
      g.hasStartedPeriods === "No" ||
      (g.hasStartedPeriods === "Yes" &&
        g.ageAtFirstPeriod.trim() &&
        g.regularCycle &&
        g.periodsOverSevenDays &&
        g.severeCramping &&
        g.lastPeriodDate.length === 10);
    return { primaryLabel: "Continue", primaryDisabled: !ready, primary: next };
  }
  if (key === "confirmInfo") {
    return {
      primaryLabel: state.confirmInfoEditing ? "Save and continue" : "Everything looks correct",
      primary: state.confirmInfoEditing ? () => { update({ confirmInfoEditing: false }); next(); } : next,
      secondaryLabel: state.confirmInfoEditing ? "Done editing" : "Update",
      secondary: () => update({ confirmInfoEditing: !state.confirmInfoEditing }),
    };
  }
  if (key === "confirmAdditional") {
    return {
      primaryLabel: state.confirmAdditionalEditing ? "Save and continue" : "Everything looks correct",
      primary: state.confirmAdditionalEditing ? () => { update({ confirmAdditionalEditing: false }); next(); } : next,
      secondaryLabel: state.confirmAdditionalEditing ? "Done editing" : "Update",
      secondary: () => update({ confirmAdditionalEditing: !state.confirmAdditionalEditing }),
    };
  }
  if (key === "consentOnFile") {
    if (state.consentOnFileEditing) {
      return {
        primaryLabel: "Sign and continue",
        primary: () => {
          if (state.agreed && state.signed) { update({ consentOnFileEditing: false }); next(); }
          else update({ agreed: true, signed: true });
        },
      };
    }
    return {
      primaryLabel: "Everything looks correct",
      primary: next,
      secondaryLabel: "Update",
      secondary: () => update({ consentOnFileEditing: true }),
    };
  }
  if (key === "insuranceManual") {
    const ready =
      state.carrier.trim() &&
      state.memberId.trim() &&
      state.groupValue.trim() &&
      state.policyholderName.trim() &&
      state.policyholderDob.length === 10 &&
      state.policyholderAddress.trim();
    return { primaryLabel: "Save and continue", primaryDisabled: !ready, primary: next };
  }
  if (key === "ppeForm") {
    return { primaryLabel: "Sign and continue", primaryDisabled: !state.ppeSigned, primary: next };
  }
  if (key === "personal") {
    if (isRet) {
      return {
        primaryLabel: "Everything looks correct",
        primary: next,
        secondaryLabel: state.editingPersonal ? "Done editing" : "Edit information",
        secondary: () => update({ editingPersonal: !state.editingPersonal }),
      };
    }
    return { primaryLabel: "Save and continue", primary: next };
  }
  if (key === "emergency") {
    if (isRet && !state.emergencyUpdating) {
      return {
        primaryLabel: "Yes, looks correct",
        primary: next,
        secondaryLabel: "Update",
        secondary: () => update({ emergencyUpdating: true }),
      };
    }
    return { primaryLabel: "Save contact", primary: next };
  }
  if (key === "visit") {
    const needsDetail = state.visitAnswer === "Something else" && !state.visitOtherText.trim();
    return { primaryLabel: "Continue", primaryDisabled: needsDetail, primary: next };
  }
  if (key === "coverage") {
    if (isRet && !state.coverageChanging) {
      return {
        primaryLabel: "Yes, continue",
        primary: next,
        secondaryLabel: "Update insurance",
        secondary: () => update({ coverageChanging: true }),
      };
    }
    return {
      primaryLabel: "Continue",
      primaryDisabled: true,
      primary: () => {},
      secondaryLabel: "Enter details manually",
      secondary: () => {
        update({ manualEntry: true });
        go("ocr");
      },
      tertiaryLabel: "I'll do this later",
      tertiary: () => {
        // Skip both the scan step and its OCR confirm — land on
        // whatever comes right after "ocr" in this flow.
        ctx.startEligibility();
        update({ coverageChanging: false, manualEntry: false });
        const after = ctx.flow[ctx.flow.indexOf("ocr") + 1];
        if (after) go(after);
      },
    };
  }
  if (key === "ocr") {
    // "Update" flips Carrier/Member/Member ID/Group into editable
    // inputs all at once (OcrScreen's `ocrFieldsEditing`) instead of
    // skipping the step — "Done editing" flips them back to the
    // read-only card view.
    const needsPolicyholder = ["new-infant", "new-adolescent"].includes(state.demoScenarioId);
    const policyholderMissing =
      needsPolicyholder &&
      (state.policyholderIsGuardian === null ||
        (state.policyholderIsGuardian === false &&
          (!state.policyholderName.trim() || state.policyholderDob.length < 10 || !state.policyholderRelationship.trim())));
    return {
      primaryLabel: state.manualEntry ? "Save and continue" : "Continue",
      primaryDisabled: policyholderMissing,
      primary: next,
      tertiaryLabel: state.manualEntry ? null : state.ocrFieldsEditing ? "Done editing" : "Update",
      tertiary: () => update({ ocrFieldsEditing: !state.ocrFieldsEditing }),
    };
  }
  if (key === "health") {
    if (isRet) {
      if (state.hhEditing) {
        // Tapping a category card goes straight into its edit UI — no
        // separate "here's what's on file, has anything changed?" gate
        // in between. One "Save changes" returns to the summary with
        // that category marked confirmed today.
        const category = state.hhEditing;
        return {
          primaryLabel: "Save changes",
          primary: () => update((s) => ({ hhConfirmed: { ...s.hhConfirmed, [category]: true }, hhEditing: null })),
        };
      }
      // Health History summary — each card opens its own focused page;
      // this step's only footer action is moving on once everything's
      // been glanced at (or left untouched, if it's recent enough).
      return { primaryLabel: "Continue", primary: next };
    }
    // New patient — ConditionAddSection adds straight to onFileConds
    // (no separate select→confirm buffer), so Continue just checks
    // there's something there (or "None of these apply").
    return {
      primaryLabel: "Continue",
      primaryDisabled: !(state.onFileConds.length || state.noneConds),
      primary: next,
    };
  }
  if (key === "medications" || key === "allergies") {
    const editing = key === "medications" ? state.medsEditing : state.allergiesEditing;
    const list = key === "medications" ? state.meds : state.allergies;
    const none = key === "medications" ? state.medsNone : state.allergiesNone;
    const editingKey = key === "medications" ? "medsEditing" : "allergiesEditing";
    if (!editing) {
      return {
        primaryLabel: "No changes",
        primary: next,
        secondaryLabel: key === "medications" ? "Update medications" : "Update allergies",
        secondary: () => update({ [editingKey]: true } as Patch),
      };
    }
    return {
      primaryLabel: list.length ? "Save and continue" : key === "medications" ? "I take no medications" : "I have no known allergies",
      primaryDisabled: !(list.length || none),
      primary: () => {
        update({ [editingKey]: !isRet } as Patch);
        next();
      },
    };
  }
  if (key === "payment") {
    const chosen = state.selectedCardId === "applepay" || state.cards.some((c) => c.id === state.selectedCardId && !c.expired);
    if (!chosen) {
      return {
        primaryLabel: "Select a payment method",
        primaryDisabled: true,
        primary: () => {},
        secondaryLabel: "Pay at the visit",
        secondary: next,
      };
    }
    return {
      primaryLabel: "Pay $40.00",
      primary: () => { update({ paid: true }); ctx.showToast("Payment successful"); next(); },
      secondaryLabel: "Pay at the visit",
      secondary: next,
    };
  }
  if (key === "consent") {
    // Returning patients see these as already-signed on file (spec
    // Parts 4-5, item 7) — "Update" flips into the same agree/sign
    // flow a new patient gets; done editing returns to the on-file view.
    if (isRet && !state.policiesEditing) {
      return {
        primaryLabel: "Everything looks correct",
        primary: next,
        secondaryLabel: "Update",
        secondary: () => update({ policiesEditing: true }),
      };
    }
    return {
      primaryLabel: "Sign and continue",
      primary: () => {
        if (state.agreed && state.signed) {
          if (isRet) update({ policiesEditing: false });
          next();
        } else update({ agreed: true, signed: true });
      },
    };
  }
  return { primaryLabel: "Continue", primary: next };
}
