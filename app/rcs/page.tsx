"use client";

import { useEffect, useRef, useState } from "react";
import { StatusBar } from "../components/StatusBar";

// ---------- RCS-style coverage + payment flow, Cleo/Qonto/Trainline
// inspired but flat (no gradients). Two zones, like Cleo's "Ask Cleo"
// screens: a scrolling feed above holds statements and confirmations —
// what's already known or already happened — while a fixed sheet docked to
// the bottom holds only the one thing still open: the current question and
// its tappable options. Once an answer is given it leaves the sheet and
// becomes a line in the feed; the sheet moves on to whatever's next.

const INK = "#2E140B"; // dark maroon — headlines, primary buttons
const MUTED = "#8A7A6E"; // secondary text
const CREAM = "#F5F1EA"; // page background
const LINE = "#ECE4D8"; // card borders / dividers
const GREEN = "#16a34a"; // universal "done" signal

const PATIENT_NAME = "Ana";
const PATIENT_AGE = 8;
const PROVIDER = "Dr. Reyes";
const VISIT_TYPE = "Sick visit";
const VISIT_WHEN = "Tomorrow · 10:20 AM";
const COPAY = "$25";
const SAVED_CARD = { label: "Visa ending 4242", brand: "VISA" };

type Step = "visit" | "eligibility" | "editElig" | "payment" | "newCard" | "done";

type CardDraft = { number: string; exp: string; cvc: string; zip: string };

const PROGRESS: Record<Step, number> = { visit: 18, eligibility: 42, editElig: 42, payment: 70, newCard: 70, done: 100 };

const BTN: React.CSSProperties = { cursor: "pointer", background: INK, color: CREAM, borderRadius: 999, padding: 17, textAlign: "center", fontSize: 16, fontWeight: 700 };
const BTN_OFF: React.CSSProperties = { background: "#ded3c3", color: "#a89a89", borderRadius: 999, padding: 17, textAlign: "center", fontSize: 16, fontWeight: 700, cursor: "default" };
const PILL: React.CSSProperties = { cursor: "pointer", background: "#ffffff", border: "1.5px solid " + INK, color: INK, borderRadius: 999, padding: "13px 18px", fontSize: 14.5, fontWeight: 700, textAlign: "center" };
const PILL_ON: React.CSSProperties = { ...PILL, background: INK, color: CREAM };
const CARD: React.CSSProperties = { background: "#ffffff", border: "1px solid " + LINE, borderRadius: 18, padding: 18 };
const INPUT: React.CSSProperties = { border: "1.5px solid " + LINE, borderRadius: 10, padding: "11px 13px", fontSize: 15, outline: "none", background: "#faf7f2", color: INK, width: "100%" };
const ROW_LABEL: React.CSSProperties = { color: MUTED, fontSize: 12.5 };
const ROW_VALUE: React.CSSProperties = { fontWeight: 700, color: INK, textAlign: "right" };
const REPLY: React.CSSProperties = { alignSelf: "flex-end", maxWidth: "78%", background: INK, color: CREAM, borderRadius: "16px 4px 16px 16px", padding: "11px 15px", fontSize: 14.5, fontWeight: 700 };

