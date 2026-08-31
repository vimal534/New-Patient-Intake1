"use client";

import { ReactNode, useState } from "react";
import { useVisit } from "../state";
import { CARRIER_DIRECTORY, PAYER_CHIPS, matchCarrierChip } from "../questionBank";
import { mockScanCard } from "../mockData";
import {
  Checkbox,
  ConfirmCard,
  InfoNote,
  OptionTile,
  PrimaryButton,
  QuestionBlock,
  SecondaryButton,
  StepHeader,
  TextField,
  TextLink,
} from "./ui";

export function CoverageSection({ onDone }: { onDone: () => void }) {
  const { state } = useVisit();
  return state.patientType === "returning" ? (
    <ReturningCoverage onDone={onDone} />
  ) : (
    <NewCoverage onDone={onDone} />
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
      <TextField label="Group ID" value={value} onChange={onChange} placeholder="e.g. GRP-7734" disabled={noGroupId} />
      <div className="mt-1">
        <Checkbox label="I don't have this value" checked={noGroupId} onChange={onToggleNoGroupId} />
      </div>
    </div>
  );
}

// Searchable carrier picker — a "Search for your carrier" box (live
// filter against the full CARRIER_DIRECTORY), a "Most common" 2x2 chip
// grid shown while the box is empty, and an always-visible "Carrier name
// (if known)" text field that mirrors whatever's currently selected and
// stays editable free text. Replaces the old plain 4-chip grid: picking
// any result (search hit, common chip, or typed text) still resolves
// through matchCarrierChip() into { payer, payerOtherText } exactly the
// way scanning a card already does — nothing downstream (isOther checks,
// summaries, the reducer) had to change for this.
function CarrierPicker({
  payer,
  payerOtherText,
  onChange,
}: {
  payer: string | null;
  payerOtherText: string;
  onChange: (next: { payer: string; payerOtherText: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const displayName = payer === "Other / not sure" ? payerOtherText : (payer ?? "");
  const mostCommon = PAYER_CHIPS.slice(0, -1);
  const results = query.trim()
    ? CARRIER_DIRECTORY.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  function pick(name: string) {
    const matched = matchCarrierChip(name);
    onChange({ payer: matched ?? "Other / not sure", payerOtherText: matched ? "" : name });
    setQuery("");
  }

  function typeName(v: string) {
    const matched = matchCarrierChip(v);
    onChange({ payer: matched ?? "Other / not sure", payerOtherText: matched ? "" : v });
  }

  return (
    <div>
      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for your carrier"
          className="min-h-[44px] w-full rounded-full border border-line-strong bg-white pl-9 pr-4 text-sm outline-none focus:border-brand"
        />
        {results.length > 0 ? (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-white shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
            {results.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => pick(c)}
                className="block w-full border-b border-line px-3 py-2 text-left text-sm font-medium text-ink last:border-b-0 hover:bg-background"
              >
                {c}
              </button>
            ))}
          </div>
        ) : query.trim() ? (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-line bg-white p-3 text-xs text-muted shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
            Not listed — type it in &quot;Carrier name&quot; below.
          </div>
        ) : null}
      </div>

      {!query.trim() ? (
        <>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-2">Most common</div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            {mostCommon.map((c) => (
              <OptionTile key={c} label={c} selected={displayName === c} onClick={() => pick(c)} />
            ))}
          </div>
        </>
      ) : null}

      <TextField
        label="Carrier name (if known)"
        value={displayName}
        onChange={typeName}
        placeholder="Type what's printed on the card"
      />
    </div>
  );
}

// Front-then-back auto-capture, matching the reference: a dashed
// card-shaped drop zone with a camera icon, "Hold steady — auto-captures"
// framing (no manual shutter tap — the mock just resolves after a beat,
// standing in for a real auto-capture model). No real camera/OCR call —
// same convention as mockScanCard() itself. Shared by New Coverage's
// capture-first flow and Returning Coverage's "Something changed -> Scan
// new card" path, since both are now the identical 2-step capture.
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

