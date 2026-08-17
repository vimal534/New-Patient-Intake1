// Ported 1:1 from the imported Claude Design prototype
// "Pediatric Symptom Intake.dc.html" — copy, thresholds, and body-map
// geometry are kept verbatim so the implementation matches the reviewed
// design rather than a paraphrase of it.

export type CSS = React.CSSProperties;

import type React from "react";

export const BTN: CSS = {
  cursor: "pointer",
  background: "#2b9dd9",
  color: "#ffffff",
  borderRadius: 18,
  padding: 20,
  textAlign: "center",
  fontSize: 17,
  fontWeight: 600,
  boxShadow: "0 6px 16px rgba(43,157,217,0.28)",
};
export const BTN_OFF: CSS = {
  background: "#dbe6ee",
  color: "#93a6b6",
  borderRadius: 18,
  padding: 20,
  textAlign: "center",
  fontSize: 17,
  fontWeight: 600,
  cursor: "default",
};
export const CARD: CSS = {
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 14,
  background: "#ffffff",
  borderRadius: 16,
  padding: 18,
  border: "1.5px solid #eef2f6",
  minHeight: 56,
};
export const CARD_ON: CSS = { ...CARD, background: "#f0fbfa", border: "1.5px solid #14b3ac" };
export const CARD_ON_SUG: CSS = { ...CARD, background: "#f0fbfa", border: "1.5px dashed #14b3ac" };
export const DOT: CSS = { width: 24, height: 24, borderRadius: "50%", border: "1.6px solid #cfdae5", flexShrink: 0 };
export const DOT_ON: CSS = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "#14b3ac",
  border: "1.6px solid #14b3ac",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
};
export const BOX: CSS = { width: 24, height: 24, borderRadius: 7, border: "1.6px solid #cfdae5", flexShrink: 0 };
export const BOX_ON: CSS = {
  width: 24,
  height: 24,
  borderRadius: 7,
  background: "#14b3ac",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
};
export const CHIP: CSS = {
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 7,
  background: "#ffffff",
  border: "1.5px solid #e3eaf1",
  borderRadius: 999,
  padding: "13px 18px",
  fontSize: 15,
  fontWeight: 500,
  color: "#3d4d5f",
  minHeight: 48,
};
export const CHIP_ON: CSS = { ...CHIP, background: "#14b3ac", border: "1.5px solid #14b3ac", fontWeight: 600, color: "#ffffff" };
export const CHIP_SUG: CSS = { ...CHIP, background: "#f0fbfa", border: "1.5px dashed #6fc8c4", color: "#137e7a" };
export const CHIP_ON_SUG: CSS = { ...CHIP, background: "#14b3ac", border: "1.5px dashed #ffffff", fontWeight: 600, color: "#ffffff" };
export const TAG_OFF: CSS = { display: "none" };
export const TAG_ON: CSS = {
  background: "rgba(20,179,172,0.16)",
  color: "#0f6f6b",
  borderRadius: 999,
  padding: "3px 8px",
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};
export const TAG_ON_SEL: CSS = { ...TAG_ON, background: "rgba(255,255,255,0.24)", color: "#ffffff" };

export type Figure = { label: string; w: number; h: number; path: string };

