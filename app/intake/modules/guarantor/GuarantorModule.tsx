"use client";

import { useEffect, useState } from "react";
import { mockDeviceProfileSource, mockGuarantorWriteSource } from "../../lib/data-source/mockAdapter";
import { DeviceProfile, GuarantorInfo, GuarantorRecordDraft } from "../../lib/data-source/types";
import { SubscriberSummary } from "../insurance/InsuranceModule";
import { ChipField } from "../../components/fields/Chip";
import { PrimaryButton, SectionShell, TextField } from "@/app/tap-intake/components/ui";

const RELATIONSHIP_OPTIONS = ["Self", "Parent", "Legal Guardian", "Grandparent", "Other"];

type Source = "guardian" | "subscriber" | "device" | "other";

function emptyGuarantor(): GuarantorInfo {
  return { name: "", relationship: "", phone: "", email: "" };
}

// Device-profile auto-populate (Pass 14) — "We think this is you" gate,
// shown once, before the existing shortcut picker, only when the device
// actually has a cached profile (see mockDeviceProfileSource's own
// comment on why that's frequently null in a real implementation).
// Deliberately its own small component rather than reusing
// ConfirmOrEditSection: that shared shell's copy ("On file" / "Edit") is
// about confirming DATA is accurate, not confirming an IDENTITY match —
// different enough framing ("is this you" vs. "is this still right") that
// forcing the same copy would misrepresent what's actually being asked,
// per the spec's explicit "We think this is you — [Name], is that right?"
// wording requirement.
function DeviceProfileConfirmCard({
  profile,
  onConfirm,
  onReject,
}: {
  profile: DeviceProfile;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-teal)]/40 bg-[var(--color-teal)]/5 p-4">
      <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-teal)]">
        From this device
      </div>
      <div className="mb-1 text-base font-semibold text-[var(--color-ink)]">
        We think this is you — {profile.name}, is that right?
      </div>
      <div className="mb-3 text-sm text-[var(--color-muted)]">
        {profile.phone} · {profile.email}
      </div>
      {/* The "last verified" surfacing this pass adds directly in response
          to the open compliance question ("can device profile data go
          stale?") — see DeviceProfileSource's comment in types.ts. Shown
          plainly, not buried, since staleness is exactly what someone on
          a borrowed/shared device (a grandparent, a caregiver) needs to
          notice before confirming. */}
      <div className="mb-3 text-xs text-[var(--color-muted-2)]">Info last verified {profile.lastVerifiedLabel}</div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-[44px] cursor-pointer rounded-full border border-[var(--color-teal)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-teal)] active:scale-[0.97]"
        >
          ✓ Yes, that&apos;s me
        </button>
        <button
          type="button"
          onClick={onReject}
          className="min-h-[44px] cursor-pointer rounded-full border border-[var(--color-line-strong)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] active:scale-[0.97]"
        >
          That&apos;s not me
        </button>
      </div>
    </div>
  );
}

