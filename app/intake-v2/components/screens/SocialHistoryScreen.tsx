"use client";

import { Ctx } from "../../ctx";
import { SocialHistory } from "../../types";
import { Eyebrow, InputField, ScreenCopy, ScreenTitle, SelectField, YesNoRow } from "../ui";

const CHILD_CARE_OPTIONS = ["Daycare/preschool", "None", "Private sitter", "Relative"];

// Social History — spec Part 3, item 10. The entire page is "can wait
// until well visit" for a same-day sick visit — every field here is
// optional, and footerFor's socialHistory branch adds a "Skip for
// today" secondary action alongside Continue (same pattern as the
// Birth & Prenatal Pregnancy/Delivery sub-steps).
export function SocialHistoryScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const set = (patch: Partial<SocialHistory>) => update((s) => ({ social: { ...s.social, ...patch } }));
  const social = state.social;

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>Social history</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">A bit about home life</ScreenTitle>
      <ScreenCopy className="mb-6">
        None of this changes how we treat today&apos;s visit. Skip it now, and we&apos;ll ask again at a well visit.
      </ScreenCopy>

      <div className="flex flex-col gap-5">
        <YesNoRow
          label="Have there been any changes to your family or social situation?"
          value={social.familySocialChanges}
          onChange={(v) => set({ familySocialChanges: v })}
        />
        <SelectField
          label="What type of child care do you use?"
          value={social.childCareType}
          options={CHILD_CARE_OPTIONS}
          placeholder="Optional"
          boldLabel
          onChange={(v) => set({ childCareType: v })}
        />
        <YesNoRow label="Do you have any pets?" value={social.pets} onChange={(v) => set({ pets: v })} />
        <YesNoRow
          label="Do you have smoke and carbon monoxide detectors in your home?"
          value={social.smokeDetectors}
          onChange={(v) => set({ smokeDetectors: v })}
        />
        <YesNoRow label="Are you passively exposed to smoke?" value={social.passiveSmokeExposure} onChange={(v) => set({ passiveSmokeExposure: v })} />
        <YesNoRow label="Do you use sunscreen routinely?" value={social.sunscreenUse} onChange={(v) => set({ sunscreenUse: v })} />
        <InputField boldLabel label="Parents' marital status" value={social.parentsMaritalStatus} placeholder="Optional" onChange={(v) => set({ parentsMaritalStatus: v })} />
        <InputField boldLabel label="Seatbelt / car seat use" value={social.seatbeltCarSeat} placeholder="Optional" onChange={(v) => set({ seatbeltCarSeat: v })} />
      </div>
    </div>
  );
}
