import { DemoScenarioId, FlowKey, IntakeState, Patch } from "./types";

// The bundle every screen/sheet component receives — state plus the
// handful of cross-cutting actions (navigation, patching state,
// eligibility) screens need regardless of which one they are. Individual
// screens still destructure `ctx.state.*` explicitly rather than reaching
// into a god-object blindly, so each screen's dependencies stay visible
// at its own top.
export type Ctx = {
  state: IntakeState;
  update: (patch: Patch) => void;
  next: () => void;
  back: () => void;
  go: (key: FlowKey) => void;
  // SuccessScreen's checklist rows use this instead of `go` — jumps
  // into that section in review mode (see IntakeState.reviewingFromSuccess)
  // and, for sections that otherwise sit behind their own read-only
  // "on file" view, opens straight into their editable state so there's
  // no extra "Update" tap needed before the fields are actually reachable.
  reviewSection: (key: FlowKey) => void;
  // The review-mode "Save and return"/header-back counterpart to `next`
  // — always lands back on the final summary (never the next step in
  // flow order) and clears `reviewingFromSuccess`.
  returnToSummary: () => void;
  // Same pair, scoped to the smaller Patient Information wizard's own
  // review screen (PatientReviewScreen) instead of the final summary —
  // see IntakeState.reviewingFromPatientReview.
  reviewPatientSection: (key: FlowKey) => void;
  returnToPatientReview: () => void;
  isRet: boolean;
  flow: FlowKey[];
  key: FlowKey;
  startEligibility: () => void;
  reset: (demoScenarioId: DemoScenarioId) => void;
  // Brief bottom toast — "Card added successfully", "Payment successful".
  showToast: (message: string) => void;
};
