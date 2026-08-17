export type Screen =
  | "picker"
  | "signup"
  | "details"
  | "idCapture"
  | "idReview"
  | "home"
  | "chat"
  | "bodyMap"
  | "handoff"
  | "private"
  | "followUp"
  | "scale"
  | "idConfirm"
  | "coverageConfirm"
  | "cardScan"
  | "cardRead"
  | "cardConfirm"
  | "copay"
  | "coverageForm"
  | "consentsConfirm"
  | "consents"
  | "signature"
  | "preferences"
  | "review"
  | "done";

export type AreaState = {
  spots: string[];
  quality: string[];
  aggravating: string[];
  severity: string | null;
  connected: string[];
  suggested: boolean;
  confirmed: boolean;
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
  ocrStep: number;
  ocrElig: "pending" | "done";
  ocr: Record<string, string>;
  editCard: boolean;
  cardUpdated: boolean;
  needsBack: boolean;
  passportOpen: boolean;
  chatText: string;
  mic: boolean;
  parsed: boolean;
  view: "front" | "back";
  areas: Record<string, AreaState>;
  order: string[];
  sheet: "region" | "assistant" | null;
  sheetArea: string | null;
  draft: AreaState | null;
  followIdx: number;
  follows: Record<string, string | string[] | boolean | undefined>;
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
  ocrStep: 0,
  ocrElig: "pending",
  ocr: {},
  editCard: false,
  cardUpdated: false,
  needsBack: false,
  passportOpen: false,
  chatText: "",
  mic: false,
  parsed: false,
  view: "front",
  areas: {},
  order: [],
  sheet: null,
  sheetArea: null,
  draft: null,
  followIdx: 0,
  follows: {},
  scale: null,
  privateAnswer: null,
  assistantAnswer: null,
  handedOff: false,
  arrived: false,
};
