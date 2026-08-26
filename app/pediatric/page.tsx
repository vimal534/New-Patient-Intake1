"use client";

import { useEffect, useRef, useState } from "react";
import {
  BTN, BTN_OFF, CARD, CARD_ON, DOT, DOT_ON, BOX, BOX_ON,
  CHIP, CHIP_ON, CHIP_SUG, CHIP_ON_SUG,
  PILL_OUTLINE, PILL_OUTLINE_ON, MIC_BTN, HISTORY_STATEMENT,
  FIGURES, ZONES, SPOTS, DEFAULT_SPOTS, QUALITY, DEFAULT_QUALITY, SEVERITY,
  REGION_META, AGGRAVATING, DEFAULT_AGGRAVATING, CONNECTED_RULES, SCALE,
  FOLLOWS, ONSET_OPTIONS, TRIGGER_OPTIONS, SYMPTOM_CHECKS, HISTORY_PROMPTS,
  REL_OPTS, CONSENT_DOCS, PARSE, PEDIATRIC_CONFIG,
} from "./data";
import { initialPedState } from "./types";
import type { AreaState, CardDraft, PedState, Screen } from "./types";
import { StatusBar } from "../components/StatusBar";
import { ConversationShell } from "./Sheet";

const P = PEDIATRIC_CONFIG;

// ---------- The conversational canvas: one combined step queue ----------
// Each step is exactly one question. "tier" controls how it renders:
// 1 = stated outright (collapsed by default, "Change" reveals options)
// 2 = a reasonable guess (shown as an active question with the guessed
//     option pre-highlighted "Suggested" — still requires a tap to confirm)
// 3 = genuinely unknown (asked fresh, never pre-filled — severity always
//     falls here per the existing hard rule)
type CanvasStep = {
  id: string; // unique within the whole queue
  region: string | null; // null for generic, cross-region steps
  tier: 1 | 2 | 3;
  eyebrow: string;
  statement?: string; // a known fact stated plainly before the question (history-aware)
  question: string;
  options: string[];
  multi: boolean;
  suggested?: string[]; // tier-2 pre-highlighted values
};

