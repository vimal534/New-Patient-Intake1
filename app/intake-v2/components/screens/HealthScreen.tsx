"use client";

import { Ctx } from "../../ctx";
import { REVIEW_TITLE } from "../../constants";
import { ConditionAddSection } from "../ConditionAddSection";
import { HealthCategory } from "../../types";
import { AllergiesEditor, ConditionsEditor, FamilyEditor, formatSurgeryLine, MedicationsEditor, SurgeriesEditor } from "../HealthCategoryEditors";
import { ChevronRightIcon } from "../Icons";
import { Card, Eyebrow, ScreenCopy, ScreenTitle } from "../ui";

export const CATEGORY_LABEL: Record<HealthCategory, string> = {
  conditions: "Conditions",
  medications: "Medications",
  surgeries: "Surgeries",
  allergies: "Allergies",
  family: "Family history",
};

// Screen 8 — Health history. New patients still get the original
// discover→select→confirm flow below (unchanged). Returning patients get
// a Health History summary of five separate, individually tappable
// cards (see ReturningHealthHistory) — tapping one opens that category's
// own focused page (CategoryFocusPage) in its place: a read-only
// "here's what's on file" confirm gate first, dropping into the actual
// edit UI (HealthCategoryEditors.tsx) only once the patient says
// something changed. Closing that page (header back, or either footer
// action) always returns to this same summary — see page.tsx's `back()`
// and footerFor's `key === "health"` branch for the state machine that
// drives both.
export function HealthScreen({ ctx }: { ctx: Ctx }) {
  const { state, isRet } = ctx;

  if (isRet) {
    return state.hhEditing ? <CategoryFocusPage ctx={ctx} category={state.hhEditing} /> : <ReturningHealthHistory ctx={ctx} />;
  }

  return (
    <div className="px-6 py-6">
      <ScreenTitle className="font-semibold">Past Medical Conditions</ScreenTitle>
      <ScreenCopy className="mb-7">Which conditions have you been diagnosed with? Select any that apply, now or in the past.</ScreenCopy>
      <ConditionAddSection ctx={ctx} showNoneOption />
    </div>
  );
}

