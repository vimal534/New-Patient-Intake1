"use client";

import { useEffect, useState } from "react";
import { Ctx } from "./ctx";
import { FLOW_NEW, FLOW_RET, PCT, initialState } from "./constants";
import { FlowKey, IntakeState, Patch, Scenario } from "./types";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { OtpScreen } from "./components/screens/OtpScreen";
import { WelcomeScreen } from "./components/screens/WelcomeScreen";
import { PersonalScreen } from "./components/screens/PersonalScreen";
import { EmergencyScreen } from "./components/screens/EmergencyScreen";
import { VisitScreen } from "./components/screens/VisitScreen";
import { CoverageScreen } from "./components/screens/CoverageScreen";
import { OcrScreen } from "./components/screens/OcrScreen";
import { HealthScreen } from "./components/screens/HealthScreen";
import { ListReviewScreen } from "./components/screens/ListReviewScreen";
import { ScreenerScreen } from "./components/screens/ScreenerScreen";
import { PaymentScreen } from "./components/screens/PaymentScreen";
import { ConsentScreen } from "./components/screens/ConsentScreen";
import { ReviewScreen } from "./components/screens/ReviewScreen";
import { SuccessScreen } from "./components/screens/SuccessScreen";
import { PaymentMethodsSheet } from "./components/sheets/PaymentMethodsSheet";
import { AddCardSheet } from "./components/sheets/AddCardSheet";
import { AddItemSheet } from "./components/sheets/AddItemSheet";
import { RemoveConfirmSheet } from "./components/sheets/RemoveConfirmSheet";
import { TextSheet } from "./components/sheets/TextSheet";
import { DemoButton, DemoSheet } from "./components/sheets/DemoSheet";
import { Toast } from "./components/Toast";

const CONSENT_TEXT =
  "I authorize the clinicians of Main St. Clinic to provide the medical care I request. Assignment of benefits: I authorize payment of insurance benefits directly to the practice and accept responsibility for amounts not covered by my plan. Privacy: I acknowledge receipt of the notice of privacy practices describing how my health information may be used and disclosed for treatment, payment and health-care operations.";
const PRIVACY_TEXT =
  "Everything you share during check-in goes only to your care team at Main St. Clinic and is stored encrypted. We never sell your health information, and you can ask the practice for a copy or correction at any time.";

