"use client";

import { useState } from "react";
import { mockDemographicsWriteSource, mockPatientLookupSource } from "../../lib/data-source/mockAdapter";
import { DemographicsRecordDraft, PatientRecord } from "../../lib/data-source/types";
import { ChipField } from "../../components/fields/Chip";
import { ConfirmOrEditSection, initialSectionState, SectionState } from "../../components/shared/ConfirmOrEditSection";
import { PrimaryButton, SectionShell, TextField } from "@/app/tap-intake/components/ui";

const RACE_OPTIONS = ["White", "Black or African American", "Asian", "American Indian or Alaska Native", "Native Hawaiian or Pacific Islander", "Other", "Choose not to disclose"];
const ETHNICITY_OPTIONS = ["Hispanic or Latino", "Not Hispanic or Latino", "Choose not to disclose"];
const LANGUAGE_OPTIONS = ["English", "Spanish", "Vietnamese", "Mandarin", "Other"];

// Reuses tap-intake's SectionShell/TextField/PrimaryButton — same visual
// system as Medications and the rest of /tap-intake, not a new design.
// `onComplete` hands back the matched record (or null) so the next module
// (Guardian/Dependent) can reuse the same lookup result instead of
// re-querying — guardian info arrives bundled with the patient match.
export function DemographicsModule({
  patientId,
  onComplete,
}: {
  patientId: string;
  // Hands back both the matched record (for Guardian's prefill) and this
  // module's own saved answers (for the Review & Submit summary).
  onComplete: (matched: PatientRecord | null, data: DemographicsRecordDraft) => void;
}) {
  const [step, setStep] = useState<"search" | "form">("search");
  const [searchFirst, setSearchFirst] = useState("");
  const [searchLast, setSearchLast] = useState("");
  const [searchDob, setSearchDob] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchedNoMatch, setSearchedNoMatch] = useState(false);
  const [matchedRecord, setMatchedRecord] = useState<PatientRecord | null>(null);

  // Editable fields — seeded from the matched record once found, or left
  // blank for a genuinely new patient.
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addr1, setAddr1] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zip, setZip] = useState("");

  const [identityState, setIdentityState] = useState<SectionState>("not_applicable");
  const [contactState, setContactState] = useState<SectionState>("not_applicable");

  const [race, setRace] = useState<string[]>([]);
  const [ethnicity, setEthnicity] = useState<string[]>([]);
  const [language, setLanguage] = useState<string[]>([]);
  const [phoneConsent, setPhoneConsent] = useState<string | null>(null);
  const [textConsent, setTextConsent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function runSearch() {
    setSearching(true);
    const found = await mockPatientLookupSource.findMatch({ firstName: searchFirst, lastName: searchLast, dob: searchDob });
    setSearching(false);
    setSearchedNoMatch(!found);
    setMatchedRecord(found);

    if (found) {
      setFirstName(found.firstName);
      setLastName(found.lastName);
      setDob(found.dob);
      setPhone(found.phone);
      setEmail(found.email);
      setAddr1(found.address.line1);
      setCity(found.address.city);
      setStateVal(found.address.state);
      setZip(found.address.zip);
    } else {
      setFirstName(searchFirst);
      setLastName(searchLast);
      setDob(searchDob);
    }
    setIdentityState(initialSectionState(!!found));
    setContactState(initialSectionState(!!found));
    setStep("form");
  }

  const identityDone = identityState === "confirmed" || identityState === "not_applicable";
  const contactDone = contactState === "confirmed" || contactState === "not_applicable";
  const detailsComplete = race.length > 0 && ethnicity.length > 0 && language.length > 0 && !!phoneConsent && !!textConsent;
  const canContinue = identityDone && contactDone && detailsComplete;

  async function handleContinue() {
    setSaving(true);
    const data: DemographicsRecordDraft = {
      firstName,
      lastName,
      dob,
      phone,
      email,
      address: { line1: addr1, city, state: stateVal, zip },
      race,
      ethnicity,
      preferredLanguage: language[0] ?? "",
      consent: { phoneCall: phoneConsent === "Yes", text: textConsent === "Yes" },
    };
    await mockDemographicsWriteSource.saveDemographics(patientId, data);
    setSaving(false);
    onComplete(matchedRecord, data);
  }

  if (step === "search") {
    return (
      <SectionShell status="active" title="Demographics">
        <div className="text-sm text-[var(--color-muted)]">
          Let&apos;s check if we already have a record for your child, so we don&apos;t ask for the same information
          twice.
        </div>
        <TextField label="Child's first name" value={searchFirst} onChange={setSearchFirst} placeholder="e.g. Ana" />
        <TextField label="Child's last name" value={searchLast} onChange={setSearchLast} placeholder="e.g. Marquez" />
        <TextField label="Date of birth" type="date" value={searchDob} onChange={setSearchDob} />
        <PrimaryButton disabled={!searchFirst || !searchLast || searching} onClick={runSearch}>
          {searching ? "Looking…" : "Find my record"}
        </PrimaryButton>
      </SectionShell>
    );
  }

  return (
    <SectionShell status="active" title="Demographics">
      {searchedNoMatch ? (
        <div className="rounded-lg bg-[var(--color-background)] p-3 text-xs text-[var(--color-muted)]">
          No existing record found — we&apos;ll collect everything fresh this once.
        </div>
      ) : null}

      <ConfirmOrEditSection
        title="Identity"
        state={identityState}
        onLooksRight={() => setIdentityState("confirmed")}
        onEdit={() => setIdentityState("editing")}
        summary={`${firstName} ${lastName} · DOB ${dob}`}
      >
        <TextField label="First name" value={firstName} onChange={setFirstName} />
        <TextField label="Last name" value={lastName} onChange={setLastName} />
        <TextField label="Date of birth" type="date" value={dob} onChange={setDob} />
      </ConfirmOrEditSection>

      <ConfirmOrEditSection
        title="Contact & address"
        state={contactState}
        onLooksRight={() => setContactState("confirmed")}
        onEdit={() => setContactState("editing")}
        summary={`${phone} · ${email} · ${addr1}, ${city}, ${stateVal} ${zip}`}
      >
        <TextField label="Phone" value={phone} onChange={setPhone} />
        <TextField label="Email" value={email} onChange={setEmail} />
        <TextField label="Address" value={addr1} onChange={setAddr1} />
        <TextField label="City" value={city} onChange={setCity} />
        <TextField label="State" value={stateVal} onChange={setStateVal} />
        <TextField label="ZIP" value={zip} onChange={setZip} />
      </ConfirmOrEditSection>

      {identityDone && contactDone ? (
        <>
          <ChipField label="Race" options={RACE_OPTIONS.map((r) => ({ value: r, label: r }))} value={race} onChange={setRace} multi={false} />
          <ChipField
            label="Ethnicity"
            options={ETHNICITY_OPTIONS.map((r) => ({ value: r, label: r }))}
            value={ethnicity}
            onChange={setEthnicity}
            multi={false}
          />
          <ChipField
            label="Preferred language"
            options={LANGUAGE_OPTIONS.map((r) => ({ value: r, label: r }))}
            value={language}
            onChange={setLanguage}
            multi={false}
          />
          <ChipField
            label="OK to contact the guardian by phone call?"
            options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]}
            value={phoneConsent ? [phoneConsent] : []}
            onChange={(v) => setPhoneConsent(v[0] ?? null)}
            multi={false}
          />
          <ChipField
            label="OK to contact the guardian by text message?"
            options={[{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }]}
            value={textConsent ? [textConsent] : []}
            onChange={(v) => setTextConsent(v[0] ?? null)}
            multi={false}
          />
        </>
      ) : null}

      <PrimaryButton disabled={!canContinue || saving} onClick={handleContinue}>
        {saving ? "Saving…" : "Continue"}
      </PrimaryButton>
    </SectionShell>
  );
}