export default function PediatricIntakePage() {
  const [state, setState] = useState<PedState>(initialPedState);
  // Whether the current screen's contextual bottom sheet is collapsed to
  // let the patient review the full conversation history — ephemeral UI,
  // shared across every ConversationShell screen since only one renders at
  // a time, and reset whenever the screen itself changes.
  const [sheetCollapsed, setSheetCollapsed] = useState(false);

  function patch(update: Partial<PedState> | ((s: PedState) => Partial<PedState>)) {
    // The contextual bottom sheet's collapsed state is screen-local UI, same
    // idea as go()'s sheet/canvasReviewOpen reset — but this needs to catch
    // every path that changes `screen`, including the few screens that
    // patch it directly rather than through go(). Read against the last
    // rendered state purely to detect the transition; the actual merge
    // below still resolves `update` against the freshest `prev`.
    const forRead = typeof update === "function" ? update(state) : update;
    if (forRead.screen !== undefined && forRead.screen !== state.screen) setSheetCollapsed(false);
    setState((prev) => ({ ...prev, ...(typeof update === "function" ? update(prev) : update) }));
  }

  // Auto-scroll: the newest question settles into view on its own — the
  // patient never has to scroll down to find what appeared next. Suspended
  // the moment they scroll away manually, so it never fights a patient
  // reading back through what's collapsed above.
  const canvasQuestionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastAutoScrollTop = useRef(0);

  const s = state;
  const isB = s.flow === "B";
  const isTeen = P.patientAge >= 12;
  const name = P.patientName;
  const fig = FIGURES[P.patientAge < 1 ? "infant" : P.patientAge <= 3 ? "toddler" : P.patientAge <= 11 ? "child" : "teen"];

  function health(): Screen[] {
    // bodyMap is no longer a default step — location is asked as a
    // quick-choice in canvas (see buildCanvasQueue's tier-2 "spots" gate);
    // the diagram is now reached only as a fallback ("Not sure" opens it,
    // and returning from it goes straight back to canvas).
    const f: Screen[] = ["chat"];
    if (isTeen) {
      f.push("handoff");
      if (s.handedOff) f.push("private");
    }
    f.push("canvas");
    if (isTeen) f.push("scale");
    return f;
  }

  function flow(): Screen[] {
    if (s.flow === "B") {
      const f: Screen[] = ["picker", "home", ...health(), "idConfirm"];
      if (s.idChanged) f.push("idCapture", "idReview");
      f.push("coverageConfirm");
      if (s.coverageChanged) f.push("rcsCoverage");
      f.push("consentsConfirm");
      if (s.consentsChanged) f.push("consents", "signature");
      return [...f, "review", "done"];
    }
    return (["picker", "signup", "details", "idCapture", "idReview"] as Screen[])
      .concat(health(), ["coverageForm", "rcsCoverage", "consents", "signature", "preferences", "review", "done"]);
  }

  function eligibleDocs() {
    return CONSENT_DOCS.filter(
      (d) => P.patientAge >= d.minAge && P.patientAge <= d.maxAge && (d.visits.includes("*") || d.visits.includes(P.visitType))
    );
  }

  function fill(str: string) {
    return str.split("{name}").join(name).split("{practice}").join(P.practiceName).split("{age}").join(String(P.patientAge));
  }

  function idx() {
    return Math.max(0, flow().indexOf(s.screen));
  }
  function go(screen: Screen) {
    // Sheets and expandables are screen-local overlays, not persistent
    // state — leaving one open while navigating elsewhere would otherwise
    // have it re-appear, uninvited, on top of an unrelated screen.
    patch({ screen, sheet: null, canvasReviewOpen: false });
  }
  function next() {
    const f = flow();
    go(f[Math.min(f.length - 1, idx() + 1)]);
  }
  function back() {
    if (s.screen === "canvas" && s.canvasHistory.length > 0) {
      const last = s.canvasHistory[s.canvasHistory.length - 1];
      clearStepField(last);
      patch((prev) => ({ canvasHistory: prev.canvasHistory.slice(0, -1), canvasChangeOpen: null, canvasJustSelected: null }));
      return;
    }
    // bodyMap is a fallback reached from canvas's location question, not a
    // flow() step — its own index there would be -1, sending back() to the
    // very start. Its back arrow returns to canvas instead.
    if (s.screen === "bodyMap") {
      go("canvas");
      return;
    }
    const f = flow();
    go(f[Math.max(0, idx() - 1)]);
  }
  function restart() {
    patch({
      screen: s.flow === "B" ? "home" : "picker",
      chatText: "",
      parsed: false,
      areas: {},
      order: [],
      symptomOnset: "",
      symptomTrigger: "",
      canvasHistory: [],
      canvasChangeOpen: null,
      canvasJustSelected: null,
      canvasReviewOpen: false,
      canvasScrolledAway: false,
      genericAnswers: {},
      scale: null,
      handedOff: false,
      privateAnswer: null,
      sheet: null,
      arrived: false,
    });
  }

  function guardian() {
    const v = (s.form.guardianName || s.form.holder || "").trim();
    if (v) return v;
    return s.flow === "B" ? "Elena Marquez" : "";
  }

  function setField(id: string, v: string) {
    patch((prev) => ({ form: { ...prev.form, [id]: v } }));
  }
  function fv(id: string, fallback?: string) {
    const v = s.form[id];
    return v === undefined ? (s.flow === "B" ? fallback || "" : "") : v;
  }

  type FormFieldCfg = { id?: string; label: string; placeholder?: string; kind?: "rel" };
  type FormGroupCfg = { heading: string; fields: FormFieldCfg[] };
  type FormCfg = {
    title: string;
    sub: string;
    cta: string;
    hint: string;
    doneHint: string;
    required: string[];
    defaults: Record<string, string>;
    needsRel: boolean;
    groups: FormGroupCfg[];
  };

  function formConfig(sc: Screen, isBflow: boolean, rel: string | null): FormCfg | null {
    if (sc === "signup") {
      return {
        title: "Let's set up your account.",
        sub: "Four things now — the rest comes later, and we save as you go.",
        cta: "Create account", hint: "Fill these in to continue.", doneHint: "You can change any of this later.",
        required: ["guardianName", "contact", "patientName", "patientDob"], defaults: {}, needsRel: false,
        groups: [
          { heading: "You", fields: [
            { id: "guardianName", label: "Your full name", placeholder: "Elena Marquez" },
            { id: "contact", label: "Email or mobile", placeholder: "elena@example.com" },
          ] },
          { heading: "Your child", fields: [
            { id: "patientName", label: "Child's full name", placeholder: name + " Marquez" },
            { id: "patientDob", label: "Date of birth", placeholder: "MM / DD / YYYY" },
          ] },
        ],
      };
    }
    if (sc === "details") {
      return {
        title: "A bit more about you both.", sub: "This is the last long form. Everything here carries over to your next visit.",
        cta: "Save details", hint: "A few fields are still empty.", doneHint: "Saved to " + name + "'s new passport.",
        required: ["address", "city", "emName", "emPhone"], defaults: {}, needsRel: true,
        groups: [
          { heading: "Patient", fields: [
            { id: "patientName", label: "Child's full name", placeholder: name + " Marquez" },
            { id: "patientDob", label: "Date of birth", placeholder: "MM / DD / YYYY" },
          ] },
          { heading: "Your relationship to " + name, fields: [{ kind: "rel", label: "Relationship to patient" }] },
          { heading: "Contact", fields: [
            { id: "guardianPhone", label: "Mobile", placeholder: "(512) 555-0198" },
            { id: "address", label: "Street address", placeholder: "2847 Magnolia Way" },
            { id: "city", label: "City, state and ZIP", placeholder: "Austin, TX 78704" },
          ] },
          { heading: "Emergency contact", fields: [
            { id: "emName", label: "Name and relationship", placeholder: "Marco Marquez · uncle" },
            { id: "emPhone", label: "Phone", placeholder: "(512) 555-0177" },
          ] },
        ],
      };
    }
    if (sc === "coverageForm") {
      return {
        title: isBflow ? "Tell us about the new plan." : "Now " + name + "'s coverage.",
        sub: isBflow
          ? "Only the plan details — we'll reuse your name and address from your file."
          : "Straight from the card. You're entering this as " + name + "'s " + (rel || "parent").toLowerCase() + " and the person we'd bill.",
        cta: "Save coverage", hint: "Insurer and member ID are needed to check eligibility.", doneHint: "We'll verify this in the background.",
        required: ["insurer", "memberId"], defaults: {}, needsRel: false,
        groups: [
          { heading: "Plan", fields: [
            { id: "insurer", label: "Insurance company", placeholder: "BlueCross BlueShield" },
            { id: "memberId", label: "Member ID", placeholder: "BXP440291847" },
            { id: "groupNo", label: "Group number", placeholder: "BCBS-77291" },
          ] },
          { heading: "Policy holder", fields: [
            { id: "holder", label: "Full name", placeholder: "Elena Marquez" },
            { id: "holderDob", label: "Date of birth", placeholder: "MM / DD / YYYY" },
            { kind: "rel", label: "Relationship to patient" },
          ] },
        ],
      };
    }
    return null;
  }

  // ---------- RCS coverage thread: eligibility check + payment ----------
  // No photo, no typing — the practice already ran the check; the patient
  // just confirms or corrects what it found. Flow B (insurance changed)
  // shows a simulated fresh lookup; Flow A (new patient) reflects back
  // whatever was just typed into the coverage form.
  function ocrFields() {
    if (isB && s.coverageChanged) {
      return [
        { id: "insurer", label: "Insurance company", value: "Aetna Choice POS II" },
        { id: "memberId", label: "Member ID", value: "W2748813902" },
        { id: "holder", label: "Policyholder", value: "Elena Marquez" },
        { id: "rel", label: "Relationship", value: "Parent" },
      ];
    }
    return [
      { id: "insurer", label: "Insurance company", value: fv("insurer", "BlueCross BlueShield") || "BlueCross BlueShield" },
      { id: "memberId", label: "Member ID", value: fv("memberId", "BXP440291847") || "BXP440291847" },
      { id: "holder", label: "Policyholder", value: fv("holder", guardianName) || guardianName },
      { id: "rel", label: "Relationship", value: rel || "Parent" },
    ];
  }

  function cardBrand(num: string) {
    const d = num.replace(/[^0-9]/g, "");
    if (!d) return null;
    if (d[0] === "4") return "Visa";
    if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "Mastercard";
    if (/^3[47]/.test(d)) return "Amex";
    if (/^6(?:011|5)/.test(d)) return "Discover";
    return "Card";
  }
  function setCard(k: keyof CardDraft, v: string) {
    patch((prev) => ({ card: { ...prev.card, [k]: v } }));
  }

  // ---------- Body-map symptom picker ----------
  function emptyArea(): AreaState {
    return { spots: [], quality: [], aggravating: [], severity: null, connected: [], suggested: false, confirmed: false, extra: {} };
  }

  function toggleRegion(id: string) {
    patch((prev) => {
      if (prev.areas[id]) {
        const areas = { ...prev.areas };
        delete areas[id];
        return { areas, order: prev.order.filter((x) => x !== id) };
      }
      return { areas: { ...prev.areas, [id]: emptyArea() }, order: [...prev.order, id] };
    });
  }

  // Severity is stored as the full tapped option ("1 · Barely") so the
  // selected-state comparison in the canvas (which matches against the same
  // option strings) keeps working — this pulls the bare number back out
  // wherever something needs to compare or look up by it.
  function severityNum(v: string | null): string | null {
    return v ? v.split(" · ")[0] : null;
  }

  function parseText() {
    // Tier-1 (stated outright) vs tier-2 (a reasonable guess) split, per the
    // conversational-canvas spec: onset/trigger are things the description
    // actually said, so they render collapsed in the recap. The specific
    // spot and quality are inferred, not stated — tier-2, shown as an active
    // question with the guess pre-highlighted rather than assumed outright.
    const areas: Record<string, AreaState> = {
      [PARSE.region]: { spots: [...PARSE.spots], quality: [...PARSE.quality], aggravating: [], severity: null, connected: [], suggested: true, confirmed: false, extra: {} },
    };
    patch({
      areas, order: [PARSE.region], parsed: true, view: "front", screen: "canvas",
      symptomOnset: PARSE.onset, symptomTrigger: PARSE.trigger,
    });
  }

  // ---------- The conversational canvas ----------
  // Values that mean "none of the above" — picking one clears any other
  // selection in the same multi-select step; picking anything else clears it.
  const EXCLUSIVE_VALUES = ["Not sure", "None of these", "Nothing in particular", "Nothing yet"];

  function fieldOf(step: CanvasStep) {
    return step.region ? step.id.slice(step.region.length + 1) : step.id.replace("generic:", "");
  }

  function singleValue(step: CanvasStep): string | undefined {
    if (!step.region) {
      const v = s.genericAnswers[fieldOf(step)];
      return typeof v === "string" ? v : undefined;
    }
    const area = s.areas[step.region] || emptyArea();
    const field = fieldOf(step);
    if (field === "spots") return area.spots[0];
    if (field === "severity") return area.severity || undefined;
    const v = area.extra[field];
    return typeof v === "string" ? v : undefined;
  }

  // Reads a past answer for the review list, where all we have is the
  // {id, region} the history recorded — not a full CanvasStep, and not
  // knowing up front whether it was single- or multi-select.
  function historyValue(rec: { id: string; region: string | null }): string | string[] | undefined {
    if (!rec.region) return s.genericAnswers[rec.id.replace("generic:", "")];
    const area = s.areas[rec.region] || emptyArea();
    const field = rec.id.slice(rec.region.length + 1);
    if (field === "spots") return area.spots[0];
    if (field === "severity") return area.severity || undefined;
    if (field === "quality") return area.quality;
    if (field === "aggravating") return area.aggravating;
    if (field === "connected") return area.connected;
    return area.extra[field];
  }

  function multiValue(step: CanvasStep): string[] {
    if (!step.region) {
      const v = s.genericAnswers[fieldOf(step)];
      return Array.isArray(v) ? v : [];
    }
    const area = s.areas[step.region] || emptyArea();
    const field = fieldOf(step);
    if (field === "quality") return area.quality;
    if (field === "aggravating") return area.aggravating;
    if (field === "connected") return area.connected;
    const v = area.extra[field];
    return Array.isArray(v) ? v : [];
  }

  function commitAnswer(step: CanvasStep, value: string | string[]) {
    if (!step.region) {
      patch((prev) => ({ genericAnswers: { ...prev.genericAnswers, [fieldOf(step)]: value } }));
      return;
    }
    const region = step.region;
    const field = fieldOf(step);
    patch((prev) => {
      const area = { ...(prev.areas[region] || emptyArea()) };
      if (field === "spots") area.spots = Array.isArray(value) ? value : [value];
      else if (field === "severity") area.severity = value as string;
      else if (field === "quality") area.quality = value as string[];
      else if (field === "aggravating") { area.aggravating = value as string[]; area.confirmed = true; }
      else if (field === "connected") { area.connected = value as string[]; area.confirmed = true; }
      else area.extra = { ...area.extra, [field]: value };
      return { areas: { ...prev.areas, [region]: area } };
    });
  }

  // The inverse of commitAnswer — resets a step's field back to unanswered.
  // Used by both the canvas back button and "Edit" from the review list,
  // which truncates history and clears every field from that point forward
  // so buildCanvasQueue naturally re-asks them in order.
  function clearStepField(rec: { id: string; region: string | null }) {
    if (!rec.region) {
      const field = rec.id.replace("generic:", "");
      patch((prev) => {
        const g = { ...prev.genericAnswers };
        delete g[field];
        return { genericAnswers: g };
      });
      return;
    }
    const region = rec.region;
    const field = rec.id.slice(region.length + 1);
    patch((prev) => {
      const area = { ...(prev.areas[region] || emptyArea()) };
      if (field === "spots") area.spots = [];
      else if (field === "severity") area.severity = null;
      else if (field === "quality") area.quality = [];
      else if (field === "aggravating") { area.aggravating = []; area.confirmed = false; }
      else if (field === "connected") { area.connected = []; area.confirmed = false; }
      else { const extra = { ...area.extra }; delete extra[field]; area.extra = extra; }
      return { areas: { ...prev.areas, [region]: area } };
    });
  }

  function editFromHistory(index: number) {
    s.canvasHistory.slice(index).forEach(clearStepField);
    patch((prev) => ({ canvasHistory: prev.canvasHistory.slice(0, index), canvasReviewOpen: false }));
  }

  // Single-select: brief visual confirmation, then collapse and move on.
  function selectSingle(step: CanvasStep, value: string) {
    if (s.canvasJustSelected) return;
    patch({ canvasJustSelected: { id: step.id, value } });
    setTimeout(() => {
      commitAnswer(step, value);
      patch((prev) => ({
        canvasJustSelected: null,
        canvasScrolledAway: false,
        canvasHistory: [...prev.canvasHistory, { id: step.id, region: step.region, eyebrow: step.eyebrow }],
      }));
    }, 180);
  }

  // Multi-select: each tap toggles immediately (its own visual confirms via
  // the selected/unselected style) — advancing needs an explicit tap on
  // Next/Continue since more than one answer is expected.
  function toggleMulti(step: CanvasStep, value: string) {
    const cur = multiValue(step);
    let next: string[];
    if (EXCLUSIVE_VALUES.includes(value)) {
      next = cur.includes(value) ? [] : [value];
    } else {
      const withoutExclusive = cur.filter((x) => !EXCLUSIVE_VALUES.includes(x));
      next = withoutExclusive.includes(value) ? withoutExclusive.filter((x) => x !== value) : [...withoutExclusive, value];
    }
    commitAnswer(step, next);
    patch({ canvasScrolledAway: false });
  }
  function finishMulti(step: CanvasStep) {
    patch((prev) => ({
      canvasScrolledAway: false,
      canvasHistory: [...prev.canvasHistory, { id: step.id, region: step.region, eyebrow: step.eyebrow }],
    }));
  }

  function activeGenericFollows() {
    const hasEar = s.order.includes("Ear");
    const hasTummy = s.order.includes("Tummy");
    const hasThroat = s.order.includes("Throat");
    return FOLLOWS.filter((f) => {
      if (f.id === "worse") return !s.symptomTrigger; // already captured tier-1 from the description — don't ask again
      if (f.id === "eating") return hasEar || hasTummy || hasThroat;
      return true; // tried
    });
  }

  // Builds the queue exactly one unanswered step at a time — each section
  // only contributes its NEXT question once everything before it (in this
  // region, then across regions, then the generic cross-region questions)
  // is resolved. That's what makes the branching invisible instead of
  // promising a count: the list simply stops growing at whatever's still
  // actually unknown.
  function buildCanvasQueue(): CanvasStep[] {
    const steps: CanvasStep[] = [];
    let blocked = false;
    for (const region of s.order) {
      if (blocked) break;
      const area = s.areas[region];
      if (!area) continue;
      const meta = REGION_META[region] || { heading: region + " discomfort", locQ: "Where exactly?" };

      // Same tier-2 treatment as quality below: a guessed spot from the
      // free-text description still needs an explicit tap before it counts
      // as answered, so location surfaces as the canvas's first question
      // (guess pre-highlighted) rather than being silently assumed —
      // that's what makes the body-map diagram a fallback, not the default.
      const spotsAsked = s.canvasHistory.some((h) => h.id === region + ":spots");
      if (area.spots.length === 0 || (area.suggested && !area.confirmed && !spotsAsked)) {
        steps.push({ id: `${region}:spots`, region, tier: area.suggested && !area.confirmed ? 2 : 3, eyebrow: "Location", question: meta.locQ, options: SPOTS[region] || DEFAULT_SPOTS, multi: false, suggested: area.suggested ? PARSE.spots : undefined });
        blocked = true;
        break;
      }
      if (area.severity === null) {
        steps.push({ id: `${region}:severity`, region, tier: 3, eyebrow: "Severity", question: "How bad is it right now?", options: SEVERITY.map(([n, l]) => n + " · " + l), multi: false });
        blocked = true;
        break;
      }

      for (const check of SYMPTOM_CHECKS.filter((c) => c.region === region)) {
        const answer = area.extra[check.id] as string | undefined;
        if (answer === undefined) {
          steps.push({ id: `${region}:${check.id}`, region, tier: 3, eyebrow: check.eyebrow, question: check.question.split("{name}").join(name), options: check.options, multi: false });
          blocked = true;
          break;
        }
        if (answer !== check.noValue) {
          const durAnswer = area.extra[check.id + "Onset"] as string | undefined;
          if (durAnswer === undefined) {
            steps.push({ id: `${region}:${check.id}Onset`, region, tier: 3, eyebrow: check.durationEyebrow, question: check.durationQuestion, options: check.durationOptions, multi: false });
            blocked = true;
            break;
          }
        }
      }
      if (blocked) break;

      for (const hp of HISTORY_PROMPTS.filter((h) => h.region === region && (!h.requiresReturning || isB))) {
        if (area.extra[hp.id] === undefined) {
          steps.push({ id: `${region}:${hp.id}`, region, tier: 3, eyebrow: "History", statement: fill(hp.statement), question: fill(hp.question), options: hp.options, multi: false });
          blocked = true;
          break;
        }
      }
      if (blocked) break;

      // A tier-2 guess (pre-filled from the description) still needs an
      // explicit tap before it counts as answered — checking array length
      // alone would treat "already has a guessed value" as "already asked",
      // which skips the confirmation tier-2 exists for. canvasHistory is
      // the record of what's actually been shown and answered.
      const qualityAsked = s.canvasHistory.some((h) => h.id === region + ":quality");
      if (area.quality.length === 0 || (area.suggested && !area.confirmed && !qualityAsked)) {
        steps.push({ id: `${region}:quality`, region, tier: area.suggested && !area.confirmed ? 2 : 3, eyebrow: "Sensation", question: "What does it feel like?", options: QUALITY[region] || DEFAULT_QUALITY, multi: true, suggested: area.suggested ? PARSE.quality : undefined });
        blocked = true;
        break;
      }
      const aggravatingId = `${region}:aggravating`;
      if (!s.canvasHistory.some((h) => h.id === aggravatingId)) {
        steps.push({ id: aggravatingId, region, tier: 3, eyebrow: "Aggravating factor", question: "When is it worse?", options: AGGRAVATING[region] || DEFAULT_AGGRAVATING, multi: true });
        blocked = true;
        break;
      }
      const rule = CONNECTED_RULES.find((r) => r.region === region);
      const connectedId = `${region}:connected`;
      if (rule && area.severity && Number(severityNum(area.severity)) >= rule.minSeverity && !s.canvasHistory.some((h) => h.id === connectedId)) {
        steps.push({ id: connectedId, region, tier: 3, eyebrow: "Also noticed", question: rule.lead, options: rule.opts, multi: true });
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      for (const f of activeGenericFollows()) {
        const cur = s.genericAnswers[f.id];
        const answered = f.multi ? Array.isArray(cur) && cur.length > 0 : cur !== undefined;
        if (!answered) {
          steps.push({ id: `generic:${f.id}`, region: null, tier: 3, eyebrow: f.eyebrow, question: f.q.split("{name}").join(name), options: f.opts, multi: f.multi });
          break;
        }
      }
    }
    return steps;
  }

  // ---------- Derived values used across many screens ----------
  const sc = s.screen;
  const docs = eligibleDocs();
  const rel = s.rel || (isB ? "Parent" : null);
  const guardianName = fv("guardianName", "Elena Marquez") || (isB ? "Elena Marquez" : "");
  const formCfg = formConfig(sc, isB, rel);
  const formValid = formCfg
    ? formCfg.required.every((id) => (fv(id, formCfg.defaults[id]) || "").trim().length > 1) && (!formCfg.needsRel || !!rel)
    : false;
  const savedCard = isB ? { brand: "Visa", last4: "4242", exp: "09 / 28" } : null;
  const cardOnFile = savedCard ? savedCard.brand + " ending " + savedCard.last4 : "New card";
  const NEW_CARD = "Use a different card";
  const ADD_CARD = "Add a card";
  const AT_DESK = "Pay at the desk";
  const usingNewCard = s.payMethod === NEW_CARD || s.payMethod === ADD_CARD || (!savedCard && s.payMethod !== AT_DESK);
  const card = s.card;
  const cardDigits = card.number.replace(/[^0-9]/g, "");
  const brand = cardBrand(card.number);
  const newCardValid = cardDigits.length >= 15 && card.exp.trim().length >= 4 && card.cvc.trim().length >= 3 && card.zip.trim().length >= 4;
  const guardianVal = guardian();
  const typedName = s.signNameTouched ? s.signName : s.signName || guardianVal;
  const signValid = s.signMode === "upload" ? !!s.upload : typedName.trim().length > 2;
  const dueToday = P.financialPolicy === "Due today";
  const ocrFieldsList = ocrFields();
  const ov = (f: { id: string; value: string }) => (s.ocr[f.id] === undefined ? f.value : s.ocr[f.id]);
  const chatReady = s.chatText.trim().length > 4;
  const norm = (a?: AreaState): AreaState => ({
    spots: a?.spots || [], quality: a?.quality || [], aggravating: a?.aggravating || [],
    connected: a?.connected || [], severity: a?.severity || null, suggested: !!a?.suggested, confirmed: !!a?.confirmed,
    extra: a?.extra || {},
  });
  const order = s.order.filter((id) => !!s.areas[id]);
  // buildCanvasQueue only ever returns the single next unanswered step (or
  // none, once everything's resolved) — see its own comment for why a
  // growing array would break the one-question-at-a-time model.
  const canvasCurrent = sc === "canvas" ? buildCanvasQueue()[0] ?? null : null;
  const canvasDetailCount = s.canvasHistory.length;

  // Sequence per the motion spec: the answer already got its own brief
  // confirmed-state beat (canvasJustSelected) before commit, so by the time
  // this fires the DOM already reflects the *next* question — settle it
  // into the upper-middle of the viewport with an eased scroll, unless the
  // patient has manually scrolled away to read something above.
  useEffect(() => {
    if (sc !== "canvas" || s.canvasScrolledAway) return;
    const el = canvasQuestionRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const container = scrollContainerRef.current;
    if (container) lastAutoScrollTop.current = container.scrollTop;
  }, [sc, canvasCurrent?.id, s.canvasScrolledAway]);

  // Keyboard-aware scroll for free-text steps: give the virtual keyboard
  // time to animate in, then make sure the field (and whatever's below it)
  // stays visible above it rather than getting covered.
  function scrollIntoViewOnFocus(e: React.FocusEvent<HTMLElement>) {
    const el = e.currentTarget;
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  }

  function handleCanvasScroll() {
    if (sc !== "canvas" || s.canvasScrolledAway) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    if (Math.abs(container.scrollTop - lastAutoScrollTop.current) > 40) patch({ canvasScrolledAway: true });
  }

  // RCS coverage thread: the eligibility check kicks off the moment the
  // screen is shown (no tap needed — that's the point, the practice already
  // ran it) and resolves a beat later, same rhythm as a real lookup.
  useEffect(() => {
    if (sc !== "rcsCoverage" || s.ocrElig === "done") return;
    const t = setTimeout(() => patch({ ocrElig: "done" }), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc, s.ocrElig]);

  // Once nothing's left to ask, pause briefly on the completed state before
  // moving on — long enough to register as "done", not long enough to feel
  // like a delay.
  useEffect(() => {
    if (sc !== "canvas" || canvasCurrent) return;
    const t = setTimeout(() => next(), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sc, canvasCurrent]);

  const plainChip = (on: boolean) => (on ? CHIP_ON : CHIP);
  const stepNames = isB ? ["Health", "Identity", "Coverage", "Consents", "Review"] : ["Account", "Details", "Identity", "Health", "Coverage", "Consents", "Review"];
  const stepNumB: Record<string, number> = { home: 1, chat: 1, bodyMap: 1, handoff: 1, private: 1, canvas: 1, scale: 1, idConfirm: 2, idCapture: 2, idReview: 2, coverageConfirm: 3, coverageForm: 3, rcsCoverage: 3, consentsConfirm: 4, consents: 4, signature: 4, review: 5 };
  const stepNumA: Record<string, number> = { signup: 1, details: 2, idCapture: 3, idReview: 3, chat: 4, bodyMap: 4, handoff: 4, private: 4, canvas: 4, scale: 4, coverageForm: 5, rcsCoverage: 5, consents: 6, signature: 6, preferences: 6, review: 7 };
  const stepNum = (isB ? stepNumB[sc] : stepNumA[sc]) || 1;
  const allAcked = docs.length > 0 && docs.every((d) => s.consentAcks.includes(d.id));
  const showHeader = !["picker", "home", "done", "private"].includes(sc);
  const showPassport = isB && !["picker", "home", "done", "private"].includes(sc);
  // "Need help?" only makes sense where there's an active contextual sheet
  // to swap its content into — the conversational screens, not the
  // dedicated full-page task modules (scanner, signature, body map, etc).
  const conversationalScreens: Screen[] = ["chat", "canvas", "idConfirm", "coverageConfirm", "consentsConfirm", "rcsCoverage"];
  const showAssistant = conversationalScreens.includes(sc) && !s.sheet;

  // The Q&A content that replaces a screen's own sheet while "Need help?"
  // is active — same canned answers as before, just swapped in place
  // rather than opened as a separate overlay drawer.
  const assistantSheet = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#14b3ac", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>AI</div>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: "#0d1421" }}>Need help with this?</div>
      </div>
      <div style={{ fontSize: 13, color: "#5b6b7d", lineHeight: 1.45 }}>Answers stay right here — nothing you ask changes what you&apos;ve filled in.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { q: "What counts as a fever?", a: "38°C or 100.4°F and above, measured under the arm or in the ear. If you only felt warm, pick “felt warm, didn't measure” — that's useful too." },
          { q: "What does “throbbing” mean here?", a: "Pain that comes in a beat, like a pulse. If it's steady instead, pick “dull ache.”" },
          { q: "Should I go to urgent care instead?", a: "If " + name + " is very hard to wake, breathing fast, or has a stiff neck, don't wait for tomorrow — call the clinic line now." },
        ].map((x) => (
          <div key={x.q} className="tap-target" onClick={() => patch({ assistantAnswer: x.a })} style={{ cursor: "pointer", background: "#f4f7fa", borderRadius: 14, padding: "13px 15px", fontSize: 14.5, fontWeight: 500, color: "#0d1421", lineHeight: 1.35 }}>{x.q}</div>
        ))}
      </div>
      {s.assistantAnswer && <div style={{ background: "#e6f7f6", borderRadius: 14, padding: 14, fontSize: 14, color: "#137e7a", lineHeight: 1.5 }}>{s.assistantAnswer}</div>}
      <div className="tap-target" onClick={() => patch({ sheet: null, assistantAnswer: null })} style={{ cursor: "pointer", textAlign: "center", fontSize: 14.5, fontWeight: 600, color: "#6b7a8d", padding: "4px 0" }}>Back to my visit</div>
    </>
  );
  function sheetContent(normal: React.ReactNode) {
    return s.sheet === "assistant" ? assistantSheet : normal;
  }

  const flowBadge = isB ? "Flow B" : s.flow === "A" ? "Flow A" : "Flows";
  const flowBadgeStyle: React.CSSProperties = {
    cursor: "pointer", flexShrink: 0, width: 52, textAlign: "center",
    background: isB ? "#e9edfb" : "#e6f7f6", color: isB ? "#4a5bb8" : "#137e7a",
    borderRadius: 999, padding: "5px 0", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
  };
  function pickFlow(start: "A" | "B", first: Screen) {
    patch({
      ...initialPedState,
      flow: start, screen: first,
    });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#eef1f6", fontFamily: "'Outfit',system-ui,sans-serif" }}>
      <style>{`
        @keyframes pedQStepIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .qstep-enter { animation: pedQStepIn 260ms ease-out; }
        .tap-target { transition: transform 100ms ease-out, filter 100ms ease-out; }
        .tap-target:active { transform: scale(0.97); filter: brightness(0.97); }
        @keyframes rcsDotPulse { 0%, 60%, 100% { opacity: 0.35; } 30% { opacity: 1; } }
        .rcs-dot { animation: rcsDotPulse 1100ms ease-in-out infinite; }
        @keyframes rcsCheckPop { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .rcs-check-pop { animation: rcsCheckPop 420ms cubic-bezier(.34,1.56,.64,1); }
      `}</style>
      <div style={{ position: "relative", width: 390, height: 844, background: "#f4f7fa", borderRadius: 44, boxShadow: "0 30px 70px rgba(16,32,50,0.18),0 2px 6px rgba(16,32,50,0.08)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <StatusBar />

        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, background: "#ffffff", flexShrink: 0, padding: "0 16px" }}>
          <div onClick={() => patch({ screen: "picker" })} style={flowBadgeStyle}>{flowBadge}</div>
          <div style={{ flex: 1, height: 24, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: "#0d1421", textAlign: "center", lineHeight: 1.1, maxHeight: 24, overflow: "hidden" }}>{P.practiceName}</div>
          </div>
          <div style={{ width: 52, flexShrink: 0 }} />
        </div>

        {showHeader && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 20px 14px", background: "#ffffff", flexShrink: 0, borderBottom: "1px solid #eef2f6" }}>
            <div onClick={back} style={{ cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#1f9ed4", fontSize: 24, fontWeight: 600, lineHeight: 1, marginLeft: -6 }}>‹</div>
            {sc === "canvas" ? (
              // The conversational moments read patient-relative progress
              // ("a few things left"), not a page count — a step tally would
              // mislead anyway once branching adds or skips questions.
              <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: "#8b9aab", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {canvasCurrent ? "A few quick details left" : "Almost there with " + (REGION_META[s.order[0]]?.heading || (s.order[0] || "") + " pain").toLowerCase()}
              </div>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", color: "#8b9aab", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stepNames[stepNum - 1]}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#c2ceda", whiteSpace: "nowrap" }}>Step {stepNum} of {stepNames.length}</div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {stepNames.map((_, n) => (
                    <div key={n} style={{ width: 9, height: 3, borderRadius: 2, background: n < stepNum - 1 ? "#14b3ac" : n === stepNum - 1 ? "#8fdad6" : "#e3eaf1" }} />
                  ))}
                </div>
              </>
            )}
            {showAssistant && (
              // Swaps the current screen's own contextual sheet to a Q&A
              // composer in place — a support layer on top of the current
              // question, not a separate assistant mode.
              <div onClick={() => patch({ sheet: "assistant", assistantAnswer: null })} className="tap-target" style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "#1f9ed4", flexShrink: 0, marginLeft: 4, padding: "6px 4px" }}>
                Need help?
              </div>
            )}
          </div>
        )}

        {showPassport && (
          <div style={{ background: "#ffffff", borderBottom: "1px solid #eef2f6", flexShrink: 0 }}>
            <div onClick={() => patch((prev) => ({ passportOpen: !prev.passportOpen }))} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 11, padding: "12px 20px" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#dff5f4", color: "#14b3ac", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{name.charAt(0)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0d1421", lineHeight: 1.2 }}>{name}</div>
                <div style={{ fontSize: 12.5, color: "#8b9aab", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Asthma · Penicillin allergy · Ear pain in March</div>
              </div>
              <div style={{ color: "#b7cbdb", fontSize: 16, lineHeight: 1, transform: `rotate(${s.passportOpen ? "180deg" : "0deg"})` }}>⌄</div>
            </div>
            {s.passportOpen && (
              <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#8b9aab", textTransform: "uppercase" }}>Known conditions</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
                    {["Mild asthma", "Grommets, 2024"].map((c) => (
                      <div key={c} style={{ background: "#f4f7fa", color: "#3d4d5f", borderRadius: 999, padding: "7px 13px", fontSize: 13.5, fontWeight: 500 }}>{c}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#8b9aab", textTransform: "uppercase" }}>Allergies</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
                    {["Penicillin", "Peanuts"].map((a) => (
                      <div key={a} style={{ background: "#fdf3d9", color: "#8a6516", borderRadius: 999, padding: "7px 13px", fontSize: 13.5, fontWeight: 600 }}>{a}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#8b9aab", textTransform: "uppercase" }}>Recent visits</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 8 }}>
                    {[["Right ear pain", "14 Mar"], ["Asthma review", "8 Jan"]].map(([label, when]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f4f7fa", borderRadius: 12, padding: "11px 13px" }}>
                        <div style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: "#0d1421" }}>{label}</div>
                        <div style={{ fontSize: 13, color: "#8b9aab", flexShrink: 0 }}>{when}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={scrollContainerRef} onScroll={handleCanvasScroll} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {sc === "picker" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "24px 20px 26px", background: "#f4f7fa" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em" }}>Two check-in flows.</div>
              <div style={{ fontSize: 15.5, color: "#5b6b7d", marginTop: 9, lineHeight: 1.45 }}>Same components, same AI-guided health module. What differs is how much is already on file.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
                {[
                  { tag: "A", title: "New User", blurb: "First visit, nothing on file. Every step is entered from scratch, including ID capture and full coverage entry.", steps: ["Account", "Details", "Identity", "Health", "Coverage", "Consents", "Review"], start: "A" as const, first: "signup" as Screen, tagBg: "#e6f7f6", tagColor: "#137e7a" },
                  { tag: "B", title: "Returning User", blurb: "Guardian and patient recognized. Each step opens confirmed and only expands if something changed.", steps: ["Health", "Identity", "Coverage", "Consents", "Review"], start: "B" as const, first: "home" as Screen, tagBg: "#e9edfb", tagColor: "#4a5bb8" },
                ].map((f) => (
                  <div key={f.tag} onClick={() => pickFlow(f.start, f.first)} style={{ cursor: "pointer", background: "#ffffff", border: "1.5px solid #eef2f6", borderRadius: 20, padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: f.tagBg, color: f.tagColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{f.tag}</div>
                      <div style={{ flex: 1, fontSize: 18, fontWeight: 700, color: "#0d1421" }}>{f.title}</div>
                    </div>
                    <div style={{ fontSize: 14.5, color: "#5b6b7d", marginTop: 10, lineHeight: 1.45 }}>{f.blurb}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
                      {f.steps.map((st) => (
                        <div key={st} style={{ background: "#f4f7fa", color: "#5b6b7d", borderRadius: 999, padding: "6px 11px", fontSize: 12.5, fontWeight: 600 }}>{st}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 22, fontSize: 13.5, color: "#8b9aab", lineHeight: 1.45 }}>Tap the flow badge in the top-left at any point to switch.</div>
            </div>
          )}

          {formCfg && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px 24px", background: "#f4f7fa" }}>
              <div style={{ fontSize: 27, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em" }}>{formCfg.title}</div>
              <div style={{ fontSize: 15, color: "#5b6b7d", marginTop: 9, lineHeight: 1.45 }}>{formCfg.sub}</div>
              {formCfg.groups.map((g) => (
                <div key={g.heading} style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#8b9aab", textTransform: "uppercase" }}>{g.heading}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                    {g.fields.map((f, fi) =>
                      f.kind === "rel" ? (
                        <div key={fi} style={{ background: "#ffffff", border: "1.5px solid #eef2f6", borderRadius: 16, padding: "13px 16px" }}>
                          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>{f.label}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                            {REL_OPTS.map((o) => (
                              <div key={o} onClick={() => patch({ rel: o })} style={rel === o ? CHIP_ON : CHIP}>{o}</div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div key={f.id} style={{ background: "#ffffff", border: "1.5px solid #eef2f6", borderRadius: 16, padding: "13px 16px" }}>
                          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>{f.label}</div>
                          <input
                            value={fv(f.id!, formCfg.defaults[f.id!])}
                            onChange={(e) => setField(f.id!, e.target.value)}
                            placeholder={f.placeholder || ""}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 16.5, fontWeight: 500, color: "#0d1421", marginTop: 5, padding: "3px 0" }}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: "auto", paddingTop: 22, display: "flex", flexDirection: "column", gap: 9 }}>
                <div onClick={() => { if (formValid) next(); }} style={formValid ? BTN : BTN_OFF}>{formCfg.cta}</div>
                <div style={{ textAlign: "center", fontSize: 13.5, color: "#8b9aab", lineHeight: 1.4 }}>{formValid ? formCfg.doneHint : formCfg.hint}</div>
              </div>
            </div>
          )}

          {sc === "idCapture" && (() => {
            // One continuous journey, not two independent screens: capturing
            // the front transitions straight into the back — no separate
            // "reviewed the front" tap required.
            const justCaptured = s.canvasJustSelected?.id === "idCapture" ? (s.canvasJustSelected.value as string) : null;
            function capture() {
              if (s.canvasJustSelected) return;
              const side = s.idSide;
              patch({ canvasJustSelected: { id: "idCapture", value: side } });
              setTimeout(() => {
                if (side === "front") patch({ idSide: "back", idShots: 1, canvasJustSelected: null });
                else patch({ idShots: 2, canvasJustSelected: null, screen: "idReview" });
              }, 650);
            }
            return (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px 20px 24px", background: "#f4f7fa" }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.08em", color: "#14b3ac", textTransform: "uppercase" }}>{s.idSide === "front" ? "1 of 2 · Front" : "2 of 2 · Back"}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em", marginTop: 6 }}>{s.idSide === "front" ? "Scan your new ID" : "Now flip your ID"}</div>
                <div style={{ fontSize: 15, color: "#5b6b7d", marginTop: 8, lineHeight: 1.45 }}>
                  {s.idSide === "front" ? "We'll guide you through both sides — a driver's licence or any government photo ID for you, the adult bringing " + name + " in." : "Same frame, same steady hands."}
                </div>
                <div style={{ position: "relative", background: "#0d1421", borderRadius: 22, marginTop: 16, padding: "26px 18px", overflow: "hidden" }}>
                  <div style={{ position: "relative", borderRadius: 14, aspectRatio: 1.58, background: "#1c2836", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {justCaptured ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#16a34a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700 }}>✓</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#ffffff" }}>{justCaptured === "front" ? "Front captured" : "Back captured"}</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ position: "absolute", top: 10, left: 10, width: 26, height: 26, borderTop: "3px solid #14b3ac", borderLeft: "3px solid #14b3ac", borderRadius: "8px 0 0 0" }} />
                        <div style={{ position: "absolute", top: 10, right: 10, width: 26, height: 26, borderTop: "3px solid #14b3ac", borderRight: "3px solid #14b3ac", borderRadius: "0 8px 0 0" }} />
                        <div style={{ position: "absolute", bottom: 10, left: 10, width: 26, height: 26, borderBottom: "3px solid #14b3ac", borderLeft: "3px solid #14b3ac", borderRadius: "0 0 0 8px" }} />
                        <div style={{ position: "absolute", bottom: 10, right: 10, width: 26, height: 26, borderBottom: "3px solid #14b3ac", borderRight: "3px solid #14b3ac", borderRadius: "0 0 8px 0" }} />
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#7c8fa3", textAlign: "center", lineHeight: 1.4, padding: "0 24px" }}>{s.idSide === "front" ? "Place the front of the card in the frame" : "Place the back of the card in the frame"}</div>
                      </>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 16 }}>
                  {["Flat on a dark surface reads best", "Avoid glare from overhead lights", "All four corners inside the frame"].map((t) => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 11, background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 14, padding: "13px 15px" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#e6f7f6", color: "#14b3ac", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>✓</div>
                      <div style={{ flex: 1, fontSize: 14.5, color: "#3d4d5f", lineHeight: 1.35 }}>{t}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="tap-target" onClick={capture} style={{ cursor: "pointer", background: "#2b9dd9", color: "#ffffff", borderRadius: 18, padding: 20, textAlign: "center", fontSize: 17, fontWeight: 600, boxShadow: "0 6px 16px rgba(43,157,217,0.28)" }}>
                    {s.idSide === "front" ? "Capture the front" : "Capture the back"}
                  </div>
                  <div className="tap-target" onClick={capture} style={{ cursor: "pointer", textAlign: "center", fontSize: 15, fontWeight: 600, color: "#1f9ed4", padding: 11 }}>
                    Choose an existing photo instead
                  </div>
                </div>
              </div>
            );
          })()}

          {sc === "idReview" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px 24px", background: "#f4f7fa" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e8f8ee", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700 }}>✓</div>
              <div style={{ fontSize: 27, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em", marginTop: 18 }}>ID captured.</div>
              <div style={{ fontSize: 15, color: "#5b6b7d", marginTop: 9, lineHeight: 1.45 }}>Front ✓ Back ✓ — we can read everything we need.</div>

              {!s.reviewPhotosOpen ? (
                <div className="tap-target" onClick={() => patch({ reviewPhotosOpen: true })} style={{ cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#8b9aab", marginTop: 16 }}>Review photos</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 16 }}>
                  {[
                    { label: "Front of your ID", side: "front" as const },
                    { label: "Back of your ID", side: "back" as const },
                  ].map((shot) => (
                    <div key={shot.label} style={{ background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 18, padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#16a34a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</div>
                        <div style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "#0d1421" }}>{shot.label}</div>
                        <div className="tap-target" onClick={() => patch({ idSide: shot.side, screen: "idCapture" })} style={{ cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#1f9ed4", padding: "4px 0" }}>Retake</div>
                      </div>
                      <div style={{ borderRadius: 12, aspectRatio: 1.58, background: "#e7edf3", marginTop: 12, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 14, gap: 6 }}>
                        <div style={{ width: "46%", height: 8, borderRadius: 4, background: "#c8d5e0" }} />
                        <div style={{ width: "66%", height: 8, borderRadius: 4, background: "#c8d5e0" }} />
                        <div style={{ width: "34%", height: 8, borderRadius: 4, background: "#d6e0e9" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="tap-target" onClick={() => { patch({ reviewPhotosOpen: false }); next(); }} style={{ cursor: "pointer", background: "#2b9dd9", color: "#ffffff", borderRadius: 18, padding: 20, textAlign: "center", fontSize: 17, fontWeight: 600, boxShadow: "0 6px 16px rgba(43,157,217,0.28)" }}>Continue</div>
              </div>
            </div>
          )}

          {(sc === "idConfirm" || sc === "coverageConfirm" || sc === "consentsConfirm") && (() => {
            const confirmTitle = { idConfirm: "Your ID is on file.", coverageConfirm: name + "'s coverage is on file.", consentsConfirm: "Your consents are unchanged." }[sc] || "";
            const confirmSub = {
              idConfirm: "Captured at your last visit. Nothing to do unless it's expired or you've replaced it.",
              coverageConfirm: "We checked it this morning and it's active. Nothing to re-type unless something changed.",
              consentsConfirm: "Signed on 14 March and still current for this visit type. Review any one of them if you'd like.",
            }[sc] || "";
            const confirmCardLabel = { idConfirm: "Guardian ID", coverageConfirm: "Insurance", consentsConfirm: "Signed documents" }[sc] || "";
            const confirmRows =
              sc === "idConfirm"
                ? [
                    { label: "Document", value: "Texas driver's licence", sub: "Captured 14 Mar 2026" },
                    { label: "Name", value: "Elena Marquez", sub: name + "'s parent" },
                    { label: "Expires", value: "April 2029", sub: "" },
                  ]
                : sc === "coverageConfirm"
                ? [
                    { label: "Plan", value: "BlueCross BlueShield PPO", sub: "Active · verified today", subGreen: true },
                    { label: "Member ID", value: "BXP440291847", sub: "" },
                    { label: "Policy holder", value: "Elena Marquez", sub: "Parent" },
                    { label: "Copay", value: "$25 for this visit type", sub: "" },
                  ]
                : docs.map((d) => ({ label: "Signed", value: fill(d.label.en), sub: "14 Mar 2026", link: true, docId: d.id }));
            const confirmQuestion = { idConfirm: "Is this ID still current?", coverageConfirm: "Is this still " + name + "'s coverage?", consentsConfirm: "Has anything changed since March?" }[sc] || "";
            const key = { idConfirm: "idChanged", coverageConfirm: "coverageChanged", consentsConfirm: "consentsChanged" }[sc] as "idChanged" | "coverageChanged" | "consentsChanged";
            const touchedKey = { idConfirm: "tId", coverageConfirm: "tCov", consentsConfirm: "tCon" }[sc] as "tId" | "tCov" | "tCon";
            const opts =
              sc === "idConfirm"
                ? [["Yes, that's still my ID", "", false], ["It expired or I replaced it", "Opens the camera again", true]]
                : sc === "coverageConfirm"
                ? [["Yes, same plan", "", false], ["No, we changed insurance", "Opens the full coverage form", true]]
                : [["No, nothing has changed", "", false], ["Yes — I need to read them again", "Opens the full summaries", true]];
            const changed = s[key];
            const touched = s[touchedKey];
            // Ask → Tap → Confirm visually → Auto-advance — no separate
            // Continue button once a clear yes/no is tapped. The "changed"
            // branch and the "unchanged" branch each go straight to their
            // own next screen; which screens flow() inserts for Flow B never
            // depends on anything else, so these are safe to name directly
            // rather than re-deriving flow() against a same-tick state
            // update that hasn't committed yet.
            const nextScreens: Record<string, [Screen, Screen]> = {
              idConfirm: ["coverageConfirm", "idCapture"],
              coverageConfirm: ["consentsConfirm", "rcsCoverage"],
              consentsConfirm: ["review", "consents"],
            };
            const justPickedId = "confirm:" + sc;
            const justPicked = s.canvasJustSelected?.id === justPickedId;
            function pick(onVal: boolean) {
              if (s.canvasJustSelected) return;
              patch({ canvasJustSelected: { id: justPickedId, value: String(onVal) } });
              setTimeout(() => {
                patch({ [key]: onVal, [touchedKey]: true, canvasJustSelected: null } as Partial<PedState>);
                go(nextScreens[sc][onVal ? 1 : 0]);
              }, 180);
            }
            return (
              <ConversationShell
                historyKey={sc}
                sheetCollapsed={sheetCollapsed}
                onToggleCollapse={() => setSheetCollapsed((v) => !v)}
                history={
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={HISTORY_STATEMENT}>{confirmTitle}</div>
                      <div style={{ fontSize: 15, color: "#5b6b7d", lineHeight: 1.45 }}>{confirmSub}</div>
                    </div>

                    <div style={{ background: "#ffffff", border: "1px solid #e2f2f1", borderRadius: 20, padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#8b9aab", textTransform: "uppercase" }}>{confirmCardLabel}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "6px 11px", flexShrink: 0, background: "#e8f8ee" }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#16a34a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700 }}>✓</div>
                          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap", color: "#15803d" }}>On file</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 14 }}>
                        {confirmRows.map((row, ri) => (
                          <div key={ri} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                            <div style={{ width: 88, flexShrink: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>{row.label}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 15.5, fontWeight: 600, color: "#0d1421", lineHeight: 1.3 }}>{row.value}</div>
                              {row.sub && <div style={{ fontSize: 13, color: (row as { subGreen?: boolean }).subGreen ? "#16a34a" : "#8b9aab", fontWeight: (row as { subGreen?: boolean }).subGreen ? 500 : 400, marginTop: 2 }}>{row.sub}</div>}
                            </div>
                            {(row as { link?: boolean; docId?: string }).link && (
                              <div onClick={() => patch({ consentsChanged: true, consentOpen: (row as { docId?: string }).docId || null, screen: "consents" })} style={{ cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "#1f9ed4", flexShrink: 0, padding: "4px 0" }}>Review</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                }
                sheet={sheetContent(
                  <>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0d1421", lineHeight: 1.35 }}>{confirmQuestion}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {opts.map((o, oi) => {
                        const onVal = o[2] as boolean;
                        const picked = justPicked ? s.canvasJustSelected!.value === String(onVal) : touched && changed === onVal;
                        return (
                          <div key={oi} className="tap-target" onClick={() => pick(onVal)} style={picked ? PILL_OUTLINE_ON : PILL_OUTLINE}>
                            <div style={{ fontSize: 15.5, fontWeight: 600 }}>{o[0] as string}</div>
                            {o[1] ? <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2, opacity: 0.8 }}>{o[1] as string}</div> : null}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              />
            );
          })()}

          {sc === "rcsCoverage" && (() => {
            const BUBBLE_BOT: React.CSSProperties = { alignSelf: "flex-start", maxWidth: "88%", background: "#ffffff", border: "1px solid #eef2f6", borderRadius: "4px 16px 16px 16px", padding: "13px 15px", fontSize: 15, color: "#0d1421", lineHeight: 1.45, boxShadow: "0 1px 2px rgba(13,20,33,0.04)" };
            const BUBBLE_ME: React.CSSProperties = { alignSelf: "flex-end", maxWidth: "80%", background: "#0d1421", color: "#ffffff", borderRadius: "16px 4px 16px 16px", padding: "12px 16px", fontSize: 15, fontWeight: 600 };
            const inputStyle: React.CSSProperties = { border: "1.5px solid #e3eaf1", borderRadius: 10, padding: "10px 12px", fontSize: 14.5, outline: "none", background: "#f8fafc", color: "#0d1421" };
            const ROW_LABEL: React.CSSProperties = { color: "#8b9aab", fontSize: 12.5, flexShrink: 0 };
            const ROW_VALUE: React.CSSProperties = { fontWeight: 600, textAlign: "right" };
            const checking = s.ocrElig !== "done";
            const eligFound = s.ocrElig === "done";
            const copayAmount = P.visitType === "Well visit" ? "$0" : "$25";
            const chargeLabel = s.payMethod === AT_DESK ? "at reception" : dueToday ? "today" : "after your visit";
            const addCardLabel = savedCard ? NEW_CARD : ADD_CARD;
            const paidLabel = usingNewCard ? (brand || "Card") + " ····" + (cardDigits.slice(-4) || "····") : s.payMethod;
            function tapPay(label: string) {
              if (label === addCardLabel) { patch({ payMethod: label }); return; }
              patch({ payMethod: label, rcsPayConfirmed: true });
            }
            return (
              <ConversationShell
                historyKey={[s.ocrElig, s.rcsEligConfirmed, s.editCard, s.cardUpdated, s.payMethod, s.rcsPayConfirmed].join(":")}
                sheetCollapsed={sheetCollapsed}
                onToggleCollapse={() => setSheetCollapsed((v) => !v)}
                history={
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "center", background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 999, padding: "6px 14px 6px 6px" }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#0d1421", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{P.practiceName[0]}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: "#5b6b7d", textTransform: "uppercase" }}>Verified practice · RCS</div>
                    </div>

                    {/* History first, then what follows is scoped to why this visit is happening. */}
                    <div style={{ ...BUBBLE_BOT, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#8b9aab", textTransform: "uppercase" }}>This visit</div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={ROW_LABEL}>Reason</span><span style={ROW_VALUE}>{P.visitType} · Dr. Reyes</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={ROW_LABEL}>When</span><span style={ROW_VALUE}>Tomorrow · 10:20 AM</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={ROW_LABEL}>Patient</span><span style={ROW_VALUE}>{name} · {P.patientAge} years</span></div>
                      <div style={{ height: 1, background: "#eef2f6", margin: "2px 0" }} />
                      <div style={{ fontSize: 12.5, color: "#5b6b7d", lineHeight: 1.4 }}>On file: penicillin allergy · ear pain reported in March · asthma plan current.</div>
                    </div>

                    <div style={BUBBLE_BOT}>{!eligFound ? <>Checking {name}&apos;s coverage with the insurer…</> : <>Good news — {name}&apos;s coverage is active.</>}</div>
                    {checking && (
                      <div style={{ alignSelf: "flex-start", display: "flex", gap: 5, padding: "2px 6px" }}>
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="rcs-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#b7c3ce", animationDelay: i * 140 + "ms" }} />
                        ))}
                      </div>
                    )}

                    {eligFound && (
                      <div style={{ ...BUBBLE_BOT, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#8b9aab", textTransform: "uppercase" }}>Coverage on file</div>
                        {ocrFieldsList.map((f) => (
                          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                            <span style={ROW_LABEL}>{f.label}</span>
                            <span style={ROW_VALUE}>{ov(f)}</span>
                          </div>
                        ))}
                        <div style={{ height: 1, background: "#eef2f6", margin: "2px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={ROW_LABEL}>Copay this visit</span>
                          <span style={{ fontWeight: 700, color: "#137e7a" }}>{copayAmount}</span>
                        </div>
                      </div>
                    )}
                    {s.rcsEligConfirmed && <div style={BUBBLE_ME}>{s.cardUpdated ? "That's updated — thanks." : "Looks right"}</div>}

                    {s.rcsEligConfirmed && <div style={BUBBLE_BOT}>How would you like to pay the {copayAmount} {chargeLabel}?</div>}
                    {s.rcsPayConfirmed && (
                      <>
                        <div style={BUBBLE_ME}>{paidLabel}</div>
                        <div className="rcs-check-pop" style={{ alignSelf: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "10px 0 4px" }}>
                          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#16a34a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, boxShadow: "0 8px 20px rgba(22,163,74,0.28)" }}>✓</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: "#0d1421" }}>Payment confirmed.</div>
                        </div>
                        <div style={{ ...BUBBLE_BOT, alignSelf: "stretch", maxWidth: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "#8b9aab", textTransform: "uppercase" }}>Receipt</div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={ROW_LABEL}>Visit</span><span style={ROW_VALUE}>{P.visitType} · Dr. Reyes</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={ROW_LABEL}>Coverage</span><span style={ROW_VALUE}>{ov(ocrFieldsList[0])}</span></div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={ROW_LABEL}>Payment method</span><span style={ROW_VALUE}>{paidLabel}</span></div>
                          <div style={{ height: 1, background: "#eef2f6", margin: "2px 0" }} />
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 700 }}>{s.payMethod === AT_DESK ? "Pay at reception" : dueToday ? "Charged today" : "Due after visit"}</span><span style={{ fontWeight: 700, color: "#137e7a" }}>{copayAmount}</span></div>
                        </div>
                      </>
                    )}
                  </>
                }
                sheet={sheetContent(
                  <>
                    {eligFound && !s.rcsEligConfirmed && !s.editCard && (
                      <>
                        <div style={{ fontSize: 15.5, fontWeight: 700, color: "#0d1421" }}>Does this look right?</div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <div className="tap-target" onClick={() => patch({ rcsEligConfirmed: true })} style={{ ...PILL_OUTLINE_ON, flex: 1 }}>Looks right</div>
                          <div className="tap-target" onClick={() => patch({ editCard: true })} style={{ ...PILL_OUTLINE, flex: 1 }}>Something&apos;s changed</div>
                        </div>
                      </>
                    )}

                    {s.editCard && (
                      <>
                        <div style={{ fontSize: 13.5, color: "#5b6b7d" }}>No problem — update the plan below.</div>
                        <input
                          value={ov(ocrFieldsList[0])}
                          onChange={(e) => patch((prev) => ({ ocr: { ...prev.ocr, insurer: e.target.value } }))}
                          placeholder="Insurance company"
                          style={inputStyle}
                        />
                        <input
                          value={ov(ocrFieldsList[1])}
                          onChange={(e) => patch((prev) => ({ ocr: { ...prev.ocr, memberId: e.target.value } }))}
                          placeholder="Member ID"
                          style={inputStyle}
                        />
                        <div className="tap-target" onClick={() => patch({ cardUpdated: true, editCard: false, rcsEligConfirmed: true })} style={{ ...BTN, padding: 13, fontSize: 15 }}>Save updated plan</div>
                        <div className="tap-target" onClick={() => patch({ editCard: false })} style={{ cursor: "pointer", textAlign: "center", fontSize: 13, color: "#8b9aab" }}>Never mind, that&apos;s right</div>
                      </>
                    )}

                    {s.rcsEligConfirmed && !s.rcsPayConfirmed && (
                      <>
                        {!usingNewCard && (
                          <div style={{ background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 16, overflow: "hidden" }}>
                            {(savedCard ? [cardOnFile, AT_DESK] : [AT_DESK]).map((label, i) => {
                              const selected = s.payMethod === label && !usingNewCard;
                              return (
                                <div key={label} className="tap-target" onClick={() => tapPay(label)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", borderTop: i > 0 ? "1px solid #eef2f6" : "none", cursor: "pointer" }}>
                                  {label === cardOnFile ? (
                                    <div style={{ width: 34, height: 22, borderRadius: 4, background: "#1a1f71", color: "#ffffff", fontSize: 9, fontWeight: 800, letterSpacing: "0.03em", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>VISA</div>
                                  ) : (
                                    <div style={{ width: 34, height: 22, borderRadius: 4, background: "#eef2f6", color: "#5b6b7d", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>$</div>
                                  )}
                                  <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500, color: "#0d1421" }}>{label}</div>
                                  <div style={selected ? DOT_ON : DOT}>{selected ? "✓" : ""}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {!usingNewCard && (
                          <div className="tap-target" onClick={() => tapPay(addCardLabel)} style={{ cursor: "pointer", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, background: "#ffffff", border: "1.5px dashed #cfdae5", borderRadius: 999, padding: "10px 16px", fontSize: 14, fontWeight: 600, color: "#1f6d96" }}>+ {addCardLabel}</div>
                        )}

                        {usingNewCard && (
                          <>
                            <input value={card.number} onChange={(e) => setCard("number", e.target.value)} placeholder="Card number" style={inputStyle} />
                            <div style={{ display: "flex", gap: 8 }}>
                              <input value={card.exp} onChange={(e) => setCard("exp", e.target.value)} placeholder="MM/YY" style={{ ...inputStyle, flex: 1 }} />
                              <input value={card.cvc} onChange={(e) => setCard("cvc", e.target.value)} placeholder="CVC" style={{ ...inputStyle, width: 70 }} />
                              <input value={card.zip} onChange={(e) => setCard("zip", e.target.value)} placeholder="ZIP" style={{ ...inputStyle, width: 80 }} />
                            </div>
                            <div onClick={() => patch((prev) => ({ saveCard: !prev.saveCard }))} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#5b6b7d" }}>
                              <div style={{ width: 34, height: 20, borderRadius: 999, background: s.saveCard ? "#14b3ac" : "#dbe6ee", padding: 2, display: "flex", justifyContent: s.saveCard ? "flex-end" : "flex-start", flexShrink: 0 }}>
                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#ffffff" }} />
                              </div>
                              Save this card for next time
                            </div>
                            <div className="tap-target" onClick={() => { if (newCardValid) patch({ rcsPayConfirmed: true }); }} style={newCardValid ? { ...BTN, padding: 13, fontSize: 15 } : { ...BTN_OFF, padding: 13, fontSize: 15 }}>Save card</div>
                          </>
                        )}
                      </>
                    )}

                    {s.rcsPayConfirmed && <div className="tap-target" onClick={next} style={BTN}>Continue</div>}
                  </>
                )}
              />
            );
          })()}

          {sc === "consents" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px 24px", background: "#f4f7fa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, fontSize: 27, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em" }}>{s.lang === "en" ? "Four things to agree to." : "Cuatro documentos."}</div>
                <div style={{ display: "flex", background: "#ffffff", border: "1.5px solid #e3eaf1", borderRadius: 999, padding: 3, flexShrink: 0 }}>
                  {(["en", "es"] as const).map((l) => (
                    <div key={l} className="tap-target" onClick={() => patch({ lang: l })} style={s.lang === l ? { cursor: "pointer", background: "#14b3ac", color: "#ffffff", borderRadius: 999, padding: "7px 13px", fontSize: 12.5, fontWeight: 700 } : { cursor: "pointer", color: "#8b9aab", borderRadius: 999, padding: "7px 13px", fontSize: 12.5, fontWeight: 700 }}>{l.toUpperCase()}</div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 15, color: "#5b6b7d", marginTop: 9, lineHeight: 1.45 }}>{s.lang === "en" ? "Plain summaries first. Open the full text only if you want it." : "Primero los resúmenes. Abra el texto completo solo si lo desea."}</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 14, padding: "13px 15px", marginTop: 14 }}>
                <div style={{ width: 19, height: 19, borderRadius: "50%", background: "#e6f7f6", color: "#14b3ac", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>i</div>
                <div style={{ flex: 1, fontSize: 13.5, color: "#5b6b7d", lineHeight: 1.4 }}>
                  {s.lang === "en"
                    ? "Showing " + docs.length + " documents that apply to a " + P.patientAge + "-year-old at a " + P.visitType.toLowerCase() + ". Nothing else is bundled in."
                    : "Mostrando " + docs.length + " documentos que corresponden a esta edad y tipo de visita."}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 14 }}>
                {docs.map((d) => {
                  const ack = s.consentAcks.includes(d.id);
                  const open = s.consentOpen === d.id;
                  const badge = d.id === "teen" ? "Because " + name + " is " + P.patientAge : d.id === "vaccine" ? "Because it's a well visit" : "";
                  return (
                    <div key={d.id} style={ack ? { background: "#f0fdf4", border: "1.5px solid #bbe9cb", borderRadius: 18, padding: 17 } : { background: "#ffffff", border: "1.5px solid #eef2f6", borderRadius: 18, padding: 17 }}>
                      <div className="tap-target" onClick={() => patch((prev) => ({ consentAcks: prev.consentAcks.includes(d.id) ? prev.consentAcks.filter((x) => x !== d.id) : [...prev.consentAcks, d.id] }))} style={{ cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 13 }}>
                        <div style={ack ? BOX_ON : BOX}>{ack ? "✓" : ""}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <div style={{ fontSize: 16.5, fontWeight: 700, color: "#0d1421", lineHeight: 1.25 }}>{fill(d.label[s.lang])}</div>
                            {badge && <div style={{ background: "#e6f7f6", color: "#0f6f6b", borderRadius: 999, padding: "3px 9px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{badge}</div>}
                          </div>
                          <div style={{ fontSize: 14.5, color: "#5b6b7d", marginTop: 6, lineHeight: 1.45 }}>{fill(d.summary[s.lang])}</div>
                        </div>
                      </div>
                      <div onClick={() => patch((prev) => ({ consentOpen: prev.consentOpen === d.id ? null : d.id }))} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 7, marginTop: 12, paddingLeft: 36 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1f9ed4" }}>{open ? (s.lang === "en" ? "Hide full text" : "Ocultar texto completo") : s.lang === "en" ? "Read full text" : "Leer texto completo"}</div>
                        <div style={{ color: "#b7cbdb", fontSize: 14, lineHeight: 1, transform: `rotate(${open ? "180deg" : "0deg"})` }}>⌄</div>
                      </div>
                      {open && <div style={{ background: "#f4f7fa", borderRadius: 14, padding: 15, marginTop: 10, marginLeft: 36, fontSize: 13.5, color: "#5b6b7d", lineHeight: 1.6 }}>{fill(d.full[s.lang])}</div>}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: "auto", paddingTop: 22, display: "flex", flexDirection: "column", gap: 9 }}>
                <div onClick={() => { if (allAcked) next(); }} style={allAcked ? BTN : BTN_OFF}>Continue to sign</div>
                <div style={{ textAlign: "center", fontSize: 13.5, color: "#8b9aab" }}>
                  {allAcked
                    ? s.lang === "en" ? "All " + docs.length + " acknowledged" : "Los " + docs.length + " confirmados"
                    : s.lang === "en" ? "Tick the " + (docs.length - s.consentAcks.length) + " remaining to continue" : "Marque los " + (docs.length - s.consentAcks.length) + " restantes"}
                </div>
              </div>
            </div>
          )}

          {sc === "signature" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px 24px", background: "#f4f7fa" }}>
              <div style={{ fontSize: 27, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em" }}>One signature covers all {docs.length}.</div>
              <div style={{ fontSize: 15, color: "#5b6b7d", marginTop: 9, lineHeight: 1.45 }}>Applies to {docs.map((d) => fill(d.label[s.lang])).join(", ").toLowerCase()}.</div>

              <div style={{ background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 16, padding: "14px 16px", marginTop: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>Signing as</div>
                <div style={{ fontSize: 16.5, fontWeight: 600, color: "#0d1421", marginTop: 4 }}>{(rel || "Parent") + " of " + name}</div>
              </div>
              <div style={{ background: "#ffffff", border: "1.5px solid #eef2f6", borderRadius: 16, padding: "13px 16px", marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>Your full legal name</div>
                <input
                  value={typedName}
                  onChange={(e) => patch({ signName: e.target.value, signNameTouched: true, signed: false })}
                  onFocus={scrollIntoViewOnFocus}
                  placeholder="Type your full name"
                  style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 16.5, fontWeight: 500, color: "#0d1421", marginTop: 5, padding: "3px 0" }}
                />
              </div>

              <div style={{ display: "flex", background: "#ffffff", border: "1.5px solid #e3eaf1", borderRadius: 14, padding: 4, marginTop: 14 }}>
                {(["type", "draw", "upload"] as const).map((m) => (
                  <div key={m} onClick={() => patch({ signMode: m, signed: false })} style={s.signMode === m ? { cursor: "pointer", flex: 1, textAlign: "center", background: "#14b3ac", color: "#ffffff", borderRadius: 11, padding: "12px 6px", fontSize: 14, fontWeight: 600 } : { cursor: "pointer", flex: 1, textAlign: "center", color: "#5b6b7d", borderRadius: 11, padding: "12px 6px", fontSize: 14, fontWeight: 600 }}>
                    {m === "type" ? "Type it" : m === "draw" ? "Draw it" : "Upload it"}
                  </div>
                ))}
              </div>

              {s.signMode === "upload" && (
                s.upload ? (
                  <div style={{ background: "#ffffff", border: "1.5px solid #14b3ac", borderRadius: 18, padding: 14, marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#16a34a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>✓</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#0d1421" }}>signature.jpg</div>
                        <div style={{ fontSize: 13, color: "#8b9aab", marginTop: 1 }}>Chosen from your library · 412 KB</div>
                      </div>
                    </div>
                    <div style={{ borderRadius: 12, background: "#f4f7fa", marginTop: 12, minHeight: 96, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontFamily: "'Caveat',cursive", fontSize: 38, color: "#33445a", lineHeight: 1 }}>{typedName || guardianVal || "Elena Marquez"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <div onClick={() => patch({ upload: null, signed: false })} style={{ cursor: "pointer", flex: 1, textAlign: "center", background: "#ffffff", border: "1.5px solid #cfdae5", color: "#1f6d96", borderRadius: 13, padding: 13, fontSize: 14.5, fontWeight: 600 }}>Retake</div>
                      <div onClick={() => patch({ upload: null, signed: false })} style={{ cursor: "pointer", flex: 1, textAlign: "center", background: "#ffffff", border: "1.5px solid #cfdae5", color: "#1f6d96", borderRadius: 13, padding: 13, fontSize: 14.5, fontWeight: 600 }}>Choose a different photo</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#ffffff", border: "1.5px dashed #cfdae5", borderRadius: 18, padding: "22px 18px", marginTop: 12, textAlign: "center" }}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: "#eef4fa", color: "#3d6b96", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 16.5V5.4" />
                        <path d="M7.6 9.8 12 5.4l4.4 4.4" />
                        <path d="M4.6 15.4v2.6a1.6 1.6 0 0 0 1.6 1.6h11.6a1.6 1.6 0 0 0 1.6-1.6v-2.6" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#0d1421", marginTop: 12, lineHeight: 1.3 }}>Upload a photo of your signature</div>
                    <div style={{ fontSize: 13.5, color: "#8b9aab", marginTop: 5, lineHeight: 1.4 }}>A signed slip or a saved signature image, from your library or camera.</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                      <div onClick={() => patch({ upload: "signature.jpg", signed: false })} style={{ cursor: "pointer", flex: 1, textAlign: "center", background: "#2b9dd9", color: "#ffffff", borderRadius: 13, padding: 14, fontSize: 15, fontWeight: 600 }}>Choose photo</div>
                      <div onClick={() => patch({ upload: "signature.jpg", signed: false })} style={{ cursor: "pointer", flex: 1, textAlign: "center", background: "#ffffff", border: "1.5px solid #cfdae5", color: "#1f6d96", borderRadius: 13, padding: 14, fontSize: 15, fontWeight: 600 }}>Take a photo</div>
                    </div>
                  </div>
                )
              )}

              {s.signMode !== "upload" && (
                <div onClick={() => { if (signValid) patch({ signed: true }); }} style={{ cursor: "pointer", background: "#ffffff", border: s.signed ? "1.5px solid #14b3ac" : "1.5px dashed #cfdae5", borderRadius: 18, marginTop: 12, minHeight: 130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 18, textAlign: "center" }}>
                  <div style={s.signed ? { fontFamily: "'Caveat',cursive", fontSize: 42, color: "#0d1421", lineHeight: 1.1 } : { fontSize: 16, color: "#b7cbdb", fontWeight: 500 }}>
                    {s.signed ? typedName || "Elena Marquez" : s.signMode === "type" ? typedName || "Your name appears here" : "Draw your signature"}
                  </div>
                  {!s.signed && <div style={{ fontSize: 13.5, color: "#a9b7c5", marginTop: 10 }}>{s.signMode === "type" ? "Tap to apply your typed signature" : "Tap and drag inside the box"}</div>}
                </div>
              )}

              <div style={{ marginTop: "auto", paddingTop: 20, display: "flex", flexDirection: "column", gap: 9 }}>
                <div onClick={() => { if (s.signMode === "upload" ? !!s.upload : s.signed) next(); }} style={(s.signMode === "upload" ? !!s.upload : s.signed) ? BTN : BTN_OFF}>{s.signed ? "Agree and sign" : "Sign to continue"}</div>
                <div style={{ textAlign: "center", fontSize: 13.5, color: "#8b9aab", lineHeight: 1.4 }}>
                  {s.signMode === "upload" && s.upload
                    ? "Uploaded signature accepted · signing as " + (rel || "Parent")
                    : s.signed
                    ? "Signed as " + (rel || "Parent") + " · " + typedName
                    : signValid
                    ? "Tap the box above to sign."
                    : s.signMode === "upload"
                    ? "Choose a photo to continue."
                    : "Type your full legal name first."}
                </div>
              </div>
            </div>
          )}

          {sc === "preferences" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px 24px", background: "#f4f7fa" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eef4fa", borderRadius: 999, padding: "8px 14px", alignSelf: "flex-start" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.06em", color: "#3d6b96", textTransform: "uppercase" }}>Optional · not part of your consents</div>
              </div>
              <div style={{ fontSize: 27, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em", marginTop: 16 }}>How should we reach you?</div>
              <div style={{ fontSize: 15, color: "#5b6b7d", marginTop: 9, lineHeight: 1.45 }}>Skip all of this if you&apos;d rather. It has no effect on {name}&apos;s care.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                {[
                  ["Text me appointment reminders", "The day before, and an hour ahead"],
                  ["Email me visit summaries", "After each visit"],
                  ["Send me clinic news", "A few times a year at most"],
                ].map(([label, sub]) => {
                  const on = s.prefs.includes(label);
                  return (
                    <div key={label} onClick={() => patch((prev) => ({ prefs: prev.prefs.includes(label) ? prev.prefs.filter((x) => x !== label) : [...prev.prefs, label] }))} style={on ? CARD_ON : CARD}>
                      <div style={on ? BOX_ON : BOX}>{on ? "✓" : ""}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 500, color: "#0d1421", lineHeight: 1.3 }}>{label}</div>
                        <div style={{ fontSize: 13.5, color: "#8b9aab", marginTop: 2 }}>{sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 22, display: "flex", flexDirection: "column", gap: 6 }}>
                <div onClick={next} style={{ cursor: "pointer", background: "#2b9dd9", color: "#ffffff", borderRadius: 18, padding: 20, textAlign: "center", fontSize: 17, fontWeight: 600, boxShadow: "0 6px 16px rgba(43,157,217,0.28)" }}>Save and continue</div>
                <div onClick={next} style={{ cursor: "pointer", textAlign: "center", fontSize: 15, fontWeight: 600, color: "#6b7a8d", padding: 12 }}>Skip this</div>
              </div>
            </div>
          )}

          {sc === "home" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px 20px 26px", background: "#f4f7fa" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em" }}>How is {name} doing?</div>
              <div style={{ fontSize: 15.5, color: "#5b6b7d", marginTop: 9, lineHeight: 1.45 }}>Tell us before the visit so Dr. Reyes is ready. Takes about two minutes.</div>

              <div style={{ background: "#ffffff", border: "1px solid #e2f2f1", borderRadius: 20, padding: 20, marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#dff5f4", color: "#14b3ac", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>{name.charAt(0)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 19, fontWeight: 700, color: "#0d1421", lineHeight: 1.2 }}>{name}</div>
                    <div style={{ fontSize: 14.5, color: "#6b7a8d", marginTop: 3 }}>{P.patientAge} years · {fig.label.split(" · ")[0]}</div>
                  </div>
                </div>
                <div style={{ height: 1, background: "#eef2f6", margin: "18px 0 14px" }} />
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#8b9aab", textTransform: "uppercase" }}>Next visit</div>
                <div style={{ fontSize: 16.5, fontWeight: 600, color: "#0d1421", marginTop: 4 }}>Tomorrow · 10:20 AM · Dr. Reyes</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 18, background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 14, padding: "13px 16px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e0a63a", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: "#5b6b7d" }}>We already have: <span style={{ color: "#0d1421", fontWeight: 600 }}>Penicillin allergy · Asthma plan</span></div>
              </div>

              <div style={{ marginTop: "auto", paddingTop: 24, display: "flex", flexDirection: "column", gap: 11 }}>
                <div onClick={() => go("chat")} style={{ cursor: "pointer", background: "#2b9dd9", color: "#ffffff", borderRadius: 18, padding: 20, textAlign: "center", fontSize: 17, fontWeight: 600, boxShadow: "0 6px 16px rgba(43,157,217,0.28)" }}>Tell us what&apos;s going on</div>
              </div>
            </div>
          )}

          {sc === "chat" && (
            <ConversationShell
              historyKey="chat"
              sheetCollapsed={sheetCollapsed}
              onToggleCollapse={() => setSheetCollapsed((v) => !v)}
              history={
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={HISTORY_STATEMENT}>What&apos;s going on with {name}?</div>
                  <div style={{ fontSize: 15, color: "#5b6b7d", lineHeight: 1.5 }}>Tell me in your own words — I&apos;ll only ask what&apos;s relevant after that.</div>
                </div>
              }
              sheet={sheetContent(
                <>
                  <div style={{ background: "#f8fafc", border: "1.5px solid #e3eaf1", borderRadius: 16, padding: 14 }}>
                    <textarea
                      value={s.chatText}
                      onChange={(e) => patch({ chatText: e.target.value })}
                      onFocus={scrollIntoViewOnFocus}
                      placeholder="She's been tugging her right ear for a few days and it's worse at bedtime…"
                      rows={3}
                      style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 15.5, lineHeight: 1.45, color: "#0d1421", background: "transparent" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, paddingTop: 10, borderTop: "1px solid #eef2f6" }}>
                      <div className="tap-target" onClick={() => patch((prev) => ({ mic: !prev.mic }))} style={s.mic ? { ...MIC_BTN, background: "#c0392b" } : MIC_BTN}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M12 4.5a2.8 2.8 0 0 1 2.8 2.8v4.4a2.8 2.8 0 0 1-5.6 0V7.3A2.8 2.8 0 0 1 12 4.5Z" />
                          <path d="M6.6 11.4a5.4 5.4 0 0 0 10.8 0" />
                          <path d="M12 16.8V19.5" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, fontSize: 13, color: "#8b9aab", lineHeight: 1.35 }}>{s.mic ? "Listening — talk normally, tap to stop." : "Or tap the mic and just say it."}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {["Ear pain", "Fever", "Cough", "Tummy ache", "Something else"].map((v) => (
                      <div key={v} className="tap-target" onClick={() => { if (v !== "Something else") patch({ chatText: v + " for a few days, worse at night" }); }} style={PILL_OUTLINE}>{v}</div>
                    ))}
                  </div>

                  <div className="tap-target" onClick={() => { if (chatReady) parseText(); }} style={chatReady ? BTN : BTN_OFF}>Tell Dr. Reyes</div>
                  <div style={{ textAlign: "center", fontSize: 13, color: "#8b9aab" }}>{chatReady ? "Nothing is sent yet — you'll confirm everything first." : "Type or say a few words to continue."}</div>
                </>
              )}
            />
          )}

          {sc === "handoff" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px 24px", background: "#f4f7fa" }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: "#e9edfb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4a5bb8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2.8" width="14" height="18.4" rx="3" />
                  <path d="M10.4 18.4h3.2" />
                </svg>
              </div>
              <div style={{ fontSize: 27, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em", marginTop: 18 }}>Some questions are just for {name}.</div>
              <div style={{ fontSize: 15.5, color: "#5b6b7d", marginTop: 10, lineHeight: 1.5 }}>{name} is {P.patientAge} years old, so the next few questions can be answered privately. You won&apos;t see the answers — Dr. Reyes will.</div>
              <div style={{ background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 18, padding: 18, marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                {["Only Dr. Reyes sees these answers — they don't appear in your view.", name + " can skip any question.", "The phone comes back to you afterwards to finish the rest."].map((p) => (
                  <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#e9edfb", color: "#4a5bb8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</div>
                    <div style={{ flex: 1, fontSize: 14.5, color: "#3d4d5f", lineHeight: 1.45 }}>{p}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                <div onClick={() => patch({ handedOff: true, screen: "private" })} style={{ cursor: "pointer", background: "#4a5bb8", color: "#ffffff", borderRadius: 18, padding: 20, textAlign: "center", fontSize: 17, fontWeight: 600, boxShadow: "0 6px 16px rgba(74,91,184,0.26)" }}>Hand the phone to {name}</div>
                <div onClick={next} style={{ cursor: "pointer", textAlign: "center", fontSize: 15, fontWeight: 600, color: "#6b7a8d", padding: 12 }}>{name} isn&apos;t here — skip for now</div>
              </div>
            </div>
          )}

          {sc === "private" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px 24px", background: "#f1f3fb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, background: "#e9edfb", borderRadius: 999, padding: "9px 14px", alignSelf: "flex-start" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4a5bb8" }} />
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: "#4a5bb8", textTransform: "uppercase" }}>Private · only your doctor sees this</div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0d1421", lineHeight: 1.25, letterSpacing: "-0.01em", marginTop: 18 }}>Is there anything you&apos;d like to tell Dr. Reyes on your own?</div>
              <div style={{ fontSize: 15, color: "#5b6b7d", marginTop: 9, lineHeight: 1.45 }}>You can skip anything you don&apos;t want to answer.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
                {["No, nothing else", "Yes — I'd like to talk privately", "I have a question about my body", "I'd rather not say"].map((v) => (
                  <div key={v} onClick={() => patch({ privateAnswer: v })} style={s.privateAnswer === v ? CARD_ON : CARD}>
                    <div style={s.privateAnswer === v ? DOT_ON : DOT} />
                    <div style={{ flex: 1, fontSize: 16.5, fontWeight: 500, color: "#0d1421" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 22, display: "flex", flexDirection: "column", gap: 8 }}>
                <div onClick={() => go("canvas")} style={{ cursor: "pointer", background: "#4a5bb8", color: "#ffffff", borderRadius: 18, padding: 19, textAlign: "center", fontSize: 17, fontWeight: 600 }}>Done — give the phone back</div>
                <div onClick={() => go("canvas")} style={{ cursor: "pointer", textAlign: "center", fontSize: 14.5, fontWeight: 600, color: "#7b86bd", padding: 11 }}>Skip this</div>
              </div>
            </div>
          )}

          {sc === "bodyMap" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "20px 20px 22px", background: "#f4f7fa" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em" }}>Where does it hurt for {name}?</div>
              <div style={{ fontSize: 15, color: "#5b6b7d", marginTop: 8, lineHeight: 1.45 }}>
                {s.parsed ? "We've marked what you described. Tap to check it, or add another spot." : "Tap any spot that's bothering " + name + ". You can pick more than one."}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                {(["front", "back"] as const).map((v) => (
                  <div key={v} onClick={() => patch({ view: v })} style={s.view === v ? { cursor: "pointer", flex: 1, textAlign: "center", background: "#14b3ac", color: "#ffffff", borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 600 } : { cursor: "pointer", flex: 1, textAlign: "center", background: "#ffffff", color: "#5b6b7d", border: "1.5px solid #e3eaf1", borderRadius: 14, padding: 14, fontSize: 15, fontWeight: 600 }}>
                    {v === "front" ? "Front" : "Back"}
                  </div>
                ))}
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 20, marginTop: 12, padding: "8px 10px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#a9b7c5", textTransform: "uppercase", padding: "4px 0 2px" }}>{fig.label}</div>
                <svg width={fig.w} height={fig.h} viewBox="0 0 120 174">
                  <path d={fig.path} fill="#eef4fa" stroke="#dbe6ee" strokeWidth="1.1" strokeLinejoin="round" />
                  <g stroke="none">
                    {ZONES[s.view].map((z) => {
                      const a = s.areas[z.id];
                      const suggested = a && a.suggested && !a.confirmed;
                      return <circle key={z.id} cx={z.cx} cy={z.cy} r={z.r} fill={a ? (suggested ? "rgba(20,179,172,0.28)" : "#14b3ac") : "rgba(43,157,217,0.13)"} stroke={suggested ? "#14b3ac" : "transparent"} strokeWidth={1.6} strokeDasharray={suggested ? "3 2" : "0"} />;
                    })}
                  </g>
                  <g fill="transparent" stroke="none">
                    {ZONES[s.view].map((z) => (
                      <circle key={z.id} cx={z.cx} cy={z.cy} r={13} onClick={() => toggleRegion(z.id)} style={{ cursor: "pointer" }} />
                    ))}
                  </g>
                </svg>
              </div>

              {order.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
                  {order.map((id) => {
                    const a = norm(s.areas[id]);
                    const sugArea = a.suggested && !a.confirmed;
                    const badge = sugArea ? "From what you told us" : a.confirmed ? "Details captured" : "Tap Continue to add details";
                    return (
                      <div key={id} onClick={() => toggleRegion(id)} style={sugArea ? { cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: "#f0fbfa", border: "1.5px dashed #6fc8c4", borderRadius: 999, padding: "11px 15px", color: "#137e7a" } : { cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: "#e6f7f6", border: "1.5px solid #e6f7f6", borderRadius: 999, padding: "11px 15px", color: "#137e7a" }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{id}</div>
                        <div style={{ fontSize: 12, color: sugArea ? "#0f6f6b" : "#5aa9a5", fontWeight: 600 }}>{badge}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", flexDirection: "column", gap: 9 }}>
                <div onClick={() => { if (order.length) go("canvas"); }} style={order.length ? BTN : BTN_OFF}>Continue</div>
                <div style={{ textAlign: "center", fontSize: 13.5, color: "#8b9aab", lineHeight: 1.35 }}>
                  {order.length
                    ? "A few quick questions next."
                    : "Tap at least one spot on the body to continue."}
                </div>
              </div>
            </div>
          )}

          {sc === "canvas" && (() => {
            const primaryRegion = s.order[0];
            const primaryArea = primaryRegion ? s.areas[primaryRegion] : undefined;
            const recapItems: { id: string; label: string }[] = [];
            if (primaryArea && primaryArea.suggested && primaryArea.spots.length > 0) {
              const regionWord = (REGION_META[primaryRegion]?.heading || primaryRegion + " pain").split(" ")[0].toLowerCase();
              recapItems.push({ id: "spot", label: primaryArea.spots[0] + " " + regionWord + " pain" });
            } else if (primaryRegion) {
              recapItems.push({ id: "region", label: REGION_META[primaryRegion]?.heading || primaryRegion + " pain" });
            }
            if (s.symptomOnset) recapItems.push({ id: "onset", label: "Started " + s.symptomOnset.toLowerCase() });
            if (s.symptomTrigger) recapItems.push({ id: "trigger", label: "Worse when " + s.symptomTrigger.toLowerCase() });
            const changeOpen = s.canvasChangeOpen === "recap";
            const cur = canvasCurrent;

            // The location question's "Not sure" is the one deliberate
            // escape hatch to the body-map diagram — every other question
            // (including "Not sure" elsewhere) commits normally.
            function tapSingle(step: CanvasStep, opt: string) {
              if (s.canvasJustSelected) return;
              if (step.id.endsWith(":spots") && opt === "Not sure") { go("bodyMap"); return; }
              selectSingle(step, opt);
            }

            return (
              <ConversationShell
                historyKey={s.canvasHistory.length + ":" + (cur?.id || "done")}
                sheetCollapsed={sheetCollapsed}
                onToggleCollapse={() => setSheetCollapsed((v) => !v)}
                history={
                  <>
                    {recapItems.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ flex: 1, fontSize: 17, fontWeight: 700, color: "#0d1421", lineHeight: 1.4 }}>
                            Got it. I picked up:{" "}
                            {recapItems.map((r, i) => (
                              <span key={r.id} style={{ fontSize: 14.5, fontWeight: 600, color: "#137e7a" }}>
                                {i > 0 ? " · " : ""}✓ {r.label}
                              </span>
                            ))}
                          </div>
                          <div
                            onClick={() => patch((prev) => ({ canvasChangeOpen: prev.canvasChangeOpen === "recap" ? null : "recap" }))}
                            className="tap-target"
                            style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1f9ed4", flexShrink: 0 }}
                          >
                            Change anything
                          </div>
                        </div>
                        {changeOpen && (
                          <div style={{ background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                            {primaryRegion && primaryArea?.suggested && primaryArea.spots.length > 0 && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>Location</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                                  {(SPOTS[primaryRegion] || DEFAULT_SPOTS).map((v) => (
                                    <div
                                      key={v} className="tap-target"
                                      onClick={() => patch((prev) => ({ areas: { ...prev.areas, [primaryRegion]: { ...prev.areas[primaryRegion], spots: [v] } }, canvasChangeOpen: null }))}
                                      style={plainChip(primaryArea.spots[0] === v)}
                                    >
                                      {v}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {s.symptomOnset && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>When it started</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                                  {ONSET_OPTIONS.map((v) => (
                                    <div key={v} className="tap-target" onClick={() => patch({ symptomOnset: v, canvasChangeOpen: null })} style={plainChip(s.symptomOnset === v)}>{v}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {s.symptomTrigger && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>What makes it worse</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                                  {TRIGGER_OPTIONS.map((v) => (
                                    <div key={v} className="tap-target" onClick={() => patch({ symptomTrigger: v, canvasChangeOpen: null })} style={plainChip(s.symptomTrigger === v)}>{v}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {canvasDetailCount > 0 && (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, fontSize: 14, color: "#5b6b7d", lineHeight: 1.4 }}>
                          So far: {s.canvasHistory.map((rec) => {
                            const val = historyValue(rec);
                            return Array.isArray(val) ? val.join(", ") : val;
                          }).filter(Boolean).join(" · ")}
                        </div>
                        <div onClick={() => patch((prev) => ({ canvasReviewOpen: !prev.canvasReviewOpen }))} className="tap-target" style={{ cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1f9ed4", flexShrink: 0 }}>
                          {s.canvasReviewOpen ? "Hide" : "Review"}
                        </div>
                      </div>
                    )}
                    {s.canvasReviewOpen && (
                      <div style={{ background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                        {s.canvasHistory.map((rec, i) => {
                          const val = historyValue(rec);
                          const label = Array.isArray(val) ? val.join(", ") : val;
                          return (
                            <div key={rec.id} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                              <div style={{ flex: 1, fontSize: 13.5, color: "#5b6b7d" }}>{rec.eyebrow}</div>
                              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0d1421" }}>{label || "—"}</div>
                              <div onClick={() => editFromHistory(i)} className="tap-target" style={{ cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "#1f9ed4" }}>Edit</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!cur && (
                      <div style={{ textAlign: "center", padding: "16px 0" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e8f8ee", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, margin: "0 auto" }}>✓</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#0d1421", marginTop: 12 }}>That&apos;s everything for now.</div>
                      </div>
                    )}
                  </>
                }
                sheet={sheetContent(
                  cur ? (
                    <div key={cur.id} className="qstep-enter">
                      <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.08em", color: "#14b3ac", textTransform: "uppercase" }}>{cur.eyebrow}</div>
                      {cur.statement && <div style={{ fontSize: 13.5, color: "#5b6b7d", marginTop: 6, lineHeight: 1.4 }}>{cur.statement}</div>}
                      <div style={{ fontSize: 19, fontWeight: 700, color: "#0d1421", lineHeight: 1.3, marginTop: 6 }}>{cur.question}</div>
                      <div style={cur.multi ? { display: "flex", flexWrap: "wrap", gap: 9, marginTop: 14 } : { display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                        {cur.options.map((opt) => {
                          if (cur.multi) {
                            const curVals = multiValue(cur);
                            const on = curVals.includes(opt);
                            // Tier-2 pre-fills the guess as already selected — it only
                            // keeps the "still just a guess" dashed treatment for as
                            // long as the patient hasn't changed anything; the moment
                            // they touch the set at all, it reads as their own answer.
                            const stillUntouchedGuess = !!cur.suggested && curVals.length === cur.suggested.length && curVals.every((v) => cur.suggested!.includes(v));
                            const suggestedNotOn = !on && !!cur.suggested?.includes(opt);
                            const style = on ? (stillUntouchedGuess ? CHIP_ON_SUG : CHIP_ON) : suggestedNotOn ? CHIP_SUG : CHIP;
                            return (
                              <div key={opt} className="tap-target" onClick={() => toggleMulti(cur, opt)} style={style}>
                                {opt}
                              </div>
                            );
                          }
                          // Quick-choice: outlined pills, not filled cards — they
                          // read as options, not committed actions, until tapped.
                          const justSelectedHere = s.canvasJustSelected?.id === cur.id;
                          const on = justSelectedHere ? s.canvasJustSelected!.value === opt : singleValue(cur) === opt;
                          const isSuggested = !on && cur.tier === 2 && !!cur.suggested?.includes(opt);
                          const style = on ? PILL_OUTLINE_ON : isSuggested ? { ...PILL_OUTLINE, background: "#f0fbfa", border: "1.5px dashed #14b3ac" } : PILL_OUTLINE;
                          return (
                            <div key={opt} className="tap-target" onClick={() => tapSingle(cur, opt)} style={style}>
                              {opt}{isSuggested ? " · Suggested" : ""}
                            </div>
                          );
                        })}
                      </div>
                      {cur.multi && (
                        <div style={{ marginTop: 16 }}>
                          <div onClick={() => { if (multiValue(cur).length) finishMulti(cur); }} className="tap-target" style={multiValue(cur).length ? BTN : BTN_OFF}>Continue</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", fontSize: 13.5, color: "#8b9aab", padding: "6px 0" }}>Moving on…</div>
                  )
                )}
              />
            );
          })()}

          {sc === "scale" && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px 24px", background: "#f4f7fa" }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.08em", color: "#8b9aab", textTransform: "uppercase" }}>Wong-Baker FACES® Pain Rating Scale</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0d1421", lineHeight: 1.3, letterSpacing: "-0.01em", marginTop: 10 }}>Point to the face that best describes your own pain and record the appropriate number.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 18 }}>
                {SCALE.map(([num, label]) => (
                  <div key={num} onClick={() => patch({ scale: num })} style={s.scale === num ? { cursor: "pointer", display: "flex", alignItems: "center", gap: 14, background: "#f0fbfa", borderRadius: 16, padding: "15px 16px", border: "1.5px solid #14b3ac", minHeight: 56 } : { cursor: "pointer", display: "flex", alignItems: "center", gap: 14, background: "#ffffff", borderRadius: 16, padding: "15px 16px", border: "1.5px solid #eef2f6", minHeight: 56 }}>
                    <div style={s.scale === num ? { width: 38, height: 38, borderRadius: "50%", background: "#14b3ac", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 } : { width: 38, height: 38, borderRadius: "50%", background: "#f4f7fa", color: "#5b6b7d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{num}</div>
                    <div style={{ flex: 1, fontSize: 16, fontWeight: 500, color: "#0d1421" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "#a9b7c5", marginTop: 14, lineHeight: 1.4 }}>Wording shown exactly as published. ©1983 Wong-Baker FACES® Foundation.</div>
              <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", flexDirection: "column", gap: 9 }}>
                <div onClick={() => { if (s.scale) next(); }} style={s.scale ? BTN : BTN_OFF}>Continue</div>
                <div style={{ textAlign: "center", fontSize: 13.5, color: "#8b9aab" }}>{s.scale ? "Recorded as " + s.scale : "Pick a number to continue."}</div>
              </div>
            </div>
          )}

          {sc === "review" && (() => {
            const sections = [
              {
                key: "identity", label: "Identity", icon: "ID", changed: !isB || s.idChanged,
                collapsedText: "Guardian ID on file · confirmed",
                rows: [
                  { label: "Guardian", value: guardianName || "Elena Marquez" },
                  { label: "Relationship", value: rel || "Parent" },
                  { label: "Document", value: !isB || s.idChanged ? "Photo ID captured just now, front and back" : "Texas driver's licence · expires April 2029" },
                ],
                target: (!isB || s.idChanged ? "idReview" : "idConfirm") as Screen,
              },
              {
                key: "coverage", label: "Coverage", icon: "$", changed: !isB || s.coverageChanged,
                collapsedText: "BlueCross PPO · active · $25 copay",
                rows: [
                  { label: "Plan", value: s.cardUpdated ? ov(ocrFieldsList[0]) : fv("insurer", "BlueCross BlueShield") || "BlueCross BlueShield" },
                  { label: "Member ID", value: s.cardUpdated ? ov(ocrFieldsList[1]) : fv("memberId", "BXP440291847") || "BXP440291847" },
                  { label: "Policy holder", value: s.cardUpdated ? ov(ocrFieldsList[3]) : fv("holder", "Elena Marquez") || guardianName || "Elena Marquez" },
                  { label: "Payment", value: usingNewCard ? (brand || "Card") + " ending " + (cardDigits.slice(-4) || "····") + (s.saveCard ? " · saved for next time" : " · this visit only") : s.payMethod || "Card on file · " + cardOnFile },
                ],
                target: (isB ? (s.coverageChanged ? "rcsCoverage" : "coverageConfirm") : "coverageForm") as Screen,
              },
              {
                key: "consents", label: "Consents", icon: "✓", changed: !isB || s.consentsChanged,
                collapsedText: docs.length + " documents · signed 14 Mar · unchanged",
                rows: [
                  { label: "Documents", value: docs.map((d) => fill(d.label.en)).join(", ") },
                  { label: "Language", value: s.lang === "es" ? "Spanish" : "English" },
                  { label: "Signed as", value: (rel || "Parent") + " · " + (typedName || "Elena Marquez") + (s.signMode === "upload" ? " · uploaded image" : s.signMode === "draw" ? " · drawn" : " · typed") },
                ],
                target: (!isB || s.consentsChanged ? "consents" : "consentsConfirm") as Screen,
              },
            ];
            const reviewCards = order.map((id, n) => {
              const a = norm(s.areas[id]);
              const sev = (SEVERITY.find((x) => x[0] === severityNum(a.severity)) || ["", "Not set"])[1];
              const checkRows = SYMPTOM_CHECKS.filter((c) => c.region === id).flatMap((c) => {
                const answer = a.extra[c.id] as string | undefined;
                if (answer === undefined) return [];
                const out = [{ label: c.eyebrow, value: answer }];
                const onset = a.extra[c.id + "Onset"] as string | undefined;
                if (onset) out.push({ label: c.durationEyebrow, value: onset });
                return out;
              });
              const historyRows = HISTORY_PROMPTS.filter((h) => h.region === id && a.extra[h.id] !== undefined)
                .map((h) => ({ label: "History", value: a.extra[h.id] as string }));
              const rows = [
                { label: "Where", value: a.spots.length ? a.spots.join(", ") : "Not set" },
                { label: "How bad", value: a.severity ? severityNum(a.severity) + " of 4 · " + sev : "Not set" },
              ]
                .concat(checkRows)
                .concat(historyRows)
                .concat([
                  { label: "Feels like", value: a.quality.length ? a.quality.join(", ") : "Not described" },
                  { label: "Worse when", value: (a.aggravating || []).length ? a.aggravating.join(", ") : "Not described" },
                ])
                .concat((a.connected || []).length ? [{ label: "Also noticed", value: a.connected.join(", ") }] : [])
                .concat([{ label: "Source", value: a.suggested ? (a.confirmed ? "Suggested, you confirmed it" : "Suggested — not confirmed yet") : "You chose this" }]);
              return { rank: String(n + 1), area: id, rows };
            });
            const contextRows = FOLLOWS.filter((f) => s.genericAnswers[f.id] !== undefined)
              .map((f) => {
                const v = s.genericAnswers[f.id];
                return { label: f.eyebrow, value: Array.isArray(v) ? v.join(", ") : (v as string) };
              })
              .concat(isTeen && s.scale ? [{ label: "Pain scale", value: s.scale + " · " + (SCALE.find((x) => x[0] === s.scale) || ["", ""])[1] }] : []);
            return (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px 24px", background: "#f4f7fa" }}>
                <div style={{ fontSize: 27, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, letterSpacing: "-0.01em" }}>{isB ? "Everything looks ready for Dr. Reyes." : "Does this look right?"}</div>
                <div style={{ fontSize: 15, color: "#5b6b7d", marginTop: 9, lineHeight: 1.45 }}>
                  {isB ? "Only what's new or changed is opened up. Everything else was confirmed as-is." : "Everything here is new. Change anything before it goes to Dr. Reyes."}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 20 }}>
                  {sections.map((sec) => (
                    <div key={sec.key} style={{ background: "#ffffff", border: `1px solid ${sec.changed ? "#e2f2f1" : "#eef2f6"}`, borderRadius: 18, padding: 17 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: sec.changed ? "#e6f7f6" : "#f4f7fa", color: sec.changed ? "#14b3ac" : "#8b9aab", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{sec.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16.5, fontWeight: 700, color: "#0d1421", lineHeight: 1.25 }}>{sec.label}</div>
                          {!sec.changed && <div style={{ fontSize: 13.5, color: "#8b9aab", marginTop: 3, lineHeight: 1.35 }}>{sec.collapsedText}</div>}
                        </div>
                        <div style={{ background: sec.changed ? "#e6f7f6" : "#f0f4f8", color: sec.changed ? "#0f6f6b" : "#7b8a9a", borderRadius: 999, padding: "4px 9px", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}>{isB ? (sec.changed ? "Updated" : "Confirmed") : "New"}</div>
                        <div onClick={() => go(sec.target)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14.5, fontWeight: 600, color: "#1f9ed4", padding: "6px 0 6px 6px", flexShrink: 0 }}>
                          Edit<span style={{ fontSize: 16, lineHeight: 1, color: "#b7cbdb" }}>›</span>
                        </div>
                      </div>
                      {sec.changed && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
                          {sec.rows.map((row) => (
                            <div key={row.label} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                              <div style={{ width: 82, flexShrink: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>{row.label}</div>
                              <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "#0d1421", lineHeight: 1.35 }}>{row.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#8b9aab", textTransform: "uppercase", marginTop: 22 }}>What {name} is feeling</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
                  {reviewCards.map((card) => (
                    <div key={card.area} style={{ background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 18, padding: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#e6f7f6", color: "#14b3ac", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{card.rank}</div>
                        <div style={{ flex: 1, minWidth: 0, fontSize: 18, fontWeight: 700, color: "#0d1421", lineHeight: 1.2 }}>{card.area}</div>
                        <div
                          onClick={() => {
                            patch((prev) => ({
                              areas: { ...prev.areas, [card.area]: { ...(prev.areas[card.area] || emptyArea()), severity: null, quality: [], aggravating: [], connected: [], extra: {}, confirmed: false } },
                              canvasHistory: prev.canvasHistory.filter((h) => h.region !== card.area),
                              screen: "canvas",
                            }));
                          }}
                          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14.5, fontWeight: 600, color: "#1f9ed4", padding: "6px 0 6px 8px", flexShrink: 0 }}
                        >
                          Edit<span style={{ fontSize: 16, lineHeight: 1, color: "#b7cbdb" }}>›</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
                        {card.rows.map((row) => (
                          <div key={row.label} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                            <div style={{ width: 82, flexShrink: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>{row.label}</div>
                            <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "#0d1421", lineHeight: 1.35 }}>{row.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div style={{ background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 18, padding: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f4f7fa", color: "#8b9aab", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>·</div>
                      <div style={{ flex: 1, fontSize: 18, fontWeight: 700, color: "#0d1421" }}>Everything else</div>
                      <div
                        onClick={() => patch((prev) => ({ genericAnswers: {}, canvasHistory: prev.canvasHistory.filter((h) => h.region !== null), screen: "canvas" }))}
                        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14.5, fontWeight: 600, color: "#1f9ed4", padding: "6px 0 6px 8px", flexShrink: 0 }}
                      >
                        Edit<span style={{ fontSize: 16, lineHeight: 1, color: "#b7cbdb" }}>›</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
                      {contextRows.map((row) => (
                        <div key={row.label} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                          <div style={{ width: 82, flexShrink: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: "#8b9aab", textTransform: "uppercase" }}>{row.label}</div>
                          <div style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "#0d1421", lineHeight: 1.35 }}>{row.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "auto", paddingTop: 22 }}>
                  <div onClick={next} style={{ cursor: "pointer", background: "#2b9dd9", color: "#ffffff", borderRadius: 18, padding: 20, textAlign: "center", fontSize: 17, fontWeight: 600, boxShadow: "0 6px 16px rgba(43,157,217,0.28)" }}>Send to Dr. Reyes</div>
                </div>
              </div>
            );
          })()}

          {sc === "done" && (() => {
            const nextSteps = [
              { label: "Dr. Reyes reads this tonight", detail: "Before your 10:20 AM slot tomorrow." },
              { label: "You'll get a message if anything changes", detail: "Sometimes we move an appointment sooner." },
              { label: "Arrive five minutes early", detail: "No paperwork at the desk." },
            ];
            const passportVerb = isB ? "Updated in " + name + "'s passport" : name + "'s passport is now created";
            const passportAddition = order.length ? order.join(" and ") + " · reported " + (s.symptomOnset || "today").toLowerCase() : "This episode";
            return (
              <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px 24px", background: "#f4f7fa", alignItems: "center", textAlign: "center" }}>
                <div style={{ marginTop: 32, width: 88, height: 88, borderRadius: "50%", background: "#e8f8ee", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 700 }}>✓</div>
                <div style={{ fontSize: 29, fontWeight: 700, color: "#0d1421", lineHeight: 1.2, marginTop: 22 }}>Dr. Reyes has it.</div>
                <div style={{ fontSize: 15.5, color: "#5b6b7d", marginTop: 10, lineHeight: 1.5, maxWidth: 300 }}>Nothing else to do before tomorrow. If anything changes tonight, you can update this.</div>

                <div style={{ background: "#ffffff", border: "1px solid #eef2f6", borderRadius: 18, padding: 18, marginTop: 24, width: "100%", textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#8b9aab", textTransform: "uppercase" }}>What happens next</div>
                  <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
                    {nextSteps.map((step, n) => (
                      <div key={step.label} style={{ display: "flex", gap: 12 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22, flexShrink: 0 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#14b3ac", marginTop: 6, flexShrink: 0 }} />
                          {n !== nextSteps.length - 1 && <div style={{ flex: 1, width: 2, background: "#dbe6ee", margin: "4px 0" }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: 14 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#0d1421", lineHeight: 1.3 }}>{step.label}</div>
                          <div style={{ fontSize: 13.5, color: "#6b7a8d", marginTop: 2, lineHeight: 1.4 }}>{step.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#e6f7f6", borderRadius: 16, padding: "16px 18px", marginTop: 12, width: "100%", textAlign: "left" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#137e7a", textTransform: "uppercase" }}>{passportVerb}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#0d1421", marginTop: 6, lineHeight: 1.35 }}>{passportAddition}</div>
                </div>

                <div style={{ width: "100%", textAlign: "left", marginTop: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#8b9aab", textTransform: "uppercase" }}>On the day</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                    <div
                      onClick={() => patch({ arrived: true })}
                      style={s.arrived
                        ? { cursor: "default", display: "flex", alignItems: "center", gap: 13, background: "#e8f8ee", border: "1.5px solid #bbe9cb", borderRadius: 16, padding: "17px 18px", minHeight: 56, color: "#15803d" }
                        : { cursor: "pointer", display: "flex", alignItems: "center", gap: 13, background: "#2b9dd9", border: "1.5px solid #2b9dd9", borderRadius: 16, padding: "17px 18px", minHeight: 56, color: "#ffffff" }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: s.arrived ? "#16a34a" : "rgba(255,255,255,0.22)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4.5 12.4 9.6 17.5 19.5 6.9" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.25 }}>{s.arrived ? "You're checked in" : "I'm here, check me in"}</div>
                        <div style={{ fontSize: 13.5, marginTop: 2, opacity: 0.82 }}>{s.arrived ? "Take a seat — someone will call " + name + "." : "Tap this when you arrive tomorrow"}</div>
                      </div>
                    </div>
                    <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 13, background: "#ffffff", border: "1.5px solid #eef2f6", borderRadius: 16, padding: "17px 18px", minHeight: 56 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eef4fa", color: "#3d6b96", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 21.5s7-6.4 7-11.6A7 7 0 0 0 5 9.9c0 5.2 7 11.6 7 11.6Z" />
                          <circle cx="12" cy="9.8" r="2.6" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16.5, fontWeight: 600, color: "#0d1421", lineHeight: 1.25 }}>Get directions</div>
                        <div style={{ fontSize: 13.5, color: "#6b7a8d", marginTop: 2 }}>240 Alder Street · parking behind the building</div>
                      </div>
                    </div>
                    <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 13, background: "#ffffff", border: "1.5px solid #eef2f6", borderRadius: 16, padding: "17px 18px", minHeight: 56 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eef4fa", color: "#3d6b96", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8.4 4.5H5.6A1.6 1.6 0 0 0 4 6.3c.5 6.9 5.8 12.2 12.7 12.7a1.6 1.6 0 0 0 1.8-1.6v-2.8l-3.5-1.2-1.7 1.7a12.6 12.6 0 0 1-4.4-4.4l1.7-1.7L8.4 4.5Z" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 16.5, fontWeight: 600, color: "#0d1421", lineHeight: 1.25 }}>Something changed tonight</div>
                        <div style={{ fontSize: 13.5, color: "#6b7a8d", marginTop: 2 }}>Update this report or call the nurse line</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "auto", width: "100%", paddingTop: 22, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div onClick={restart} style={{ cursor: "pointer", background: "#ffffff", border: "1.5px solid #cfdae5", color: "#1f6d96", borderRadius: 18, padding: 19, textAlign: "center", fontSize: 16.5, fontWeight: 600 }}>Back to {name}&apos;s summary</div>
                </div>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