// Given a state's scenario/coverageChanging/manualEntry, which flow array
// applies — mirrors the prototype's `flow()` method. Pure function (no
// `this`) so it can be called both from render and from inside a
// functional setState updater without a stale closure.
function flowFor(s: Pick<IntakeState, "scenario" | "coverageChanging" | "manualEntry">): FlowKey[] {
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
      return { ...s, idx: Math.max(s.idx - 1, 0) };
    });
  const go = (target: FlowKey) =>
    setState((s) => {
      const f = flowFor(s);
      const i = f.indexOf(target);
      return i >= 0 ? { ...s, idx: i } : s;
    });
  const reset = (scenario: Scenario) => setState(initialState(scenario));
  const showToast = (message: string) => setState((s) => ({ ...s, toastMessage: message, toastId: s.toastId + 1 }));

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

  const ctx: Ctx = { state, update, next, back, go, isRet, flow, key, startEligibility, reset, showToast };

  const percent = PCT[key] ?? 0;
  const showHeader = !["otp", "welcome", "success"].includes(key);

  // Footer configuration per screen — ported 1:1 from the prototype's
  // renderVals() footer block.
  const footer = footerFor(ctx);

  return (
    <div className="iv2-root relative mx-auto min-h-screen max-w-[430px] overflow-hidden bg-[#FBFBFC] font-[family-name:var(--font-inter)]">
      <div className="flex min-h-screen flex-col">
        {showHeader ? <Header percent={percent} timeLeft={isRet ? "About 2 min left" : "About 4–5 min left"} onBack={back} /> : null}

        <div className="flex-1 overflow-auto">
          {key === "otp" ? <OtpScreen ctx={ctx} /> : null}
          {key === "welcome" ? <WelcomeScreen ctx={ctx} /> : null}
          {key === "personal" ? <PersonalScreen ctx={ctx} /> : null}
          {key === "emergency" ? <EmergencyScreen ctx={ctx} /> : null}
          {key === "visit" ? <VisitScreen ctx={ctx} /> : null}
          {key === "coverage" ? <CoverageScreen ctx={ctx} /> : null}
          {key === "ocr" ? <OcrScreen ctx={ctx} /> : null}
          {key === "health" ? <HealthScreen ctx={ctx} /> : null}
          {key === "medications" ? <ListReviewScreen ctx={ctx} kind="medications" /> : null}
          {key === "allergies" ? <ListReviewScreen ctx={ctx} kind="allergies" /> : null}
          {key === "screener" ? <ScreenerScreen ctx={ctx} /> : null}
          {key === "payment" ? <PaymentScreen ctx={ctx} /> : null}
          {key === "consent" ? <ConsentScreen ctx={ctx} /> : null}
          {key === "review" ? <ReviewScreen ctx={ctx} /> : null}
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
          primaryPill={key === "review"}
        />
      </div>

      <PaymentMethodsSheet ctx={ctx} />
      <AddCardSheet ctx={ctx} />
      <AddItemSheet ctx={ctx} />
      <RemoveConfirmSheet ctx={ctx} />
      <TextSheet open={state.consentFullOpen} title="Consent to treatment" body={CONSENT_TEXT} onClose={() => update({ consentFullOpen: false })} zIndex={74} />
      <TextSheet open={state.privacyOpen} title="How your information is used" body={PRIVACY_TEXT} onClose={() => update({ privacyOpen: false })} zIndex={74} />
      <DemoButton onOpen={() => update({ demoOpen: true })} />
      <DemoSheet ctx={ctx} />
      {state.toastMessage ? (
        <Toast key={state.toastId} message={state.toastMessage} onDone={() => update({ toastMessage: null })} />
      ) : null}
    </div>
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

  if (key === "otp") {
    return { primaryLabel: "Continue", primaryDisabled: state.otp.length < 6, primary: next };
  }
  if (key === "welcome" || key === "screener" || key === "success") {
    return { primaryLabel: null };
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
    if (!state.visitConfirmed) {
      return {
        primaryLabel: "Yes, that's right",
        primary: () => update({ visitConfirmed: true }),
        secondaryLabel: "Update reason",
        secondary: () => update({ visitConfirmed: true }),
      };
    }
    return { primaryLabel: "Continue", primary: next };
  }
  if (key === "coverage") {
    if (isRet && state.coverageEditing) {
      return {
        primaryLabel: "Save coverage details",
        primary: () => update({ coverageEditing: false }),
        secondaryLabel: "Cancel",
        secondary: () => update({ coverageEditing: false }),
      };
    }
    if (isRet && !state.coverageChanging) {
      return {
        primaryLabel: "Yes, continue",
        primary: next,
        secondaryLabel: "No, I need to update it",
        secondary: () => update({ coverageChanging: true }),
        tertiaryLabel: "✎ Edit insurance details",
        tertiary: () => update({ coverageEditing: true }),
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
        ctx.startEligibility();
        update({ coverageChanging: false, manualEntry: false });
        go("health");
      },
    };
  }
  if (key === "ocr") {
    return { primaryLabel: state.manualEntry ? "Save and continue" : "Looks good, continue", primary: next };
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
    // New patient — original discover→select→confirm flow, unchanged.
    return {
      primaryLabel: "Continue",
      primaryDisabled: !(state.selectedConds.length || state.noneConds),
      primary: () => {
        if (state.selectedConds.length || state.noneConds) {
          update((s) => ({ onFileConds: [...s.onFileConds, ...s.selectedConds], selectedConds: [] }));
          next();
        }
      },
    };
  }
  if (key === "medications" || key === "allergies") {
    const editing = key === "medications" ? state.medsEditing : state.allergiesEditing;
    const list = key === "medications" ? state.meds : state.allergies;
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
    return {
      primaryLabel: "Sign and continue",
      primary: () => {
        if (state.agreed && state.signed) next();
        else update({ agreed: true, signed: true });
      },
    };
  }
  if (key === "review") {
    return { primaryLabel: "Complete check-in", primary: next };
  }
  return { primaryLabel: "Continue", primary: next };
}
