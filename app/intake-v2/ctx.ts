import { FlowKey, IntakeState, Patch } from "./types";

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
  isRet: boolean;
  flow: FlowKey[];
  key: FlowKey;
  startEligibility: () => void;
  reset: (scenario: IntakeState["scenario"]) => void;
  // Brief bottom toast — "Card added successfully", "Payment successful".
  showToast: (message: string) => void;
};
