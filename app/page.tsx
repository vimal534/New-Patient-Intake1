"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  initialPatientData,
  HealthPhase,
  PatientData,
  SAVED_CARDS,
  SECTION_LABEL,
  SECTION_STEP,
  STORAGE_KEY,
  StepId,
  WIZARD_STEPS,
} from "@/app/lib/checkin-types";
import {
  Card,
  Heading,
  PrimaryButton,
  ScreenBody,
  ScreenFooter,
  SectionLabel,
  StepBar,
  TextLink,
} from "@/app/components/CheckinShell";
import { Chip } from "@/app/components/Chip";
import { SignaturePad } from "@/app/components/SignaturePad";
import { MedicationPicker, SimpleTagPicker } from "@/app/components/HealthPicker";
import { ProgressRing } from "@/app/components/ProgressRing";
import { StatusBar } from "@/app/components/StatusBar";
import {
  ALLERGY_SUGGESTIONS,
  CONDITION_SUGGESTIONS,
} from "@/app/lib/health-suggestions";

type SetPatientData = Dispatch<SetStateAction<PatientData>>;

const PREV_STEP: Partial<Record<StepId, StepId>> = {
  ready: "home",
  confirm: "ready",
  health: "confirm",
  insurance: "health",
  copay: "insurance",
  consents: "copay",
  deferred: "consents",
};

// ---- Adaptive Health module: a tiny rules engine, not a form ----
// Reason for visit never appears here — it's already known from scheduling
// and shown as context on the home screen. This module only asks what
// scheduling *can't* know: what's changed, and whether that changes what
// else needs asking.
const CRISIS_PATTERN = /self.?harm|suicide|kill myself|hurt myself/i;
const SYMPTOM_PATTERN = /pain|hurt|ache|aching|dizzy|dizziness|chest|fever|cough|nausea|nauseous|vomit/i;
const LOW_MOOD_PATTERN = /sad|down|hopeless|anxious|anxiety|stressed|depress|worthless/i;

const SYMPTOM_LOCATIONS = ["Head", "Chest", "Abdomen", "Back", "Joints", "Other"];

const MENTAL_ITEMS = [
  "Feeling anxious or worried",
  "Feeling down or hopeless",
  "Difficulty concentrating",
  "Changes in appetite",
];

export default function Home() {
  const [step, setStep] = useState<StepId>("home");
  const [data, setData] = useState<PatientData>(initialPatientData);
  const [maxStepIndex, setMaxStepIndex] = useState(-1);
  const [hydrated, setHydrated] = useState(false);

  // Resume progress saved locally — this is what "we save as you go" means.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.data) setData({ ...initialPatientData, ...saved.data });
        if (typeof saved.maxStepIndex === "number")
          setMaxStepIndex(saved.maxStepIndex);
      }
    } catch {
      // ignore corrupt/unavailable storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, maxStepIndex })
    );
  }, [data, maxStepIndex, hydrated]);

  function goTo(next: StepId) {
    const idx = WIZARD_STEPS.indexOf(next);
    if (idx > maxStepIndex) setMaxStepIndex(idx);
    setStep(next);
  }

  function goBack() {
    setStep(PREV_STEP[step] ?? "home");
  }

  function advanceFrom(current: StepId) {
    const idx = WIZARD_STEPS.indexOf(current);
    const next = WIZARD_STEPS[idx + 1];
    if (next) goTo(next);
    else setStep("deferred");
  }

  const percentComplete =
    maxStepIndex < 0
      ? 0
      : Math.round(((maxStepIndex + 1) / WIZARD_STEPS.length) * 100);

  return (
    <div className="flex flex-1 justify-center bg-background px-0 sm:px-6 sm:py-8">
      <div className="flex min-h-screen w-full max-w-[402px] flex-col overflow-hidden bg-white sm:min-h-[874px] sm:rounded-[40px] sm:shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
        <StatusBar />
        {step === "home" && (
          <HomeScreen
            data={data}
            percentComplete={percentComplete}
            onStart={() =>
              setStep(maxStepIndex >= 0 ? WIZARD_STEPS[maxStepIndex] : "ready")
            }
          />
        )}
        {step === "ready" && (
          <ReadyScreen onBack={goBack} onBegin={() => goTo("confirm")} />
        )}
        {step === "confirm" && (
          <ConfirmScreen
            data={data}
            setData={setData}
            onBack={goBack}
            onContinue={() => advanceFrom("confirm")}
          />
        )}
        {step === "health" && (
          <HealthScreen
            data={data}
            setData={setData}
            onBack={goBack}
            onContinue={() => advanceFrom("health")}
          />
        )}
        {step === "insurance" && (
          <InsuranceScreen
            data={data}
            setData={setData}
            onBack={goBack}
            onContinue={() => advanceFrom("insurance")}
          />
        )}
        {step === "copay" && (
          <CopayScreen
            data={data}
            setData={setData}
            onBack={goBack}
            onContinue={() => advanceFrom("copay")}
          />
        )}
        {step === "consents" && (
          <ConsentsScreen
            data={data}
            setData={setData}
            onBack={goBack}
            onSubmit={() => setStep("deferred")}
          />
        )}
        {step === "deferred" && (
          <DeferredScreen
            data={data}
            setData={setData}
            onDone={() => setStep("done")}
          />
        )}
        {step === "done" && (
          <DoneScreen
            data={data}
            onDone={() => {
              window.localStorage.removeItem(STORAGE_KEY);
              setData(initialPatientData);
              setMaxStepIndex(-1);
              setStep("home");
            }}
          />
        )}
      </div>
    </div>
  );
}

