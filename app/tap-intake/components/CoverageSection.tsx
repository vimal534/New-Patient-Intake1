"use client";

import { useState } from "react";
import { useVisit } from "../state";
import { PAYER_CHIPS } from "../questionBank";
import { mockScanCard } from "../mockData";
import { Checkbox, InfoNote, OptionTile, PrimaryButton, QuestionBlock, SecondaryButton, TextField, TextLink } from "./ui";

export function CoverageSection({ onDone }: { onDone: () => void }) {
  const { state } = useVisit();
  return state.patientType === "returning" ? (
    <ReturningCoverage onDone={onDone} />
  ) : (
    <NewCoverage onDone={onDone} />
  );
}

function CarrierGrid({ value, onPick }: { value: string | null; onPick: (p: string) => void }) {
  // First four laid out 2x2, with the catch-all "Other / not sure" (last
  // entry) spanning the full width below — matches the reference layout.
  const mainOptions = PAYER_CHIPS.slice(0, -1);
  const otherOption = PAYER_CHIPS[PAYER_CHIPS.length - 1];
  return (
    <div className="grid grid-cols-2 gap-2">
      {mainOptions.map((p) => (
        <OptionTile key={p} label={p} selected={value === p} onClick={() => onPick(p)} />
      ))}
      <div className="col-span-2">
        <OptionTile label={otherOption} selected={value === otherOption} onClick={() => onPick(otherOption)} />
      </div>
    </div>
  );
}

// Group ID is frequently absent from cards — the checkbox exists so an
// empty field reads as "confirmed absent," not "skipped." Shared by both
// flows' field editors so the fallback behaves identically everywhere.
function GroupIdField({
  value,
  noGroupId,
  onChange,
  onToggleNoGroupId,
}: {
  value: string;
  noGroupId: boolean;
  onChange: (v: string) => void;
  onToggleNoGroupId: (v: boolean) => void;
}) {
  return (
    <div>
      <TextField
        label="Group ID"
        value={value}
        onChange={onChange}
        placeholder="e.g. GRP-7734"
        disabled={noGroupId}
      />
      <div className="mt-1">
        <Checkbox label="I don't have this value" checked={noGroupId} onChange={onToggleNoGroupId} />
      </div>
    </div>
  );
}

// Front-then-back auto-capture zone, matching the reference: a dashed
// card-shaped drop zone with a camera icon, "Hold steady — auto-captures"
// framing (no manual shutter tap — the mock just resolves after a beat,
// standing in for a real auto-capture model). No real camera/OCR call —
// same convention as mockScanCard() itself.
function CaptureZone({ label, onCapture, capturing }: { label: string; onCapture: () => void; capturing: boolean }) {
  return (
    <button
      type="button"
      onClick={onCapture}
      disabled={capturing}
      className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-teal bg-teal/5 px-6 py-10 text-center disabled:cursor-wait"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">📷</span>
      <span className="text-base font-bold text-teal">{capturing ? "Hold steady…" : label}</span>
      <span className="text-sm text-muted">Hold steady — auto-captures</span>
    </button>
  );
}

function SideStepper({ side }: { side: "front" | "back" }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span className={["h-2 w-2 rounded-full", side === "front" ? "bg-teal" : "bg-line-strong"].join(" ")} />
      Front
      <span className="text-line-strong">—</span>
      <span className={["h-2 w-2 rounded-full", side === "back" ? "bg-teal" : "bg-line-strong"].join(" ")} />
      Back · optional
    </div>
  );
}