export const FIGURES: Record<"infant" | "toddler" | "child" | "teen", Figure> = {
  infant: {
    label: "Infant · under 1",
    w: 214,
    h: 300,
    path: "M60 4c7.5 0 12.6 5.6 12.6 12.6 0 4.4-1.6 8-4 10.2 4.4 1.2 7.8 2.3 10.6 3.6 5.6 2.6 8.2 6.4 8.6 12l1.8 22c.3 3.2-1.6 5.4-4.4 5.6-2.8.2-4.8-1.6-5.2-4.6l-1.4-10.4v18c0 4 .4 7.8 1.2 11.6l1.4 6.8c.4 2.2-1 4-3.2 4h-4.4l-.6 17-1.4 27.4c-.1 3-2.2 5-5 5-2.7 0-4.8-2-5-4.9l-1.8-26.4-.8-8.6-.8 8.6-1.8 26.4c-.2 2.9-2.3 4.9-5 4.9-2.8 0-4.9-2-5-5l-1.4-27.4-.6-17h-4.4c-2.2 0-3.6-1.8-3.2-4l1.4-6.8c.8-3.8 1.2-7.6 1.2-11.6v-18l-1.4 10.4c-.4 3-2.4 4.8-5.2 4.6-2.8-.2-4.7-2.4-4.4-5.6l1.8-22c.4-5.6 3-9.4 8.6-12 2.8-1.3 6.2-2.4 10.6-3.6-2.4-2.2-4-5.8-4-10.2C47.4 9.6 52.5 4 60 4Z",
  },
  toddler: {
    label: "Toddler · 1–3",
    w: 218,
    h: 310,
    path: "M60 4c6.8 0 11.6 5 11.6 11.6 0 4-1.4 7.2-3.6 9.2 4.2 1.2 7.6 2.2 10.4 3.5 5.8 2.6 8.6 6.4 9.4 12l3 24c.4 3-1.4 5.2-4.2 5.6-2.8.4-4.9-1.4-5.4-4.4l-2.2-12v19.6c0 3.8.4 7.4 1.2 11l1.6 7.6c.4 2.2-1 3.9-3.1 3.9h-4.5l-.6 19-1.5 30c-.1 3-2.2 5-5 5-2.7 0-4.8-2-5-4.9l-1.9-29.5-.7-9-.7 9-1.9 29.5c-.2 2.9-2.3 4.9-5 4.9-2.8 0-4.9-2-5-5l-1.5-30-.6-19h-4.5c-2.1 0-3.5-1.7-3.1-3.9l1.6-7.6c.8-3.6 1.2-7.2 1.2-11V53.5l-2.2 12c-.5 3-2.6 4.8-5.4 4.4-2.8-.4-4.6-2.6-4.2-5.6l3-24c.8-5.6 3.6-9.4 9.4-12 2.8-1.3 6.2-2.3 10.4-3.5-2.2-2-3.6-5.2-3.6-9.2C48.4 9 53.2 4 60 4Z",
  },
  child: {
    label: "Child · 4–11",
    w: 222,
    h: 320,
    path: "M60 4c6 0 10.2 4.6 10.2 10.6 0 3.8-1.2 6.8-3.2 8.8 3.8 1.1 7 2.1 9.8 3.3 6 2.4 9.2 5.6 10.3 11.4l4.4 23.4c.5 2.8-1.2 5-4 5.4-2.7.4-4.8-1.2-5.4-4l-3-13.4v20.6c0 3.7.4 7.2 1.2 10.8l1.7 8.2c.4 2.1-1 3.8-3 3.8h-4.6l-.6 20.4-1.6 32.4c-.1 3-2.2 5-5 5-2.7 0-4.8-2-5-4.9l-2-31.9-.6-9.2-.6 9.2-2 31.9c-.2 2.9-2.3 4.9-5 4.9-2.8 0-4.9-2-5-5l-1.6-32.4-.6-20.4h-4.6c-2 0-3.4-1.7-3-3.8l1.7-8.2c.8-3.6 1.2-7.1 1.2-10.8V49.5l-3 13.4c-.6 2.8-2.7 4.4-5.4 4-2.8-.4-4.5-2.6-4-5.4l4.4-23.4c1.1-5.8 4.3-9 10.3-11.4 2.8-1.2 6-2.2 9.8-3.3-2-2-3.2-5-3.2-8.8C49.8 8.6 54 4 60 4Z",
  },
  teen: {
    label: "Teen · 12–17",
    w: 226,
    h: 330,
    path: "M60 4c5 0 8.6 4 8.6 9.2 0 3.4-1 6-2.6 7.8 3.4 1 6.4 1.7 9.4 2.7 6 2 9.2 5 10.4 10.6l4.8 22.6c.5 2.6-1 4.6-3.4 5-2.4.5-4.4-.9-5-3.4l-3.4-14v20.8c0 3.6.5 7 1.2 10.4l1.8 8.6c.4 2-1 3.6-3 3.6h-4.6l-.6 20.8-1.6 34c-.1 3-2.2 5-5 5-2.7 0-4.8-2-5-4.9l-2-33.3-.6-9.6-.6 9.6-2 33.3c-.2 2.9-2.3 4.9-5 4.9-2.8 0-4.9-2-5-5l-1.6-34-.6-20.8h-4.6c-2 0-3.4-1.6-3-3.6l1.8-8.6c.7-3.4 1.2-6.8 1.2-10.4V54.5l-3.4 14c-.6 2.5-2.6 3.9-5 3.4-2.4-.4-3.9-2.4-3.4-5l4.8-22.6c1.2-5.6 4.4-8.6 10.4-10.6 3-1 6-1.7 9.4-2.7-1.6-1.8-2.6-4.4-2.6-7.8C51.4 8 55 4 60 4Z",
  },
};

