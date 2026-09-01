"use client";

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { StepHeader, StepHeaderInfo } from "./ui";

// Lets a multi-step sub-flow (Coverage's card capture, Payment's
// select/newCard/confirm steps, Health History's "still accurate?" gate)
// have its progress header rendered directly under the status bar —
// genuinely outside the scrollable section list, the same slot
// ProgressSummary already occupies — instead of inline inside its own
// SectionShell card.
//
// Why this exists: StepHeader used to render inline, `sticky top-0`
// within its own card. That worked once the card was actually the
// scrolling ancestor (see PhoneFrame's fixed-height fix), but only ever
// held the header at the top of ITS OWN card — which, with several
// already-completed sections collapsed above it, could still sit well
// down the page, and even once "stuck," only pinned to wherever that
// card's own top happened to be, not the phone's actual top edge. A
// reference screenshot showed the header pinned at the true top of the
// screen, immediately below the status bar, matching ProgressSummary's
// own placement exactly — this is how that's achieved without threading
// per-section step state into the reducer: the section keeps owning its
// own local step state (unchanged) and just reports the CURRENT header
// contents up to this shared slot instead of rendering them itself.
const StepHeaderContext = createContext<{ setHeader: (h: StepHeaderInfo | null) => void } | null>(null);

export function StepHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<StepHeaderInfo | null>(null);
  return (
    <StepHeaderContext.Provider value={{ setHeader }}>
      <StepHeaderSlotContext.Provider value={header}>{children}</StepHeaderSlotContext.Provider>
    </StepHeaderContext.Provider>
  );
}

// Split into two contexts on purpose — `setHeader` (stable, from
// useState) is what every section's `useActiveStepHeader` call depends
// on; `header` itself (changes whenever any section's step changes) is
// read only by the slot that actually renders it. A section registering
// its header only ever needs the former, so it never re-renders just
// because SOME section's header content changed.
const StepHeaderSlotContext = createContext<StepHeaderInfo | null>(null);

// Renders the currently-registered header, or nothing if no multi-step
// sub-flow is active right now — the caller (page.tsx) falls back to
// ProgressSummary in that case, matching the mutual-exclusivity a single
// top-of-screen slot needs.
export function ActiveStepHeaderSlot() {
  const header = useContext(StepHeaderSlotContext);
  if (!header) return null;
  return <StepHeader {...header} />;
}

export function useStepHeaderSlotActive(): boolean {
  return useContext(StepHeaderSlotContext) !== null;
}

// Called by a section instead of rendering <StepHeader> inline. Registers
// on mount/whenever eyebrow-stepLabel-progressPercent actually change,
// clears itself on unmount (leaving the section, or the whole sub-flow
// finishing) so the slot reverts to ProgressSummary automatically.
//
// `onBack` is read through a ref, not a dependency — sections typically
// pass a fresh inline arrow function every render, and depending on that
// directly would re-register (and briefly flicker) the header on every
// keystroke inside the active step. The ref always calls whatever the
// LATEST onBack is at click time, without needing the effect to re-run
// for it.
//
// `header` itself may be `null` — for a section where only SOME of its
// internal steps want the top-slot header (Health History's "still
// accurate?" gate does; its editor step after that doesn't), pass `null`
// on the steps that shouldn't claim the slot, rather than needing a
// second hook or a conditional hook call (which would break React's
// rules-of-hooks across that section's own step branches).
export function useActiveStepHeader(header: StepHeaderInfo | null) {
  const ctx = useContext(StepHeaderContext);
  const onBackRef = useRef(header?.onBack);
  // Updated in its own effect (runs after every render, no deps array) —
  // not a direct assignment during render, which React's rules-of-hooks
  // lint (and the compiler) reject: refs are only safe to write outside
  // render, in an effect or event handler.
  useEffect(() => {
    onBackRef.current = header?.onBack;
  });

  const setHeader = ctx?.setHeader;
  const eyebrow = header?.eyebrow;
  const stepLabel = header?.stepLabel;
  const progressPercent = header?.progressPercent;

  useEffect(() => {
    if (!setHeader) return;
    if (eyebrow === undefined || stepLabel === undefined || progressPercent === undefined) return;
    setHeader({ eyebrow, stepLabel, progressPercent, onBack: () => onBackRef.current?.() });
    return () => setHeader(null);
  }, [setHeader, eyebrow, stepLabel, progressPercent]);
}