function WizardStepBar({ step, onBack }: { step: StepId; onBack: () => void }) {
  const section = SECTION_LABEL[step];
  const localStep = SECTION_STEP[step];
  const overallIdx = WIZARD_STEPS.indexOf(step);

  if (section && localStep) {
    return (
      <StepBar
        onBack={onBack}
        sectionLabel={section}
        stepLabel={`STEP ${localStep[0]} OF ${localStep[1]}`}
        progress={localStep[0] / localStep[1]}
      />
    );
  }

  return (
    <StepBar
      onBack={onBack}
      stepLabel={`STEP ${overallIdx + 1} OF ${WIZARD_STEPS.length}`}
      progress={(overallIdx + 1) / WIZARD_STEPS.length}
    />
  );
}

// ---------- Screens ----------

function HomeScreen({
  data,
  percentComplete,
  onStart,
}: {
  data: PatientData;
  percentComplete: number;
  onStart: () => void;
}) {
  const firstName = data.preferredName || data.legalFirstName || "there";
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-center gap-2 border-b border-line py-4">
        <span className="text-teal">✚</span>
        <span className="text-lg font-bold text-brand">
          Health<span className="text-teal">pro</span>
        </span>
        <span className="text-lg font-normal text-ink">Clinic</span>
      </div>

      <div className="px-5 pt-5">
        <SectionLabel>Welcome, see you tomorrow</SectionLabel>
        <h1 className="mt-1 text-4xl font-bold text-ink">{firstName}</h1>
      </div>

      <div className="px-5 pt-4">
        <Card>
          <SectionLabel>Tomorrow&rsquo;s visit</SectionLabel>
          <div className="mt-3 flex items-start gap-4">
            <ProgressRing value={percentComplete} size={56} strokeWidth={4} />
            <div>
              <p className="text-lg font-bold text-ink">Annual Physical</p>
              <p className="text-sm text-muted-2">Tomorrow · 8:00 AM</p>
              <p className="text-sm text-muted-2">Oakwood Primary Care</p>
            </div>
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <SectionLabel>Provider</SectionLabel>
            <p className="mt-1 text-base font-semibold text-ink">
              Dr. Sarah Chen
            </p>
            <span className="mt-2 inline-block rounded-full border border-brand px-3 py-1 text-xs font-semibold text-brand">
              First visit
            </span>
          </div>
        </Card>
      </div>

      <div className="px-5 pt-5">
        <PrimaryButton onClick={onStart}>Start check-in →</PrimaryButton>
        <p className="mt-2 text-center text-xs text-muted-2">
          About 5 min · we save as you go
        </p>
      </div>

      <div className="px-5 pt-4">
        <Card className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-orange">
            <span aria-hidden>🍽️</span>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-ink">
              Fast 12 hours before your visit
            </p>
            <p className="text-xs text-muted-2">
              No food or drinks after 8 PM tonight.
            </p>
          </div>
          <span className="whitespace-nowrap rounded-full border border-orange px-2.5 py-1 text-xs font-bold text-orange">
            Fasting
          </span>
        </Card>
      </div>
    </div>
  );
}

function ReadyScreen({
  onBack,
  onBegin,
}: {
  onBack: () => void;
  onBegin: () => void;
}) {
  const items = [
    { n: 1, title: "About you", desc: "Confirm what we know in one quick pass", time: "1 min" },
    { n: 2, title: "Your health", desc: "Confirm what's on file, tell us what's new", time: "2 min" },
    { n: 3, title: "Coverage", desc: "Insurance and copay payment", time: "1 min" },
    { n: 4, title: "Consents & signature", desc: "One signature covers everything", time: "1 min" },
  ];
  return (
    <div className="flex flex-1 flex-col">
      <StepBar onBack={onBack} stepLabel="" progress={0} />
      <Heading
        title="Let's get you ready"
        subtitle="Your reason for visit, provider, and appointment details are already on file — we won't ask again."
      />
      <ScreenBody>
        <Card className="divide-y divide-line p-0">
          {items.map((item) => (
            <div key={item.n} className="flex items-start gap-3 p-4">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-brand text-xs font-semibold text-brand">
                {item.n}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
              <span className="whitespace-nowrap rounded-full border border-line-strong px-2.5 py-1 text-xs text-muted">
                {item.time}
              </span>
            </div>
          ))}
        </Card>
      </ScreenBody>
      <ScreenFooter>
        <PrimaryButton onClick={onBegin}>Begin</PrimaryButton>
        <TextLink onClick={onBack}>Save &amp; continue later</TextLink>
      </ScreenFooter>
    </div>
  );
}

// ---------- Identity, Contact & Emergency Contact (Module 1) ----------
// Sequential, section-at-a-time confirmation: one section open and editable,
// completed sections collapse into a compact confirmed row, sections not
// yet reached stay closed. Confirming the last section advances the wizard.

type ConfirmSection = "identity" | "contact" | "emergency";
const CONFIRM_SECTIONS: ConfirmSection[] = ["identity", "contact", "emergency"];
const CONFIRM_TITLES: Record<ConfirmSection, string> = {
  identity: "Identity",
  contact: "Contact",
  emergency: "Emergency contact",
};

