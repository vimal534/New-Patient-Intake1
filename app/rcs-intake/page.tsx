"use client";

import { useEffect, useRef, useState } from "react";
import { StatusBar } from "../components/StatusBar";

// ---------- Healthpro Clinic · RCS Intake Prototype (v3, full 8-step journey) ----------
// Landing screen is a fixed entry state (not chat). Everything after it is
// one shared conversation+bottom-sheet template: the thread above shows
// what's already resolved, the sheet below holds exactly the one open
// question, and answering it collapses into the thread as a normal
// AI-bubble + patient-reply exchange before the sheet advances.

const INK = "#0d1421";
const MUTED = "#6b7a8d";
const TEAL = "#14b3ac";
const AMBER = "#b8860b";
const BLUE = "#2f7bff";
const LINE = "#e3e8ee";
const BG = "#f7f8fa";

const PROVIDER = "Dr. Reyes";
const VISIT_WHEN = "Tomorrow · 10:20 AM";
const GUARDIAN = "Elena Marquez";
const COPAY = "$35";

// Returning vs. new patient share every screen and the whole state
// machine below — only the copy and which fields are on file differ.
// Returning has things to *confirm*; new has things to *collect*.
type PatientFlow = "returning" | "new";
const RETURNING_NAME = "Ana";
const RETURNING_AGE = "8 years";
const NEW_NAME = "Mia";
const NEW_AGE = "3 years";

type Stage = "HEALTH" | "HISTORY" | "DETAILS" | "COVERAGE" | "FINISH";
type Step = "health" | "history" | "healthCheck" | "yourDetails" | "coverage" | "payment" | "consents" | "review";

const STEP_ORDER: Step[] = ["health", "history", "healthCheck", "yourDetails", "coverage", "payment", "consents", "review"];
const STEP_STAGE: Record<Step, Stage> = {
  health: "HEALTH",
  history: "HISTORY",
  healthCheck: "DETAILS",
  yourDetails: "DETAILS",
  coverage: "COVERAGE",
  payment: "FINISH",
  consents: "FINISH",
  review: "FINISH",
};
const STAGES: Stage[] = ["HEALTH", "HISTORY", "DETAILS", "COVERAGE", "FINISH"];
const STAGE_INDEX: Record<Stage, number> = { HEALTH: 1, HISTORY: 2, DETAILS: 3, COVERAGE: 4, FINISH: 5 };
const STEP_LABEL: Record<Step, string> = { health: "Health", history: "History", healthCheck: "Health check", yourDetails: "Details", coverage: "Coverage", payment: "Payment", consents: "Consents", review: "Review" };

// ---------- Thread item model ----------
type ThreadItem =
  | { kind: "ai"; text: string }
  | { kind: "info"; lines: string[] }
  | { kind: "answer"; text: string; time: string }
  | { kind: "summary"; label: string; lines: string[] };

function now() {
  return "12:04 PM"; // static demo timestamp — no live clock dependency
}

// ---------- Shared visual pieces ----------
const PILL: React.CSSProperties = { cursor: "pointer", background: "#ffffff", border: "1.5px solid " + LINE, borderRadius: 999, padding: "13px 20px", fontSize: 15, fontWeight: 600, color: INK, textAlign: "center" };
const PILL_ON: React.CSSProperties = { ...PILL, background: INK, border: "1.5px solid " + INK, color: "#ffffff" };
const CHECK_ROW: React.CSSProperties = { cursor: "pointer", display: "flex", alignItems: "center", gap: 10, border: "1.5px solid " + LINE, borderRadius: 14, padding: "13px 14px", background: "#ffffff" };
const BOX: React.CSSProperties = { width: 20, height: 20, borderRadius: 5, border: "1.6px solid " + LINE, flexShrink: 0 };
const BOX_ON: React.CSSProperties = { ...BOX, background: BLUE, border: "1.6px solid " + BLUE, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 };
const PRIMARY_BTN: React.CSSProperties = { cursor: "pointer", background: BLUE, color: "#ffffff", borderRadius: 999, padding: 17, textAlign: "center", fontSize: 16, fontWeight: 700, boxShadow: "0 6px 16px rgba(47,123,255,0.28)" };
const PRIMARY_BTN_OFF: React.CSSProperties = { background: "#d7e0ea", color: "#9aa8b6", borderRadius: 999, padding: 17, textAlign: "center", fontSize: 16, fontWeight: 700, cursor: "default" };
const INPUT: React.CSSProperties = { border: "1.5px solid " + LINE, borderRadius: 10, padding: "11px 13px", fontSize: 15, outline: "none", background: "#fbfcfd", color: INK, width: "100%" };

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="9.5" y="2" width="5" height="20" rx="2" fill={TEAL} />
        <rect x="2" y="9.5" width="20" height="5" rx="2" fill={TEAL} />
      </svg>
      <span style={{ fontSize: 22, fontWeight: 800, color: INK }}>Healthpro</span>
      <span style={{ fontSize: 22, fontWeight: 800, color: TEAL }}>Clinic</span>
    </div>
  );
}