export type Zone = { id: string; cx: number; cy: number; r: number };

export const ZONES: Record<"front" | "back", Zone[]> = {
  front: [
    { id: "Head", cx: 60, cy: 13, r: 8.5 },
    { id: "Ear", cx: 74, cy: 15, r: 6 },
    { id: "Throat", cx: 60, cy: 27, r: 6.5 },
    { id: "Chest", cx: 60, cy: 42, r: 9 },
    { id: "Left arm", cx: 34, cy: 56, r: 7 },
    { id: "Right arm", cx: 86, cy: 56, r: 7 },
    { id: "Tummy", cx: 60, cy: 66, r: 9.5 },
    { id: "Hips", cx: 60, cy: 92, r: 8 },
    { id: "Left leg", cx: 50, cy: 128, r: 8 },
    { id: "Right leg", cx: 70, cy: 128, r: 8 },
  ],
  back: [
    { id: "Back of head", cx: 60, cy: 13, r: 8.5 },
    { id: "Upper back", cx: 60, cy: 42, r: 9 },
    { id: "Lower back", cx: 60, cy: 76, r: 9 },
    { id: "Left arm", cx: 34, cy: 56, r: 7 },
    { id: "Right arm", cx: 86, cy: 56, r: 7 },
    { id: "Left leg", cx: 50, cy: 128, r: 8 },
    { id: "Right leg", cx: 70, cy: 128, r: 8 },
  ],
};

export const SPOTS: Record<string, string[]> = {
  Ear: ["Right ear", "Left ear", "Both ears", "Behind the ear"],
  Head: ["Forehead", "Temples", "All over", "Back of head"],
  Tummy: ["Around the belly button", "Upper tummy", "Lower right", "Lower left", "All over"],
  Throat: ["When swallowing", "All the time", "One side"],
  Chest: ["Middle", "Left side", "Right side", "When breathing in"],
  "Left leg": ["Thigh", "Knee", "Shin", "Ankle or foot"],
  "Right leg": ["Thigh", "Knee", "Shin", "Ankle or foot"],
  "Left arm": ["Shoulder", "Elbow", "Wrist or hand"],
  "Right arm": ["Shoulder", "Elbow", "Wrist or hand"],
  Hips: ["Right hip", "Left hip", "Groin"],
  "Upper back": ["Between shoulders", "One side"],
  "Lower back": ["Centre", "One side"],
  "Back of head": ["Base of skull", "All over"],
};
export const DEFAULT_SPOTS = ["One spot", "A wide area", "It moves around"];

export const QUALITY: Record<string, string[]> = {
  Ear: ["Aching", "Sharp", "Full or blocked", "Itchy", "Other"],
  Tummy: ["Cramping", "Sharp", "Dull ache", "Comes in waves", "Other"],
  Head: ["Throbbing", "Pressing", "Sharp", "Other"],
  Throat: ["Scratchy", "Raw", "Burning", "Other"],
};
export const DEFAULT_QUALITY = ["Sharp", "Dull ache", "Throbbing", "Burning", "Tender to touch", "Other"];

export const SEVERITY: [string, string][] = [
  ["1", "Barely"],
  ["2", "Mild"],
  ["3", "Moderate"],
  ["4", "Severe"],
];

