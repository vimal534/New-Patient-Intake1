"use client";

import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollToPlugin);
}

// Shared GSAP motion constants + helpers for /intake-v2's interactive
// primitives (SmartField, SelectField, RadioRow, OptionPill,
// ConditionTile, CatalogCheckRow, NoneCheckRow, DetailPill,
// InputField, SearchClearInput) — one place for "how a tap/focus
// feels" so every clickable card and input in the app animates the
// same way instead of each component inventing its own timing.

// Reduced motion — every duration in this module is meant to be read
// through `dur()` below rather than used as a literal, so a patient
// who has asked their OS/browser for reduced motion gets the same end
// state (border colors, elevation, scroll position, revealed fields)
// with the animated transition collapsed to effectively nothing,
// instead of the app either ignoring the preference or freezing
// entirely. Read fresh on every call (not cached) since the OS
// setting can change while the app is open.
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Wrap any of this module's duration constants at the call site —
// `gsap.to(el, { ..., duration: dur(MOTION_DURATION) })` — to collapse
// it to a near-zero duration under reduced motion. Not exactly 0:
// GSAP special-cases a literal 0 in a couple of plugins (ScrollTo
// among them) in ways that can skip applying the value; 1ms reads as
// instant to a human but still runs as a real (if imperceptible) tween.
export function dur(base: number): number {
  return prefersReducedMotion() ? 0.001 : base;
}

// 150-200ms per spec for any focus/tap transition, in both directions.
export const MOTION_DURATION = 0.18;
export const MOTION_EASE = "power2.out";

// Elevation — a soft shadow plus a barely-there scale bump (never more
// than 1.02) on tap/focus, back to flat on blur/release. Deliberately
// small: this is a healthcare intake form, not a game UI — the goal is
// "this responded to me," not a visible bounce or lift.
export const ELEVATE_SCALE = 1.015;
export const ELEVATE_SHADOW = "0 6px 16px rgba(16,24,40,0.10)";
export const ELEVATE_REST_SHADOW = "0 1px 2px rgba(16,24,40,0)";

// No hook/helper wraps the actual onFocus/onBlur pair — the
// react-hooks/refs lint rule flags any function that receives a ref
// as a parameter when it might be called during render, even a plain
// (non-hook) one, so every component below declares its own ref via
// `useRef` and writes its onFocus/onBlur inline, closing over that
// ref directly (the same pattern SmartField.tsx already uses). These
// constants are what keeps all of those inline handlers identical —
// the standard tap/focus elevation: a soft shadow + a barely-there
// scale bump on focus, back to flat on blur. Something like:
//
//   const cardRef = useRef<HTMLButtonElement>(null);
//   const onFocus = () => { if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_SHADOW, scale: ELEVATE_SCALE, duration: MOTION_DURATION, ease: MOTION_EASE }); };
//   const onBlur = () => { if (cardRef.current) gsap.to(cardRef.current, { boxShadow: ELEVATE_REST_SHADOW, scale: 1, duration: MOTION_DURATION, ease: MOTION_EASE }); };

// 300-400ms per spec for any scroll transition — deliberately its own
// (slower) constant, distinct from MOTION_DURATION's 150-200ms tap/
// focus feel: a scroll is a bigger, slower gesture than a border or
// shadow tweak.
export const SCROLL_DURATION = 0.35;

// 200-250ms per spec for a conditional-reveal fade + small upward
// motion (Reveal, in ui.tsx) — a field that appears because an answer
// unlocked it, as opposed to MOTION_DURATION's tap/focus feel or
// SCROLL_DURATION's bigger scroll gesture.
export const REVEAL_DURATION = 0.22;

// Walks up from `el` to find the nearest scrollable ancestor — in this
// app that's the phone-frame's own overflow-auto content pane, not
// `window`, so any auto-scroll has to target that element rather than
// the page.
export function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

// Smoothly brings `target` to a comfortable position in its scroll
// container — but only when it isn't already fully visible there
// ("do not auto-scroll if the next field/question is already
// visible"). Shared by SmartField's field-to-field chaining, every
// screen advancing from one answered single-select question to the
// next unanswered one, and SelectField.
export function scrollIntoComfortableView(target: HTMLElement) {
  const container = getScrollParent(target);
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const margin = 12;
  const alreadyComfortable = targetRect.top >= containerRect.top + margin && targetRect.bottom <= containerRect.bottom - margin;
  if (alreadyComfortable) return;
  gsap.to(container, {
    duration: dur(SCROLL_DURATION),
    ease: "power2.out",
    scrollTo: { y: target, offsetY: containerRect.height * 0.3 },
  });
}

// Brings `target` to a fixed amount of context below the top of its
// scroll container — used for guided answer-then-advance flows (Birth
// History's Yes/No questions) where the patient should keep seeing a
// little of the question they just answered, not have the next one
// land flush against the top edge. Distinct from
// scrollIntoComfortableView above, which centers the target ~30% down
// a (possibly tall) container — built for chained text-field focus
// advancement, not for holding a fixed, small amount of prior context
// in view. Always animates (respecting reduced motion via `dur`) even
// when only a small adjustment is needed, since the whole point here
// is a visible, reassuring motion — never an abrupt jump.
export function scrollToReadingPosition(target: HTMLElement, topContext = 100) {
  const container = getScrollParent(target);
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const currentOffset = targetRect.top - containerRect.top;
  const delta = currentOffset - topContext;
  if (Math.abs(delta) < 4) return;
  gsap.to(container, {
    duration: dur(SCROLL_DURATION),
    ease: "power2.out",
    scrollTo: { y: container.scrollTop + delta },
  });
}

// Scrolls `container` smoothly back to its very top — used whenever
// the patient moves to a new section/screen, so the new title and
// first question are always what greets them, never wherever the
// previous screen happened to be scrolled to.
export function scrollToTop(container: HTMLElement) {
  if (container.scrollTop === 0) return;
  gsap.to(container, { duration: dur(SCROLL_DURATION), ease: "power2.out", scrollTo: { y: 0 } });
}

// After a field/question is answered, hand focus to whatever comes
// next in the flow — but only if that next element isn't already
// answered (so re-editing an earlier answer never yanks focus away
// from further-along work), and only scroll if it isn't already
// comfortably visible. Works for both a plain <input> (checked via
// `.value`) and a button-based control like SelectField's trigger
// (checked via its `data-answered` attribute, set by that component).
export function focusNextIfEmpty(nextEl: HTMLElement | null, delay = 220) {
  if (!nextEl) return;
  const isAnswered = nextEl instanceof HTMLInputElement ? nextEl.value !== "" : nextEl.dataset.answered === "true";
  if (isAnswered) return;
  scrollIntoComfortableView(nextEl);
  window.setTimeout(() => nextEl.focus(), prefersReducedMotion() ? 0 : delay);
}
