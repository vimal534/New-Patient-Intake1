"use client";

import { Ctx } from "../../ctx";
import { ChevronRightIcon, DocumentIcon, ShieldLockIcon, CardIcon } from "../Icons";
import { Divider, ScreenCopy, ScreenTitle } from "../ui";

const DOCS = [
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

// Screen 13 — Consent & signature. Restyled to a reference: three
// separate document rows (each with its own "Read" sheet) instead of
// one summary card + "Read full consent", and the agree checkbox as its
// own tinted card, personalized with the patient's name, instead of a
// bare checkbox row.
export function ConsentScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  const openDoc = (key: (typeof DOCS)[number]["key"]) => {
    if (key === "consent") update({ consentFullOpen: true });
    else if (key === "privacy") update({ privacyOpen: true });
    else update({ financialOpen: true });
  };

  return (
    <div className="px-6 py-6">
      <ScreenTitle>Review &amp; sign</ScreenTitle>
      <ScreenCopy className="mb-6">Please read the following documents and agree to continue.</ScreenCopy>

      <div className="overflow-hidden rounded-[20px] border border-[var(--iv2-border)] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {DOCS.map((doc, i) => (
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
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-[15px] font-semibold text-[var(--iv2-brand)]">Read</span>
                <ChevronRightIcon color="var(--iv2-brand)" />
              </div>
            </button>
          </div>
        ))}
      </div>

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
            I have read and agree to the policies above on behalf of Jane Doe.
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
            Jane Doe
          </span>
        ) : (
          <span className="text-[15px] font-semibold text-[var(--iv2-text-muted)]">Tap to sign</span>
        )}
      </button>
    </div>
  );
}