export default function RcsCleanPage() {
  const [step, setStep] = useState<Step>("visit");
  const [eligDone, setEligDone] = useState(false);
  const [eligConfirmed, setEligConfirmed] = useState(false);
  const [eligEdited, setEligEdited] = useState(false);
  const [insurer, setInsurer] = useState("Aetna Choice POS II");
  const [memberId, setMemberId] = useState("W2748813902");
  const [payMethod, setPayMethod] = useState<string | null>(null);
  const [payConfirmed, setPayConfirmed] = useState(false);
  const [card, setCard] = useState<CardDraft>({ number: "", exp: "", cvc: "", zip: "" });
  const [saveCard, setSaveCard] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);

  // The eligibility check runs the moment its step is reached — nothing to
  // tap, the practice already ran it.
  useEffect(() => {
    if (step !== "eligibility" || eligDone) return;
    const t = setTimeout(() => setEligDone(true), 1400);
    return () => clearTimeout(t);
  }, [step, eligDone]);
  const checking = step === "eligibility" && !eligDone;

  // Chat feed grows downward — keep the newest line in view as each beat
  // resolves.
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [eligDone, eligConfirmed, payConfirmed, step]);

  const cardDigits = card.number.replace(/[^0-9]/g, "");
  const usingNewCard = payMethod === "new";
  const newCardValid = cardDigits.length >= 15 && card.exp.trim().length >= 4 && card.cvc.trim().length >= 3 && card.zip.trim().length >= 4;
  const paidLabel = usingNewCard ? "Card ····" + (cardDigits.slice(-4) || "····") : payMethod === "desk" ? "Pay at the desk" : SAVED_CARD.label;

  function restart() {
    setStep("visit");
    setEligDone(false);
    setEligConfirmed(false);
    setEligEdited(false);
    setPayMethod(null);
    setPayConfirmed(false);
    setCard({ number: "", exp: "", cvc: "", zip: "" });
    setSaveCard(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: CREAM, fontFamily: "'Outfit',system-ui,sans-serif" }}>
      <style>{`
        @keyframes rcsDot { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }
        .dot { animation: rcsDot 1100ms ease-in-out infinite; }
        .tap { transition: transform 100ms ease-out, filter 100ms ease-out; }
        .tap:active { transform: scale(0.97); filter: brightness(0.97); }
      `}</style>
      <div style={{ position: "relative", width: 390, height: 844, background: CREAM, borderRadius: 44, boxShadow: "0 30px 70px rgba(16,32,50,0.18),0 2px 6px rgba(16,32,50,0.08)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <StatusBar />

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 20px 10px" }}>
          <div className="tap" onClick={() => back(step, setStep)} style={{ cursor: "pointer", fontSize: 22, color: INK, width: 28 }}>‹</div>
          <div style={{ flex: 1, height: 4, background: LINE, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: PROGRESS[step] + "%", background: INK, borderRadius: 2, transition: "width 260ms ease-out" }} />
          </div>
          <div style={{ width: 28 }} />
        </div>

        {/* ---- Feed: statements, confirmations, receipts — what's already known or already happened ---- */}
        <div ref={feedRef} style={{ flex: 1, overflowY: "auto", padding: "8px 20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "center", background: "#ffffff", border: "1px solid " + LINE, borderRadius: 999, padding: "6px 14px 6px 6px" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: INK, color: CREAM, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>B</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.04em", color: MUTED, textTransform: "uppercase" }}>Verified practice · RCS</div>
          </div>

          <div style={CARD}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: MUTED, textTransform: "uppercase" }}>This visit</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ROW_LABEL}>Reason</span><span style={ROW_VALUE}>{VISIT_TYPE} · {PROVIDER}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ROW_LABEL}>When</span><span style={ROW_VALUE}>{VISIT_WHEN}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ROW_LABEL}>Patient</span><span style={ROW_VALUE}>{PATIENT_NAME} · {PATIENT_AGE} years</span></div>
            </div>
            <div style={{ height: 1, background: LINE, margin: "12px 0" }} />
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.4 }}>On file: penicillin allergy · ear pain reported in March · asthma plan current.</div>
          </div>

          {step !== "visit" && (
            <div style={{ fontSize: 15, color: INK, fontWeight: 600 }}>{!eligDone ? "Checking " + PATIENT_NAME + "'s coverage with the insurer…" : "Good news — coverage is active."}</div>
          )}
          {checking && (
            <div style={{ display: "flex", gap: 5 }}>
              {[0, 1, 2].map((i) => <div key={i} className="dot" style={{ width: 7, height: 7, borderRadius: "50%", background: MUTED, animationDelay: i * 140 + "ms" }} />)}
            </div>
          )}

          {eligDone && (
            <div style={CARD}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: MUTED, textTransform: "uppercase" }}>Coverage on file</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ROW_LABEL}>Insurance company</span><span style={ROW_VALUE}>{insurer}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ROW_LABEL}>Member ID</span><span style={ROW_VALUE}>{memberId}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ROW_LABEL}>Policyholder</span><span style={ROW_VALUE}>Elena Marquez</span></div>
              </div>
              <div style={{ height: 1, background: LINE, margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ROW_LABEL}>Copay this visit</span><span style={{ fontWeight: 800, color: GREEN }}>{COPAY}</span></div>
            </div>
          )}

          {eligConfirmed && (
            <>
              <div style={REPLY}>{eligEdited ? "Updated the plan" : "Looks right"}</div>
              <div style={{ fontSize: 15, color: INK, fontWeight: 600 }}>Your copay is {COPAY} — how would you like to pay?</div>
            </>
          )}

          {payConfirmed && (
            <>
              <div style={REPLY}>{paidLabel}</div>
              <div style={{ alignSelf: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "6px 0" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: GREEN, color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>✓</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: INK }}>Payment confirmed.</div>
              </div>
              <div style={CARD}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: MUTED, textTransform: "uppercase" }}>Receipt</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ROW_LABEL}>Visit</span><span style={ROW_VALUE}>{VISIT_TYPE} · {PROVIDER}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ROW_LABEL}>Coverage</span><span style={ROW_VALUE}>{insurer}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={ROW_LABEL}>Payment method</span><span style={ROW_VALUE}>{paidLabel}</span></div>
                </div>
                <div style={{ height: 1, background: LINE, margin: "12px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 800, color: INK }}>Due after visit</span><span style={{ fontWeight: 800, color: GREEN }}>{COPAY}</span></div>
              </div>
            </>
          )}
        </div>

        {/* ---- Sheet: the one open question right now, docked to the bottom ---- */}
        <div style={{ background: "#ffffff", borderRadius: "22px 22px 0 0", boxShadow: "0 -6px 20px rgba(46,20,11,0.06)", padding: "10px 20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ alignSelf: "center", width: 36, height: 4, borderRadius: 2, background: LINE }} />

          {step === "visit" && (
            <div className="tap" onClick={() => setStep("eligibility")} style={BTN}>Check coverage</div>
          )}

          {step === "eligibility" && checking && (
            <div style={{ textAlign: "center", fontSize: 13.5, color: MUTED }}>Checking with the insurer…</div>
          )}

          {step === "eligibility" && eligDone && !eligConfirmed && (
            <>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: INK }}>Does this look right?</div>
              <div style={{ display: "flex", gap: 10 }}>
                <div className="tap" onClick={() => { setEligConfirmed(true); setEligEdited(false); }} style={{ ...PILL_ON, flex: 1 }}>Looks right</div>
                <div className="tap" onClick={() => setStep("editElig")} style={{ ...PILL, flex: 1 }}>Something&apos;s changed</div>
              </div>
            </>
          )}

          {step === "eligibility" && eligConfirmed && (
            <div className="tap" onClick={() => setStep("payment")} style={BTN}>Continue</div>
          )}

          {step === "editElig" && (
            <>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: INK }}>Update the plan</div>
              <input value={insurer} onChange={(e) => setInsurer(e.target.value)} placeholder="Insurance company" style={INPUT} />
              <input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="Member ID" style={INPUT} />
              <div className="tap" onClick={() => { setEligConfirmed(true); setEligEdited(true); setStep("eligibility"); }} style={BTN}>Save updated plan</div>
              <div className="tap" onClick={() => setStep("eligibility")} style={{ cursor: "pointer", textAlign: "center", fontSize: 13.5, color: MUTED }}>Never mind, that&apos;s right</div>
            </>
          )}

          {step === "payment" && (
            <>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: INK }}>How would you like to pay?</div>
              <div style={{ border: "1px solid " + LINE, borderRadius: 16, overflow: "hidden" }}>
                {[{ key: "saved", label: SAVED_CARD.label, tile: "VISA" }, { key: "desk", label: "Pay at the desk", tile: "$" }].map((opt, i) => {
                  const selected = payMethod === opt.key;
                  return (
                    <div key={opt.key} className="tap" onClick={() => { setPayMethod(opt.key); setPayConfirmed(true); setStep("done"); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", borderTop: i > 0 ? "1px solid " + LINE : "none", cursor: "pointer" }}>
                      <div style={{ width: 34, height: 22, borderRadius: 4, background: opt.tile === "VISA" ? "#1a1f71" : LINE, color: opt.tile === "VISA" ? "#ffffff" : MUTED, fontSize: opt.tile === "VISA" ? 9 : 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{opt.tile}</div>
                      <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: INK }}>{opt.label}</div>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", border: "1.6px solid " + (selected ? INK : LINE), background: selected ? INK : "transparent", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{selected ? "✓" : ""}</div>
                    </div>
                  );
                })}
              </div>
              <div className="tap" onClick={() => setStep("newCard")} style={{ ...PILL, alignSelf: "flex-start" }}>+ Use a different card</div>
            </>
          )}

          {step === "newCard" && (
            <>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: INK }}>Add a card</div>
              <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="Card number" style={INPUT} />
              <div style={{ display: "flex", gap: 8 }}>
                <input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" style={{ ...INPUT, flex: 1 }} />
                <input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="CVC" style={{ ...INPUT, width: 72 }} />
                <input value={card.zip} onChange={(e) => setCard({ ...card, zip: e.target.value })} placeholder="ZIP" style={{ ...INPUT, width: 82 }} />
              </div>
              <div className="tap" onClick={() => setSaveCard(!saveCard)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: MUTED }}>
                <div style={{ width: 34, height: 20, borderRadius: 999, background: saveCard ? INK : LINE, padding: 2, display: "flex", justifyContent: saveCard ? "flex-end" : "flex-start" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#ffffff" }} />
                </div>
                Save this card for next time
              </div>
              <div className="tap" onClick={() => { if (newCardValid) { setPayMethod("new"); setPayConfirmed(true); setStep("done"); } }} style={newCardValid ? BTN : BTN_OFF}>Save card</div>
            </>
          )}

          {step === "done" && (
            <div className="tap" onClick={restart} style={BTN}>Start over</div>
          )}
        </div>
      </div>
    </div>
  );
}

function back(step: Step, setStep: (s: Step) => void) {
  const order: Step[] = ["visit", "eligibility", "payment", "done"];
  if (step === "editElig") { setStep("eligibility"); return; }
  if (step === "newCard") { setStep("payment"); return; }
  const i = order.indexOf(step);
  if (i > 0) setStep(order[i - 1]);
}