export const REGION_META: Record<string, { heading: string; locQ: string }> = {
  Ear: { heading: "Ear discomfort", locQ: "Where is the discomfort?" },
  Head: { heading: "Head pain", locQ: "Where is the pain?" },
  Throat: { heading: "Throat discomfort", locQ: "When does it hurt?" },
  Chest: { heading: "Chest discomfort", locQ: "Where in the chest?" },
  Tummy: { heading: "Tummy pain", locQ: "Where in the tummy?" },
  Hips: { heading: "Hip discomfort", locQ: "Which side?" },
  "Left arm": { heading: "Left arm discomfort", locQ: "Which part of the arm?" },
  "Right arm": { heading: "Right arm discomfort", locQ: "Which part of the arm?" },
  "Left leg": { heading: "Left leg discomfort", locQ: "Which part of the leg?" },
  "Right leg": { heading: "Right leg discomfort", locQ: "Which part of the leg?" },
  "Upper back": { heading: "Upper back pain", locQ: "Where exactly?" },
  "Lower back": { heading: "Lower back pain", locQ: "Where exactly?" },
  "Back of head": { heading: "Head pain", locQ: "Where exactly?" },
};

export const AGGRAVATING: Record<string, string[]> = {
  Ear: ["Lying down", "At night", "Swallowing", "Touching the ear", "Not sure"],
  Throat: ["Swallowing", "Eating", "At night", "Talking", "Not sure"],
  Head: ["Bright light", "Loud noise", "Bending over", "At night", "Not sure"],
  Chest: ["Breathing in", "Coughing", "Lying down", "Activity", "Not sure"],
  Tummy: ["After eating", "Before eating", "Movement", "Pressing on it", "Not sure"],
};
export const DEFAULT_AGGRAVATING = ["Movement", "Touching it", "At night", "Weight on it", "Not sure"];

export type ConnectedRule = { id: string; region: string; minSeverity: number; lead: string; opts: string[] };

// Rules engine — not the model — decides whether a connected follow-up is warranted.
export const CONNECTED_RULES: ConnectedRule[] = [
  { id: "earRedFlags", region: "Ear", minSeverity: 3, lead: "One more thing that may help Dr. Reyes prepare: have you noticed any of these?", opts: ["Fever", "Fluid or drainage", "Trouble hearing", "Dizziness", "None of these"] },
  { id: "throatRedFlags", region: "Throat", minSeverity: 3, lead: "One more thing that may help Dr. Reyes prepare: have you noticed any of these?", opts: ["Fever", "Swollen glands", "Drooling or can't swallow", "Rash", "None of these"] },
  { id: "tummyRedFlags", region: "Tummy", minSeverity: 3, lead: "One more thing that may help Dr. Reyes prepare: have you noticed any of these?", opts: ["Vomiting", "Fever", "Blood in the stool", "Pain moving to the lower right", "None of these"] },
  { id: "chestRedFlags", region: "Chest", minSeverity: 2, lead: "One more thing Dr. Reyes will want to know: have you noticed any of these?", opts: ["Fast breathing", "Wheezing", "Blue lips", "Fever", "None of these"] },
  { id: "headRedFlags", region: "Head", minSeverity: 3, lead: "One more thing that may help Dr. Reyes prepare: have you noticed any of these?", opts: ["Fever", "Stiff neck", "Vomiting", "Light hurts the eyes", "None of these"] },
];

export const SCALE: [string, string][] = [
  ["0", "No Hurt"],
  ["2", "Hurts Little Bit"],
  ["4", "Hurts Little More"],
  ["6", "Hurts Even More"],
  ["8", "Hurts Whole Lot"],
  ["10", "Hurts Worst"],
];

export type FollowUp = { id: string; eyebrow: string; q: string; multi: boolean; layout: "list" | "chips"; opts: string[]; why: string };

