"use client";

import { Ctx } from "../../ctx";
import { SCENARIO_LABEL } from "../../constants";
import { DemoScenarioId } from "../../types";
import { BottomSheet, Eyebrow } from "../ui";
import { ChevronLeftIcon, ChevronRightIcon } from "../Icons";

// Prototype-only scenario switcher — README: "This control and its sheet
// must not appear in the production patient UI; the real app derives the
// scenario from the patient record." Kept here, same as /tap-intake's
// own DemoScenarioSwitcher.tsx, purely so this route can be reviewed
// across every demo scenario without a real patient-record backend.
export function DemoButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      // `absolute`, not `fixed` — the page column is capped at 430px and
      // centered with a `relative` wrapper (see page.tsx), so this needs
      // to stay pinned to that column's own bottom-right corner rather
      // than the full browser viewport's, which is much wider on desktop.
      // Sits at the true bottom-right corner of the screen, below the
      // primary CTA, rather than overlapping it.
      className="absolute right-4 bottom-4 z-[80] h-[34px] cursor-pointer rounded-full border-none bg-[var(--iv2-text-primary)] px-4 text-xs font-extrabold tracking-[0.08em] text-white shadow-[0_4px_14px_rgba(16,24,43,0.2)]"
    >
      DEMO
    </button>
  );
}

const NEW_PATIENT_IDS: DemoScenarioId[] = ["new-infant", "new-adolescent"];
const RETURNING_IDS: DemoScenarioId[] = ["returning-well", "returning-sick", "returning-sports"];

// Two-level picker — README "Intake Flow — Complete Build Spec": New
// Patient / Returning Patient, each opening a submenu of the 5 named
// scenarios (2 new, 3 returning). `demoCategoryOpen` holds which
// category's submenu is showing; `null` shows the top-level choice.
export function DemoSheet({ ctx }: { ctx: Ctx }) {
  const { state, reset, update } = ctx;

  const close = () => update({ demoOpen: false, demoCategoryOpen: null });
  const openCategory = (cat: "new" | "returning") => update({ demoCategoryOpen: cat });
  const back = () => update({ demoCategoryOpen: null });

  const pick = (id: DemoScenarioId) => {
    if (!SCENARIO_LABEL[id].built) return;
    reset(id);
    update({ demoOpen: false, demoCategoryOpen: null });
  };

  const category = state.demoCategoryOpen;
  const ids = category === "new" ? NEW_PATIENT_IDS : category === "returning" ? RETURNING_IDS : [];

  return (
    <BottomSheet open={state.demoOpen} onClose={close} zIndex={80} maxHeight="none">
      {category ? (
        <>
          <button
            type="button"
            onClick={back}
            className="mb-3 flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[15px] font-semibold text-[var(--iv2-text-secondary)]"
          >
            <ChevronLeftIcon size={11} />
            Back
          </button>
          <Eyebrow>{category === "new" ? "New patient" : "Returning patient"} scenarios</Eyebrow>
          <div className="flex flex-col gap-2.5">
            {ids.map((id) => {
              const info = SCENARIO_LABEL[id];
              const selected = state.demoScenarioId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => pick(id)}
                  disabled={!info.built}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4 text-left"
                  style={{
                    borderColor: selected ? "var(--iv2-brand)" : "var(--iv2-border)",
                    backgroundColor: selected ? "var(--iv2-brand-tint)" : "#fff",
                    cursor: info.built ? "pointer" : "not-allowed",
                    opacity: info.built ? 1 : 0.55,
                  }}
                >
                  <div>
                    <div className="text-[17px] font-bold text-[var(--iv2-text-primary)]">{info.title}</div>
                    <div className="mt-0.5 text-sm text-[var(--iv2-text-secondary)]">{info.subtitle}</div>
                  </div>
                  {info.built ? (
                    <ChevronRightIcon />
                  ) : (
                    <span className="shrink-0 rounded-full bg-[var(--iv2-surface-muted)] px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">
                      Coming soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <Eyebrow>Demo scenario</Eyebrow>
          <button
            type="button"
            onClick={() => openCategory("new")}
            className="mb-2.5 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4 text-left"
            style={{
              borderColor: state.scenario !== "returning" ? "var(--iv2-brand)" : "var(--iv2-border)",
              backgroundColor: state.scenario !== "returning" ? "var(--iv2-brand-tint)" : "#fff",
            }}
          >
            <div>
              <div className="text-[17px] font-bold text-[var(--iv2-text-primary)]">New patient</div>
              <div className="mt-0.5 text-sm text-[var(--iv2-text-secondary)]">2 scenarios: first visit, building health history</div>
            </div>
            <ChevronRightIcon />
          </button>
          <button
            type="button"
            onClick={() => openCategory("returning")}
            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border-[1.5px] p-4 text-left"
            style={{
              borderColor: state.scenario === "returning" ? "var(--iv2-brand)" : "var(--iv2-border)",
              backgroundColor: state.scenario === "returning" ? "var(--iv2-brand-tint)" : "#fff",
            }}
          >
            <div>
              <div className="text-[17px] font-bold text-[var(--iv2-text-primary)]">Returning patient</div>
              <div className="mt-0.5 text-sm text-[var(--iv2-text-secondary)]">3 scenarios: reviewing what&apos;s already on file</div>
            </div>
            <ChevronRightIcon />
          </button>
          <button
            type="button"
            onClick={close}
            className="mt-3 h-11 w-full cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-text-muted)]"
          >
            Close
          </button>
        </>
      )}
    </BottomSheet>
  );
}
