"use client";

import { Ctx } from "../../ctx";
import { GynHistory } from "../../types";
import { formatDob } from "../../format";
import { Eyebrow, InputField, ScreenCopy, ScreenTitle, YesNoRow } from "../ui";

// GYN History — spec Part 3, item 13. Only fires for Age > 11 AND sex
// assigned at birth = female (this scenario's patient is 14 and
// female, so it's always in-flow for Scenario 2).
export function GynHistoryScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const set = (patch: Partial<GynHistory>) => update((s) => ({ gyn: { ...s.gyn, ...patch } }));
  const gyn = state.gyn;

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>GYN history</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">A few questions about your cycle</ScreenTitle>
      <ScreenCopy className="mb-6">Answered privately and used only to guide today&apos;s care.</ScreenCopy>

      <div className="flex flex-col gap-5">
        <YesNoRow label="Have your periods started?" value={gyn.hasStartedPeriods} onChange={(v) => set({ hasStartedPeriods: v })} />

        {gyn.hasStartedPeriods === "Yes" ? (
          <>
            <InputField label="Age at first period" value={gyn.ageAtFirstPeriod} placeholder="e.g. 12" inputMode="numeric" onChange={(v) => set({ ageAtFirstPeriod: v })} />
            <YesNoRow label="Are your periods regular (28–35 days)?" value={gyn.regularCycle} onChange={(v) => set({ regularCycle: v })} />
            <YesNoRow label="Do periods last more than 7 days?" value={gyn.periodsOverSevenDays} onChange={(v) => set({ periodsOverSevenDays: v })} />
            <YesNoRow label="Severe cramping?" value={gyn.severeCramping} onChange={(v) => set({ severeCramping: v })} />
            <InputField
              label="Date of last period"
              value={gyn.lastPeriodDate}
              placeholder="MM/DD/YYYY"
              inputMode="numeric"
              onChange={(v) => set({ lastPeriodDate: formatDob(v) })}
            />
            <InputField
              label="Current birth control method"
              value={gyn.birthControlMethod}
              placeholder="None, or method used"
              onChange={(v) => set({ birthControlMethod: v })}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