export const FOLLOWS: FollowUp[] = [
  { id: "onset", eyebrow: "When it started", q: "When did this start?", multi: false, layout: "list", opts: ["Today", "Yesterday", "2–3 days ago", "About a week ago", "Longer than a week"], why: "" },
  { id: "fever", eyebrow: "Fever", q: "Has {name} had a fever?", multi: false, layout: "list", opts: ["No fever", "Felt warm, didn't measure", "Under 38°C / 100.4°F", "38°C / 100.4°F or higher"], why: "Ear pain with a fever changes how soon {name} should be seen." },
  { id: "worse", eyebrow: "What makes it worse", q: "Anything that makes it worse?", multi: true, layout: "chips", opts: ["Lying down", "Chewing", "Loud sounds", "Touching it", "Nothing in particular"], why: "" },
  { id: "eating", eyebrow: "Eating and drinking", q: "Is {name} eating and drinking normally?", multi: false, layout: "list", opts: ["Yes, normally", "Less than usual", "Barely anything", "Nothing since yesterday"], why: "" },
  { id: "similar", eyebrow: "Continuity", q: "Does this feel like the ear pain from March?", multi: false, layout: "list", opts: ["Yes, very similar", "Similar but worse", "Different this time", "I'm not sure"], why: "{name} was seen for right ear pain on 14 March. Dr. Reyes will compare." },
  { id: "tried", eyebrow: "What you've tried", q: "Given anything for it?", multi: true, layout: "chips", opts: ["Paracetamol", "Ibuprofen", "Warm compress", "Nothing yet"], why: "" },
];

export const REL_OPTS = ["Parent", "Legal Guardian", "Other authorized adult"];

export type ConsentDoc = {
  id: string;
  minAge: number;
  maxAge: number;
  visits: string[];
  label: { en: string; es: string };
  summary: { en: string; es: string };
  full: { en: string; es: string };
};