function formatDob(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function ConfirmScreen({
  data,
  setData,
  onBack,
  onContinue,
}: {
  data: PatientData;
  setData: SetPatientData;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [active, setActive] = useState<ConfirmSection>("identity");
  const [completed, setCompleted] = useState<Set<ConfirmSection>>(new Set());

  function confirmSection(section: ConfirmSection) {
    setCompleted((prev) => new Set(prev).add(section));
    const idx = CONFIRM_SECTIONS.indexOf(section);
    const next = CONFIRM_SECTIONS[idx + 1];
    if (next) setActive(next);
    else onContinue();
  }

  function reopenSection(section: ConfirmSection) {
    setCompleted((prev) => {
      const copy = new Set(prev);
      copy.delete(section);
      return copy;
    });
    setActive(section);
  }

  return (
    <div className="flex flex-1 flex-col">
      <WizardStepBar step="confirm" onBack={onBack} />
      <Heading
        title="Let's confirm a few things"
        subtitle="We've pre-filled what we got from your booking. Confirm or correct each one."
      />
      <ScreenBody>
        <div className="space-y-3">
          {CONFIRM_SECTIONS.map((section) => {
            if (completed.has(section)) {
              return (
                <ConfirmedRow
                  key={section}
                  title={CONFIRM_TITLES[section]}
                  summary={confirmSummary(section, data)}
                  onEdit={() => reopenSection(section)}
                />
              );
            }
            if (section === active) {
              return (
                <ActiveConfirmCard
                  key={section}
                  section={section}
                  data={data}
                  setData={setData}
                  onConfirm={() => confirmSection(section)}
                />
              );
            }
            return <UpcomingRow key={section} title={CONFIRM_TITLES[section]} />;
          })}
        </div>
      </ScreenBody>
      <ScreenFooter>
        <TextLink onClick={onBack}>Save &amp; continue later</TextLink>
      </ScreenFooter>
    </div>
  );
}

function confirmSummary(section: ConfirmSection, data: PatientData): string {
  if (section === "identity") {
    return `${data.legalFirstName} ${data.legalLastName} · ${formatDob(data.dob)}`;
  }
  if (section === "contact") {
    return `${data.phone} · ${data.streetAddress}, ${data.city}`;
  }
  return `${data.emergencyName} · ${data.emergencyRelationship} · ${data.emergencyPhone}`;
}

function ConfirmedRow({
  title,
  summary,
  onEdit,
}: {
  title: string;
  summary: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm text-white">
        ✓
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
          {title}
        </p>
        <p className="truncate text-sm font-semibold text-ink">{summary}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${title}`}
        className="shrink-0 text-muted hover:text-brand"
      >
        ✎
      </button>
    </div>
  );
}

function UpcomingRow({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-line bg-background/70 px-4 py-3 opacity-60">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-2">
        {title}
      </p>
    </div>
  );
}

function BoxField({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-line-strong px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-brand"
      />
    </div>
  );
}

function BoxSelect({
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-line-strong bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-brand"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function ActiveConfirmCard({
  section,
  data,
  setData,
  onConfirm,
}: {
  section: ConfirmSection;
  data: PatientData;
  setData: SetPatientData;
  onConfirm: () => void;
}) {
  return (
    <Card className="border-brand">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
        {CONFIRM_TITLES[section]}
      </p>

      {section === "identity" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <BoxField
              label="Legal First Name"
              value={data.legalFirstName}
              onChange={(v) => setData((prev) => ({ ...prev, legalFirstName: v }))}
            />
            <BoxField
              label="Legal Last Name"
              value={data.legalLastName}
              onChange={(v) => setData((prev) => ({ ...prev, legalLastName: v }))}
            />
          </div>
          <BoxField
            label="Preferred Name"
            value={data.preferredName}
            onChange={(v) => setData((prev) => ({ ...prev, preferredName: v }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <BoxField
              label="Date of Birth"
              type="date"
              value={data.dob}
              onChange={(v) => setData((prev) => ({ ...prev, dob: v }))}
            />
            <BoxSelect
              label="Sex"
              value={data.sex}
              options={["Female", "Male", "Other", "Prefer not to say"]}
              onChange={(v) => setData((prev) => ({ ...prev, sex: v }))}
            />
          </div>
        </div>
      )}

      {section === "contact" && (
        <div className="space-y-3">
          <BoxField
            label="Phone"
            type="tel"
            value={data.phone}
            onChange={(v) => setData((prev) => ({ ...prev, phone: v }))}
          />
          <BoxField
            label="Street Address"
            value={data.streetAddress}
            onChange={(v) => setData((prev) => ({ ...prev, streetAddress: v }))}
          />
          <BoxField
            label="Apt, Suite (optional)"
            value={data.aptSuite}
            onChange={(v) => setData((prev) => ({ ...prev, aptSuite: v }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <BoxField
              label="City"
              value={data.city}
              onChange={(v) => setData((prev) => ({ ...prev, city: v }))}
            />
            <BoxField
              label="State"
              value={data.state}
              onChange={(v) => setData((prev) => ({ ...prev, state: v }))}
            />
          </div>
          <BoxField
            label="Zip"
            value={data.zip}
            onChange={(v) => setData((prev) => ({ ...prev, zip: v }))}
          />
        </div>
      )}

      {section === "emergency" && (
        <div className="space-y-3">
          <BoxField
            label="Full Name"
            value={data.emergencyName}
            onChange={(v) => setData((prev) => ({ ...prev, emergencyName: v }))}
          />
          <BoxField
            label="Relationship"
            value={data.emergencyRelationship}
            onChange={(v) => setData((prev) => ({ ...prev, emergencyRelationship: v }))}
          />
          <BoxField
            label="Phone"
            type="tel"
            value={data.emergencyPhone}
            onChange={(v) => setData((prev) => ({ ...prev, emergencyPhone: v }))}
          />
        </div>
      )}

      <div className="mt-4">
        <PrimaryButton onClick={onConfirm}>✓ Looks right</PrimaryButton>
      </div>
    </Card>
  );
}

// ---------- Adaptive Health module (Module 2) ----------
// One wizard step, several internal phases. Most patients only see
// "confirm" + "notes" — everything past that is a gate, not a default.

function healthProgress(phase: HealthPhase): { label: string; progress: number } {
  switch (phase) {
    case "confirm":
      return { label: "STEP 1 OF 4", progress: 1 / 4 };
    case "notes":
    case "symptom":
    case "crisis":
      return { label: "STEP 2 OF 4", progress: 2 / 4 };
    case "mood":
      return { label: "STEP 3 OF 4", progress: 3 / 4 };
    case "screener":
      return { label: "STEP 4 OF 4", progress: 4 / 4 };
  }
}

function HealthScreen({
  data,
  setData,
  onBack,
  onContinue,
}: {
  data: PatientData;
  setData: SetPatientData;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [phase, setPhase] = useState<HealthPhase>("confirm");
  const { label, progress } = healthProgress(phase);

  function classifyAndAdvance() {
    const notes = data.todayNotes;
    if (CRISIS_PATTERN.test(notes)) {
      setPhase("crisis");
    } else if (SYMPTOM_PATTERN.test(notes)) {
      setPhase("symptom");
    } else {
      // Annual Physical always gates on a mood check — see Rules Engine §7.
      setPhase("mood");
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepBar
        onBack={onBack}
        sectionLabel="Your Health"
        stepLabel={label}
        progress={progress}
      />

      {phase === "confirm" && (
        <>
          <Heading
            title="What's on file"
            subtitle="Add or remove only what's changed. Start typing to search."
          />
          <ScreenBody>
            <div className="space-y-5">
              <div>
                <SectionLabel>Conditions</SectionLabel>
                <div className="mt-1.5">
                  <SimpleTagPicker
                    label="a condition"
                    tags={data.conditions}
                    suggestions={CONDITION_SUGGESTIONS}
                    onChange={(v) => setData((prev) => ({ ...prev, conditions: v }))}
                  />
                </div>
              </div>
              <div>
                <SectionLabel>Medications</SectionLabel>
                <div className="mt-1.5">
                  <MedicationPicker
                    entries={data.medications}
                    onChange={(v) => setData((prev) => ({ ...prev, medications: v }))}
                  />
                </div>
              </div>
              <div>
                <SectionLabel>Allergies — we flag these</SectionLabel>
                <div className="mt-1.5">
                  <SimpleTagPicker
                    label="an allergy"
                    variant="caution"
                    tags={data.allergies}
                    suggestions={ALLERGY_SUGGESTIONS}
                    onChange={(v) => setData((prev) => ({ ...prev, allergies: v }))}
                  />
                </div>
              </div>
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={() => setPhase("notes")}>
              Still accurate →
            </PrimaryButton>
          </ScreenFooter>
        </>
      )}

      {phase === "notes" && (
        <>
          <Heading
            title="Anything new today?"
            subtitle="We already know why you're here. Just tell us if anything's changed — we'll figure out what else to ask."
          />
          <ScreenBody>
            <textarea
              autoFocus
              value={data.todayNotes}
              onChange={(e) =>
                setData((prev) => ({ ...prev, todayNotes: e.target.value }))
              }
              rows={4}
              placeholder="e.g. nothing new — or, I've had some chest discomfort this week"
              className="w-full rounded-2xl border border-line-strong px-4 py-3 text-sm text-ink outline-none focus:border-brand"
            />
            <p className="mt-2 text-xs text-muted-2">
              Your own words are enough — we&rsquo;ll parse this, not grade it.
            </p>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={classifyAndAdvance}>Continue</PrimaryButton>
          </ScreenFooter>
        </>
      )}

      {phase === "crisis" && (
        <>
          <Heading title="You're not alone." />
          <ScreenBody>
            <div className="rounded-xl border border-orange bg-orange/5 px-4 py-3 text-sm text-ink">
              <p className="font-semibold">
                If you&rsquo;re in immediate danger, call 911.
              </p>
              <p className="mt-1 text-muted">
                You can also reach the 988 Suicide &amp; Crisis Lifeline by
                calling or texting <strong>988</strong>, any time. A member of
                our care team will also follow up with you before your visit.
              </p>
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={() => setPhase("screener")}>
              Continue
            </PrimaryButton>
          </ScreenFooter>
        </>
      )}

      {phase === "symptom" && (
        <>
          <Heading
            title="Where exactly?"
            subtitle="That's the one thing we need to pin down before your visit."
          />
          <ScreenBody>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_LOCATIONS.map((loc) => (
                <Chip
                  key={loc}
                  label={loc}
                  variant="solid"
                  selected={data.symptomLocation === loc}
                  onClick={() =>
                    setData((prev) => ({ ...prev, symptomLocation: loc }))
                  }
                />
              ))}
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={() => setPhase("mood")}>Continue</PrimaryButton>
          </ScreenFooter>
        </>
      )}

      {phase === "mood" && (
        <>
          <Heading
            title="How have you been feeling lately?"
            subtitle="One question — this decides whether we need to ask anything further."
          />
          <ScreenBody>
            <div className="flex flex-col gap-2">
              {(
                [
                  ["good", "🙂 Good"],
                  ["okay", "😐 Okay"],
                  ["struggling", "🙁 Struggling"],
                ] as const
              ).map(([value, label]) => (
                <Chip
                  key={value}
                  label={label}
                  selected={data.moodCheck === value}
                  onClick={() =>
                    setData((prev) => ({ ...prev, moodCheck: value }))
                  }
                />
              ))}
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton
              disabled={!data.moodCheck}
              onClick={() =>
                data.moodCheck === "struggling"
                  ? setPhase("screener")
                  : onContinue()
              }
            >
              Continue
            </PrimaryButton>
          </ScreenFooter>
        </>
      )}

      {phase === "screener" && (
        <>
          <Heading
            title="A few more, since you mentioned that"
            subtitle="This stays between you and Dr. Chen."
          />
          <ScreenBody>
            <div className="flex flex-col items-start gap-2">
              {MENTAL_ITEMS.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={data.screener.includes(item)}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      screener: prev.screener.includes(item)
                        ? prev.screener.filter((s) => s !== item)
                        : [...prev.screener, item],
                    }))
                  }
                />
              ))}
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
          </ScreenFooter>
        </>
      )}
    </div>
  );
}

function InsuranceScreen({
  data,
  setData,
  onBack,
  onContinue,
}: {
  data: PatientData;
  setData: SetPatientData;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [manual, setManual] = useState(false);
  const [scanning, setScanning] = useState(false);

  function simulateScan() {
    setScanning(true);
    window.setTimeout(() => {
      setData((prev) => ({
        ...prev,
        insurance: {
          provider: "BlueCross BlueShield",
          memberId: "BXP440291847",
          planType: "PPO",
          groupNumber: "BCBS-77291",
        },
      }));
      setScanning(false);
    }, 900);
  }

  return (
    <div className="flex flex-1 flex-col">
      <WizardStepBar step="insurance" onBack={onBack} />
      <Heading
        title="Snap your insurance card"
        subtitle={
          data.insurance
            ? "Card captured successfully."
            : "Faster than typing. We'll read your provider, member ID, and plan automatically."
        }
      />
      <ScreenBody>
        {data.insurance ? (
          <Card className="border-brand">
            <p className="text-sm font-semibold text-brand">
              ✓ Card captured
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <InsuranceRow label="Provider" value={data.insurance.provider} />
              <InsuranceRow label="Member ID" value={data.insurance.memberId} />
              <InsuranceRow label="Plan type" value={data.insurance.planType} />
              <InsuranceRow label="Group number" value={data.insurance.groupNumber} />
            </dl>
            <button
              type="button"
              onClick={() => setData((prev) => ({ ...prev, insurance: null }))}
              className="mt-3 text-sm font-semibold text-brand"
            >
              Re-scan
            </button>
          </Card>
        ) : manual ? (
          <Card>
            <div className="space-y-3">
              <ManualField label="Provider name" />
              <ManualField label="Member ID" />
              <ManualField label="Plan type" />
              <ManualField label="Group number" />
              <PrimaryButton
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    insurance: {
                      provider: "",
                      memberId: "",
                      planType: "",
                      groupNumber: "",
                    },
                  }))
                }
              >
                Save details
              </PrimaryButton>
            </div>
          </Card>
        ) : (
          <>
            <button
              type="button"
              onClick={simulateScan}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand/60 bg-brand/5 py-10 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full border-2 border-brand text-xl">
                📷
              </span>
              <span className="text-sm font-semibold text-brand">
                {scanning ? "Scanning…" : "Scan the front of your card"}
              </span>
              <span className="text-xs text-muted-2">
                Hold steady — we&rsquo;ll capture it for you.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setManual(true)}
              className="mt-3 flex w-full items-center justify-between rounded-2xl border border-line px-4 py-4 text-sm font-semibold text-ink"
            >
              Enter details manually
              <span aria-hidden>›</span>
            </button>
          </>
        )}

        <Card className="mt-4">
          <p className="text-sm font-semibold text-ink">What we&rsquo;ll capture</p>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-sm text-muted">
            <li>✓ Provider name</li>
            <li>✓ Group number</li>
            <li>✓ Member ID</li>
            <li>✓ Plan type</li>
          </ul>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-2">
            🔒 Your information is encrypted and secure — eligibility is
            verified in the background while you continue.
          </p>
        </Card>
      </ScreenBody>
      <ScreenFooter>
        <PrimaryButton onClick={onContinue}>Continue</PrimaryButton>
        <TextLink onClick={onContinue}>
          Don&rsquo;t have your card? Skip for now
        </TextLink>
      </ScreenFooter>
    </div>
  );
}

function InsuranceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs uppercase tracking-[1.2px] text-muted-2">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

function ManualField({ label }: { label: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">
        {label}
      </label>
      <input className="w-full rounded-2xl border border-line-strong px-3 py-2 text-sm text-ink outline-none focus:border-brand" />
    </div>
  );
}

function CardBrandMark({ brand }: { brand: "visa" | "mastercard" }) {
  if (brand === "visa") {
    return (
      <span className="flex h-6 w-9 shrink-0 items-center justify-center rounded-[4px] bg-[#1A1F71] text-[10px] font-bold italic text-white">
        VISA
      </span>
    );
  }
  return (
    <span className="flex h-6 w-9 shrink-0 items-center" aria-hidden>
      <span className="size-4 rounded-full bg-[#EB001B]" />
      <span className="-ml-1.5 size-4 rounded-full bg-[#F79E1B] opacity-90" />
    </span>
  );
}

function lastFour(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  return digits.slice(-4) || "····";
}

function CopayScreen({
  data,
  setData,
  onBack,
  onContinue,
}: {
  data: PatientData;
  setData: SetPatientData;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<"idle" | "paying" | "paid">("idle");
  // showPicker: the card-list view, reached only via "Use a different card".
  // addFlow: what's showing inside that picker when adding a new card.
  const [showPicker, setShowPicker] = useState(false);
  const [addFlow, setAddFlow] = useState<"idle" | "choose" | "manual">("idle");

  const usingNew = data.paymentMethod === "new";
  const needsCvv = usingNew && data.newCard.cardNumber.trim() !== "" && data.newCard.cvv.trim() === "";
  const selectedSavedCard = SAVED_CARDS.find((c) => c.id === data.paymentMethod);

  function simulateScanCard() {
    setScanning(true);
    window.setTimeout(() => {
      setData((prev) => ({
        ...prev,
        paymentMethod: "new",
        newCard: {
          ...prev.newCard,
          nameOnCard: `${prev.legalFirstName} ${prev.legalLastName}`,
          cardNumber: "4000 0000 0000 0844",
          expiration: "03/28",
          cvv: "",
          // CVV is only on the back of the card — a scan of the front
          // can't read it, so it's the one thing still asked for.
        },
      }));
      setScanning(false);
      setShowPicker(false);
      setAddFlow("idle");
    }, 900);
  }

  function useManualCard() {
    setData((prev) => ({ ...prev, paymentMethod: "new" }));
    setShowPicker(false);
    setAddFlow("idle");
  }

  function pay() {
    setStatus("paying");
    window.setTimeout(() => {
      setStatus("paid");
      setData((prev) => ({ ...prev, payDecision: "paid" }));
      window.setTimeout(onContinue, 500);
    }, 700);
  }

  const canPay = usingNew
    ? data.newCard.cardNumber.trim().length > 0 && data.newCard.cvv.trim().length > 0
    : true;

  return (
    <div className="flex flex-1 flex-col">
      <WizardStepBar step="copay" onBack={onBack} />
      <Heading title="Your copay" subtitle="Confirm the amount and you're set." />
      <ScreenBody>
        <Card className="border-teal">
          <SectionLabel>Amount due</SectionLabel>
          <p className="mt-1 text-4xl font-bold text-ink">$40</p>
          <div className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <InsuranceRow label="To" value="Oakwood Primary Care" />
            <InsuranceRow label="For" value="Annual Physical · Today 8:00 AM" />
          </div>
        </Card>

        <div className="mt-4">
          <SectionLabel>Pay with</SectionLabel>

          {!showPicker && (
            <div className="mt-1.5 rounded-2xl border border-line bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <CardBrandMark brand={usingNew ? "visa" : selectedSavedCard?.brand ?? "visa"} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {usingNew ? "New card" : selectedSavedCard ? `${selectedSavedCard.brand === "visa" ? "Visa" : "Mastercard"}` : "Card"}
                    {" •••• "}
                    {usingNew ? lastFour(data.newCard.cardNumber) : selectedSavedCard?.last4}
                  </p>
                  <p className="text-xs text-muted-2">
                    {needsCvv ? "Enter your CVV to finish" : usingNew ? "Ready to pay" : `Expires ${selectedSavedCard?.expiry}`}
                  </p>
                </div>
                {!needsCvv && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-brand text-white">
                    <span aria-hidden className="text-[10px]">✓</span>
                  </span>
                )}
              </div>
              {needsCvv && (
                <input
                  autoFocus
                  value={data.newCard.cvv}
                  onChange={(e) => setData((prev) => ({ ...prev, newCard: { ...prev.newCard, cvv: e.target.value } }))}
                  placeholder="CVV"
                  inputMode="numeric"
                  maxLength={4}
                  className="mt-3 w-24 rounded-2xl border border-line-strong px-3 py-2 text-sm font-medium text-ink outline-none focus:border-brand"
                />
              )}
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="mt-2 text-sm font-semibold text-brand"
              >
                Use a different card
              </button>
            </div>
          )}

          {showPicker && addFlow === "idle" && (
            <div className="mt-1.5 space-y-2">
              {SAVED_CARDS.map((card) => {
                const selected = !usingNew && data.paymentMethod === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={card.expired}
                    onClick={() => {
                      setData((prev) => ({ ...prev, paymentMethod: card.id }));
                      setShowPicker(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      card.expired
                        ? "border-line bg-background/60 opacity-60"
                        : selected
                          ? "border-brand bg-brand/5"
                          : "border-line bg-white"
                    }`}
                  >
                    <CardBrandMark brand={card.brand} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">
                        {card.brand === "visa" ? "Visa" : "Mastercard"} •••• {card.last4}
                      </p>
                      <p className="text-xs text-muted-2">Expires {card.expiry}</p>
                    </div>
                    {card.expired ? (
                      <span className="whitespace-nowrap rounded-full border border-orange px-2.5 py-1 text-xs font-bold text-orange">
                        Expired
                      </span>
                    ) : (
                      selected && (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-brand text-white">
                          <span aria-hidden className="text-[10px]">✓</span>
                        </span>
                      )
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setAddFlow("choose")}
                className="w-full rounded-full border border-dashed border-line-strong py-2.5 text-sm font-medium text-muted"
              >
                + Add new card
              </button>
            </div>
          )}

          {showPicker && addFlow === "choose" && (
            <div className="mt-1.5 rounded-2xl border-2 border-brand bg-white p-4">
              <button
                type="button"
                onClick={simulateScanCard}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/60 bg-brand/5 py-4 text-sm font-semibold text-brand"
              >
                <span aria-hidden>📷</span>
                {scanning ? "Scanning…" : "Scan card"}
              </button>
              <div className="mt-3 flex items-center justify-between text-sm">
                <button type="button" onClick={() => setAddFlow("manual")} className="font-semibold text-muted">
                  Enter manually instead
                </button>
                <button type="button" onClick={() => setAddFlow("idle")} className="text-muted-2">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showPicker && addFlow === "manual" && (
            <div className="mt-1.5 rounded-2xl border-2 border-brand bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
                  Enter card details
                </p>
                <button type="button" onClick={() => setAddFlow("choose")} aria-label="Back" className="text-muted-2">
                  ×
                </button>
              </div>
              <div className="space-y-3">
                <BoxField
                  label="Name on Card"
                  value={data.newCard.nameOnCard}
                  onChange={(v) => setData((prev) => ({ ...prev, newCard: { ...prev.newCard, nameOnCard: v } }))}
                />
                <BoxField
                  label="Card Number"
                  value={data.newCard.cardNumber}
                  onChange={(v) => setData((prev) => ({ ...prev, newCard: { ...prev.newCard, cardNumber: v } }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <BoxField
                    label="Expiration Date"
                    value={data.newCard.expiration}
                    onChange={(v) => setData((prev) => ({ ...prev, newCard: { ...prev.newCard, expiration: v } }))}
                  />
                  <BoxField
                    label="CVV"
                    value={data.newCard.cvv}
                    onChange={(v) => setData((prev) => ({ ...prev, newCard: { ...prev.newCard, cvv: v } }))}
                  />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-2">
                  Billing address — using your address on file
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <BoxField
                    label="City"
                    value={data.city}
                    onChange={(v) => setData((prev) => ({ ...prev, city: v }))}
                  />
                  <BoxField label="ZIP" value={data.zip} onChange={(v) => setData((prev) => ({ ...prev, zip: v }))} />
                </div>
              </div>
              <PrimaryButton onClick={useManualCard}>Use this card</PrimaryButton>
            </div>
          )}
        </div>

        <div className="mt-4">
          <SectionLabel>Receipt</SectionLabel>
          <div className="mt-1.5">
            <BoxField
              label="Email"
              type="email"
              value={data.receiptEmail}
              onChange={(v) => setData((prev) => ({ ...prev, receiptEmail: v }))}
            />
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1 text-xs text-muted-2">
          🔒 Encrypted and processed by Stripe. We never see your card number.
        </p>
      </ScreenBody>
      <ScreenFooter>
        <PrimaryButton onClick={pay} disabled={!canPay || status !== "idle"}>
          {status === "paid" ? "✓ Payment successful" : status === "paying" ? "Processing…" : "Pay $40"}
        </PrimaryButton>
        <TextLink
          onClick={() => {
            setData((prev) => ({ ...prev, payDecision: "later" }));
            onContinue();
          }}
        >
          I&rsquo;ll pay at the visit
        </TextLink>
      </ScreenFooter>
    </div>
  );
}

function ConsentsScreen({
  data,
  setData,
  onBack,
  onSubmit,
}: {
  data: PatientData;
  setData: SetPatientData;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const docs: { key: keyof PatientData["consents"]; title: string; desc: string }[] = [
    {
      key: "privacy",
      title: "Notice of Privacy Practices",
      desc: "HIPAA-required acknowledgment of how we handle your health information.",
    },
    {
      key: "treatment",
      title: "Consent to Treatment",
      desc: "Authorization for Dr. Chen to provide evaluation and treatment.",
    },
    {
      key: "financial",
      title: "Financial Responsibility",
      desc: "Agreement to pay for services not covered by your insurance.",
    },
  ];

  const allChecked = docs.every((d) => data.consents[d.key]);
  const canSubmit = allChecked && Boolean(data.signature);

  function toggleConsent(key: keyof PatientData["consents"]) {
    setData((prev) => ({
      ...prev,
      consents: { ...prev.consents, [key]: !prev.consents[key] },
    }));
  }

  return (
    <div className="flex flex-1 flex-col">
      <WizardStepBar step="consents" onBack={onBack} />
      <Heading
        title="Consents & signature"
        subtitle="One signature below covers all three — nothing's changed since your last visit."
      />
      <ScreenBody>
        <div className="space-y-3">
          {docs.map((doc) => (
            <Card key={doc.key} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{doc.title}</p>
                <p className="mt-1 text-xs text-muted-2">{doc.desc}</p>
              </div>
              <button
                type="button"
                role="checkbox"
                aria-checked={data.consents[doc.key]}
                onClick={() => toggleConsent(doc.key)}
                className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  data.consents[doc.key]
                    ? "border-brand bg-brand text-white"
                    : "border-line-strong"
                }`}
              >
                {data.consents[doc.key] && <span aria-hidden>✓</span>}
              </button>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <SectionLabel>Your signature</SectionLabel>
          <div className="mt-2">
            <SignaturePad
              value={data.signature}
              onChange={(v) => setData((prev) => ({ ...prev, signature: v }))}
            />
          </div>
          <p className="mt-2 text-xs text-muted-2">
            By signing, you confirm you&rsquo;ve read and agree to the documents
            above.
          </p>
        </div>
      </ScreenBody>
      <ScreenFooter>
        <PrimaryButton onClick={onSubmit} disabled={!canSubmit}>
          Submit &amp; complete check-in
        </PrimaryButton>
      </ScreenFooter>
    </div>
  );
}

// ---------- Deferred-to-portal queue (Module 5) ----------
// Level-3 items. Never on the critical path — answer now, or push to the
// patient portal. Either way, check-in is already done.

type DeferredKey = "familyHistory" | "socialHistory" | "advanceDirective";

function ageFromDob(iso: string): number | null {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date("2026-08-06T00:00:00"); // fixed "today" for this demo
  let age = now.getFullYear() - d.getFullYear();
  const notYetBirthday =
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
  if (notYetBirthday) age -= 1;
  return age;
}

function DeferredScreen({
  data,
  setData,
  onDone,
}: {
  data: PatientData;
  setData: SetPatientData;
  onDone: () => void;
}) {
  const age = ageFromDob(data.dob);

  // Adaptive, not just deferred: the rules engine still decides which of
  // these are worth asking at all. Advance directive conversations are
  // typically deferred to older or chronically-ill patients — for a
  // healthy 30-something annual physical, the rule skips it entirely.
  const allItems: { key: DeferredKey; title: string; benefit: string; placeholder: string }[] = [
    {
      key: "familyHistory",
      title: "Family medical history",
      benefit: "Family history can flag risks Dr. Chen should watch for.",
      placeholder: "e.g. father — heart disease at 60",
    },
    {
      key: "socialHistory",
      title: "Social history",
      benefit: "Helps Dr. Chen tailor advice to your day-to-day habits.",
      placeholder: "e.g. smoking, alcohol, exercise habits",
    },
    {
      key: "advanceDirective",
      title: "Advance directive",
      benefit: "Ensures your wishes are honored if you're ever unable to say them yourself.",
      placeholder: "e.g. name of your healthcare proxy",
    },
  ];
  const items = allItems.filter((i) => i.key !== "advanceDirective" || age === null || age >= 50);

  const [index, setIndex] = useState(-1); // -1 = intro
  const current = index >= 0 ? items[index] : null;

  function goNext() {
    if (index >= items.length - 1) {
      setData((prev) => ({
        ...prev,
        deferred: {
          ...prev.deferred,
          pushedToPortal: items.some((i) => !prev.deferred[i.key]),
        },
      }));
      onDone();
    } else {
      setIndex(index + 1);
    }
  }

  function skip() {
    if (current) {
      setData((prev) => ({
        ...prev,
        deferred: { ...prev.deferred, [current.key]: "" },
      }));
    }
    goNext();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-line px-5 py-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-[1.2px] text-muted-2">
          Check-in complete — this part is optional
        </span>
      </div>

      {index === -1 && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-2xl font-bold leading-snug text-ink">
            &ldquo;I have {items.length} quick question{items.length === 1 ? "" : "s"}{" "}
            that help your doctor prepare.&rdquo;
          </p>
          <p className="mt-3 text-sm text-muted">
            None of this is needed for tomorrow&rsquo;s visit.
          </p>
          <div className="mt-8 w-full">
            <PrimaryButton onClick={() => setIndex(0)}>Let&rsquo;s go</PrimaryButton>
            <TextLink onClick={onDone}>Skip all of this</TextLink>
          </div>
        </div>
      )}

      {current && (
        <>
          <div className="flex items-center justify-center gap-1.5 px-5 pt-4">
            {items.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-6 bg-brand"
                    : i < index
                      ? "w-1.5 bg-brand/40"
                      : "w-1.5 bg-line-strong"
                }`}
              />
            ))}
          </div>
          <Heading title={current.title} subtitle={current.benefit} />
          <ScreenBody>
            <textarea
              autoFocus
              value={data.deferred[current.key]}
              onChange={(e) =>
                setData((prev) => ({
                  ...prev,
                  deferred: { ...prev.deferred, [current.key]: e.target.value },
                }))
              }
              placeholder={current.placeholder}
              rows={3}
              className="w-full rounded-2xl border border-line-strong px-3.5 py-3 text-sm text-ink outline-none focus:border-brand"
            />
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={goNext}>
              {index === items.length - 1 ? "Done" : "Continue"}
            </PrimaryButton>
            <TextLink onClick={skip}>Skip this one</TextLink>
          </ScreenFooter>
        </>
      )}
    </div>
  );
}

const DEFERRED_LABELS: Record<DeferredKey, string> = {
  familyHistory: "family history",
  socialHistory: "social history",
  advanceDirective: "your advance directive",
};

function formatDeferredList(data: PatientData): string {
  const age = ageFromDob(data.dob);
  // Mirrors DeferredScreen's own gate — a question the rule never asked
  // isn't something we "follow up" on later.
  const applicable = (Object.keys(DEFERRED_LABELS) as DeferredKey[]).filter(
    (key) => key !== "advanceDirective" || age === null || age >= 50
  );
  const skipped = applicable
    .filter((key) => !data.deferred[key])
    .map((key) => DEFERRED_LABELS[key]);
  if (skipped.length === 0) return "";
  if (skipped.length === 1) return skipped[0];
  if (skipped.length === 2) return `${skipped[0]} and ${skipped[1]}`;
  return `${skipped.slice(0, -1).join(", ")}, and ${skipped[skipped.length - 1]}`;
}

function DoneScreen({
  data,
  onDone,
}: {
  data: PatientData;
  onDone: () => void;
}) {
  const firstName = data.preferredName || data.legalFirstName || "there";
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand/10 text-3xl text-brand">
        ✓
      </span>
      <h1 className="mt-4 text-2xl font-bold text-ink">
        You&rsquo;re all set, {firstName}!
      </h1>
      <p className="mt-2 text-sm text-muted">
        Your check-in is complete. We&rsquo;ll see you tomorrow at 8:00 AM for
        your Annual Physical with Dr. Sarah Chen at Oakwood Primary Care.
      </p>
      {data.payDecision === "paid" && (
        <p className="mt-2 text-sm text-muted-2">
          Your $40 copay has been recorded as paid.
        </p>
      )}
      {data.deferred.pushedToPortal && (
        <p className="mt-2 text-sm text-muted-2">
          We&rsquo;ll follow up on {formatDeferredList(data)} in your patient
          portal.
        </p>
      )}
      <div className="mt-8 w-full">
        <PrimaryButton onClick={onDone}>Return home</PrimaryButton>
      </div>
    </div>
  );
}
