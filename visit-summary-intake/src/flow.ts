// The full 24-screen route order, and which of the 5 sections each screen
// belongs to. StepHeader reads this to render "HEALTH · 2 OF 5" plus the
// segmented progress bar — no screen needs to know its own position.
export type Section = "VISIT" | "HEALTH" | "DETAILS" | "COVERAGE" | "FINISH";

export const SECTIONS: Section[] = ["VISIT", "HEALTH", "DETAILS", "COVERAGE", "FINISH"];
export const SECTION_INDEX: Record<Section, number> = { VISIT: 1, HEALTH: 2, DETAILS: 3, COVERAGE: 4, FINISH: 5 };

export const FLOW: { path: string; section: Section | null }[] = [
  { path: "/", section: null }, // 01 Welcome/Resume — no header
  { path: "/reason", section: "VISIT" }, // 02
  { path: "/symptom", section: "VISIT" }, // 03
  { path: "/symptom/follow-up", section: "VISIT" }, // 04
  { path: "/symptom/summary", section: "VISIT" }, // 05
  { path: "/health", section: "HEALTH" }, // 06
  { path: "/health/changed", section: "HEALTH" }, // 07
  { path: "/health/add", section: "HEALTH" }, // 08
  { path: "/health/confirm", section: "HEALTH" }, // 09
  { path: "/health/checkin", section: "HEALTH" }, // 10
  { path: "/health/summary", section: "HEALTH" }, // 11
  { path: "/details", section: "DETAILS" }, // 12
  { path: "/coverage", section: "COVERAGE" }, // 13
  { path: "/coverage/scan", section: "COVERAGE" }, // 14
  { path: "/coverage/capture", section: "COVERAGE" }, // 15
  { path: "/coverage/processing", section: "COVERAGE" }, // 16
  { path: "/coverage/verify", section: "COVERAGE" }, // 17
  { path: "/coverage/result", section: "COVERAGE" }, // 18
  { path: "/payment", section: "FINISH" }, // 19
  { path: "/payment/processing", section: "FINISH" }, // 20
  { path: "/payment/success", section: "FINISH" }, // 21
  { path: "/consents", section: "FINISH" }, // 22
  { path: "/summary", section: "FINISH" }, // 23
  { path: "/done", section: "FINISH" }, // 24
];

export function nextPath(current: string): string {
  const i = FLOW.findIndex((f) => f.path === current);
  return FLOW[Math.min(FLOW.length - 1, i + 1)]?.path ?? "/";
}