function NewCoverage({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const c = state.coverage;
  // "capture" walks front -> back -> "details" (the pre-existing
  // carrier/policy/group-ID fields, pre-filled if a scan supplied them).
  // "I'll do this later" on the front step skips straight to details with
  // nothing filled — manual entry stays fully available, just no longer
  // the thing offered first (capture-first, not scan-as-an-afterthought
  // link, per the reference).
  const [step, setStep] = useState<"front" | "back" | "details">("front");
  const [capturing, setCapturing] = useState(false);
  const isOther = c.payer === "Other / not sure";
  const canContinue = !!c.payer && c.policyNumber.trim().length > 0;

  function runScan(onDoneCapture: () => void) {
    setCapturing(true);
    // Simulated capture + vision-call latency — no real camera/OCR here.
    setTimeout(() => {
      const result = mockScanCard();
      dispatch({
        type: "APPLY_SCANNED_COVERAGE",
        companyName: result.companyName,
        policyNumber: result.policyNumber,
        groupId: result.groupId,
      });
      setCapturing(false);
      onDoneCapture();
    }, 900);
  }

  if (step === "front" || step === "back") {
    const progress = step === "front" ? 50 : 85;
    return (
      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (step === "back" ? setStep("front") : onDone())}
            aria-label="Back"
            className="cursor-pointer text-lg text-teal"
          >
            ←
          </button>
          <div className="text-[11px] font-bold uppercase tracking-wide text-teal">Coverage · Step 1 of 2</div>
        </div>
        <div className="mt-2 h-[3px] w-full rounded-full bg-line">
          <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${progress}%` }} />
        </div>

        {step === "front" ? (
          <>
            <h2 className="mt-4 text-xl font-bold text-ink">Snap your insurance card.</h2>
            <p className="mt-2 text-sm text-muted">Faster than typing. We&apos;ll read your provider, member ID, and plan.</p>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-xl font-bold text-ink">Now flip it over.</h2>
            <p className="mt-2 text-sm text-muted">The claims address and customer service number are usually on the back.</p>
          </>
        )}

        <div className="mt-3">
          <SideStepper side={step} />
        </div>

        <div className="mt-3">
          <CaptureZone
            label={step === "front" ? "Scan front of card" : "Scan back of card"}
            capturing={capturing}
            onCapture={() => runScan(() => setStep(step === "front" ? "back" : "details"))}
          />
        </div>

        {step === "back" ? (
          <div className="mt-3">
            <SecondaryButton onClick={() => setStep("details")}>Skip the back — I don&apos;t need it</SecondaryButton>
          </div>
        ) : null}

        <div className="mt-3 text-center">
          <TextLink onClick={() => setStep("details")}>I&apos;ll do this later</TextLink>
        </div>
      </div>
    );
  }

  return (
    <>
      <QuestionBlock eyebrow="Insurance carrier" prompt="Who is the coverage through?">
        <CarrierGrid value={c.payer} onPick={(p) => dispatch({ type: "SET_COVERAGE_PAYER", value: p })} />
      </QuestionBlock>

      {isOther ? (
        <TextField
          label="Carrier name (if known)"
          value={c.payerOtherText}
          onChange={(v) => dispatch({ type: "SET_COVERAGE_FIELD", field: "payerOtherText", value: v })}
          placeholder="Type what's printed on the card"
        />
      ) : null}

      <TextField
        label="Policy number"
        value={c.policyNumber}
        onChange={(v) => dispatch({ type: "SET_COVERAGE_FIELD", field: "policyNumber", value: v })}
        placeholder="e.g. W123456789"
      />

      <GroupIdField
        value={c.groupId}
        noGroupId={c.noGroupId}
        onChange={(v) => dispatch({ type: "SET_COVERAGE_FIELD", field: "groupId", value: v })}
        onToggleNoGroupId={(v) => dispatch({ type: "SET_COVERAGE_NO_GROUP_ID", value: v })}
      />

      {c.scannedFromCard ? (
        <InfoNote>Scanned from card — edit if anything&apos;s off.</InfoNote>
      ) : (
        <TextLink onClick={() => setStep("front")}>📷 Scan card instead</TextLink>
      )}

      <InfoNote>
        Policyholder:{" "}
        <span className="font-semibold text-[var(--color-ink)]">
          {state.guardian.isPolicyholder ? state.guardian.name || "you" : "Someone else on file"}
        </span>{" "}
        — reused from Guardian Details, not re-asked.
      </InfoNote>

      <PrimaryButton
        disabled={!canContinue}
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "coverage" });
          onDone();
        }}
      >
        Continue
      </PrimaryButton>
    </>
  );
}

function ReturningCoverage({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const c = state.coverage;
  const [scanning, setScanning] = useState(false);
  // Which of the two equal paths the guardian picked after "Something
  // changed" — null means neither yet, so the field editor stays hidden
  // until a path is chosen (OCR is never the default).
  const [editMode, setEditMode] = useState<"scan" | "manual" | null>(null);

  function runScan() {
    setScanning(true);
    setTimeout(() => {
      const result = mockScanCard();
      dispatch({
        type: "APPLY_SCANNED_COVERAGE",
        companyName: result.companyName,
        policyNumber: result.policyNumber,
        groupId: result.groupId,
      });
      setScanning(false);
    }, 700);
  }

  if (!c.reviewed) {
    const last4 = c.policyNumber.slice(-4);
    return (
      <>
        <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted-2)]">On file</div>
        <div className="mb-1 text-lg font-bold text-[var(--color-ink)]">{c.payer}</div>
        <div className="mb-4 text-sm text-[var(--color-muted)]">
          Policy •••• {last4} · Group ID {c.noGroupId ? "not on file" : "on file"}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton
            onClick={() => {
              dispatch({ type: "CONFIRM_COVERAGE_NO_CHANGE" });
              onDone();
            }}
          >
            Nothing changed
          </SecondaryButton>
          <SecondaryButton onClick={() => dispatch({ type: "FLAG_COVERAGE_CHANGED" })}>Something changed</SecondaryButton>
        </div>
      </>
    );
  }

  // "Something changed" was tapped — offer scan and manual entry as two
  // equal options before showing any fields, rather than defaulting to OCR.
  if (!editMode) {
    return (
      <>
        <div className="text-sm text-[var(--color-muted)]">How would you like to update it?</div>
        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton onClick={() => setEditMode("scan")}>📷 Scan new card</SecondaryButton>
          <SecondaryButton onClick={() => setEditMode("manual")}>Edit fields manually</SecondaryButton>
        </div>
      </>
    );
  }

  const isOther = c.payer === "Other / not sure";

  return (
    <>
      {editMode === "scan" && !c.scannedFromCard ? (
        <SecondaryButton onClick={runScan}>{scanning ? "Scanning…" : "📷 Tap to scan the new card"}</SecondaryButton>
      ) : null}

      {c.scannedFromCard ? <InfoNote>Scanned from card — edit if anything&apos;s off.</InfoNote> : null}

      <QuestionBlock eyebrow="Insurance carrier" prompt="Update the carrier if it's changed">
        <CarrierGrid value={c.payer} onPick={(p) => dispatch({ type: "SET_COVERAGE_PAYER", value: p })} />
      </QuestionBlock>

      {isOther ? (
        <TextField
          label="Carrier name (if known)"
          value={c.payerOtherText}
          onChange={(v) => dispatch({ type: "SET_COVERAGE_FIELD", field: "payerOtherText", value: v })}
          placeholder="Type what's printed on the card"
        />
      ) : null}

      <TextField
        label="Policy number"
        value={c.policyNumber}
        onChange={(v) => dispatch({ type: "SET_COVERAGE_FIELD", field: "policyNumber", value: v })}
      />

      <GroupIdField
        value={c.groupId}
        noGroupId={c.noGroupId}
        onChange={(v) => dispatch({ type: "SET_COVERAGE_FIELD", field: "groupId", value: v })}
        onToggleNoGroupId={(v) => dispatch({ type: "SET_COVERAGE_NO_GROUP_ID", value: v })}
      />

      <PrimaryButton
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "coverage" });
          onDone();
        }}
      >
        Save changes
      </PrimaryButton>
    </>
  );
}
