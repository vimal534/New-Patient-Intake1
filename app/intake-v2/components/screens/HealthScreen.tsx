"use client";

import { Ctx } from "../../ctx";
import { COMMON_CONDS, MORE_CONDS } from "../../constants";
import { HealthCategory } from "../../types";
import { AllergiesEditor, ConditionsEditor, FamilyEditor, MedicationsEditor, SurgeriesEditor } from "../HealthCategoryEditors";
import { ChevronRightIcon } from "../Icons";
import { Card, ConditionTile, Eyebrow, InputField, ScreenCopy, ScreenTitle, TextAction } from "../ui";

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
  const { state, isRet, update } = ctx;

  if (isRet) {
    return state.hhEditing ? <CategoryFocusPage ctx={ctx} category={state.hhEditing} /> : <ReturningHealthHistory ctx={ctx} />;
  }

  const toggleCond = (name: string) =>
    update((s) => ({
      noneConds: false,
      selectedConds: s.selectedConds.includes(name)
        ? s.selectedConds.filter((c) => c !== name)
        : [...s.selectedConds, name],
    }));

  const options = [...COMMON_CONDS, ...(state.showMore ? MORE_CONDS : [])];

  const searchResults =
    state.condSearch.trim().length < 2
      ? []
      : [...COMMON_CONDS, ...MORE_CONDS]
          .filter((c) => c.toLowerCase().includes(state.condSearch.trim().toLowerCase()))
          .filter((c) => !state.selectedConds.includes(c))
          .slice(0, 4);

  return (
    <div className="px-6 py-6">
      <Eyebrow>Health history</Eyebrow>
      <ScreenTitle className="font-semibold">Which conditions have you been diagnosed with?</ScreenTitle>
      <ScreenCopy className="mb-7">Select any that apply, now or in the past.</ScreenCopy>

      <div>
        <div className="grid grid-cols-2 gap-2.5">
          {options.map((name) => (
            <ConditionTile key={name} label={name} selected={state.selectedConds.includes(name)} onClick={() => toggleCond(name)} />
          ))}
        </div>
        <TextAction onClick={() => update({ showMore: !state.showMore })} className="block pt-4 text-[15px]">
          {state.showMore ? "Show fewer conditions" : `Show ${MORE_CONDS.length} more conditions`}
        </TextAction>

        <div className="mt-6 mb-2.5 text-xs font-semibold tracking-[0.07em] text-[var(--iv2-brand)] uppercase">Add a condition</div>
        <InputField
          value={state.condSearch}
          placeholder="Type a condition, like migraine"
          ariaLabel="Search conditions"
          onChange={(v) => update({ condSearch: v })}
        />
        {searchResults.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => toggleCond(name)}
            className="flex w-full cursor-pointer items-center justify-between border-none border-b border-[var(--iv2-border-subtle)] bg-transparent py-3.5 text-left"
          >
            <span className="text-base text-[var(--iv2-text-primary)]">{name}</span>
            <span className="text-[15px] font-bold text-[var(--iv2-brand)]">Add</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => update((s) => ({ noneConds: !s.noneConds, selectedConds: [] }))}
          className="mt-6 flex min-h-14 w-full cursor-pointer items-center gap-2.5 rounded-2xl border-[1.5px] p-3.5 text-left"
          style={{
            borderColor: state.noneConds ? "var(--iv2-brand)" : "var(--iv2-border-subtle)",
            backgroundColor: state.noneConds ? "var(--iv2-brand-surface)" : "#fff",
          }}
        >
          <span
            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-[13px] font-extrabold text-white"
            style={{
              borderColor: state.noneConds ? "var(--iv2-brand)" : "var(--iv2-border-strong)",
              backgroundColor: state.noneConds ? "var(--iv2-brand)" : "#fff",
            }}
          >
            {state.noneConds ? "✓" : ""}
          </span>
          <span className="text-base font-semibold text-[var(--iv2-text-primary)]">None of these apply</span>
        </button>
      </div>
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
      <Eyebrow>Health history</Eyebrow>
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
          lines={state.surgeries.map((s) => `${s.name} · ${s.year}`)}
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
