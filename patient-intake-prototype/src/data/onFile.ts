// Mock "already on file" data for the demo patient. In a real app this
// comes from the EHR — the Health screen only ever asks about what's
// missing or changed relative to this list.
export const ON_FILE_CONDITIONS = [
  { id: "allergy-penicillin", label: "Penicillin allergy", detail: "Confirmed 14 Mar 2026" },
  { id: "asthma-plan", label: "Asthma action plan", detail: "Reviewed 8 Jan 2026" },
];

export const HAS_ASTHMA_PLAN = ON_FILE_CONDITIONS.some((c) => c.id === "asthma-plan");
