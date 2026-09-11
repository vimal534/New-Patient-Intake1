"use client";

import { Ctx } from "../../ctx";
import { SurgeriesEditor } from "../HealthCategoryEditors";
import { ScreenCopy, ScreenTitle } from "../ui";

// New-patient Health History, step 2 of 5 — its own screen (own
// progress %, own title), matching the pattern of HealthScreen.tsx
// (conditions) and ListReviewScreen.tsx (medications/allergies)
// rather than a merged scrolling page. No own Eyebrow — the header
// above already names the section ("Health history"), so repeating it
// here would just be noise.
export function SurgeriesScreen({ ctx }: { ctx: Ctx }) {
  return (
    <div className="px-6 pt-8 pb-6">
      <ScreenTitle className="mb-2 leading-[1.28]">Surgeries</ScreenTitle>
      <ScreenCopy className="mb-6">Have you had any surgeries? Select any that apply, now or in the past.</ScreenCopy>
      <SurgeriesEditor ctx={ctx} />
    </div>
  );
}
