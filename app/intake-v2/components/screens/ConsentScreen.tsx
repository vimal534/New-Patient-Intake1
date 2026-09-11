"use client";

import { Ctx } from "../../ctx";
import { ChevronRightIcon, CheckIcon, DocumentIcon, ShieldLockIcon, CardIcon, ShieldPlainIcon, ShieldCheckIcon } from "../Icons";
import { Divider, ScreenCopy, ScreenTitle } from "../ui";

const CORE_DOCS = [
  {
    key: "consent" as const,
    icon: <DocumentIcon color="#1677E8" />,
    iconBg: "var(--iv2-brand-tint)",
    title: "Consent to treat",
    subtitle: "Allows us to provide care",
  },
  {
    key: "privacy" as const,
    icon: <ShieldLockIcon size={19} color="#067647" />,
    iconBg: "var(--iv2-success-surface)",
    title: "Notice of privacy practices",
    subtitle: "How we protect your information",
  },
  {
    key: "financial" as const,
    icon: <CardIcon size={19} color="#7C3AED" />,
    iconBg: "#F3E8FF",
    title: "Financial policy",
    subtitle: "Billing, payment and your responsibility",
  },
];

// Scenario 1 (New Patient, Infant) sees all 5 — spec's consolidated
// "Policies & Agreements" component. The generic adult flows keep the
// original 3.
const PEDS_NEW_DOCS = [
  {
    key: "welcome" as const,
    icon: <ShieldPlainIcon size={19} color="#0E9F8A" />,
    iconBg: "#E6F7F4",
    title: "Welcome letter",
    subtitle: "What to expect as a new patient",
  },
  {
    key: "immunization" as const,
    icon: <ShieldCheckIcon size={19} color="#B54708" />,
    iconBg: "var(--iv2-warning-surface)",
    title: "Immunization policy",
    subtitle: "Our vaccine schedule and requirements",
  },
];

type DocKey = (typeof CORE_DOCS)[number]["key"] | (typeof PEDS_NEW_DOCS)[number]["key"];

// Screen 13 — Consent & signature. Restyled to a reference: separate
// document rows (each with its own "Read" sheet) instead of one summary
// card + "Read full consent", and the agree checkbox as its own tinted
// card, personalized with the patient's name, instead of a bare
// checkbox row.
export function ConsentScreen({ ctx }: { ctx: Ctx }) {
  const { state, update, isRet } = ctx;
  const isPedsNew = ["new-infant", "new-adolescent"].includes(state.demoScenarioId);
  let docs = isPedsNew ? [...CORE_DOCS, ...PEDS_NEW_DOCS] : CORE_DOCS;
  // A plain Sick Visit workflow never included Financial Policies —
  // only Office Visit and New Patient visits do (spec Part 5, item 7 —
  // "a real, intentional difference, not a bug").
  if (state.demoScenarioId === "returning-sick") docs = docs.filter((d) => d.key !== "financial");
  const signerName = state.scenario === "new" && state.guardian1.name.trim() ? state.guardian1.name : state.scheduling.patientName;

  // Returning patients see these as already signed/on file (spec Parts
  // 4-5, item 7) — "Update" (footerFor's consent branch) flips into the
  // exact same Read/agree/sign flow a new patient gets.
  const onFile = isRet && !state.policiesEditing;

  const openDoc = (key: DocKey) => {
    if (key === "consent") update({ consentFullOpen: true });
    else if (key === "privacy") update({ privacyOpen: true });
    else if (key === "financial") update({ financialOpen: true });
    else if (key === "welcome") update({ consentFullOpen: true });
    else update({ privacyOpen: true });
  };

  return (
    <div className="px-6 py-6">
      <ScreenTitle>{onFile ? "Policies on file" : "Review & sign"}</ScreenTitle>
      <ScreenCopy className="mb-6">
        {onFile ? "Signed and on file from a previous visit." : "Please read the following documents and agree to continue."}
      </ScreenCopy>

      <div className="overflow-hidden rounded-[20px] border border-[var(--iv2-border)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {docs.map((doc, i) => (
          <div key={doc.key}>
            {i > 0 ? <Divider /> : null}
            <button
              type="button"
              onClick={() => openDoc(doc.key)}
              className="flex w-full cursor-pointer items-center gap-3.5 p-4 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: doc.iconBg }}>
                {doc.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold text-[var(--iv2-text-primary)]">{doc.title}</div>
                <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">{doc.subtitle}</div>
              </div>
              {onFile ? (
                <div className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[var(--iv2-success)]">
                  <CheckIcon size={14} strokeWidth={2.8} />
                  Signed {state.lastConfirmed}
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-[15px] font-semibold text-[var(--iv2-brand)]">Read</span>
                  <ChevronRightIcon color="var(--iv2-brand)" />
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      {!onFile ? (
        <>
          <button
            type="button"
            onClick={() => update({ agreed: !state.agreed })}
            className="mt-4 flex w-full cursor-pointer items-start gap-3 rounded-2xl border-none bg-[var(--iv2-brand-tint)] p-4 text-left"
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-sm font-extrabold text-white"
              style={{
                borderColor: state.agreed ? "var(--iv2-brand)" : "var(--iv2-border-strong)",
                backgroundColor: state.agreed ? "var(--iv2-brand)" : "#fff",
              }}
            >
              {state.agreed ? "✓" : ""}
            </span>
            <div>
              <div className="text-[15px] leading-[1.45] font-semibold text-[var(--iv2-text-primary)]">
                I have read and agree to the policies above on behalf of {signerName}.
              </div>
              <div className="mt-1 text-sm leading-[1.45] text-[var(--iv2-text-secondary)]">
                By checking this box, I confirm that I understand and accept these documents electronically.
              </div>
            </div>
          </button>

          <div className="mt-6 mb-2 text-[13px] text-[var(--iv2-text-muted)]">Signature</div>
          <button
            type="button"
            onClick={() => update({ signed: !state.signed })}
            className="flex h-[110px] w-full cursor-pointer items-center justify-center rounded-2xl border-[1.5px] bg-white"
            style={{ borderColor: state.signed ? "var(--iv2-brand)" : "var(--iv2-border)" }}
          >
            {state.signed ? (
              <span className="text-[38px] text-[var(--iv2-text-primary)]" style={{ fontFamily: "var(--font-caveat), cursive" }}>
                {signerName}
              </span>
            ) : (
              <span className="text-[15px] font-semibold text-[var(--iv2-text-muted)]">Tap to sign</span>
            )}
          </button>
        </>
      ) : null}
    </div>
  );
}
