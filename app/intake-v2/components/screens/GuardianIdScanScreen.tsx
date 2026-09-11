"use client";

import { Ctx } from "../../ctx";
import { ScanCardIcon, ShieldLockIcon, UserIcon } from "../Icons";
import { Card, Eyebrow, InfoNote, ScreenCopy, ScreenTitle, TextAction } from "../ui";

// Demo-only "OCR" result — a driver's license read, standing in for a
// real ID-scanning vendor the same way CoverageScreen's card scan
// stands in for a real payer-eligibility check. Written onto guardian1
// (never guardian2 — that guardian never goes through this screen).
const SCANNED_ID = { dob: "10/14/1970", idNumber: "TX-D447091523", issuingState: "TX", expiration: "10/14/2028" };

// Patient Information wizard — Step 2 of 6, "Identity verification."
// Scan behavior matches CoverageScreen's own card-scan panel exactly:
// one screen throughout, the dashed box swapping its own label to
// "Capturing…" in place (no separate full-screen camera-viewfinder
// mock) with a "Reading your ID…" banner underneath, then the same
// 1.6s simulated-read beat before auto-advancing into Step 3.
export function GuardianIdScanScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const firstName = state.guardian1.name.split(" ")[0] || "your guardian";

  const startScan = () => {
    update({ guardianIdScanning: true, guardianIdManual: false });
    window.setTimeout(() => {
      update((s) => ({
        guardianIdScanning: false,
        guardian1: { ...s.guardian1, dob: SCANNED_ID.dob },
        guardianIdNumber: SCANNED_ID.idNumber,
        guardianIdIssuingState: SCANNED_ID.issuingState,
        guardianIdExpiration: SCANNED_ID.expiration,
      }));
      ctx.go("guardianIdReview");
    }, 1600);
  };
  const enterManually = () => {
    update({ guardianIdManual: true });
    ctx.go("guardianIdReview");
  };

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>{state.reviewingFromPatientReview ? "Review identity verification" : "Identity verification · Step 2 of 6"}</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Verify {firstName}&apos;s identity</ScreenTitle>
      <ScreenCopy className="mb-6">Scan the parent or guardian&apos;s photo ID. We&apos;ll use it to securely pre-fill your information and save time.</ScreenCopy>

      <Card>
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
            <UserIcon size={20} color="var(--iv2-brand)" />
          </span>
          <div>
            <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Parent / guardian</div>
            <div className="mt-0.5 text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.guardian1.name}</div>
            <div className="text-[13px] text-[var(--iv2-text-secondary)]">
              {state.guardian1.relationship} of {state.scheduling.patientName.split(" ")[0]}
            </div>
          </div>
        </div>
      </Card>

      <button
        type="button"
        onClick={startScan}
        disabled={state.guardianIdScanning}
        className="mt-4 flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed p-11 px-6"
        style={{ borderColor: "var(--iv2-scan-border)", backgroundColor: "var(--iv2-scan-bg)" }}
      >
        <span className="mb-3 flex h-17 w-17 items-center justify-center rounded-full bg-white" style={{ height: 68, width: 68 }}>
          <ScanCardIcon size={24} />
        </span>
        <span className="text-lg font-semibold text-[var(--iv2-brand)]">{state.guardianIdScanning ? "Capturing…" : `Scan ${firstName}'s ID`}</span>
        <span className="text-[15px]" style={{ color: "var(--iv2-scan-sub)" }}>
          Driver&apos;s license, state ID, or passport
        </span>
      </button>

      {!state.guardianIdScanning ? (
        <div className="mt-3 text-center">
          <TextAction onClick={enterManually}>Enter details manually</TextAction>
        </div>
      ) : null}

      <div className="mt-5">
        <InfoNote tone="quiet">
          <ShieldLockIcon size={20} color="#667085" />
          <div className="text-[15px] leading-[1.5] text-[var(--iv2-text-primary)]">
            <span className="font-semibold">Your information is secure.</span> We use bank-level encryption and never store your ID image.
          </div>
        </InfoNote>
      </div>

      {state.guardianIdScanning ? (
        <div className="mt-4 rounded-2xl bg-[var(--iv2-brand-tint)] px-4 py-3.5 text-[15px] font-semibold text-[var(--iv2-brand-hover)]">
          Reading the ID…
        </div>
      ) : null}
    </div>
  );
}