// One tappable card per category on the summary — content lines, a
// status line ("✓ Reviewed" / "✓ Confirmed today" / "Last confirmed …"),
// and a trailing chevron signaling the whole card opens something.
function CategoryCard({
  category,
  lines,
  emptyText,
  hasItems,
  confirmedToday,
  lastConfirmed,
  onOpen,
}: {
  category: HealthCategory;
  lines: string[];
  emptyText: string;
  hasItems: boolean;
  confirmedToday: boolean;
  lastConfirmed: string;
  onOpen: () => void;
}) {
  const status = confirmedToday
    ? { text: "✓ Confirmed today", tone: "success" as const }
    : hasItems
      ? { text: "✓ Reviewed", tone: "success" as const }
      : { text: `Last confirmed ${lastConfirmed}`, tone: "muted" as const };

  return (
    <button type="button" onClick={onOpen} className="group block w-full cursor-pointer text-left">
      <Card className="iv2-hover-card p-5">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="text-xs font-semibold tracking-[0.07em] text-[var(--iv2-text-muted)] uppercase transition-colors group-hover:text-[var(--iv2-brand)]">
            {CATEGORY_LABEL[category]}
          </div>
          <span className="text-[var(--iv2-text-muted)] transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-[var(--iv2-brand)]">
            <ChevronRightIcon color="currentColor" />
          </span>
        </div>
        {lines.length ? (
          <div className="flex flex-col gap-1">
            {lines.map((line) => (
              <div key={line} className="text-sm text-[var(--iv2-text-primary)]">
                {line}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[var(--iv2-text-muted)]">{emptyText}</div>
        )}
        <div
          className="mt-3 text-sm font-semibold"
          style={{ color: status.tone === "success" ? "var(--iv2-success)" : "var(--iv2-text-muted)" }}
        >
          {status.text}
        </div>
      </Card>
    </button>
  );
}

function ReturningHealthHistory({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const openCategory = (category: HealthCategory) => update({ hhEditing: category });

  return (
    <div className="px-6 py-6">
      <Eyebrow>{state.reviewingFromSuccess ? REVIEW_TITLE.health : "Health history"}</Eyebrow>
      <ScreenTitle>Your health history</ScreenTitle>
      <ScreenCopy className="mb-6">Review what&apos;s on file and update anything that has changed.</ScreenCopy>

      <div className="flex flex-col gap-3.5">
        <CategoryCard
          category="conditions"
          lines={state.onFileConds}
          emptyText="No conditions reported."
          hasItems={state.onFileConds.length > 0}
          confirmedToday={state.hhConfirmed.conditions}
          lastConfirmed={state.lastConfirmed}
          onOpen={() => openCategory("conditions")}
        />
        <CategoryCard
          category="medications"
          lines={state.meds.map((m) => `${m.name} · ${m.dose || m.detail}${m.frequency ? ` · ${m.frequency}` : ""}`)}
          emptyText="No medications on file."
          hasItems={state.meds.length > 0}
          confirmedToday={state.hhConfirmed.medications}
          lastConfirmed={state.lastConfirmed}
          onOpen={() => openCategory("medications")}
        />
        <CategoryCard
          category="surgeries"
          lines={state.surgeries.map(formatSurgeryLine)}
          emptyText="No surgeries reported."
          hasItems={state.surgeries.length > 0}
          confirmedToday={state.hhConfirmed.surgeries}
          lastConfirmed={state.lastConfirmed}
          onOpen={() => openCategory("surgeries")}
        />
        <CategoryCard
          category="allergies"
          lines={state.allergies.map((a) => (a.detail ? `${a.name} · ${a.detail}` : a.name))}
          emptyText="No known allergies"
          hasItems={state.allergies.length > 0}
          confirmedToday={state.hhConfirmed.allergies}
          lastConfirmed={state.lastConfirmed}
          onOpen={() => openCategory("allergies")}
        />
        <CategoryCard
          category="family"
          lines={state.familyHistory}
          emptyText="None reported"
          hasItems={state.familyHistory.length > 0}
          confirmedToday={state.hhConfirmed.family}
          lastConfirmed={state.lastConfirmed}
          onOpen={() => openCategory("family")}
        />
      </div>

      <div className="mt-6 text-sm text-[var(--iv2-text-muted)]">Last reviewed {state.lastConfirmed}</div>
    </div>
  );
}

export const CATEGORY_LOWER: Record<HealthCategory, string> = {
  conditions: "conditions",
  medications: "medications",
  surgeries: "surgeries",
  allergies: "allergies",
  family: "family history",
};

// A category's own focused page — opened by tapping its summary card,
// straight into the edit UI (no separate "here's what's on file, has
// anything changed?" confirm gate — tapping the card already IS "I want
// to look at/change this").
export function CategoryFocusPage({ ctx, category }: { ctx: Ctx; category: HealthCategory }) {
  const label = CATEGORY_LABEL[category];
  const lower = CATEGORY_LOWER[category];

  return (
    <div className="px-6 py-6">
      <Eyebrow>{label}</Eyebrow>
      <ScreenTitle>Update {lower}</ScreenTitle>
      <ScreenCopy className="mb-6">Add, remove, or correct anything below.</ScreenCopy>
      {category === "conditions" ? <ConditionsEditor ctx={ctx} /> : null}
      {category === "medications" ? <MedicationsEditor ctx={ctx} /> : null}
      {category === "surgeries" ? <SurgeriesEditor ctx={ctx} /> : null}
      {category === "allergies" ? <AllergiesEditor ctx={ctx} /> : null}
      {category === "family" ? <FamilyEditor ctx={ctx} /> : null}
    </div>
  );
}
