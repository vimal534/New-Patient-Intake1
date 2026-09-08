"use client";

import { Ctx } from "../../ctx";
import { MedAllergyAddSection } from "../MedAllergyAddSection";
import { Eyebrow, ScreenCopy, ScreenTitle } from "../ui";

// Screens 9/10 — Medications and Allergies. New-patient flow only —
// returning patients review both on one merged Health History screen
// instead (HealthCategoryEditors.tsx's MedicationsEditor/
// AllergiesEditor), which shares the exact same add flow via
// MedAllergyAddSection so both patient types get identical behavior.
export function ListReviewScreen({ ctx, kind }: { ctx: Ctx; kind: "medications" | "allergies" }) {
  const title = kind === "medications" ? "What medications are you currently taking?" : "What are you allergic to?";

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>{kind === "medications" ? "Medications" : "Allergies"}</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">{title}</ScreenTitle>
      <ScreenCopy className="mb-6">Select all that apply. Search if it isn&apos;t listed.</ScreenCopy>
      <MedAllergyAddSection ctx={ctx} kind={kind} showNoneOption />
    </div>
  );
}
