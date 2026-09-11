"use client";

import { Ctx } from "../../ctx";
import { FamilyEditor } from "../HealthCategoryEditors";
import { ScreenCopy, ScreenTitle } from "../ui";

// New-patient Health History, step 3 of 5 — its own screen (own
// progress %, own title), matching the pattern of HealthScreen.tsx
// (conditions) and ListReviewScreen.tsx (medications/allergies)
// rather than a merged scrolling page. No own Eyebrow — the header
// above already names the section ("Health history"), so repeating it
// here would just be noise.
export function FamilyHistoryScreen({ ctx }: { ctx: Ctx }) {
  return (
    <div className="px-6 pt-8 pb-6">
      <ScreenTitle className="mb-2 leading-[1.28]">Family Health History</ScreenTitle>
      <ScreenCopy className="mb-6">Any conditions that run in the family? Immediate family: parents, siblings, grandparents.</ScreenCopy>
      <FamilyEditor ctx={ctx} />
    </div>
  );
}
