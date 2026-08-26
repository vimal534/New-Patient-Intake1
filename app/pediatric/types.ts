export type Screen =
  | "picker"
  | "signup"
  | "details"
  | "idCapture"
  | "idReview"
  | "home"
  | "chat"
  | "bodyMap"
  | "canvas"
  | "handoff"
  | "private"
  | "scale"
  | "idConfirm"
  | "coverageConfirm"
  | "rcsCoverage"
  | "coverageForm"
  | "consentsConfirm"
  | "consents"
  | "signature"
  | "preferences"
  | "review"
  | "done";

// `extra` holds every dynamic per-region answer captured in the conversational
// canvas — symptom-check values and their onset follow-ups (e.g. fever /
// feverOnset / drainage / drainageOnset), history-aware prompts (tubes /
// similar), and the region's own red-flag check for non-Ear regions
// (connected) — all keyed by the step id that produced them. Kept as a bag
// rather than named fields because which checks/history apply is
// region-dependent and computed at render time, not fixed per region.
export type AreaState = {
  spots: string[];
  quality: string[];
  aggravating: string[];
  severity: string | null;
  connected: string[];
  suggested: boolean;
  confirmed: boolean;
  extra: Record<string, string | string[] | undefined>;
};

export type CardDraft = { number: string; exp: string; cvc: string; zip: string };

export type PedState = {
  flow: "A" | "B" | null;
  screen: Screen;
  form: Record<string, string>;
  rel: string | null;
  idSide: "front" | "back";
  idShots: number;
  idChanged: boolean;
  coverageChanged: boolean;
  consentsChanged: boolean;
  tId: boolean;
  tCov: boolean;
  tCon: boolean;
  consentAcks: string[];
  consentOpen: string | null;
  lang: "en" | "es";
  payMethod: string | null;
  prefs: string[];
  signMode: "type" | "draw" | "upload";
  signName: string;
  signed: boolean;
  signNameTouched: boolean;
  upload: string | null;
  card: CardDraft;
  saveCard: boolean;
  ocrElig: "pending" | "done";
  ocr: Record<string, string>;
  editCard: boolean;
  cardUpdated: boolean;
  // RCS-thread coverage/payment beats (rcsCoverage screen): whether the
  // patient tapped through the found coverage and the chosen payment
  // method. The eligibility check itself is tracked by ocrElig alone —
  // it starts as soon as the screen mounts, no separate flag needed.
  rcsEligConfirmed: boolean;
  rcsPayConfirmed: boolean;
  passportOpen: boolean;
  chatText: string;
  mic: boolean;
  parsed: boolean;
  view: "front" | "back";
  areas: Record<string, AreaState>;
  order: string[];
  sheet: "assistant" | null;
  // Tier-1 facts extracted from the free-text description — stated outright,
  // not inferred, so they render collapsed by default with a "Change" link
  // rather than as an open question.
  symptomOnset: string;
  symptomTrigger: string;
  // The conversational canvas asks exactly one thing at a time — the next
  // unanswered step is derived fresh from state each render (see
  // buildCanvasQueue in page.tsx), not tracked by an index. `canvasHistory`
  // is the ordered record of what's already been answered, purely so the
  // "N details captured — Review" list and the back button have something
  // to show/undo; it plays no part in deciding what's asked next.
  canvasHistory: { id: string; region: string | null; eyebrow: string }[];
  canvasChangeOpen: string | null; // id of a collapsed tier-1/tier-2 value currently expanded via "Change", or "recap"
  canvasJustSelected: { id: string; value: string | string[] } | null; // brief pre-collapse confirmation beat
  canvasReviewOpen: boolean; // "N details captured — Review" expanded
  canvasScrolledAway: boolean; // user manually scrolled off the active question; suspends auto-scroll
  genericAnswers: Record<string, string | string[] | undefined>; // worse / eating / tried
  reviewPhotosOpen: boolean; // ID capture: photos are hidden by default unless quality is poor or the patient asks
  scale: string | null;
  privateAnswer: string | null;
  assistantAnswer: string | null;
  handedOff: boolean;
  arrived: boolean;
};

export const initialPedState: PedState = {
  flow: null,
  screen: "picker",
  form: {},
  rel: null,
  idSide: "front",
  idShots: 0,
  idChanged: false,
  coverageChanged: false,
  consentsChanged: false,
  tId: false,
  tCov: false,
  tCon: false,
  consentAcks: [],
  consentOpen: null,
  lang: "en",
  payMethod: null,
  prefs: [],
  signMode: "type",
  signName: "",
  signed: false,
  signNameTouched: false,
  upload: null,
  card: { number: "", exp: "", cvc: "", zip: "" },
  saveCard: false,
  ocrElig: "pending",
  ocr: {},
  editCard: false,
  cardUpdated: false,
  rcsEligConfirmed: false,
  rcsPayConfirmed: false,
  passportOpen: false,
  chatText: "",
  mic: false,
  parsed: false,
  view: "front",
  areas: {},
  order: [],
  sheet: null,
  symptomOnset: "",
  symptomTrigger: "",
  canvasHistory: [],
  canvasChangeOpen: null,
  canvasJustSelected: null,
  canvasReviewOpen: false,
  canvasScrolledAway: false,
  genericAnswers: {},
  reviewPhotosOpen: false,
  scale: null,
  privateAnswer: null,
  assistantAnswer: null,
  handedOff: false,
  arrived: false,
};
