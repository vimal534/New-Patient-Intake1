// Small curated lists standing in for a real clinical terminology API
// (e.g. SNOMED CT for conditions/allergies, RxNorm for medications).
// The point being demonstrated is the interaction — typeahead + confirm —
// not the completeness of the dataset.

export const CONDITION_SUGGESTIONS = [
  "Type 2 Diabetes",
  "Type 1 Diabetes",
  "Hypertension",
  "Hyperlipidemia",
  "Asthma",
  "COPD",
  "Coronary Artery Disease",
  "Atrial Fibrillation",
  "Heart Attack",
  "Stroke",
  "Transient Ischemic Attack",
  "Chronic Kidney Disease",
  "Kidney Stones",
  "Hypothyroidism",
  "Hyperthyroidism",
  "Parkinson's Disease",
  "Osteoarthritis",
  "Rheumatoid Arthritis",
  "Depression",
  "Anxiety Disorder",
  "GERD",
  "Migraine",
];

export const MEDICATION_SUGGESTIONS = [
  "Metformin",
  "Empagliflozin",
  "Lisinopril",
  "Losartan",
  "Atorvastatin",
  "Rosuvastatin",
  "Levothyroxine",
  "Amlodipine",
  "Warfarin",
  "Apixaban",
  "Albuterol",
  "Fluticasone",
  "Omeprazole",
  "Famotidine",
  "Sertraline",
  "Gabapentin",
  "Metoprolol",
  "Hydrochlorothiazide",
];

export const ALLERGY_SUGGESTIONS = [
  "Penicillin",
  "Amoxicillin",
  "Sulfa Drugs",
  "Aspirin",
  "Ibuprofen (NSAIDs)",
  "Latex",
  "Peanuts",
  "Tree Nuts",
  "Shellfish",
  "Eggs",
  "Bee Stings",
  "Contrast Dye",
];

export const ALLERGY_SEVERITIES = ["Mild", "Moderate", "Severe"];

export const MEDICATION_UNITS = ["mg", "mcg", "mL", "IU", "%", "tablet(s)"];

export const MEDICATION_FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "At bedtime",
  "With meals",
  "As needed",
  "Other…",
];
