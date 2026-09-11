"use client";

import { Ctx } from "../../ctx";
import { SubstanceUse } from "../../types";
import { formatDob } from "../../format";
import { Eyebrow, InputField, RadioRow, ScreenCopy, ScreenTitle, YesNoRow } from "../ui";

const ALCOHOL_LEVELS = ["Never", "Rarely", "Occasionally", "Regularly", "Prefer not to answer"];

// Substance Use — spec Part 3, item 12. Only fires for Age > 11 (this
// scenario's patient is 14, so it's always in-flow for Scenario 2).
export function SubstanceUseScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const set = (patch: Partial<SubstanceUse>) => update((s) => ({ substance: { ...s.substance, ...patch } }));
  const substance = state.substance;

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>Substance use</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">A few confidential questions</ScreenTitle>
      <ScreenCopy className="mb-6">Answered privately and used only to guide today&apos;s care.</ScreenCopy>

      <div className="flex flex-col gap-5">
        <YesNoRow label="Do you use tobacco or vape?" value={substance.tobaccoUse} onChange={(v) => set({ tobaccoUse: v })} />
        <YesNoRow
          label="Any other tobacco or nicotine products?"
          value={substance.otherTobaccoProducts}
          onChange={(v) => set({ otherTobaccoProducts: v })}
        />
        <InputField
          label="Most recent tobacco screening date"
          value={substance.tobaccoScreeningDate}
          placeholder="MM/DD/YYYY"
          inputMode="numeric"
          onChange={(v) => set({ tobaccoScreeningDate: formatDob(v) })}
        />
        <div>
          <div className="mb-3 text-[15px] font-semibold text-[var(--iv2-text-primary)]">Alcohol consumption</div>
          <div className="flex flex-col gap-2">
            {ALCOHOL_LEVELS.map((opt) => (
              <RadioRow key={opt} label={opt} selected={substance.alcoholLevel === opt} onClick={() => set({ alcoholLevel: opt })} />
            ))}
          </div>
        </div>
        <YesNoRow label="Illicit or recreational drug use?" value={substance.illicitDrugUse} onChange={(v) => set({ illicitDrugUse: v })} />
      </div>
    </div>
  );
}