// The billing-responsible party — asked as its own question even though
// it's very often the same person as the guardian or the insurance
// subscriber, per the spec's explicit "separate from insurance subscriber"
// requirement. The device-profile gate above (when a profile exists) and
// the "guardian"/"subscriber" shortcuts below all exist purely to avoid
// re-typing something already available this same pass; nothing here
// reads from an EMR, and none of it is ever committed without the
// guardian explicitly confirming — see each path's own confirm step.
export function GuarantorModule({
  patientId,
  guardianInfo,
  subscriberInfo,
  onComplete,
}: {
  patientId: string;
  guardianInfo: GuarantorInfo | null;
  subscriberInfo: SubscriberSummary | null;
  onComplete: (data: GuarantorRecordDraft) => void;
}) {
  const [source, setSource] = useState<Source | null>(null);
  const [guarantor, setGuarantor] = useState<GuarantorInfo>(emptyGuarantor());
  const [billingSameAsHousehold, setBillingSameAsHousehold] = useState<"Yes" | "No" | null>(null);
  const [addrLine1, setAddrLine1] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [saving, setSaving] = useState(false);

  // "loading" while the (mock, simulated-latency) device-profile read is
  // in flight; null once resolved if the device has no cached profile at
  // all (skip the gate, straight to the existing picker below); a real
  // DeviceProfile once resolved with data. `deviceGateAnswered` is
  // separate from `deviceProfile` itself so a resolved "no profile"
  // doesn't need its own extra state just to mean "gate not needed."
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null | "loading">("loading");
  const [deviceGateAnswered, setDeviceGateAnswered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    mockDeviceProfileSource.getProfile().then((profile) => {
      if (!cancelled) setDeviceProfile(profile);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function confirmDeviceProfile(profile: DeviceProfile) {
    setSource("device");
    setGuarantor({ name: profile.name, relationship: "Parent", phone: profile.phone, email: profile.email });
    setDeviceGateAnswered(true);
  }

  function rejectDeviceProfile() {
    setDeviceGateAnswered(true);
  }

  function pickSource(next: Exclude<Source, "device">) {
    setSource(next);
    if (next === "guardian" && guardianInfo) {
      setGuarantor(guardianInfo);
    } else if (next === "subscriber" && subscriberInfo) {
      setGuarantor({
        name: subscriberInfo.subscriberName,
        relationship: subscriberInfo.patientRelationToSubscriber,
        phone: "",
        email: "",
      });
    } else {
      setGuarantor(emptyGuarantor());
    }
  }

  const guarantorFieldsComplete =
    guarantor.name.trim() !== "" && guarantor.relationship !== "" && guarantor.phone.trim() !== "" && guarantor.email.trim() !== "";
  const addressComplete =
    billingSameAsHousehold === "Yes" ||
    (billingSameAsHousehold === "No" && addrLine1.trim() !== "" && addrCity.trim() !== "" && addrState.trim() !== "" && addrZip.trim() !== "");
  const canContinue = source !== null && guarantorFieldsComplete && billingSameAsHousehold !== null && addressComplete;

  async function handleContinue() {
    setSaving(true);
    const data: GuarantorRecordDraft = {
      source: source ?? "other",
      guarantor,
      billingSameAsHousehold: billingSameAsHousehold === "Yes",
      billingAddress:
        billingSameAsHousehold === "No" ? { line1: addrLine1, city: addrCity, state: addrState, zip: addrZip } : null,
    };
    await mockGuarantorWriteSource.saveGuarantor(patientId, data);
    setSaving(false);
    onComplete(data);
  }

  // The device gate takes over the "who's the guarantor" question entirely
  // while it's unresolved — either still loading, or resolved with a
  // profile the guardian hasn't answered yet. Once resolved either way
  // (no profile at all, or "that's not me"), the existing shortcut picker
  // takes over exactly as before Pass 14. A "yes, that's me" answer skips
  // the picker entirely — the guardian already just confirmed who this is,
  // asking again via the chip picker would be redundant.
  const showDeviceGate = deviceProfile !== "loading" && deviceProfile !== null && !deviceGateAnswered;
  const showSourcePicker = deviceProfile !== "loading" && !showDeviceGate && source !== "device";

  return (
    <SectionShell status="active" title="Guarantor">
      <div className="text-sm text-[var(--color-muted)]">Who&apos;s responsible for the bill?</div>

      {showDeviceGate ? (
        <DeviceProfileConfirmCard
          profile={deviceProfile}
          onConfirm={() => confirmDeviceProfile(deviceProfile)}
          onReject={rejectDeviceProfile}
        />
      ) : null}

      {showSourcePicker ? (
        <ChipField
          label="Billing-responsible party"
          options={[
            { value: "guardian", label: "Same as guardian" },
            { value: "subscriber", label: "Same as insurance subscriber" },
            { value: "other", label: "Someone else" },
          ]}
          value={source ? [source] : []}
          onChange={(v) => pickSource((v[0] as Exclude<Source, "device">) ?? "other")}
          multi={false}
        />
      ) : null}

      {source ? (
        <>
          <TextField label="Full name" value={guarantor.name} onChange={(v) => setGuarantor({ ...guarantor, name: v })} />
          <ChipField
            label="Relationship to patient"
            options={RELATIONSHIP_OPTIONS.map((r) => ({ value: r, label: r }))}
            value={guarantor.relationship ? [guarantor.relationship] : []}
            onChange={(v) => setGuarantor({ ...guarantor, relationship: v[0] ?? "" })}
            multi={false}
          />
          <TextField label="Phone" value={guarantor.phone} onChange={(v) => setGuarantor({ ...guarantor, phone: v })} inputMode="tel" />
          <TextField label="Email" value={guarantor.email} onChange={(v) => setGuarantor({ ...guarantor, email: v })} type="email" />

          <ChipField
            label="Send billing statements to the address we already have on file?"
            options={[
              { value: "Yes", label: "Yes" },
              { value: "No", label: "No, use a different address" },
            ]}
            value={billingSameAsHousehold ? [billingSameAsHousehold] : []}
            onChange={(v) => setBillingSameAsHousehold((v[0] as "Yes" | "No") ?? null)}
            multi={false}
          />
          {billingSameAsHousehold === "No" ? (
            <div className="space-y-3 rounded-lg border border-[var(--color-line)] p-3">
              <TextField label="Address" value={addrLine1} onChange={setAddrLine1} />
              <TextField label="City" value={addrCity} onChange={setAddrCity} />
              <TextField label="State" value={addrState} onChange={setAddrState} />
              <TextField label="ZIP" value={addrZip} onChange={setAddrZip} />
            </div>
          ) : null}
        </>
      ) : null}

      <PrimaryButton disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </SectionShell>
  );
}