export const CONSENT_DOCS: ConsentDoc[] = [
  {
    id: "treat", minAge: 0, maxAge: 17, visits: ["*"],
    label: { en: "Consent to treat a minor", es: "Consentimiento para tratar a un menor" },
    summary: { en: "You're giving Dr. Reyes permission to examine and treat {name} at this visit. You can ask questions or stop at any point.", es: "Autoriza a la Dra. Reyes a examinar y tratar a {name} en esta visita. Puede preguntar o detenerse en cualquier momento." },
    full: { en: "As the person legally responsible for {name}, you authorize the clinicians of {practice} to perform examination, routine diagnostic testing, and treatment appropriate to the reason for today's visit. Consent may be withdrawn verbally at any time, including partway through an examination. Emergency care may proceed without further consent if a delay would put {name} at risk.", es: "Como responsable legal de {name}, autoriza al personal clínico de {practice} a realizar el examen, las pruebas diagnósticas de rutina y el tratamiento apropiado para el motivo de la visita de hoy. El consentimiento puede retirarse verbalmente en cualquier momento. La atención de emergencia puede continuar sin consentimiento adicional si una demora pusiera a {name} en riesgo." },
  },
  {
    id: "guardian", minAge: 0, maxAge: 17, visits: ["*"],
    label: { en: "Guardian authorization", es: "Autorización del tutor" },
    summary: { en: "Confirms you're the adult allowed to make care decisions for {name}, and that we can reach you about this visit.", es: "Confirma que usted es el adulto autorizado a tomar decisiones sobre el cuidado de {name} y que podemos contactarle." },
    full: { en: "You confirm your relationship to {name} as stated in this check-in and that you hold the authority to consent to care. If that authority changes — through a custody order or a change of legal guardianship — you agree to tell the practice before the next visit. We may contact you at the phone number and email you entered for anything related to this visit.", es: "Confirma su relación con {name} tal como se indica en este registro y que tiene la autoridad para consentir su atención. Si esa autoridad cambia, se compromete a informar a la clínica antes de la siguiente visita." },
  },
  {
    id: "privacy", minAge: 0, maxAge: 17, visits: ["*"],
    label: { en: "Privacy notice", es: "Aviso de privacidad" },
    summary: { en: "How we protect {name}'s records, and the short list of reasons we're allowed to share them.", es: "Cómo protegemos el expediente de {name} y las razones limitadas por las que podemos compartirlo." },
    full: { en: "{practice} uses {name}'s health information to provide care, bill your insurer, and run the practice. We do not sell it. We share it outside the practice only with your written permission, or where the law requires it — for example a public-health report or a court order. You may request a copy of the record, ask for a correction, or ask for a list of disclosures at any time.", es: "{practice} usa la información de salud de {name} para brindar atención, facturar a su seguro y operar la clínica. No la vendemos. La compartimos fuera de la clínica solo con su permiso por escrito o cuando la ley lo exige." },
  },
  {
    id: "financial", minAge: 0, maxAge: 17, visits: ["*"],
    label: { en: "Financial responsibility", es: "Responsabilidad financiera" },
    summary: { en: "You agree to cover the copay and anything the plan doesn't pay. Balances are due within 30 days.", es: "Acepta cubrir el copago y lo que el plan no pague. Los saldos se pagan en 30 días." },
    full: { en: "As the responsible party you agree to pay copays, deductibles, coinsurance, and charges for services your plan does not cover. Statements are due within 30 days. Payment plans are available on request and carry no interest. If coverage is later denied, we will tell you before billing you directly.", es: "Como parte responsable, acepta pagar copagos, deducibles, coseguro y los servicios que su plan no cubra. Los estados de cuenta se pagan en 30 días. Hay planes de pago sin interés disponibles." },
  },
  {
    id: "teen", minAge: 12, maxAge: 17, visits: ["*"],
    label: { en: "Confidential care for teens", es: "Atención confidencial para adolescentes" },
    summary: { en: "At {age}, {name} can answer some questions privately. Those answers go to the doctor, not to you.", es: "A los {age} años, {name} puede responder algunas preguntas en privado. Esas respuestas van al médico, no a usted." },
    full: { en: "State law lets patients {name}'s age speak with a clinician confidentially about certain topics. Answers {name} gives in the private part of this check-in are visible to the care team only. Dr. Reyes will always involve you when there is a safety concern, and will tell {name} when that happens.", es: "La ley estatal permite que los pacientes de la edad de {name} hablen de forma confidencial con un médico sobre ciertos temas. Las respuestas privadas solo las ve el equipo clínico. La Dra. Reyes le informará siempre que exista una preocupación de seguridad." },
  },
  {
    id: "vaccine", minAge: 0, maxAge: 17, visits: ["Well visit"],
    label: { en: "Vaccine consent", es: "Consentimiento de vacunas" },
    summary: { en: "Only shown because today is a well visit. Covers the vaccines due at {name}'s age.", es: "Se muestra porque hoy es una visita de control. Cubre las vacunas correspondientes a la edad de {name}." },
    full: { en: "You consent to the vaccines scheduled for {name}'s age band at today's well visit. You have been offered the Vaccine Information Statement for each one. You may decline any single vaccine without affecting the rest of the visit.", es: "Consiente las vacunas programadas para la edad de {name} en la visita de control de hoy. Se le ofreció la hoja informativa de cada vacuna. Puede rechazar cualquier vacuna sin afectar el resto de la visita." },
  },
  {
    id: "adultSelfPay", minAge: 18, maxAge: 120, visits: ["*"],
    label: { en: "Adult self-pay agreement", es: "Acuerdo de pago propio para adultos" },
    summary: { en: "Adult patients only.", es: "Solo para pacientes adultos." },
    full: { en: "Not applicable to pediatric patients.", es: "No aplicable a pacientes pediátricos." },
  },
];

// A canned "AI extraction" result, standing in for a real NLP parse of the
// chat free-text — same principle as the adult flow: the AI classifies,
// the rules engine picks a validated question set, nothing is invented.
export const PARSE = {
  areas: [{ id: "Ear", spots: ["Right ear"], quality: ["Aching"], severity: null as string | null }],
  follows: { onset: "2–3 days ago", worse: ["Lying down"], tried: ["Paracetamol"] } as Record<string, string | string[]>,
};

// Fixed "practice configuration" — in a real deployment these would come
// from the practice's own settings, the same way `props` are editable
// knobs in the design tool preview.
export const PEDIATRIC_CONFIG = {
  practiceName: "Brightline Pediatrics",
  visitType: "Sick visit" as "Sick visit" | "Well visit",
  financialPolicy: "Charged after your visit" as "Charged after your visit" | "Due today",
  eligibilityGate: false,
  ocrConfidence: "All fields clear" as "All fields clear" | "One field unclear",
  patientName: "Ana",
  patientAge: 8,
  autoAdvance: true,
};