function AiTurn({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignSelf: "flex-start", maxWidth: "92%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: AMBER, fontSize: 13 }}>✦</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: AMBER }}>Healthpro Clinic</span>
      </div>
      <div style={{ background: "#ffffff", border: "1px solid " + LINE, borderRadius: "4px 14px 14px 14px", padding: "13px 15px", fontSize: 15, color: INK, lineHeight: 1.5, whiteSpace: "pre-line" }}>{text}</div>
    </div>
  );
}

function InfoCard({ lines }: { lines: string[] }) {
  return (
    <div style={{ alignSelf: "flex-start", maxWidth: "92%", background: "#f7f8fa", border: "1px solid " + LINE, borderRadius: 14, padding: "12px 15px", display: "flex", flexDirection: "column", gap: 4 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 14, color: i === 0 ? MUTED : INK, fontWeight: i === 0 ? 500 : 600, lineHeight: 1.4 }}>{l}</div>
      ))}
    </div>
  );
}

function SummaryCard({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div style={{ alignSelf: "flex-start", maxWidth: "94%", width: "94%", background: "#ffffff", border: "1px solid " + LINE, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: MUTED, textTransform: "uppercase" }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontSize: 14, color: INK, lineHeight: 1.45 }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function AnswerBubble({ text, time }: { text: string; time: string }) {
  return (
    <div style={{ alignSelf: "flex-end", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, maxWidth: "80%" }}>
      <div style={{ background: INK, color: "#ffffff", borderRadius: "14px 4px 14px 14px", padding: "11px 15px", fontSize: 14.5, fontWeight: 600 }}>{text}</div>
      <div style={{ fontSize: 11.5, color: MUTED }}>{time}</div>
    </div>
  );
}

export default function RcsIntakePage() {
  const [screen, setScreen] = useState<"picker" | "landing" | "flow">("picker");
  const [patientFlow, setPatientFlow] = useState<PatientFlow>("returning");
  const [step, setStep] = useState<Step>("health");
  const [sub, setSub] = useState(0);
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [returnToReview, setReturnToReview] = useState(false);
  const [reviewingFrom, setReviewingFrom] = useState<Step | null>(null);

  // free-standing per-question draft state
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [historyChanged, setHistoryChanged] = useState<boolean | null>(null);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [guardianIsMe, setGuardianIsMe] = useState<boolean | null>(null);
  const [guardianName, setGuardianName] = useState("");
  const [guardianRel, setGuardianRel] = useState("");
  const [idPhotoTaken, setIdPhotoTaken] = useState(false);
  const [coverageChanged, setCoverageChanged] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [insurerName, setInsurerName] = useState("");
  const [memberIdInput, setMemberIdInput] = useState("");
  const [payMethod, setPayMethod] = useState<string | null>(null);
  const [payPending, setPayPending] = useState<string | null>(null);
  const [consentsChanged, setConsentsChanged] = useState<boolean | null>(null);
  const [consentsAgreed, setConsentsAgreed] = useState<string[]>([]);
  const [signedName, setSignedName] = useState("");

  const isNew = patientFlow === "new";
  const name = isNew ? NEW_NAME : RETURNING_NAME;
  const ageLabel = isNew ? NEW_AGE : RETURNING_AGE;
  const NEW_CONSENT_DOCS = ["Consent to Treat", "HIPAA Privacy Notice", "Financial Policy"];

  const threadRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.length]);

  function say(text: string) {
    setThread((t) => [...t, { kind: "ai", text }]);
  }
  function info(lines: string[]) {
    setThread((t) => [...t, { kind: "info", lines }]);
  }
  function reply(text: string) {
    setThread((t) => [...t, { kind: "answer", text, time: now() }]);
  }

  function startFlow() {
    setScreen("flow");
    setStep("health");
    setSub(0);
    setThread([{ kind: "ai", text: "Hi, I'm here to help get " + name + " ready for her visit with " + PROVIDER + " " + VISIT_WHEN.toLowerCase() + ".\n\nThis should only take about " + (isNew ? "five" : "two") + " minutes." }]);
  }

  // Advance to the next underlying step, speaking the stage transition
  // explicitly whenever the stage itself changes — never a silent jump.
  function nextStep() {
    if (returnToReview) {
      setReturnToReview(false);
      setStep("review");
      setSub(0);
      say("Thanks — that's updated. Here's the review again.");
      return;
    }
    const i = STEP_ORDER.indexOf(step);
    const next = STEP_ORDER[i + 1];
    if (!next) return;
    if (STEP_STAGE[next] !== STEP_STAGE[step]) {
      const lines: Record<Step, string> = {
        health: "",
        history: isNew
          ? "Since this is " + name + "'s first visit, let's build her health history."
          : "Great, I'll include that for Dr. Reyes. Next, let's quickly make sure " + name + "'s health history is up to date.",
        healthCheck: "",
        yourDetails: isNew ? "Thanks — now let's get a couple of details from you." : "Thanks — now let's confirm a couple of details on file.",
        coverage: "Perfect. Next, let's " + (isNew ? "set up" : "check") + " " + name + "'s insurance.",
        payment: "All set on coverage. Last few things before you're done.",
        consents: "",
        review: "",
      };
      const line = lines[next];
      if (line) say(line);
    }
    // Every step's own opening info card is inserted here, at the moment we
    // transition into it — never during that step's own render — so it
    // appears exactly once regardless of re-renders.
    if (next === "history" && !isNew) info(["On file", "Penicillin allergy · Asthma plan"]);
    if (next === "payment") info(["Based on your plan", "Today's estimated visit cost is " + COPAY]);
    if (next === "consents" && !isNew) info(["Your consent forms", "HIPAA Privacy Notice, Financial Policy — on file and up to date"]);
    if (next === "review") {
      say("Here's everything for tomorrow's visit.");
      const lines = isNew
        ? [
            "Guardian: " + (guardianName || GUARDIAN) + (guardianRel ? " (" + guardianRel + ")" : "") + " — added",
            "Health history: " + (historyItems.length ? historyItems.join(", ") : "nothing reported"),
            "Insurance: " + (insurerName || "BlueShield PPO") + (memberIdInput ? " ••" + memberIdInput.slice(-4) : "") + " — added",
            "Payment: " + (payMethod || "Card") + ", " + COPAY + " estimated",
            "Consents: " + consentsAgreed.length + " of " + NEW_CONSENT_DOCS.length + " signed today",
          ]
        : [
            "Guardian: " + (guardianIsMe === false ? guardianName + " (" + guardianRel + ")" : GUARDIAN) + " (confirmed)",
            "Health history: " + (historyChanged ? "updated" : "unchanged"),
            "Insurance: BlueShield PPO ••4821 (" + (coverageChanged ? "updated" : "unchanged") + ")",
            "Payment: " + (payMethod || "Visa ••4242") + ", " + COPAY + " estimated",
            "Consents: on file, " + (consentsChanged ? "updated" : "no changes"),
          ];
      setThread((t) => [...t, { kind: "summary", label: "Visit details", lines }]);
    }
    setStep(next);
    setSub(0);
  }

  function jumpToReview(fromStep: Step) {
    setReturnToReview(true);
    setReviewingFrom(fromStep);
    setStep(fromStep);
    setSub(0);
  }

  const stage = STEP_STAGE[step];
  const stageIdx = STAGE_INDEX[stage];

  // ============================= PICKER =============================
  if (screen === "picker") {
    const CARD: React.CSSProperties = { cursor: "pointer", background: "#ffffff", border: "1.5px solid " + LINE, borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 4 };
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#eef1f6", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
        <div style={{ position: "relative", width: 390, height: 844, background: "#ffffff", borderRadius: 44, boxShadow: "0 30px 70px rgba(16,32,50,0.18),0 2px 6px rgba(16,32,50,0.08)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <StatusBar />
          <div style={{ padding: "10px 0 16px", borderBottom: "1px solid " + LINE }}>
            <Logo />
          </div>
          <div style={{ flex: 1, padding: "26px 22px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: INK, lineHeight: 1.2 }}>Who&apos;s checking in?</div>
            <div style={{ fontSize: 15, color: MUTED, marginTop: 10, lineHeight: 1.45 }}>Two intake paths, same conversation — what differs is how much is already on file.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
              <div className="tap" onClick={() => { setPatientFlow("returning"); setScreen("landing"); }} style={CARD}>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK }}>Returning patient</div>
                <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.4 }}>{RETURNING_NAME} has visited before — we confirm what&apos;s already on file.</div>
              </div>
              <div className="tap" onClick={() => { setPatientFlow("new"); setScreen("landing"); }} style={CARD}>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK }}>New patient</div>
                <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.4 }}>First visit for {NEW_NAME} — nothing on file yet, so we collect it as we go.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================= LANDING =============================
  if (screen === "landing") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#eef1f6", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
        <div style={{ position: "relative", width: 390, height: 844, background: "#ffffff", borderRadius: 44, boxShadow: "0 30px 70px rgba(16,32,50,0.18),0 2px 6px rgba(16,32,50,0.08)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <StatusBar />
          <div style={{ padding: "10px 0 16px", borderBottom: "1px solid " + LINE }}>
            <Logo />
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 24px", display: "flex", flexDirection: "column" }}>
            <div className="tap" onClick={() => setScreen("picker")} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.05em", color: MUTED, textTransform: "uppercase", marginBottom: 14 }}>‹ Switch patient type</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: INK, lineHeight: 1.2 }}>{isNew ? "Let's get " + name + " ready for her first visit" : "How is " + name + " doing?"}</div>
            <div style={{ fontSize: 15, color: MUTED, marginTop: 10, lineHeight: 1.45 }}>{isNew ? "A few quick things before " + PROVIDER + " meets " + name + ". Takes about five minutes." : "Tell us before the visit so " + PROVIDER + " is ready. Takes about two minutes."}</div>

            <div style={{ background: "#ffffff", border: "1px solid " + LINE, borderRadius: 18, padding: 20, marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#dff5f4", color: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>{name[0]}</div>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: INK }}>{name}</div>
                  <div style={{ fontSize: 14, color: MUTED, marginTop: 2 }}>{ageLabel} · Child</div>
                </div>
              </div>
              <div style={{ height: 1, background: LINE, margin: "16px 0 12px" }} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: MUTED, textTransform: "uppercase" }}>{isNew ? "First visit" : "Next visit"}</div>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: INK, marginTop: 4 }}>{VISIT_WHEN} · {PROVIDER}</div>
            </div>

            {!isNew && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#ffffff", border: "1px solid " + LINE, borderRadius: 16, padding: "15px 16px", marginTop: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: AMBER, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 14.5, lineHeight: 1.4 }}>
                  <span style={{ color: MUTED }}>We already have: </span>
                  <span style={{ color: INK, fontWeight: 700 }}>Penicillin allergy · Asthma plan</span>
                </div>
                <div style={{ color: MUTED, fontSize: 18 }}>›</div>
              </div>
            )}
            {isNew && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#ffffff", border: "1px solid " + LINE, borderRadius: 16, padding: "15px 16px", marginTop: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: MUTED, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 14.5, lineHeight: 1.4, color: MUTED }}>Nothing on file yet — we&apos;ll collect health history, ID, insurance, and consents as we go.</div>
              </div>
            )}

            <div style={{ marginTop: "auto", paddingTop: 24 }}>
              <div className="tap" onClick={startFlow} style={{ cursor: "pointer", background: BLUE, color: "#ffffff", borderRadius: 999, padding: 19, textAlign: "center", fontSize: 16.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: "0 8px 20px rgba(47,123,255,0.3)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"><path d="M4 5h16v11H8l-4 4V5Z" /></svg>
                Tell us what&apos;s going on
              </div>
              <div style={{ textAlign: "center", fontSize: 13, color: MUTED, marginTop: 12 }}>{isNew ? "About 5 min · we save as you go" : "About 10 min · we save as you go"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================= FLOW =============================
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#eef1f6", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}>
      <style>{`
        .tap { transition: transform 100ms ease-out, filter 100ms ease-out; }
        .tap:active { transform: scale(0.97); filter: brightness(0.97); }
      `}</style>
      <div style={{ position: "relative", width: 390, height: 844, background: "#ffffff", borderRadius: 44, boxShadow: "0 30px 70px rgba(16,32,50,0.18),0 2px 6px rgba(16,32,50,0.08)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <StatusBar />

        <div style={{ padding: "2px 20px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="tap" onClick={() => setScreen("landing")} style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.05em", color: MUTED, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 16 }}>‹</span> {stage}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.05em", color: MUTED, textTransform: "uppercase" }}>Step {stageIdx} of 5</div>
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {STAGES.map((st) => (
              <div key={st} style={{ flex: 1, height: 4, borderRadius: 2, background: STAGE_INDEX[st] <= stageIdx ? BLUE : LINE }} />
            ))}
          </div>
        </div>

        <div ref={threadRef} style={{ flex: 1, overflowY: "auto", padding: "6px 20px 14px", display: "flex", flexDirection: "column", gap: 14, background: BG }}>
          {thread.map((item, i) => {
            if (item.kind === "ai") return <AiTurn key={i} text={item.text} />;
            if (item.kind === "info") return <InfoCard key={i} lines={item.lines} />;
            if (item.kind === "summary") return <SummaryCard key={i} label={item.label} lines={item.lines} />;
            return <AnswerBubble key={i} text={item.text} time={item.time} />;
          })}
        </div>

        {/* -------------------- Bottom sheet -------------------- */}
        <div style={{ background: "#ffffff", borderRadius: "26px 26px 0 0", boxShadow: "0 -6px 20px rgba(13,20,33,0.07)", flexShrink: 0, maxHeight: 460, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: LINE }} />
          </div>
          <div style={{ overflowY: "auto", padding: "12px 22px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
            {returnToReview && (
              <div style={{ fontSize: 12.5, fontWeight: 600, color: AMBER, textAlign: "center" }}>Editing {STEP_LABEL[reviewingFrom || step]} — you&apos;ll return to Review after.</div>
            )}

            {/* ===== STEP 1 · HEALTH ===== */}
            {step === "health" && sub === 0 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>How is {name} doing today?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  {["Doing well", "Not so good", "About the same"].map((v) => (
                    <div key={v} className="tap" onClick={() => {
                      reply(v);
                      if (v === "Doing well") { say("Glad to hear it! Just to be safe, is there anything at all going on we should know about?"); setSub(4); }
                      else { say("I'm sorry to hear that. I'll ask a few quick questions to help " + PROVIDER + " prepare."); setSub(1); }
                    }} style={PILL}>{v}</div>
                  ))}
                </div>
              </>
            )}
            {step === "health" && sub === 1 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>What&apos;s going on with {name}?</div>
                <div style={{ fontSize: 13.5, color: MUTED }}>You can select all that apply.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {["Fever", "Cough", "Ear pain", "Tummy ache", "Headache", "Something else"].map((v) => {
                    const on = symptoms.includes(v);
                    return (
                      <div key={v} className="tap" onClick={() => setSymptoms((s) => (on ? s.filter((x) => x !== v) : [...s, v]))} style={CHECK_ROW}>
                        <div style={on ? BOX_ON : BOX}>{on ? "✓" : ""}</div>
                        <div style={{ fontSize: 14.5, color: INK }}>{v}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1.5px solid " + LINE, borderRadius: 999, padding: "6px 6px 6px 16px" }}>
                  <input placeholder="Type your answer..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14.5, color: INK }} />
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#ffffff", border: "1px solid " + LINE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.8"><path d="M12 4.5a2.8 2.8 0 0 1 2.8 2.8v4.4a2.8 2.8 0 0 1-5.6 0V7.3A2.8 2.8 0 0 1 12 4.5Z" /><path d="M6.6 11.4a5.4 5.4 0 0 0 10.8 0" /></svg>
                  </div>
                </div>
                <div className="tap" onClick={() => { if (symptoms.length) { reply(symptoms.join(" · ")); say("Got it. Roughly how long has this been going on?"); setSub(2); } }} style={symptoms.length ? PRIMARY_BTN : PRIMARY_BTN_OFF}>Continue</div>
              </>
            )}
            {step === "health" && sub === 2 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>How long has this been going on?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  {["Today", "1–2 days", "2–3 days", "A week or more"].map((v) => (
                    <div key={v} className="tap" onClick={() => { reply(v); say("Is it worse at any particular time, like lying down or after eating?"); setSub(3); }} style={PILL}>{v}</div>
                  ))}
                </div>
              </>
            )}
            {step === "health" && sub === 3 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Is it worse at any particular time?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  {["Worse lying down", "Worse after eating", "No pattern", "Not sure"].map((v) => (
                    <div key={v} className="tap" onClick={() => {
                      reply(v);
                      info(["Here's what I understood about " + name, symptoms.join(" · ") || "No specific symptoms flagged", "Started " + "a couple of days ago", v]);
                      setThread((t) => [...t, { kind: "summary", label: "Health summary", lines: [
                        (symptoms.join(", ") || "General discomfort") + ", started recently.",
                        v + ".",
                        "Mild to moderate — nothing urgent flagged.",
                      ] }]);
                      say("Does that sound right?");
                      setSub(5);
                    }} style={PILL}>{v}</div>
                  ))}
                </div>
              </>
            )}
            {step === "health" && sub === 4 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Anything else we should know?</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", border: "1.5px solid " + LINE, borderRadius: 999, padding: "6px 6px 6px 16px" }}>
                  <input placeholder="Type your answer..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14.5, color: INK }} />
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#ffffff", border: "1px solid " + LINE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="1.8"><path d="M12 4.5a2.8 2.8 0 0 1 2.8 2.8v4.4a2.8 2.8 0 0 1-5.6 0V7.3A2.8 2.8 0 0 1 12 4.5Z" /><path d="M6.6 11.4a5.4 5.4 0 0 0 10.8 0" /></svg>
                  </div>
                </div>
                <div className="tap" onClick={() => {
                  reply("Nothing else — she's doing well");
                  setThread((t) => [...t, { kind: "summary", label: "Health summary", lines: ["No new concerns — " + name + " is doing well.", "Routine visit."] }]);
                  say("Sounds good. Does that look right?");
                  setSub(5);
                }} style={PRIMARY_BTN}>Continue</div>
              </>
            )}
            {step === "health" && sub === 5 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Does that sound right?</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="tap" onClick={() => { reply("Yes, that's right"); nextStep(); }} style={{ ...PILL_ON, flex: 1 }}>Yes, that&apos;s right</div>
                  <div className="tap" onClick={() => { reply("Something needs changing"); setSub(1); setSymptoms([]); say("No problem — let's go through it again."); }} style={{ ...PILL, flex: 1 }}>Something needs changing</div>
                </div>
              </>
            )}

            {/* ===== STEP 2 · HISTORY ===== */}
            {step === "history" && sub === 0 && !isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Has anything changed or been added since her last visit?</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="tap" onClick={() => { reply("Nothing's changed"); nextStep(); }} style={{ ...PILL_ON, flex: 1 }}>Nothing&apos;s changed</div>
                  <div className="tap" onClick={() => { reply("Something's changed"); setHistoryChanged(true); setSub(1); say("What's changed or been added?"); }} style={{ ...PILL, flex: 1 }}>Something&apos;s changed</div>
                </div>
              </>
            )}
            {step === "history" && sub === 1 && !isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>What&apos;s changed or been added?</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {["New allergy", "New medication", "New diagnosis", "Something else"].map((v) => (
                    <div key={v} className="tap" onClick={() => { reply(v); info(["Updated", v]); nextStep(); }} style={CHECK_ROW}>
                      <div style={BOX} />
                      <div style={{ fontSize: 14, color: INK }}>{v}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {step === "history" && sub === 0 && isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Does {name} have any allergies, medications, or ongoing conditions we should know about?</div>
                <div style={{ fontSize: 13.5, color: MUTED }}>You can select all that apply.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {["Allergies", "Medications", "Ongoing condition", "None of these"].map((v) => {
                    const on = historyItems.includes(v);
                    return (
                      <div key={v} className="tap" onClick={() => setHistoryItems((s) => (on ? s.filter((x) => x !== v) : [...s, v]))} style={CHECK_ROW}>
                        <div style={on ? BOX_ON : BOX}>{on ? "✓" : ""}</div>
                        <div style={{ fontSize: 14, color: INK }}>{v}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="tap" onClick={() => { if (historyItems.length) { reply(historyItems.join(" · ")); info(["Health history on file", historyItems.join(", ")]); nextStep(); } }} style={historyItems.length ? PRIMARY_BTN : PRIMARY_BTN_OFF}>Continue</div>
              </>
            )}

            {/* ===== STEP 3 · HEALTH CHECK (screener) — conditional: gated on ===== */}
            {/* an existing condition for a returning patient, or skipped (nothing */}
            {/* to gate on yet) for a new one. */}
            {step === "healthCheck" && sub === 0 && !isNew && (
              <>
                  <div style={{ fontSize: 13.5, color: MUTED, marginBottom: -6 }}>A couple of quick standard check-in questions, since {name} has an asthma plan on file.</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Has {name} used her rescue inhaler in the past 7 days?</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["Yes", "No"].map((v) => (
                      <div key={v} className="tap" onClick={() => { reply(v); setSub(1); say("Has she had any nighttime symptoms this month?"); }} style={{ ...PILL, flex: 1 }}>{v}</div>
                    ))}
                  </div>
              </>
            )}
            {step === "healthCheck" && sub === 0 && isNew && (
              <>
                <div style={{ fontSize: 13.5, color: MUTED, marginBottom: -6 }}>No condition-specific screening applies yet — there&apos;s nothing on file to check against.</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>We&apos;ll follow up on this after today&apos;s visit if {PROVIDER} flags anything.</div>
                <div className="tap" onClick={() => { reply("Got it"); nextStep(); }} style={PRIMARY_BTN}>Continue</div>
              </>
            )}
            {step === "healthCheck" && sub === 1 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Has she had any nighttime symptoms this month?</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {["Yes", "No"].map((v) => (
                    <div key={v} className="tap" onClick={() => { reply(v); nextStep(); }} style={{ ...PILL, flex: 1 }}>{v}</div>
                  ))}
                </div>
              </>
            )}

            {/* ===== STEP 4 · YOUR DETAILS ===== */}
            {step === "yourDetails" && sub === 0 && !isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>I have {GUARDIAN} listed as {name}&apos;s parent or guardian. Is that you?</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="tap" onClick={() => { reply("Yes, that's me"); setGuardianIsMe(true); setSub(2); say("Thanks. Please confirm the last 4 digits of the ID we have on file."); }} style={{ ...PILL_ON, flex: 1 }}>Yes, that&apos;s me</div>
                  <div className="tap" onClick={() => { reply("No, someone else"); setGuardianIsMe(false); setSub(1); say("No problem — who's completing this today?"); }} style={{ ...PILL, flex: 1 }}>No, someone else</div>
                </div>
              </>
            )}
            {step === "yourDetails" && sub === 0 && isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Who&apos;s completing this intake today?</div>
                <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Full name" style={INPUT} />
                <input value={guardianRel} onChange={(e) => setGuardianRel(e.target.value)} placeholder={"Relationship to " + name} style={INPUT} />
                <div className="tap" onClick={() => { if (guardianName && guardianRel) { reply(guardianName + " · " + guardianRel); info(["Guardian added", guardianName + " (" + guardianRel + ")"]); setSub(2); say("Thanks. Let's also capture a photo ID for our records."); } }} style={guardianName && guardianRel ? PRIMARY_BTN : PRIMARY_BTN_OFF}>Continue</div>
              </>
            )}
            {step === "yourDetails" && sub === 1 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Who&apos;s completing this today?</div>
                <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Full name" style={INPUT} />
                <input value={guardianRel} onChange={(e) => setGuardianRel(e.target.value)} placeholder={"Relationship to " + name} style={INPUT} />
                <div className="tap" onClick={() => { if (guardianName && guardianRel) { reply(guardianName + " · " + guardianRel); info(["Guardian updated", guardianName + " (" + guardianRel + ")"]); setSub(2); say("Thanks. Please confirm the last 4 digits of the ID we have on file."); } }} style={guardianName && guardianRel ? PRIMARY_BTN : PRIMARY_BTN_OFF}>Continue</div>
              </>
            )}
            {step === "yourDetails" && sub === 2 && !isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Confirm the last 4 digits of the ID on file</div>
                <input placeholder="•• •• 4821" style={INPUT} defaultValue="8821" />
                <div className="tap" onClick={() => { reply("8821 — confirmed"); nextStep(); }} style={PRIMARY_BTN}>Confirm ID</div>
              </>
            )}
            {step === "yourDetails" && sub === 2 && isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Capture a photo ID</div>
                <div style={{ border: "1.5px dashed " + LINE, borderRadius: 16, padding: "26px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: MUTED }}>Driver&apos;s license or state ID</div>
                  <div className="tap" onClick={() => { setIdPhotoTaken(true); reply("ID captured"); info(["Guardian ID on file", guardianName || GUARDIAN]); nextStep(); }} style={{ ...PRIMARY_BTN, marginTop: 14 }}>{idPhotoTaken ? "Retake photo" : "Take photo"}</div>
                </div>
              </>
            )}

            {/* ===== STEP 5 · COVERAGE ===== */}
            {step === "coverage" && sub === 0 && !isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>We have {name}&apos;s insurance on file as BlueShield PPO, member ending 4821. Is this still correct?</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="tap" onClick={() => { reply("Yes, still correct"); nextStep(); }} style={{ ...PILL_ON, flex: 1 }}>Yes, still correct</div>
                  <div className="tap" onClick={() => { reply("It's changed"); setCoverageChanged(true); setSub(1); say("No problem — let's scan the new card."); }} style={{ ...PILL, flex: 1 }}>It&apos;s changed</div>
                </div>
              </>
            )}
            {step === "coverage" && sub === 0 && isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>What insurance will {name} be using?</div>
                <input value={insurerName} onChange={(e) => setInsurerName(e.target.value)} placeholder="Insurance company" style={INPUT} />
                <input value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value)} placeholder="Member ID" style={INPUT} />
                <div className="tap" onClick={() => { if (insurerName && memberIdInput) { reply(insurerName + " · " + memberIdInput); setSub(1); say("Let's scan the card so we have it on file."); } }} style={insurerName && memberIdInput ? PRIMARY_BTN : PRIMARY_BTN_OFF}>Continue</div>
              </>
            )}
            {step === "coverage" && sub === 1 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Scan your insurance card</div>
                <div style={{ border: "1.5px dashed " + LINE, borderRadius: 16, padding: "26px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: MUTED }}>Front, then back</div>
                  <div className="tap" onClick={() => { setScanned(true); reply("Card scanned"); info([isNew ? "Insurance added" : "Insurance updated", isNew ? (insurerName || "New plan") + " on file" : "New plan on file"]); nextStep(); }} style={{ ...PRIMARY_BTN, marginTop: 14 }}>{scanned ? "Rescan" : "Take photo"}</div>
                </div>
              </>
            )}

            {/* ===== STEP 6 · PAYMENT ===== */}
            {step === "payment" && sub === 0 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>How would you like to pay?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  {(isNew ? ["Add a card", "Pay at desk"] : ["Visa ••••4242", "Different card", "Pay at desk"]).map((v) => (
                    <div key={v} className="tap" onClick={() => { setPayPending(v); setSub(1); }} style={payPending === v ? PILL_ON : PILL}>{v}</div>
                  ))}
                </div>
              </>
            )}
            {step === "payment" && sub === 1 && (
              <>
                <div style={{ fontSize: 15.5, color: MUTED }}>You selected <strong style={{ color: INK }}>{payPending}</strong>. Nothing is charged until you confirm.</div>
                <div className="tap" onClick={() => { setPayMethod(payPending); reply(payPending || ""); info(["Payment confirmed", (payPending || "") + " · " + COPAY]); nextStep(); }} style={PRIMARY_BTN}>Confirm payment of {COPAY}</div>
                <div className="tap" onClick={() => setSub(0)} style={{ cursor: "pointer", textAlign: "center", fontSize: 13.5, color: MUTED }}>Choose a different method</div>
              </>
            )}

            {/* ===== STEP 7 · CONSENTS ===== */}
            {step === "consents" && sub === 0 && !isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Does anything need updating?</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="tap" onClick={() => { reply("No, all good"); nextStep(); }} style={{ ...PILL_ON, flex: 1 }}>No, all good</div>
                  <div className="tap" onClick={() => { reply("Yes, update something"); setConsentsChanged(true); setSub(1); say("Which one needs updating?"); }} style={{ ...PILL, flex: 1 }}>Yes, update something</div>
                </div>
              </>
            )}
            {step === "consents" && sub === 1 && !isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Which one needs updating?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  {["HIPAA Privacy Notice", "Financial Policy"].map((v) => (
                    <div key={v} className="tap" onClick={() => { reply(v); info(["Flagged for review", v]); nextStep(); }} style={PILL}>{v}</div>
                  ))}
                </div>
              </>
            )}
            {step === "consents" && sub === 0 && isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Please review and agree to continue</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {NEW_CONSENT_DOCS.map((v) => {
                    const on = consentsAgreed.includes(v);
                    return (
                      <div key={v} className="tap" onClick={() => setConsentsAgreed((s) => (on ? s.filter((x) => x !== v) : [...s, v]))} style={CHECK_ROW}>
                        <div style={on ? BOX_ON : BOX}>{on ? "✓" : ""}</div>
                        <div style={{ fontSize: 14.5, color: INK }}>{v}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="tap" onClick={() => { if (consentsAgreed.length === NEW_CONSENT_DOCS.length) { reply("Agreed to all " + NEW_CONSENT_DOCS.length + " documents"); setSub(1); say("Please sign to confirm."); } }} style={consentsAgreed.length === NEW_CONSENT_DOCS.length ? PRIMARY_BTN : PRIMARY_BTN_OFF}>Continue</div>
              </>
            )}
            {step === "consents" && sub === 1 && isNew && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Sign to confirm</div>
                <input value={signedName || guardianName} onChange={(e) => setSignedName(e.target.value)} placeholder="Type your full name" style={INPUT} />
                <div className="tap" onClick={() => { const sig = signedName || guardianName; if (sig) { setSignedName(sig); reply(sig + " — signed"); nextStep(); } }} style={(signedName || guardianName) ? PRIMARY_BTN : PRIMARY_BTN_OFF}>Sign and continue</div>
              </>
            )}

            {/* ===== STEP 8 · REVIEW ===== */}
            {step === "review" && sub === 0 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>Everything look right?</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="tap" onClick={() => { reply("Everything looks right"); say("Perfect — " + name + "'s all set for tomorrow. See you then!"); setSub(2); }} style={{ ...PILL_ON, flex: 1 }}>Everything looks right</div>
                  <div className="tap" onClick={() => setSub(1)} style={{ ...PILL, flex: 1 }}>Review something</div>
                </div>
              </>
            )}
            {step === "review" && sub === 1 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>What would you like to review?</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {([["Health", "health"], ["History", "history"], ["Details", "yourDetails"], ["Coverage", "coverage"], ["Payment", "payment"], ["Consents", "consents"]] as [string, Step][]).map(([label, s]) => (
                    <div key={s} className="tap" onClick={() => jumpToReview(s)} style={{ ...CHECK_ROW, justifyContent: "space-between" }}>
                      <div style={{ fontSize: 14.5, color: INK, fontWeight: 600 }}>{label}</div>
                      <div style={{ color: MUTED }}>›</div>
                    </div>
                  ))}
                </div>
                <div className="tap" onClick={() => setSub(0)} style={{ cursor: "pointer", textAlign: "center", fontSize: 13.5, color: MUTED }}>Never mind, go back</div>
              </>
            )}
            {step === "review" && sub === 2 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "10px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#16a34a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800 }}>✓</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK }}>Intake complete.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
