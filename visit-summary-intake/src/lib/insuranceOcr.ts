import type { OnFileInsurance } from "../types";

/**
 * STUB — swap for a real card-scan/OCR service.
 *
 * Simulates reading a freshly captured insurance card photo. Resolves
 * after a short delay with extracted fields, one of which ("group") is
 * marked uncertain — the UI should only re-ask that single field, never
 * the whole form. No technical language ("OCR", "confidence score") is
 * ever surfaced to the patient; that's a UI concern, not this stub's.
 */
export function extractInsuranceCard(): Promise<{ fields: OnFileInsurance; uncertainField: keyof OnFileInsurance | null }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        fields: { payer: "Aetna Choice POS II", plan: "Choice Plus", memberId: "W2748813902", group: "" },
        uncertainField: "group",
      });
    }, 1800);
  });
}
