"use client";

import { useRef, useState } from "react";
import { mockInsuranceOcrSource, mockInsuranceWriteSource } from "../../lib/data-source/mockAdapter";
import { InsuranceOcrResult, InsuranceRecordDraft } from "../../lib/data-source/types";
import { ChipField } from "../../components/fields/Chip";
import { Checkbox, PrimaryButton, SectionShell, TextField } from "@/app/tap-intake/components/ui";

const RELATIONSHIP_OPTIONS = ["Self", "Child", "Spouse", "Other"];
const CONFIDENCE_THRESHOLD = 0.7; // below this, treat the scan as unreadable and fall back to manual entry

type Step = "capture" | "review";

// A field the OCR can populate but the guardian can also mark as not
// provided — same "I don't have this value" escape hatch whether the scan
// succeeded, failed, or was skipped entirely.
type OcrField = { value: string; notProvided: boolean };

function emptyField(): OcrField {
  return { value: "", notProvided: false };
}

export type SubscriberSummary = { subscriberName: string; patientRelationToSubscriber: string };

export function InsuranceModule({
  patientId,
  onComplete,
}: {
  patientId: string;
  // Hands back this module's full saved answers — Guarantor derives a
  // SubscriberSummary from it for "Same as insurance subscriber", Review
  // reads the whole thing for its summary.
  onComplete: (data: InsuranceRecordDraft) => void;
}) {
  const [step, setStep] = useState<Step>("capture");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [skippedCapture, setSkippedCapture] = useState(false);
  const [ocrResult, setOcrResult] = useState<InsuranceOcrResult | null>(null);

  const [payerName, setPayerName] = useState<OcrField>(emptyField());
  const [memberId, setMemberId] = useState<OcrField>(emptyField());
  const [groupId, setGroupId] = useState<OcrField>(emptyField());
  const [subscriberName, setSubscriberName] = useState("");
  const [relationship, setRelationship] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);

  async function handleScan() {
    if (!frontFile || !backFile) return;
    setScanning(true);
    const result = await mockInsuranceOcrSource.extract(frontFile, backFile);
    setScanning(false);
    setOcrResult(result);
    if (result.confidence >= CONFIDENCE_THRESHOLD) {
      setPayerName({ value: result.payerName ?? "", notProvided: false });
      setMemberId({ value: result.memberId ?? "", notProvided: false });
      setGroupId({ value: result.groupId ?? "", notProvided: false });
    }
    setStep("review");
  }

  function handleSkipCapture() {
    setSkippedCapture(true);
    setOcrResult(null);
    setStep("review");
  }

  const fieldsComplete =
    (payerName.value.trim() !== "" || payerName.notProvided) &&
    (memberId.value.trim() !== "" || memberId.notProvided) &&
    (groupId.value.trim() !== "" || groupId.notProvided);
  const canContinue = fieldsComplete && subscriberName.trim() !== "" && relationship.length > 0;

  async function handleContinue() {
    setSaving(true);
    const data: InsuranceRecordDraft = {
      ocrConfidence: skippedCapture ? null : (ocrResult?.confidence ?? null),
      payerName: { value: payerName.notProvided ? "" : payerName.value, notProvided: payerName.notProvided },
      memberId: { value: memberId.notProvided ? "" : memberId.value, notProvided: memberId.notProvided },
      groupId: { value: groupId.notProvided ? "" : groupId.value, notProvided: groupId.notProvided },
      subscriberName,
      patientRelationToSubscriber: relationship[0] ?? "",
    };
    await mockInsuranceWriteSource.saveInsurance(patientId, data);
    setSaving(false);
    onComplete(data);
  }

  if (step === "capture") {
    return (
      <SectionShell status="active" title="Insurance">
        <div className="text-sm text-[var(--color-muted)]">
          Snap a photo of the front and back of the insurance card, and we&apos;ll fill in the details for you.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CaptureTile
            label="Front of card"
            file={frontFile}
            onPick={() => frontInputRef.current?.click()}
          />
          <CaptureTile label="Back of card" file={backFile} onPick={() => backInputRef.current?.click()} />
        </div>
        <input
          ref={frontInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={backInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
        />

        <PrimaryButton disabled={!frontFile || !backFile || scanning} onClick={handleScan}>
          {scanning ? "Scanning…" : "Scan card"}
        </PrimaryButton>

        <button
          type="button"
          onClick={handleSkipCapture}
          className="min-h-[44px] w-full cursor-pointer text-center text-sm font-medium text-[var(--color-brand)]"
        >
          I don&apos;t have my insurance card
        </button>
      </SectionShell>
    );
  }

  return (
    <SectionShell status="active" title="Insurance">
      {ocrResult && ocrResult.confidence >= CONFIDENCE_THRESHOLD ? (
        <div className="rounded-lg border border-[var(--color-teal)] bg-[var(--color-teal)]/10 p-3 text-xs text-[var(--color-teal)]">
          Scanned from your card — please confirm these are correct.
        </div>
      ) : null}
      {ocrResult && ocrResult.confidence < CONFIDENCE_THRESHOLD ? (
        <div className="rounded-lg border border-[var(--color-orange)] bg-[var(--color-orange)]/10 p-3 text-xs text-[var(--color-orange)]">
          We couldn&apos;t read your card clearly — please enter these details manually.
        </div>
      ) : null}
      {skippedCapture ? (
        <div className="rounded-lg bg-[var(--color-background)] p-3 text-xs text-[var(--color-muted)]">
          Enter what you have — mark anything you don&apos;t have on hand.
        </div>
      ) : null}

      <OcrFieldRow label="Insurance company" field={payerName} onChange={setPayerName} />
      <OcrFieldRow label="Member ID" field={memberId} onChange={setMemberId} />
      <OcrFieldRow label="Group ID" field={groupId} onChange={setGroupId} />

      <TextField label="Subscriber's full name" value={subscriberName} onChange={setSubscriberName} placeholder="Whoever the plan is under" />
      <ChipField
        label="Patient's relationship to subscriber"
        options={RELATIONSHIP_OPTIONS.map((r) => ({ value: r, label: r }))}
        value={relationship}
        onChange={setRelationship}
        multi={false}
      />

      <PrimaryButton disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </SectionShell>
  );
}

function CaptureTile({ label, file, onPick }: { label: string; file: File | null; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={[
        "flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border p-3 text-center text-xs font-medium active:scale-[0.98]",
        file ? "border-[var(--color-teal)] bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "border-dashed border-[var(--color-line-strong)] text-[var(--color-muted)]",
      ].join(" ")}
    >
      <span className="text-lg">{file ? "✓" : "📷"}</span>
      <span>{file ? file.name : label}</span>
    </button>
  );
}

function OcrFieldRow({
  label,
  field,
  onChange,
}: {
  label: string;
  field: OcrField;
  onChange: (next: OcrField) => void;
}) {
  return (
    <div className="space-y-1">
      <TextField
        label={label}
        value={field.value}
        onChange={(v) => onChange({ value: v, notProvided: false })}
        disabled={field.notProvided}
        placeholder={field.notProvided ? "Not provided" : undefined}
      />
      <Checkbox
        label="I don't have this value"
        checked={field.notProvided}
        onChange={(checked) => onChange({ value: checked ? "" : field.value, notProvided: checked })}
      />
    </div>
  );
}
