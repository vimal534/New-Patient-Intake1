// Mock data per the data-source abstraction pattern (see ./types.ts). This
// stands in for a real terminology/EMR service (e.g. RxNorm, FHIR
// MedicationKnowledge) — a future adapter implements CodedSearchSource
// against that real service and the Medications module swaps it in with
// zero UI changes. Until then, this file is the entire "database" of
// searchable medications and the synchronous ranking logic a real async
// adapter would otherwise perform server-side.

import type { CodedEntry } from "./types";

export const MOCK_MEDICATIONS: CodedEntry[] = [
  // --- Antibiotics -----------------------------------------------------
  {
    id: "amoxicillin-500",
    name: "Amoxicillin",
    detail: "Amoxicillin 500mg capsule",
    category: "Antibiotic",
    doses: ["125mg", "250mg", "400mg", "500mg", "875mg"],
    frequencies: ["Once daily", "Twice daily", "Three times daily"],
    isCommon: true,
  },
  {
    id: "amoxicillin-clav",
    name: "Amoxicillin-Clavulanate (Augmentin)",
    detail: "Augmentin 875mg-125mg tablet",
    category: "Antibiotic",
    doses: ["250mg-125mg", "500mg-125mg", "875mg-125mg"],
    frequencies: ["Twice daily", "Three times daily"],
  },
  {
    id: "azithromycin",
    name: "Azithromycin (Zithromax)",
    detail: "Zithromax 250mg tablet",
    category: "Antibiotic",
    doses: ["100mg/5mL suspension", "200mg/5mL suspension", "250mg", "500mg"],
    frequencies: ["Once daily", "Once (single dose)"],
    isCommon: true,
  },
  {
    id: "cephalexin",
    name: "Cephalexin (Keflex)",
    detail: "Keflex 500mg capsule",
    category: "Antibiotic",
    doses: ["250mg", "500mg", "125mg/5mL suspension", "250mg/5mL suspension"],
    frequencies: ["Twice daily", "Three times daily", "Four times daily"],
  },
  {
    id: "ciprofloxacin",
    name: "Ciprofloxacin (Cipro)",
    detail: "Cipro 500mg tablet",
    category: "Antibiotic",
    doses: ["250mg", "500mg", "750mg"],
    frequencies: ["Twice daily"],
  },
  {
    id: "clindamycin",
    name: "Clindamycin",
    detail: "Clindamycin 300mg capsule",
    category: "Antibiotic",
    doses: ["75mg", "150mg", "300mg"],
    frequencies: ["Three times daily", "Four times daily"],
  },
  {
    id: "doxycycline",
    name: "Doxycycline",
    detail: "Doxycycline 100mg tablet",
    category: "Antibiotic",
    doses: ["50mg", "100mg"],
    frequencies: ["Once daily", "Twice daily"],
  },
  {
    id: "sulfamethoxazole-tmp",
    name: "Sulfamethoxazole-Trimethoprim (Bactrim)",
    detail: "Bactrim DS 800mg-160mg tablet",
    category: "Antibiotic",
    doses: ["400mg-80mg", "800mg-160mg"],
    frequencies: ["Twice daily"],
  },
  {
    id: "nitrofurantoin",
    name: "Nitrofurantoin (Macrobid)",
    detail: "Macrobid 100mg capsule",
    category: "Antibiotic",
    doses: ["50mg", "100mg"],
    frequencies: ["Twice daily"],
  },
  {
    id: "metronidazole",
    name: "Metronidazole (Flagyl)",
    detail: "Flagyl 500mg tablet",
    category: "Antibiotic",
    doses: ["250mg", "500mg"],
    frequencies: ["Twice daily", "Three times daily"],
  },

  // --- Analgesics / antipyretics ---------------------------------------
  {
    id: "acetaminophen",
    name: "Acetaminophen (Tylenol)",
    detail: "Tylenol 160mg/5mL children's suspension",
    category: "Analgesic",
    doses: ["80mg chewable", "160mg/5mL suspension", "325mg", "500mg", "650mg"],
    frequencies: ["Every 4 hours as needed", "Every 6 hours as needed", "As needed"],
    isCommon: true,
  },
  {
    id: "ibuprofen",
    name: "Ibuprofen (Motrin, Advil)",
    detail: "Motrin 100mg/5mL infant/children's suspension",
    category: "Analgesic",
    doses: ["50mg/1.25mL infant drops", "100mg/5mL suspension", "200mg", "400mg", "600mg", "800mg"],
    frequencies: ["Every 6 hours as needed", "Every 8 hours as needed", "As needed"],
    isCommon: true,
  },
  {
    id: "naproxen",
    name: "Naproxen (Aleve)",
    detail: "Aleve 220mg tablet",
    category: "Analgesic",
    doses: ["220mg", "375mg", "500mg"],
    frequencies: ["Twice daily", "As needed"],
  },
  {
    id: "tramadol",
    name: "Tramadol",
    detail: "Tramadol 50mg tablet",
    category: "Analgesic",
    doses: ["50mg", "100mg"],
    frequencies: ["Every 6 hours as needed", "As needed"],
  },
  {
    id: "oxycodone-acetaminophen",
    name: "Oxycodone-Acetaminophen (Percocet)",
    detail: "Percocet 5mg-325mg tablet",
    category: "Analgesic",
    doses: ["2.5mg-325mg", "5mg-325mg", "7.5mg-325mg", "10mg-325mg"],
    frequencies: ["Every 6 hours as needed", "As needed"],
  },

  // --- Respiratory / asthma / allergy ----------------------------------
  {
    id: "albuterol-inhaler",
    name: "Albuterol (ProAir, Ventolin)",
    detail: "ProAir HFA 90mcg inhaler",
    category: "Bronchodilator",
    doses: ["90mcg/actuation inhaler", "0.083% nebulizer solution", "2.5mg/3mL nebulizer"],
    frequencies: ["Every 4-6 hours as needed", "Twice daily", "As needed"],
    isCommon: true,
  },
  {
    id: "montelukast",
    name: "Montelukast (Singulair)",
    detail: "Singulair 10mg tablet",
    category: "Asthma/Allergy",
    doses: ["4mg chewable", "5mg chewable", "10mg tablet"],
    frequencies: ["Once daily (evening)"],
    isCommon: true,
  },
  {
    id: "fluticasone-nasal",
    name: "Fluticasone Nasal Spray (Flonase)",
    detail: "Flonase 50mcg/spray nasal spray",
    category: "Asthma/Allergy",
    doses: ["50mcg/spray"],
    frequencies: ["Once daily", "Twice daily"],
  },
  {
    id: "fluticasone-inhaler",
    name: "Fluticasone Inhaler (Flovent)",
    detail: "Flovent HFA 44mcg inhaler",
    category: "Asthma/Allergy",
    doses: ["44mcg/actuation", "110mcg/actuation", "220mcg/actuation"],
    frequencies: ["Twice daily"],
  },
  {
    id: "budesonide-formoterol",
    name: "Budesonide-Formoterol (Symbicort)",
    detail: "Symbicort 160mcg-4.5mcg inhaler",
    category: "Asthma/Allergy",
    doses: ["80mcg-4.5mcg", "160mcg-4.5mcg"],
    frequencies: ["Twice daily"],
  },
  {
    id: "cetirizine",
    name: "Cetirizine (Zyrtec)",
    detail: "Zyrtec 10mg tablet",
    category: "Antihistamine",
    doses: ["1mg/mL solution", "5mg", "10mg"],
    frequencies: ["Once daily"],
    isCommon: true,
  },
  {
    id: "loratadine",
    name: "Loratadine (Claritin)",
    detail: "Claritin 10mg tablet",
    category: "Antihistamine",
    doses: ["5mg chewable", "10mg", "1mg/mL solution"],
    frequencies: ["Once daily"],
  },
  {
    id: "diphenhydramine",
    name: "Diphenhydramine (Benadryl)",
    detail: "Benadryl 25mg capsule",
    category: "Antihistamine",
    doses: ["12.5mg/5mL liquid", "25mg", "50mg"],
    frequencies: ["Every 6 hours as needed", "As needed"],
    isCommon: true,
  },
  {
    id: "fexofenadine",
    name: "Fexofenadine (Allegra)",
    detail: "Allegra 180mg tablet",
    category: "Antihistamine",
    doses: ["30mg", "60mg", "180mg"],
    frequencies: ["Once daily", "Twice daily"],
  },
  {
    id: "guaifenesin",
    name: "Guaifenesin (Mucinex)",
    detail: "Mucinex 600mg extended-release tablet",
    category: "Cough/Cold",
    doses: ["100mg/5mL liquid", "400mg", "600mg", "1200mg"],
    frequencies: ["Every 4 hours as needed", "Twice daily"],
  },
  {
    id: "benzonatate",
    name: "Benzonatate (Tessalon Perles)",
    detail: "Tessalon Perles 100mg capsule",
    category: "Cough/Cold",
    doses: ["100mg", "200mg"],
    frequencies: ["Three times daily"],
  },

  // --- Cardiovascular ----------------------------------------------------
  {
    id: "lisinopril",
    name: "Lisinopril (Zestril)",
    detail: "Zestril 10mg tablet",
    category: "Antihypertensive",
    doses: ["2.5mg", "5mg", "10mg", "20mg", "40mg"],
    frequencies: ["Once daily"],
    isCommon: true,
  },
  {
    id: "amlodipine",
    name: "Amlodipine (Norvasc)",
    detail: "Norvasc 5mg tablet",
    category: "Antihypertensive",
    doses: ["2.5mg", "5mg", "10mg"],
    frequencies: ["Once daily"],
    isCommon: true,
  },
  {
    id: "losartan",
    name: "Losartan (Cozaar)",
    detail: "Cozaar 50mg tablet",
    category: "Antihypertensive",
    doses: ["25mg", "50mg", "100mg"],
    frequencies: ["Once daily", "Twice daily"],
  },
  {
    id: "metoprolol",
    name: "Metoprolol (Lopressor, Toprol-XL)",
    detail: "Toprol-XL 50mg extended-release tablet",
    category: "Antihypertensive",
    doses: ["25mg", "50mg", "100mg", "200mg"],
    frequencies: ["Once daily", "Twice daily"],
  },
  {
    id: "hydrochlorothiazide",
    name: "Hydrochlorothiazide (Microzide)",
    detail: "Microzide 25mg capsule",
    category: "Antihypertensive",
    doses: ["12.5mg", "25mg", "50mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "atorvastatin",
    name: "Atorvastatin (Lipitor)",
    detail: "Lipitor 20mg tablet",
    category: "Statin",
    doses: ["10mg", "20mg", "40mg", "80mg"],
    frequencies: ["Once daily (evening)"],
    isCommon: true,
  },
  {
    id: "simvastatin",
    name: "Simvastatin (Zocor)",
    detail: "Zocor 20mg tablet",
    category: "Statin",
    doses: ["10mg", "20mg", "40mg"],
    frequencies: ["Once daily (evening)"],
  },
  {
    id: "clopidogrel",
    name: "Clopidogrel (Plavix)",
    detail: "Plavix 75mg tablet",
    category: "Antiplatelet",
    doses: ["75mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "warfarin",
    name: "Warfarin (Coumadin)",
    detail: "Coumadin 5mg tablet",
    category: "Anticoagulant",
    doses: ["1mg", "2mg", "2.5mg", "5mg", "10mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "aspirin-low-dose",
    name: "Aspirin (low-dose)",
    detail: "Aspirin 81mg chewable/enteric-coated tablet",
    category: "Antiplatelet",
    doses: ["81mg", "325mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "furosemide",
    name: "Furosemide (Lasix)",
    detail: "Lasix 40mg tablet",
    category: "Diuretic",
    doses: ["20mg", "40mg", "80mg"],
    frequencies: ["Once daily", "Twice daily"],
  },

  // --- Endocrine / metabolic ---------------------------------------------
  {
    id: "metformin",
    name: "Metformin (Glucophage)",
    detail: "Glucophage 500mg tablet",
    category: "Antidiabetic",
    doses: ["500mg", "850mg", "1000mg"],
    frequencies: ["Once daily", "Twice daily"],
    isCommon: true,
  },
  {
    id: "insulin-glargine",
    name: "Insulin Glargine (Lantus)",
    detail: "Lantus 100units/mL injection",
    category: "Antidiabetic",
    doses: ["10 units", "20 units", "30 units", "40 units"],
    frequencies: ["Once daily (bedtime)"],
  },
  {
    id: "levothyroxine",
    name: "Levothyroxine (Synthroid)",
    detail: "Synthroid 50mcg tablet",
    category: "Thyroid",
    doses: ["25mcg", "50mcg", "75mcg", "100mcg", "125mcg", "150mcg"],
    frequencies: ["Once daily (morning, empty stomach)"],
    isCommon: true,
  },

  // --- GI ------------------------------------------------------------------
  {
    id: "omeprazole",
    name: "Omeprazole (Prilosec)",
    detail: "Prilosec 20mg delayed-release capsule",
    category: "GI/Acid reducer",
    doses: ["10mg", "20mg", "40mg"],
    frequencies: ["Once daily"],
    isCommon: true,
  },
  {
    id: "ondansetron",
    name: "Ondansetron (Zofran)",
    detail: "Zofran 4mg orally disintegrating tablet",
    category: "Antiemetic",
    doses: ["4mg", "8mg"],
    frequencies: ["Every 8 hours as needed", "As needed"],
    isCommon: true,
  },
  {
    id: "polyethylene-glycol",
    name: "Polyethylene Glycol 3350 (Miralax)",
    detail: "Miralax 17g powder packet",
    category: "GI/Laxative",
    doses: ["17g"],
    frequencies: ["Once daily", "As needed"],
    isCommon: true,
  },
  {
    id: "loperamide",
    name: "Loperamide (Imodium)",
    detail: "Imodium 2mg capsule",
    category: "GI/Antidiarrheal",
    doses: ["1mg/5mL liquid", "2mg"],
    frequencies: ["As needed"],
  },
  {
    id: "simethicone",
    name: "Simethicone (Mylicon)",
    detail: "Mylicon 20mg/0.3mL infant drops",
    category: "GI",
    doses: ["20mg/0.3mL drops", "40mg", "125mg"],
    frequencies: ["After meals as needed", "As needed"],
  },

  // --- Psych / neuro ---------------------------------------------------
  {
    id: "sertraline",
    name: "Sertraline (Zoloft)",
    detail: "Zoloft 50mg tablet",
    category: "Antidepressant",
    doses: ["25mg", "50mg", "100mg"],
    frequencies: ["Once daily"],
    isCommon: true,
  },
  {
    id: "fluoxetine",
    name: "Fluoxetine (Prozac)",
    detail: "Prozac 20mg capsule",
    category: "Antidepressant",
    doses: ["10mg", "20mg", "40mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "escitalopram",
    name: "Escitalopram (Lexapro)",
    detail: "Lexapro 10mg tablet",
    category: "Antidepressant",
    doses: ["5mg", "10mg", "20mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "bupropion",
    name: "Bupropion (Wellbutrin)",
    detail: "Wellbutrin XL 150mg extended-release tablet",
    category: "Antidepressant",
    doses: ["75mg", "100mg", "150mg", "300mg"],
    frequencies: ["Once daily", "Twice daily"],
  },
  {
    id: "methylphenidate",
    name: "Methylphenidate (Ritalin, Concerta)",
    detail: "Concerta 18mg extended-release tablet",
    category: "ADHD",
    doses: ["5mg", "10mg", "18mg", "27mg", "36mg", "54mg"],
    frequencies: ["Once daily (morning)", "Twice daily"],
    isCommon: true,
  },
  {
    id: "amphetamine-dextroamphetamine",
    name: "Amphetamine-Dextroamphetamine (Adderall)",
    detail: "Adderall XR 20mg extended-release capsule",
    category: "ADHD",
    doses: ["5mg", "10mg", "15mg", "20mg", "25mg", "30mg"],
    frequencies: ["Once daily (morning)", "Twice daily"],
  },
  {
    id: "lisdexamfetamine",
    name: "Lisdexamfetamine (Vyvanse)",
    detail: "Vyvanse 30mg capsule",
    category: "ADHD",
    doses: ["10mg", "20mg", "30mg", "40mg", "50mg", "60mg"],
    frequencies: ["Once daily (morning)"],
  },
  {
    id: "guanfacine",
    name: "Guanfacine (Intuniv)",
    detail: "Intuniv 2mg extended-release tablet",
    category: "ADHD",
    doses: ["1mg", "2mg", "3mg", "4mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "melatonin",
    name: "Melatonin",
    detail: "Melatonin 3mg gummy",
    category: "Sleep aid",
    doses: ["1mg", "3mg", "5mg", "10mg"],
    frequencies: ["Once daily (bedtime)", "As needed"],
    isCommon: true,
  },
  {
    id: "gabapentin",
    name: "Gabapentin (Neurontin)",
    detail: "Neurontin 300mg capsule",
    category: "Neuropathic pain",
    doses: ["100mg", "300mg", "400mg", "600mg", "800mg"],
    frequencies: ["Once daily", "Twice daily", "Three times daily"],
  },
  {
    id: "sumatriptan",
    name: "Sumatriptan (Imitrex)",
    detail: "Imitrex 50mg tablet",
    category: "Migraine",
    doses: ["25mg", "50mg", "100mg"],
    frequencies: ["As needed (max 2/day)", "As needed"],
  },

  // --- Dermatology / topical ---------------------------------------------
  {
    id: "hydrocortisone-topical",
    name: "Hydrocortisone Cream",
    detail: "Hydrocortisone 1% topical cream",
    category: "Topical/Dermatologic",
    doses: ["0.5%", "1%", "2.5%"],
    frequencies: ["Twice daily", "As needed"],
  },
  {
    id: "triamcinolone-topical",
    name: "Triamcinolone Cream",
    detail: "Triamcinolone 0.1% topical cream",
    category: "Topical/Dermatologic",
    doses: ["0.025%", "0.1%", "0.5%"],
    frequencies: ["Twice daily"],
  },
  {
    id: "mupirocin",
    name: "Mupirocin (Bactroban)",
    detail: "Bactroban 2% topical ointment",
    category: "Topical/Antibiotic",
    doses: ["2%"],
    frequencies: ["Three times daily"],
  },
  {
    id: "benzoyl-peroxide",
    name: "Benzoyl Peroxide",
    detail: "Benzoyl Peroxide 5% topical gel",
    category: "Topical/Dermatologic",
    doses: ["2.5%", "5%", "10%"],
    frequencies: ["Once daily", "Twice daily"],
  },
  {
    id: "permethrin",
    name: "Permethrin",
    detail: "Permethrin 5% topical cream",
    category: "Topical/Antiparasitic",
    doses: ["1%", "5%"],
    frequencies: ["Single application", "As directed"],
  },

  // --- Steroids / anti-inflammatory ---------------------------------------
  {
    id: "prednisone",
    name: "Prednisone",
    detail: "Prednisone 20mg tablet",
    category: "Corticosteroid",
    doses: ["1mg", "2.5mg", "5mg", "10mg", "20mg", "50mg"],
    frequencies: ["Once daily", "Twice daily", "As directed (taper)"],
    isCommon: true,
  },
  {
    id: "prednisolone-liquid",
    name: "Prednisolone (Orapred)",
    detail: "Orapred 15mg/5mL oral solution",
    category: "Corticosteroid",
    doses: ["15mg/5mL solution"],
    frequencies: ["Once daily", "Twice daily"],
  },
  {
    id: "methylprednisolone",
    name: "Methylprednisolone (Medrol Dose Pack)",
    detail: "Medrol 4mg dose pack",
    category: "Corticosteroid",
    doses: ["4mg"],
    frequencies: ["As directed (taper)"],
  },

  // --- Vitamins / supplements --------------------------------------------
  {
    id: "vitamin-d3",
    name: "Vitamin D3 (Cholecalciferol)",
    detail: "Vitamin D3 1000 IU tablet",
    category: "Supplement",
    doses: ["400 IU", "1000 IU", "2000 IU", "5000 IU"],
    frequencies: ["Once daily"],
    isCommon: true,
  },
  {
    id: "multivitamin-pediatric",
    name: "Children's Multivitamin",
    detail: "Children's Multivitamin chewable tablet",
    category: "Supplement",
    doses: ["1 chewable tablet", "1mL liquid"],
    frequencies: ["Once daily"],
  },
  {
    id: "iron-ferrous-sulfate",
    name: "Ferrous Sulfate (Iron)",
    detail: "Ferrous Sulfate 325mg tablet",
    category: "Supplement",
    doses: ["15mg/mL drops", "220mg", "325mg"],
    frequencies: ["Once daily", "Twice daily"],
  },
  {
    id: "folic-acid",
    name: "Folic Acid",
    detail: "Folic Acid 1mg tablet",
    category: "Supplement",
    doses: ["0.4mg", "1mg", "5mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "fluoride-drops",
    name: "Fluoride Drops",
    detail: "Fluoride 0.25mg/drop oral drops",
    category: "Supplement",
    doses: ["0.125mg/drop", "0.25mg/drop", "0.5mg/drop"],
    frequencies: ["Once daily"],
  },

  // --- Contraception / hormones -------------------------------------------
  {
    id: "epinephrine-autoinjector",
    name: "Epinephrine Auto-Injector (EpiPen)",
    detail: "EpiPen 0.3mg auto-injector",
    category: "Emergency/Allergy",
    doses: ["0.15mg (Jr)", "0.3mg"],
    frequencies: ["As needed for anaphylaxis"],
    isCommon: true,
  },
  {
    id: "oseltamivir",
    name: "Oseltamivir (Tamiflu)",
    detail: "Tamiflu 75mg capsule",
    category: "Antiviral",
    doses: ["6mg/mL suspension", "30mg", "45mg", "75mg"],
    frequencies: ["Twice daily"],
    isCommon: true,
  },
  {
    id: "pantoprazole",
    name: "Pantoprazole (Protonix)",
    detail: "Protonix 40mg tablet",
    category: "GI/Acid reducer",
    doses: ["20mg", "40mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "diltiazem",
    name: "Diltiazem (Cardizem)",
    detail: "Cardizem CD 180mg extended-release capsule",
    category: "Antihypertensive",
    doses: ["120mg", "180mg", "240mg", "300mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "rosuvastatin",
    name: "Rosuvastatin (Crestor)",
    detail: "Crestor 10mg tablet",
    category: "Statin",
    doses: ["5mg", "10mg", "20mg", "40mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "sitagliptin",
    name: "Sitagliptin (Januvia)",
    detail: "Januvia 100mg tablet",
    category: "Antidiabetic",
    doses: ["25mg", "50mg", "100mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "semaglutide",
    name: "Semaglutide (Ozempic)",
    detail: "Ozempic 0.5mg/dose injection pen",
    category: "Antidiabetic",
    doses: ["0.25mg", "0.5mg", "1mg", "2mg"],
    frequencies: ["Once weekly"],
  },
  {
    id: "buspirone",
    name: "Buspirone (Buspar)",
    detail: "Buspar 10mg tablet",
    category: "Anxiolytic",
    doses: ["5mg", "10mg", "15mg", "30mg"],
    frequencies: ["Twice daily", "Three times daily"],
  },
  {
    id: "duloxetine",
    name: "Duloxetine (Cymbalta)",
    detail: "Cymbalta 30mg capsule",
    category: "Antidepressant",
    doses: ["20mg", "30mg", "60mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "venlafaxine",
    name: "Venlafaxine (Effexor XR)",
    detail: "Effexor XR 75mg extended-release capsule",
    category: "Antidepressant",
    doses: ["37.5mg", "75mg", "150mg", "225mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "risperidone",
    name: "Risperidone (Risperdal)",
    detail: "Risperdal 1mg tablet",
    category: "Antipsychotic",
    doses: ["0.25mg", "0.5mg", "1mg", "2mg"],
    frequencies: ["Once daily", "Twice daily"],
  },
  {
    id: "aripiprazole",
    name: "Aripiprazole (Abilify)",
    detail: "Abilify 10mg tablet",
    category: "Antipsychotic",
    doses: ["2mg", "5mg", "10mg", "15mg", "20mg"],
    frequencies: ["Once daily"],
  },
  {
    id: "chlorhexidine-mouthwash",
    name: "Chlorhexidine Mouthwash (Peridex)",
    detail: "Peridex 0.12% oral rinse",
    category: "Dental",
    doses: ["0.12%"],
    frequencies: ["Twice daily"],
  },
];

function normalize(value: string): string {
  return value.toLowerCase();
}

function matches(entry: CodedEntry, needle: string): "starts" | "contains" | null {
  const name = normalize(entry.name);
  const detail = normalize(entry.detail);
  if (name.startsWith(needle) || detail.startsWith(needle)) return "starts";
  if (name.includes(needle) || detail.includes(needle)) return "contains";
  return null;
}

function rankAndSlice(
  candidates: CodedEntry[],
  query: string,
  opts?: { recentIds?: string[]; limit?: number }
): CodedEntry[] {
  const limit = opts?.limit ?? 20;
  const recentIds = opts?.recentIds ?? [];
  const trimmed = query.trim().toLowerCase();

  const scored = candidates
    .map((entry) => {
      const matchKind = trimmed ? matches(entry, trimmed) : "contains";
      return { entry, matchKind };
    })
    .filter((row) => row.matchKind !== null) as { entry: CodedEntry; matchKind: "starts" | "contains" }[];

  scored.sort((a, b) => {
    const aRecent = recentIds.includes(a.entry.id) ? 1 : 0;
    const bRecent = recentIds.includes(b.entry.id) ? 1 : 0;
    if (aRecent !== bRecent) return bRecent - aRecent;

    if (trimmed) {
      const aStarts = a.matchKind === "starts" ? 1 : 0;
      const bStarts = b.matchKind === "starts" ? 1 : 0;
      if (aStarts !== bStarts) return bStarts - aStarts;
    }

    const aCommon = a.entry.isCommon ? 1 : 0;
    const bCommon = b.entry.isCommon ? 1 : 0;
    if (aCommon !== bCommon) return bCommon - aCommon;

    return a.entry.name.localeCompare(b.entry.name);
  });

  return scored.slice(0, limit).map((row) => row.entry);
}

export function searchMedications(
  query: string,
  opts?: { recentIds?: string[]; limit?: number }
): CodedEntry[] {
  return rankAndSlice(MOCK_MEDICATIONS, query, opts);
}

export function getMedicationById(id: string): CodedEntry | null {
  return MOCK_MEDICATIONS.find((entry) => entry.id === id) ?? null;
}
