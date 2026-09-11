"use client";

import { Ctx } from "../../ctx";
import { AllergiesSection } from "../AllergiesSection";
import { MedicationsSection } from "../MedicationsSection";
import { ScreenCopy, ScreenTitle } from "../ui";

// Medications and Allergies — new-patient flow. Both dedicated
// components (MedicationsSection.tsx / AllergiesSection.tsx) share the
// Health History common interaction pattern (checkbox rows, live
// search, exclusive "None") but are otherwise independent, one per
// kind. No own Eyebrow — the header above already names the section
// ("Health history"), so repeating it here would just be noise.
export function ListReviewScreen({ ctx, kind }: { ctx: Ctx; kind: "medications" | "allergies" }) {
  const title = kind === "medications" ? "Medications" : "Allergies";
  const copy = kind === "medications" ? "What medications are you currently taking?" : "What are you allergic to?";

  return (
    <div className="px-6 pt-8 pb-6">
      <ScreenTitle className="mb-2 leading-[1.28]">{title}</ScreenTitle>
      <ScreenCopy className="mb-6">
        {copy} Select all that apply. Search if it isn&apos;t listed.
      </ScreenCopy>
      {kind === "medications" ? <MedicationsSection ctx={ctx} /> : <AllergiesSection ctx={ctx} />}
    </div>
  );
}