function CardCaptureSteps({
  onBack,
  onComplete,
  extraFrontAction,
}: {
  // Called only when leaving the front step entirely (not for the
  // internal front->back step-back, which this component handles itself).
  onBack: () => void;
  onComplete: () => void;
  // New Coverage's "I'll do this later" skip-to-manual link only makes
  // sense when scanning is the sole path offered up front; Returning
  // Coverage already forked scan-vs-manual a screen earlier, so it passes
  // nothing here.
  extraFrontAction?: ReactNode;
}) {
  const { dispatch } = useVisit();
  const [side, setSide] = useState<"front" | "back">("front");
  const [capturing, setCapturing] = useState(false);

  function runScan(after: () => void) {
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
      after();
    }, 900);
  }

  const progress = side === "front" ? 50 : 85;

  return (
    <div>
      <StepHeader
        eyebrow="Coverage"
        stepLabel={`Step ${side === "front" ? 1 : 2} of 2`}
        progressPercent={progress}
        onBack={() => (side === "back" ? setSide("front") : onBack())}
      />

      {side === "front" ? (
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
        <SideStepper side={side} />
      </div>

      <div className="mt-3">
        <CaptureZone
          label={side === "front" ? "Scan front of card" : "Scan back of card"}
          capturing={capturing}
          onCapture={() => runScan(() => (side === "front" ? setSide("back") : onComplete()))}
        />
      </div>

      {side === "back" ? (
        <div className="mt-3">
          <SecondaryButton onClick={onComplete}>Skip the back — I don&apos;t need it</SecondaryButton>
        </div>
      ) : null}

      {side === "front" && extraFrontAction ? <div className="mt-3 text-center">{extraFrontAction}</div> : null}
    </div>
  );
}

function NewCoverage({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const c = state.coverage;
  // "capture" is the shared front->back CardCaptureSteps; "I'll do this
  // later" on its front step skips straight to details with nothing
  // filled — manual entry stays fully available, just no longer the thing
  // offered first (capture-first, not scan-as-an-afterthought link, per
  // the reference).
  const [step, setStep] = useState<"capture" | "details">("capture");
  const canContinue = !!c.payer && c.policyNumber.trim().length > 0;

  if (step === "capture") {
    return (
      <CardCaptureSteps
        onBack={onDone}
        onComplete={() => setStep("details")}
        extraFrontAction={<TextLink onClick={() => setStep("details")}>I&apos;ll do this later</TextLink>}
      />
    );
  }

  return (
    <>
      <QuestionBlock eyebrow="Insurance carrier" prompt="Who is the coverage through?">
        <CarrierPicker
          payer={c.payer}
          payerOtherText={c.payerOtherText}
          onChange={({ payer, payerOtherText }) => {
            dispatch({ type: "SET_COVERAGE_PAYER", value: payer });
            dispatch({ type: "SET_COVERAGE_FIELD", field: "payerOtherText", value: payerOtherText });
          }}
        />
      </QuestionBlock>

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
        <TextLink onClick={() => setStep("capture")}>📷 Scan card instead</TextLink>
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
  // gate: on-file confirm card. choose: scan-vs-manual fork (only reached
  // via "Something changed"). capture: the shared front->back scan.
  // fields: carrier/policy/group editor, reached either from capture
  // completing or "Edit fields manually" — same form either way.
  const [step, setStep] = useState<"gate" | "choose" | "capture" | "fields">("gate");

  if (step === "gate") {
    const last4 = c.policyNumber.slice(-4);
    return (
      <ConfirmCard
        title="Insurance on file"
        summary={`${c.payer} · Policy •••• ${last4} · Group ${c.noGroupId ? "not on file" : "on file"}`}
        onNoChange={() => {
          dispatch({ type: "CONFIRM_COVERAGE_NO_CHANGE" });
          onDone();
        }}
        onChanged={() => setStep("choose")}
      />
    );
  }

  if (step === "choose") {
    return (
      <div>
        <div className="text-sm font-semibold text-ink">How would you like to update it?</div>
        <div className="mt-1 text-sm text-muted">Scanning is faster and usually more accurate.</div>
        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setStep("capture")}
            className="flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-2xl border-[1.5px] border-teal bg-teal/10 px-4 py-3.5 text-left text-sm font-semibold text-teal active:scale-[0.98]"
          >
            <span className="text-lg" aria-hidden="true">
              📷
            </span>
            Scan new card
            <span className="ml-auto rounded-full bg-teal px-2.5 py-1 text-[10px] font-bold text-white">Recommended</span>
          </button>
          <button
            type="button"
            onClick={() => setStep("fields")}
            className="min-h-[44px] w-full cursor-pointer rounded-2xl border border-line-strong bg-white px-4 py-3.5 text-left text-sm font-medium text-ink active:scale-[0.98]"
          >
            Edit fields manually
          </button>
        </div>
      </div>
    );
  }

  if (step === "capture") {
    return <CardCaptureSteps onBack={() => setStep("choose")} onComplete={() => setStep("fields")} />;
  }

  return (
    <>
      {c.scannedFromCard ? <InfoNote>📷 Scanned from card — edit anything that&apos;s off.</InfoNote> : null}

      <QuestionBlock eyebrow="Insurance carrier" prompt="Update the carrier if it's changed">
        <CarrierPicker
          payer={c.payer}
          payerOtherText={c.payerOtherText}
          onChange={({ payer, payerOtherText }) => {
            dispatch({ type: "SET_COVERAGE_PAYER", value: payer });
            dispatch({ type: "SET_COVERAGE_FIELD", field: "payerOtherText", value: payerOtherText });
          }}
        />
      </QuestionBlock>

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
