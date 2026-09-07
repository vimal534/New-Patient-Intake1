// Mock data per the data-source abstraction pattern (see ./types.ts). This
// stands in for a real terminology/EMR allergy service (e.g. a FHIR
// AllergyIntolerance-backed terminology lookup) — a future adapter
// implements CodedSearchSource against that real service and the Allergies
// module swaps it in with zero UI changes. Until then, this file is the
// entire "database" of searchable allergens and the synchronous ranking
// logic a real async adapter would otherwise perform server-side.

import type { CodedEntry } from "./types";

export const MOCK_ALLERGENS: CodedEntry[] = [
  // --- Drug allergies ----------------------------------------------------
  {
    id: "penicillin",
    name: "Penicillin",
    detail: "Penicillin (and derivatives)",
    category: "Drug",
    reactions: ["Hives", "Rash", "Swelling", "Anaphylaxis", "Difficulty breathing"],
    isCommon: true,
  },
  {
    id: "amoxicillin-allergy",
    name: "Amoxicillin",
    detail: "Amoxicillin (penicillin class)",
    category: "Drug",
    reactions: ["Hives", "Rash", "Swelling", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "sulfa-drugs",
    name: "Sulfa Drugs",
    detail: "Sulfonamide antibiotics (e.g. Bactrim)",
    category: "Drug",
    reactions: ["Hives", "Rash", "Fever", "Swelling", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "nsaids",
    name: "NSAIDs",
    detail: "Nonsteroidal anti-inflammatory drugs (ibuprofen, naproxen)",
    category: "Drug",
    reactions: ["Hives", "Swelling", "Difficulty breathing", "GI upset", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "aspirin-allergy",
    name: "Aspirin",
    detail: "Aspirin (acetylsalicylic acid)",
    category: "Drug",
    reactions: ["Hives", "Swelling", "Difficulty breathing", "Nasal congestion", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "codeine",
    name: "Codeine",
    detail: "Codeine and related opioids",
    category: "Drug",
    reactions: ["Rash", "Itching", "Swelling", "Difficulty breathing", "Nausea"],
  },
  {
    id: "morphine",
    name: "Morphine",
    detail: "Morphine and related opioids",
    category: "Drug",
    reactions: ["Itching", "Rash", "Swelling", "Difficulty breathing", "Nausea"],
  },
  {
    id: "cephalosporins",
    name: "Cephalosporins",
    detail: "Cephalosporin antibiotics (e.g. cephalexin)",
    category: "Drug",
    reactions: ["Hives", "Rash", "Swelling", "Anaphylaxis"],
  },
  {
    id: "erythromycin-allergy",
    name: "Erythromycin",
    detail: "Erythromycin and macrolide antibiotics",
    category: "Drug",
    reactions: ["Rash", "GI upset", "Hives", "Swelling"],
  },
  {
    id: "tetracycline",
    name: "Tetracycline",
    detail: "Tetracycline antibiotics (including doxycycline)",
    category: "Drug",
    reactions: ["Rash", "Photosensitivity", "Hives", "Swelling"],
  },
  {
    id: "contrast-dye",
    name: "Contrast Dye",
    detail: "IV iodinated contrast media",
    category: "Drug",
    reactions: ["Hives", "Itching", "Swelling", "Difficulty breathing", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "latex",
    name: "Latex",
    detail: "Natural rubber latex",
    category: "Drug",
    reactions: ["Hives", "Rash", "Itching", "Swelling", "Difficulty breathing", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "local-anesthetics",
    name: "Local Anesthetics",
    detail: "Lidocaine and related local anesthetics",
    category: "Drug",
    reactions: ["Rash", "Swelling", "Hives", "Difficulty breathing"],
  },
  {
    id: "ace-inhibitors",
    name: "ACE Inhibitors",
    detail: "ACE inhibitors (e.g. lisinopril)",
    category: "Drug",
    reactions: ["Cough", "Swelling", "Angioedema", "Rash"],
  },
  {
    id: "vancomycin",
    name: "Vancomycin",
    detail: "Vancomycin",
    category: "Drug",
    reactions: ["Rash", "Flushing (red man syndrome)", "Hives", "Swelling"],
  },
  {
    id: "ciprofloxacin-allergy",
    name: "Ciprofloxacin",
    detail: "Ciprofloxacin and fluoroquinolone antibiotics",
    category: "Drug",
    reactions: ["Rash", "Hives", "Tendon pain", "Swelling"],
  },
  {
    id: "acetaminophen-allergy",
    name: "Acetaminophen",
    detail: "Acetaminophen (Tylenol)",
    category: "Drug",
    reactions: ["Rash", "Hives", "Swelling"],
  },
  {
    id: "insulin-allergy",
    name: "Insulin",
    detail: "Insulin (any formulation)",
    category: "Drug",
    reactions: ["Redness at injection site", "Itching", "Hives", "Swelling"],
  },
  {
    id: "iodine",
    name: "Iodine",
    detail: "Iodine-based antiseptics and compounds",
    category: "Drug",
    reactions: ["Rash", "Hives", "Swelling", "Difficulty breathing"],
  },
  {
    id: "adhesive-tape",
    name: "Adhesive Tape",
    detail: "Medical adhesive/tape",
    category: "Drug",
    reactions: ["Rash", "Itching", "Redness", "Blistering"],
  },

  // --- Food allergies ------------------------------------------------------
  {
    id: "peanuts",
    name: "Peanuts",
    detail: "Peanuts and peanut-derived products",
    category: "Food",
    reactions: ["Hives", "Swelling", "Vomiting", "Difficulty breathing", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "tree-nuts",
    name: "Tree Nuts",
    detail: "Tree nuts (almonds, walnuts, cashews, pecans)",
    category: "Food",
    reactions: ["Hives", "Swelling", "Vomiting", "Difficulty breathing", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "shellfish",
    name: "Shellfish",
    detail: "Shellfish (shrimp, crab, lobster)",
    category: "Food",
    reactions: ["Hives", "Swelling", "Vomiting", "Nausea", "Difficulty breathing", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "fish",
    name: "Fish",
    detail: "Finned fish (salmon, tuna, cod)",
    category: "Food",
    reactions: ["Hives", "Swelling", "Vomiting", "Difficulty breathing", "Anaphylaxis"],
  },
  {
    id: "eggs",
    name: "Eggs",
    detail: "Eggs (whole, egg white, egg yolk)",
    category: "Food",
    reactions: ["Hives", "Rash", "Vomiting", "Diarrhea", "Difficulty breathing"],
    isCommon: true,
  },
  {
    id: "milk",
    name: "Milk",
    detail: "Cow's milk and dairy products",
    category: "Food",
    reactions: ["Hives", "Vomiting", "Diarrhea", "Rash", "Difficulty breathing"],
    isCommon: true,
  },
  {
    id: "soy",
    name: "Soy",
    detail: "Soy and soy-derived products",
    category: "Food",
    reactions: ["Hives", "Vomiting", "Diarrhea", "Rash", "Swelling"],
    isCommon: true,
  },
  {
    id: "wheat",
    name: "Wheat",
    detail: "Wheat (gluten-containing grains)",
    category: "Food",
    reactions: ["Hives", "Bloating", "Vomiting", "Diarrhea", "Rash"],
    isCommon: true,
  },
  {
    id: "sesame",
    name: "Sesame",
    detail: "Sesame seeds and sesame oil",
    category: "Food",
    reactions: ["Hives", "Swelling", "Vomiting", "Difficulty breathing", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "strawberries",
    name: "Strawberries",
    detail: "Strawberries",
    category: "Food",
    reactions: ["Hives", "Itching", "Rash", "Swelling of lips"],
  },
  {
    id: "corn",
    name: "Corn",
    detail: "Corn and corn-derived products",
    category: "Food",
    reactions: ["Hives", "Bloating", "Vomiting", "Diarrhea"],
  },
  {
    id: "kiwi",
    name: "Kiwi",
    detail: "Kiwi fruit",
    category: "Food",
    reactions: ["Itching of mouth", "Hives", "Swelling", "Vomiting"],
  },
  {
    id: "banana",
    name: "Banana",
    detail: "Banana",
    category: "Food",
    reactions: ["Itching of mouth", "Hives", "Swelling", "GI upset"],
  },
  {
    id: "avocado",
    name: "Avocado",
    detail: "Avocado",
    category: "Food",
    reactions: ["Itching of mouth", "Hives", "Swelling", "GI upset"],
  },
  {
    id: "chocolate",
    name: "Chocolate",
    detail: "Chocolate/cocoa",
    category: "Food",
    reactions: ["Hives", "Rash", "GI upset", "Headache"],
  },
  {
    id: "food-dyes",
    name: "Food Dyes",
    detail: "Artificial food coloring/dyes",
    category: "Food",
    reactions: ["Hives", "Rash", "Hyperactivity", "GI upset"],
  },
  {
    id: "gluten",
    name: "Gluten",
    detail: "Gluten (wheat, barley, rye proteins)",
    category: "Food",
    reactions: ["Bloating", "Diarrhea", "Abdominal pain", "Fatigue", "Rash"],
  },
  {
    id: "peas-legumes",
    name: "Peas / Legumes",
    detail: "Peas and other legumes",
    category: "Food",
    reactions: ["Hives", "Swelling", "GI upset", "Difficulty breathing"],
  },
  {
    id: "mustard",
    name: "Mustard",
    detail: "Mustard seed/condiment",
    category: "Food",
    reactions: ["Hives", "Swelling", "GI upset", "Difficulty breathing"],
  },
  {
    id: "sulfites",
    name: "Sulfites",
    detail: "Sulfite food preservatives",
    category: "Food",
    reactions: ["Hives", "Wheezing", "Flushing", "GI upset", "Difficulty breathing"],
  },

  // --- Environmental allergies --------------------------------------------
  {
    id: "pollen-tree",
    name: "Tree Pollen",
    detail: "Tree pollen (oak, birch, maple)",
    category: "Environmental",
    reactions: ["Sneezing", "Runny nose", "Itchy eyes", "Nasal congestion", "Wheezing"],
    isCommon: true,
  },
  {
    id: "pollen-grass",
    name: "Grass Pollen",
    detail: "Grass pollen",
    category: "Environmental",
    reactions: ["Sneezing", "Runny nose", "Itchy eyes", "Nasal congestion", "Wheezing"],
    isCommon: true,
  },
  {
    id: "pollen-ragweed",
    name: "Ragweed Pollen",
    detail: "Ragweed pollen",
    category: "Environmental",
    reactions: ["Sneezing", "Runny nose", "Itchy eyes", "Nasal congestion", "Wheezing"],
    isCommon: true,
  },
  {
    id: "dust-mites",
    name: "Dust Mites",
    detail: "House dust mites",
    category: "Environmental",
    reactions: ["Sneezing", "Runny nose", "Itchy eyes", "Wheezing", "Skin rash"],
    isCommon: true,
  },
  {
    id: "pet-dander-cat",
    name: "Cat Dander",
    detail: "Cat dander/saliva proteins",
    category: "Environmental",
    reactions: ["Sneezing", "Itchy eyes", "Nasal congestion", "Wheezing", "Skin rash"],
    isCommon: true,
  },
  {
    id: "pet-dander-dog",
    name: "Dog Dander",
    detail: "Dog dander/saliva proteins",
    category: "Environmental",
    reactions: ["Sneezing", "Itchy eyes", "Nasal congestion", "Wheezing", "Skin rash"],
    isCommon: true,
  },
  {
    id: "mold",
    name: "Mold",
    detail: "Mold/mildew spores",
    category: "Environmental",
    reactions: ["Sneezing", "Runny nose", "Wheezing", "Itchy eyes", "Cough"],
    isCommon: true,
  },
  {
    id: "bee-sting",
    name: "Bee Stings",
    detail: "Bee/wasp venom",
    category: "Environmental",
    reactions: ["Swelling", "Hives", "Pain at site", "Difficulty breathing", "Anaphylaxis"],
    isCommon: true,
  },
  {
    id: "fire-ant-sting",
    name: "Fire Ant Stings",
    detail: "Fire ant venom",
    category: "Environmental",
    reactions: ["Swelling", "Hives", "Pustules at site", "Difficulty breathing", "Anaphylaxis"],
  },
  {
    id: "cockroach",
    name: "Cockroach",
    detail: "Cockroach allergen proteins",
    category: "Environmental",
    reactions: ["Sneezing", "Nasal congestion", "Wheezing", "Skin rash"],
  },
  {
    id: "pollen-weed",
    name: "Weed Pollen",
    detail: "Weed pollen (non-ragweed)",
    category: "Environmental",
    reactions: ["Sneezing", "Runny nose", "Itchy eyes", "Nasal congestion"],
  },
  {
    id: "nickel",
    name: "Nickel",
    detail: "Nickel (jewelry, metal fasteners)",
    category: "Environmental",
    reactions: ["Rash", "Itching", "Redness", "Blistering"],
  },
  {
    id: "poison-ivy",
    name: "Poison Ivy",
    detail: "Poison ivy/urushiol",
    category: "Environmental",
    reactions: ["Rash", "Itching", "Blistering", "Swelling"],
  },
  {
    id: "cigarette-smoke",
    name: "Cigarette Smoke",
    detail: "Tobacco/cigarette smoke",
    category: "Environmental",
    reactions: ["Cough", "Wheezing", "Itchy eyes", "Nasal congestion"],
  },
  {
    id: "perfume-fragrance",
    name: "Perfume / Fragrance",
    detail: "Perfumes and scented products",
    category: "Environmental",
    reactions: ["Headache", "Sneezing", "Skin rash", "Nasal congestion"],
  },
  {
    id: "hair-dye",
    name: "Hair Dye",
    detail: "Hair dye (PPD-containing)",
    category: "Environmental",
    reactions: ["Rash", "Itching", "Swelling", "Blistering"],
  },
  {
    id: "wool",
    name: "Wool",
    detail: "Wool fibers",
    category: "Environmental",
    reactions: ["Itching", "Rash", "Redness"],
  },
  {
    id: "chlorine",
    name: "Chlorine",
    detail: "Chlorine (pool chemicals)",
    category: "Environmental",
    reactions: ["Rash", "Itchy eyes", "Cough", "Skin irritation"],
  },
  {
    id: "sunscreen",
    name: "Sunscreen",
    detail: "Chemical sunscreen ingredients",
    category: "Environmental",
    reactions: ["Rash", "Itching", "Redness", "Hives"],
  },
  {
    id: "wasp-sting",
    name: "Wasp Stings",
    detail: "Wasp/hornet venom",
    category: "Environmental",
    reactions: ["Swelling", "Hives", "Pain at site", "Difficulty breathing", "Anaphylaxis"],
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

export function searchAllergens(
  query: string,
  opts?: { recentIds?: string[]; limit?: number }
): CodedEntry[] {
  return rankAndSlice(MOCK_ALLERGENS, query, opts);
}

export function getAllergenById(id: string): CodedEntry | null {
  return MOCK_ALLERGENS.find((entry) => entry.id === id) ?? null;
}
