"use client";

import { useState } from "react";
import { PatientType } from "../types";

// Replaces the old prominent "New Patient / Returning Patient" choice
// screen (Welcome.tsx, now gone — see page.tsx) with a small, out-of-the-way
// floating control: a real patient's app would already know who they are
// (a lookup or a magic link), so a big first-class "which one are you"
// screen only ever existed for demoing this prototype. Tucking it behind
// a "DEMO" pill — present throughout the main section flow, not just at
// the very start — matches how the reference screenshot uses it: visible
// mid-flow on a question screen, not as its own step.
const SCENARIOS: { type: PatientType; label: string; subtitle: string }[] = [
  { type: "new", label: "New patient", subtitle: "First visit — full intake" },
  { type: "returning", label: "Returning patient", subtitle: "Welcome back — most on file" },
];

export function DemoScenarioSwitcher({ onSwitch }: { onSwitch: (type: PatientType) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-30">
      {open ? (
        <div className="absolute bottom-12 left-0 w-64 rounded-2xl bg-[#1c1c1e] p-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <div className="mb-1 flex items-center justify-between">
            <div className="text-[11px] font-bold uppercase tracking-wide text-white/60">Demo scenario</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="mt-1 flex flex-col gap-1">
            {SCENARIOS.map((s) => (
              <button
                key={s.type}
                type="button"
                onClick={() => {
                  onSwitch(s.type);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-start gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-white/10 active:scale-[0.98]"
              >
                {s.type === "new" ? <NewPatientIcon /> : <ReturningPatientIcon />}
                <span>
                  <div className="text-sm font-semibold text-white">{s.label}</div>
                  <div className="text-xs text-white/60">{s.subtitle}</div>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1c1c1e] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)] active:scale-[0.97]"
      >
        <span aria-hidden="true">⟲</span> Demo
      </button>
    </div>
  );
}

function NewPatientIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden className="mt-0.5 shrink-0">
      <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 17c0-3 2.4-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 6.5v5M13.5 9h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ReturningPatientIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden className="mt-0.5 shrink-0">
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 5.75V10l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
