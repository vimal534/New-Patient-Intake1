"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  copayPayingNow,
  formatTimeLeft,
  initialPatientData,
  minutesRemaining,
  COPAY_LINE_ITEMS,
  COPAY_TOTAL,
  HealthPhase,
  PatientData,
  SAVED_CARDS,
  SECTION_LABEL,
  STORAGE_KEY,
  StepId,
  TOTAL_CHECKIN_MINUTES,
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
import { AllergyPicker, MedicationPicker, SimpleTagPicker } from "@/app/components/HealthPicker";
import { ProgressRing } from "@/app/components/ProgressRing";
import { StatusBar } from "@/app/components/StatusBar";
import { CONDITION_SUGGESTIONS } from "@/app/lib/health-suggestions";

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
// Checked before the generic symptom pattern — each of these has its own
// validated structured question set the rules engine selects; everything
// else falls back to the generic "where exactly" location picker.
const RESPIRATORY_PATTERN = /breathing|shortness of breath|wheez|congestion|can'?t breathe/i;
const DIZZINESS_PATTERN = /dizzy|dizziness|lightheaded|light-headed/i;
const SYMPTOM_PATTERN = /pain|hurt|ache|aching|chest|fever|cough|nausea|nauseous|vomit/i;
const LOW_MOOD_PATTERN = /sad|down|hopeless|anxious|anxiety|stressed|depress|worthless/i;

const ONSET_OPTIONS = ["Today", "In the past week", "1–4 weeks ago", "More than a month ago", "I'm not sure"];
const TRIGGER_OPTIONS = [
  "When standing up",
  "During exercise",
  "Before eating",
  "After taking medication",
  "It happens randomly",
  "Something else",
];
const BREATHING_CONTEXT_OPTIONS = [
  "At rest",
  "With activity",
  "When lying down",
  "It varies",
  "I'm not sure",
];

const SMOKING_CONFIRM_OPTIONS = ["Yes, still current", "No, I stopped", "This needs updating"];
const SMOKING_QUIT_OPTIONS = [
  "Within the past month",
  "1–12 months ago",
  "More than a year ago",
  "I'm not sure",
];

const SYMPTOM_LOCATIONS = ["Head", "Chest", "Abdomen", "Back", "Joints", "Other"];

// Free text often already answers "when did it start?" — "for three days,"
// "since this morning." Asking the onset question again would ignore what
// the patient just said, so this is checked first and the question is
// skipped whenever it succeeds. Rules-engine-adjacent: this only ever maps
// extracted text onto one of the same validated ONSET_OPTIONS a human would
// have picked from — it doesn't invent new answers.
function extractOnsetFromNotes(notes: string): string {
  if (/\btoday\b|this morning/i.test(notes)) return "Today";
  const days = notes.match(/(\d+)\s*days?\b/i);
  if (days) return Number(days[1]) <= 7 ? "In the past week" : "1–4 weeks ago";
  const weeks = notes.match(/(\d+)\s*weeks?\b/i);
  if (weeks) return Number(weeks[1]) <= 4 ? "1–4 weeks ago" : "More than a month ago";
  if (/month/i.test(notes)) return "More than a month ago";
  return "";
}

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
    let next = WIZARD_STEPS[idx + 1];
    // Coverage isn't the same thing as Payment — if eligibility comes back
    // showing nothing is actually owed, there's no payment step to show.
    if (next === "copay" && COPAY_TOTAL === 0) {
      next = WIZARD_STEPS[idx + 2];
    }
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
          <ReadyScreen data={data} onBack={goBack} onBegin={() => goTo("confirm")} />
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

// Patients care about time remaining, not "step 7 of 15" — the progress
// bar itself is proportional to actual minutes left, not step count.
//
// This used to also render a second, section-dot progress indicator below
// the bar. Two progress systems on one screen made patients ask "which one
// tells me where I am?" — and with adaptive branching, a fixed step count
// is the wrong second system anyway: the AI can add or skip questions, so
// a "step N of M" indicator would have to jump backward mid-flow. The time
// estimate plus a single continuous bar is the one honest signal: it moves
// forward monotonically no matter which branch a given patient takes.
function WizardStepBar({
  step,
  onBack,
  stepFraction = 1,
}: {
  step: StepId;
  onBack: () => void;
  stepFraction?: number; // 1 = just started this step, 0 = about to leave it
}) {
  const left = minutesRemaining(step, stepFraction);
  const progress = 1 - left / TOTAL_CHECKIN_MINUTES;

  return (
    <StepBar
      onBack={onBack}
      sectionLabel={SECTION_LABEL[step]}
      stepLabel={formatTimeLeft(left)}
      progress={progress}
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
            {percentComplete > 0 ? (
              <ProgressRing value={percentComplete} size={56} strokeWidth={4} />
            ) : (
              // Before starting, a bare "0%" reads as "lots of work ahead."
              // Progress only becomes meaningful once there's some to show.
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <CalendarIcon size={24} />
              </span>
            )}
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
  data,
  onBack,
  onBegin,
}: {
  data: PatientData;
  onBack: () => void;
  onBegin: () => void;
}) {
  const firstName = data.preferredName || data.legalFirstName || "there";
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
        title={`Hi ${firstName}, I'll help you finish check-in.`}
        subtitle="Most of your information is already on file. We'll only ask about anything that's changed."
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
  emergency: "Emergency Contact",
};

// A field name subset of PatientData — used to snapshot a section's data
// before editing, so "Cancel" can genuinely revert instead of just hiding
// whatever was already typed.
type ConfirmFieldKey =
  | "legalFirstName" | "legalLastName" | "preferredName" | "dob" | "sex"
  | "phone" | "streetAddress" | "aptSuite" | "city" | "state" | "zip"
  | "emergencyName" | "emergencyRelationship" | "emergencyPhone";

const CONFIRM_SECTION_FIELDS: Record<ConfirmSection, ConfirmFieldKey[]> = {
  identity: ["legalFirstName", "legalLastName", "preferredName", "dob", "sex"],
  contact: ["phone", "streetAddress", "aptSuite", "city", "state", "zip"],
  emergency: ["emergencyName", "emergencyRelationship", "emergencyPhone"],
};

function formatDob(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ---- small line icons, all currentColor so they inherit their wrapper's tint ----
function PersonIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
      <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CalendarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" aria-hidden>
      <rect x="3" y="4.5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
      <path
        d="M5.5 3h2l1 3.5-1.7 1.3a9 9 0 0 0 4.4 4.4l1.3-1.7 3.5 1v2c0 1-.8 1.8-1.8 1.7C8.9 14.8 5.2 11.1 4.8 5.8 4.7 4.8 4.5 3 5.5 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function LocationIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
      <path d="M10 17s6-5.3 6-9.5A6 6 0 0 0 4 7.5C4 11.7 10 17 10 17Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="10" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function MedicalCrossIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
      <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
      <path d="M7.5 4.5l6 5.5-6 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function genderGlyph(sex: string): string {
  if (sex === "Female") return "♀";
  if (sex === "Male") return "♂";
  return "⚧";
}

function SectionIcon({ section }: { section: ConfirmSection }) {
  const isEmergency = section === "emergency";
  const Icon = section === "contact" ? PhoneIcon : isEmergency ? MedicalCrossIcon : PersonIcon;
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
        isEmergency ? "bg-red-100 text-red-500" : "bg-brand/10 text-brand"
      }`}
    >
      <Icon />
    </span>
  );
}

function ConfirmedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
      <span aria-hidden>✓</span> Confirmed
    </span>
  );
}

// Exception-driven, not one-at-a-time-for-everything: Contact rarely
// changes and is low-risk, so it's confirmed automatically. Identity is
// always worth one deliberate tap. Emergency Contact is flagged here as
// needing review — in a real system that flag would come from staleness
// (not reconfirmed recently) or a data-quality check, not a fixed rule.
const NEEDS_REVIEW: Record<ConfirmSection, boolean> = {
  identity: true,
  contact: false,
  emergency: true,
};
const REVIEW_SECTIONS = CONFIRM_SECTIONS.filter((s) => NEEDS_REVIEW[s]);

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
  const [active, setActive] = useState<ConfirmSection>(REVIEW_SECTIONS[0]);
  const [completed, setCompleted] = useState<Set<ConfirmSection>>(
    () => new Set(CONFIRM_SECTIONS.filter((s) => !NEEDS_REVIEW[s]))
  );
  // Confirmation is the default state for the active section — editable
  // fields are opt-in, reached only via "Edit."
  const [editingActive, setEditingActive] = useState(false);
  // Snapshot of the active section's fields, taken the moment editing
  // starts — this is what makes "Cancel" a real revert, not just a hide.
  const [snapshot, setSnapshot] = useState<Partial<PatientData> | null>(null);
  const [snapshotWasCompleted, setSnapshotWasCompleted] = useState(false);

  function startEditing(section: ConfirmSection, wasCompleted: boolean) {
    const snap: Partial<PatientData> = {};
    for (const key of CONFIRM_SECTION_FIELDS[section]) {
      (snap as Record<string, unknown>)[key] = data[key];
    }
    setSnapshot(snap);
    setSnapshotWasCompleted(wasCompleted);
    setEditingActive(true);
  }

  function confirmSection(section: ConfirmSection) {
    setCompleted((prev) => new Set(prev).add(section));
    setEditingActive(false);
    const idx = REVIEW_SECTIONS.indexOf(section);
    const next = REVIEW_SECTIONS[idx + 1];
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
    startEditing(section, true);
  }

  function cancelEdit() {
    if (snapshot) setData((prev) => ({ ...prev, ...snapshot }));
    setEditingActive(false);
    if (snapshotWasCompleted) setCompleted((prev) => new Set(prev).add(active));
  }

  const stepFraction = 1 - REVIEW_SECTIONS.indexOf(active) / REVIEW_SECTIONS.length;

  return (
    <div className="flex flex-1 flex-col">
      <WizardStepBar step="confirm" onBack={onBack} stepFraction={stepFraction} />
      <Heading
        title="Let's confirm a few things"
        subtitle="Most of this is already on file. Just say if anything's changed."
      />
      <ScreenBody>
        <div className="space-y-3">
          {CONFIRM_SECTIONS.map((section) => {
            if (completed.has(section)) {
              return (
                <ConfirmedRow
                  key={section}
                  section={section}
                  summary={confirmSummary(section, data)}
                  onEdit={() => reopenSection(section)}
                />
              );
            }
            if (section === active) {
              return editingActive ? (
                <ActiveConfirmCard
                  key={section}
                  section={section}
                  data={data}
                  setData={setData}
                  onConfirm={() => confirmSection(section)}
                  onCancel={cancelEdit}
                />
              ) : (
                <PreviewConfirmCard
                  key={section}
                  section={section}
                  data={data}
                  onConfirm={() => confirmSection(section)}
                  onEdit={() => startEditing(section, false)}
                />
              );
            }
            return (
              <UpcomingRow
                key={section}
                section={section}
                title={CONFIRM_TITLES[section]}
                needsReview={NEEDS_REVIEW[section]}
              />
            );
          })}
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-2">
          <LockIcon /> Your information is safe and secure
        </p>
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

function previewLines(
  section: ConfirmSection,
  data: PatientData
): { icon: React.ReactNode; text: string }[] {
  if (section === "identity") {
    return [
      { icon: <PersonIcon />, text: `${data.legalFirstName} ${data.legalLastName}` },
      { icon: <CalendarIcon />, text: formatDob(data.dob) },
      { icon: <span className="text-sm">{genderGlyph(data.sex)}</span>, text: data.sex },
    ].filter((l) => l.text);
  }
  if (section === "contact") {
    const street = [data.streetAddress, data.aptSuite].filter(Boolean).join(", ");
    return [
      { icon: <PhoneIcon />, text: data.phone },
      { icon: <LocationIcon />, text: `${street}, ${data.city}, ${data.state} ${data.zip}` },
    ].filter((l) => l.text);
  }
  return [
    { icon: <PersonIcon />, text: `${data.emergencyName} · ${data.emergencyRelationship}` },
    { icon: <PhoneIcon />, text: data.emergencyPhone },
  ].filter((l) => l.text);
}

function PreviewConfirmCard({
  section,
  data,
  onConfirm,
  onEdit,
}: {
  section: ConfirmSection;
  data: PatientData;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  return (
    <Card className="ring-2 ring-inset ring-brand">
      {/* No "Confirmed" badge here — that's not true yet. This is the ask,
          not the result. */}
      <div className="mb-1 flex items-center gap-2.5">
        <SectionIcon section={section} />
        <span className="text-base font-bold text-ink">{CONFIRM_TITLES[section]}</span>
      </div>
      <div className="divide-y divide-line">
        {previewLines(section, data).map((line, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 text-sm font-medium text-ink">
            <span className="text-muted-2">{line.icon}</span>
            {line.text}
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted">Is this information correct?</p>
      <div className="mt-3">
        <PrimaryButton onClick={onConfirm}>Yes, continue →</PrimaryButton>
      </div>
      <button type="button" onClick={onEdit} className="mt-2 w-full text-center text-sm font-semibold text-brand">
        Edit information
      </button>
    </Card>
  );
}

function ConfirmedRow({
  section,
  summary,
  onEdit,
}: {
  section: ConfirmSection;
  summary: string;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left"
    >
      <SectionIcon section={section} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-ink">{CONFIRM_TITLES[section]}</p>
          <ConfirmedBadge />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">{summary}</p>
      </div>
    </button>
  );
}

function UpcomingRow({
  section,
  title,
  needsReview,
}: {
  section: ConfirmSection;
  title: string;
  needsReview?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
      <SectionIcon section={section} />
      <p className="flex-1 text-sm font-bold text-ink">{title}</p>
      {needsReview ? (
        <span className="whitespace-nowrap rounded-full border border-orange px-2.5 py-1 text-xs font-bold text-orange">
          Needs review
        </span>
      ) : (
        <span className="text-muted-2">
          <ChevronIcon />
        </span>
      )}
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
      <label className="mb-1.5 block text-sm text-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line-strong px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-brand"
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
      <label className="mb-1.5 block text-sm text-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line-strong bg-white px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-brand"
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
  onCancel,
}: {
  section: ConfirmSection;
  data: PatientData;
  setData: SetPatientData;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Card className="ring-2 ring-inset ring-brand">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <SectionIcon section={section} />
          <span className="text-base font-bold text-ink">{CONFIRM_TITLES[section]}</span>
        </div>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-brand">
          Cancel
        </button>
      </div>

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
        <PrimaryButton onClick={onConfirm}>Save changes</PrimaryButton>
      </div>
    </Card>
  );
}

// ---------- Adaptive Health module (Module 2) ----------
// One wizard step, several internal phases. Most patients only see
// "confirm" + "notes" — everything past that is a gate, not a default.

// Rough share of the Health module's own time budget still left, per
// phase — feeds the same "About N min left" system as every other step.
const HEALTH_PHASE_FRACTION: Record<HealthPhase, number> = {
  confirm: 1,
  notes: 0.65,
  symptom: 0.55,
  symptomOnset: 0.5,
  symptomTriggers: 0.42,
  breathingContext: 0.42,
  smokingCheck: 0.35,
  smokingSince: 0.32,
  crisis: 0.55,
  mood: 0.3,
  screener: 0.1,
};

function HeartPulseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden>
      <path
        d="M10 16.5s-6-3.6-6-8A3.5 3.5 0 0 1 10 6a3.5 3.5 0 0 1 6 2.5c0 4.4-6 8-6 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M6 10h2l1.2 2 1.6-3.5L12 10h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PillIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden>
      <g transform="rotate(45 10 10)">
        <rect x="4" y="7" width="12" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10" y1="7" x2="10" y2="13" stroke="currentColor" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
function WarningTriangleIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden>
      <path d="M10 3.5 17.5 16h-15L10 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="13.3" r="0.9" fill="currentColor" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M10 2l1.3 4.7L16 8l-4.7 1.3L10 14l-1.3-4.7L4 8l4.7-1.3L10 2Z" />
      <path d="M16 13l.6 2 2 .6-2 .6-.6 2-.6-2-2-.6 2-.6.6-2Z" />
    </svg>
  );
}
function ShieldLockIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden>
      <path d="M10 2.5 16 4.5v5c0 4.2-3 6.7-6 8-3-1.3-6-3.8-6-8v-5L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="7.7" y="9" width="4.6" height="3.6" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8.6 9V7.8a1.4 1.4 0 0 1 2.8 0V9" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function ChevronDownIcon({ up }: { up?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      aria-hidden
      className={up ? "rotate-180" : ""}
    >
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HealthCategoryCard({
  icon,
  colorClass,
  badgeClass,
  title,
  count,
  editing,
  onEdit,
  onDone,
  editor,
  items,
}: {
  icon: React.ReactNode;
  colorClass: string;
  badgeClass: string;
  title: string;
  count: number;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  editor: React.ReactNode;
  items: React.ReactNode[];
}) {
  const [open, setOpen] = useState(true);
  // Patients with a long problem or medication list shouldn't have every
  // card expand to a wall of rows by default — show a few, offer the rest.
  const [showAll, setShowAll] = useState(false);
  const VISIBLE = 3;
  const visibleItems = showAll ? items : items.slice(0, VISIBLE);
  const hiddenCount = items.length - visibleItems.length;
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 p-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
            {icon}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-base font-bold text-ink">{title}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgeClass}`}>{count}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (editing) onDone();
            else {
              onEdit();
              setOpen(true);
            }
          }}
          className="shrink-0 text-sm font-semibold text-brand"
        >
          {editing ? "Done" : "Edit"}
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Collapse" : "Expand"}
          className="shrink-0 text-muted-2"
        >
          <ChevronDownIcon up={open} />
        </button>
      </div>
      {open && (
        <div className="px-4 pb-4">
          {editing ? (
            editor
          ) : (
            <>
              <div className="divide-y divide-line">{visibleItems}</div>
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-2 text-sm font-semibold text-brand"
                >
                  + {hiddenCount} more
                </button>
              )}
              {showAll && items.length > VISIBLE && (
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  className="mt-2 text-sm font-semibold text-muted"
                >
                  Show less
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function HealthItemRow({
  tone,
  name,
  detail,
}: {
  tone: "blue" | "green" | "orange";
  name: string;
  detail?: string;
}) {
  // Deliberately neutral, not a checkmark — a checkmark here would imply
  // the patient individually verified each item. This is what's on file;
  // the section header's "Confirmed" badge is what carries that meaning,
  // and only once they've actually pressed through it.
  const detailClass = tone === "orange" ? "font-semibold text-orange" : "text-muted-2";
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="flex size-5 shrink-0 items-center justify-center">
        <span aria-hidden className="size-1.5 rounded-full bg-line-strong" />
      </span>
      <span className="flex-1 text-sm font-semibold text-ink">{name}</span>
      {detail && <span className={`text-sm ${detailClass}`}>{detail}</span>}
    </div>
  );
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
  // Confirmation is the default per category — each card's picker is an
  // opt-in path reached only via that card's own "Edit," not a whole-screen
  // mode switch.
  const [editingCategory, setEditingCategory] = useState<
    "conditions" | "medications" | "allergies" | null
  >(null);
  const left = minutesRemaining("health", HEALTH_PHASE_FRACTION[phase]);
  const progress = 1 - left / TOTAL_CHECKIN_MINUTES;

  // Which validated question set the rules engine picked, based on what
  // the AI classified — not something the AI invented on the fly. Routing
  // goes straight from classification to the follow-up itself: if the AI
  // isn't diagnosing and is only selecting among validated question sets,
  // a separate "is that right?" confirmation just adds friction without
  // adding safety. The heading on the follow-up screen itself says why
  // it's being asked, which keeps this transparent without an extra tap.
  const [symptomKind, setSymptomKind] = useState<"dizziness" | "respiratory" | "generic" | null>(
    null
  );

  // Existing history that has a configured reason to be re-checked this
  // visit — not every field on file, just the ones a rule flags. Smoking
  // status is asked about because it's clinically relevant on an ongoing
  // basis; family history isn't re-asked here for that same reason (it has
  // no rule pointing at it for this visit), so it stays out of this chain
  // entirely and is left for the optional deferred module instead.
  const needsSmokingCheck = data.smokingStatus === "Current smoker";

  function afterSymptomPhase(): HealthPhase {
    return needsSmokingCheck ? "smokingCheck" : "mood";
  }

  function classifyAndAdvance() {
    const notes = data.todayNotes;
    const extractedOnset = extractOnsetFromNotes(notes);
    if (CRISIS_PATTERN.test(notes)) {
      setPhase("crisis");
    } else if (RESPIRATORY_PATTERN.test(notes)) {
      setSymptomKind("respiratory");
      if (extractedOnset) {
        // Already stated — e.g. "for three days." Use it, skip asking again.
        setData((prev) => ({ ...prev, symptomOnset: extractedOnset }));
        setPhase("breathingContext");
      } else {
        setPhase("symptomOnset");
      }
    } else if (DIZZINESS_PATTERN.test(notes)) {
      setSymptomKind("dizziness");
      if (extractedOnset) {
        setData((prev) => ({ ...prev, symptomOnset: extractedOnset }));
        setPhase("symptomTriggers");
      } else {
        setPhase("symptomOnset");
      }
    } else if (SYMPTOM_PATTERN.test(notes)) {
      setSymptomKind("generic");
      setPhase("symptom");
    } else {
      setPhase(afterSymptomPhase());
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepBar
        onBack={onBack}
        sectionLabel="Your Health"
        stepLabel={formatTimeLeft(left)}
        progress={progress}
      />

      {phase === "confirm" && (
        <>
          <Heading title="Health review" />
          <ScreenBody>
            <div className="mb-4 flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <SparkleIcon />
              </span>
              <p className="text-sm text-muted">
                We&rsquo;ve reviewed your previous records. Please confirm everything below.
              </p>
            </div>

            <div className="space-y-4">
              <HealthCategoryCard
                icon={<HeartPulseIcon />}
                colorClass="bg-brand/10 text-brand"
                badgeClass="bg-brand/10 text-brand"
                title="Conditions"
                count={data.conditions.length}
                editing={editingCategory === "conditions"}
                onEdit={() => setEditingCategory("conditions")}
                onDone={() => setEditingCategory(null)}
                editor={
                  <SimpleTagPicker
                    label="a condition"
                    tags={data.conditions}
                    suggestions={CONDITION_SUGGESTIONS}
                    onChange={(v) => setData((prev) => ({ ...prev, conditions: v }))}
                  />
                }
                items={data.conditions.map((c) => (
                  <HealthItemRow key={c} tone="blue" name={c} />
                ))}
              />

              <HealthCategoryCard
                icon={<PillIcon />}
                colorClass="bg-green-100 text-green-600"
                badgeClass="bg-green-100 text-green-700"
                title="Medications"
                count={data.medications.length}
                editing={editingCategory === "medications"}
                onEdit={() => setEditingCategory("medications")}
                onDone={() => setEditingCategory(null)}
                editor={
                  <MedicationPicker
                    entries={data.medications}
                    onChange={(v) => setData((prev) => ({ ...prev, medications: v }))}
                  />
                }
                items={data.medications.map((m) => (
                  <HealthItemRow
                    key={m.name}
                    tone="green"
                    name={m.name}
                    detail={[m.strength && `${m.strength} ${m.unit}`, m.frequency].filter(Boolean).join(" · ")}
                  />
                ))}
              />

              <HealthCategoryCard
                icon={<WarningTriangleIcon />}
                colorClass="bg-orange/15 text-orange"
                badgeClass="bg-orange/15 text-orange"
                title="Allergies"
                count={data.allergies.length}
                editing={editingCategory === "allergies"}
                onEdit={() => setEditingCategory("allergies")}
                onDone={() => setEditingCategory(null)}
                editor={
                  <AllergyPicker
                    entries={data.allergies}
                    onChange={(v) => setData((prev) => ({ ...prev, allergies: v }))}
                  />
                }
                items={data.allergies.map((a) => (
                  <HealthItemRow key={a.name} tone="orange" name={a.name} detail={a.severity} />
                ))}
              />
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-background px-4 py-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <ShieldLockIcon />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">Your information is secure</p>
                <p className="mt-0.5 text-xs text-muted">
                  We use industry-standard security to keep your data private and protected.
                </p>
              </div>
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={() => setPhase("notes")}>
              ✓ Everything looks correct →
            </PrimaryButton>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-2">
              <LockIcon /> Secure &amp; HIPAA-compliant
            </p>
          </ScreenFooter>
        </>
      )}

      {phase === "notes" && (
        <>
          <Heading
            title="Anything you'd like Dr. Chen to know before your visit?"
            subtitle="Tell us about any symptoms, concerns, or changes since your last visit."
          />
          <ScreenBody>
            <textarea
              autoFocus
              value={data.todayNotes}
              onChange={(e) =>
                setData((prev) => ({ ...prev, todayNotes: e.target.value }))
              }
              rows={4}
              placeholder="e.g. I've been getting dizzy in the mornings for the past two weeks"
              className="w-full rounded-2xl border border-line-strong px-4 py-3 text-sm text-ink outline-none focus:border-brand"
            />
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={classifyAndAdvance}>Continue</PrimaryButton>
            <TextLink onClick={() => setPhase(afterSymptomPhase())}>Nothing else to add</TextLink>
          </ScreenFooter>
        </>
      )}

      {phase === "symptomOnset" && (
        <>
          <Heading
            title={
              symptomKind === "dizziness"
                ? "A few questions about the dizziness"
                : "A few questions about your breathing"
            }
            subtitle="You mentioned a new concern — a couple of quick details will help Dr. Chen prepare."
          />
          <ScreenBody>
            <p className="mb-3 text-sm font-semibold text-ink">When did it start?</p>
            <div className="flex flex-col gap-2">
              {ONSET_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={data.symptomOnset === opt}
                  onClick={() => setData((prev) => ({ ...prev, symptomOnset: opt }))}
                />
              ))}
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton
              disabled={!data.symptomOnset}
              onClick={() => setPhase(symptomKind === "respiratory" ? "breathingContext" : "symptomTriggers")}
            >
              Continue
            </PrimaryButton>
          </ScreenFooter>
        </>
      )}

      {phase === "symptomTriggers" && (
        <>
          <Heading
            title="When does it usually happen?"
            subtitle="Select all that apply."
          />
          <ScreenBody>
            <div className="flex flex-col items-start gap-2">
              {TRIGGER_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={data.symptomTriggers.includes(opt)}
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      symptomTriggers: prev.symptomTriggers.includes(opt)
                        ? prev.symptomTriggers.filter((t) => t !== opt)
                        : [...prev.symptomTriggers, opt],
                    }))
                  }
                />
              ))}
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton
              disabled={data.symptomTriggers.length === 0}
              onClick={() => setPhase(afterSymptomPhase())}
            >
              Continue
            </PrimaryButton>
          </ScreenFooter>
        </>
      )}

      {phase === "breathingContext" && (
        <>
          <Heading title="About your breathing" />
          <ScreenBody>
            <p className="mb-3 text-sm font-semibold text-ink">
              When do you notice the breathing difficulty?
            </p>
            <div className="flex flex-col gap-2">
              {BREATHING_CONTEXT_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={data.symptomSeverity === opt}
                  onClick={() => setData((prev) => ({ ...prev, symptomSeverity: opt }))}
                />
              ))}
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton
              disabled={!data.symptomSeverity}
              onClick={() => setPhase(afterSymptomPhase())}
            >
              Continue
            </PrimaryButton>
          </ScreenFooter>
        </>
      )}

      {phase === "smokingCheck" && (
        <>
          <Heading
            title="One quick health update"
            subtitle="We have smoking listed in your health history. Is that still correct?"
          />
          <ScreenBody>
            <div className="flex flex-col gap-2">
              {SMOKING_CONFIRM_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={data.smokingStatusUpdate === opt}
                  onClick={() => setData((prev) => ({ ...prev, smokingStatusUpdate: opt }))}
                />
              ))}
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton
              disabled={!data.smokingStatusUpdate}
              onClick={() =>
                // Only a gap opens a follow-up — confirming nothing's changed
                // (or flagging it for staff) both end this branch right here.
                setPhase(data.smokingStatusUpdate === "No, I stopped" ? "smokingSince" : "mood")
              }
            >
              Continue
            </PrimaryButton>
          </ScreenFooter>
        </>
      )}

      {phase === "smokingSince" && (
        <>
          <Heading title="About when did you stop?" />
          <ScreenBody>
            <div className="flex flex-col gap-2">
              {SMOKING_QUIT_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={data.smokingQuitWhen === opt}
                  onClick={() => setData((prev) => ({ ...prev, smokingQuitWhen: opt }))}
                />
              ))}
            </div>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton disabled={!data.smokingQuitWhen} onClick={() => setPhase("mood")}>
              Continue
            </PrimaryButton>
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
            <PrimaryButton onClick={() => setPhase(afterSymptomPhase())}>Continue</PrimaryButton>
          </ScreenFooter>
        </>
      )}

      {phase === "mood" && (
        <>
          <Heading
            title="Overall, how have you been feeling lately?"
            subtitle="Choose what feels closest. This is separate from anything you already told us."
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
            {data.moodCheck && (
              <p className="mt-3 text-sm text-muted-2">
                {data.moodCheck === "struggling"
                  ? "Thanks for sharing that — I'll ask a few wellbeing questions."
                  : "Good to hear — I'll skip the wellbeing screener."}
              </p>
            )}
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
            title="Thanks for sharing that"
            subtitle="We have a few quick questions to better understand how you've been feeling. This stays between you and Dr. Chen."
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

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" aria-hidden>
      <path d="M6 8.5V6a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="4" y="8.5" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="12.3" r="1.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 13.6v1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden>
      <path
        d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l.8-1.6A1.5 1.5 0 0 1 9.6 4.5h4.8a1.5 1.5 0 0 1 1.3.9L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.5" r="3.3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
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
  // Insurance already on file is the common case — confirming it is the
  // default experience, not re-scanning a card. "capture" only happens if
  // the patient explicitly says the plan changed, or nothing's on file.
  const [mode, setMode] = useState<"confirm" | "capture" | "captured" | "manual">(
    data.insurance ? "confirm" : "capture"
  );
  // OCR reads the card instantly. Eligibility is what actually takes a
  // moment to check — and it runs in the background. The patient is never
  // blocked waiting on it; we only interrupt if it comes back needing action.
  const [eligibilityVerified, setEligibilityVerified] = useState(false);

  function simulateScan() {
    setData((prev) => ({
      ...prev,
      insurance: {
        provider: "BlueCross BlueShield",
        memberId: "BXP440291847",
        planType: "PPO",
        groupNumber: "BCBS-77291",
      },
    }));
    setMode("captured");
    setEligibilityVerified(false);
    window.setTimeout(() => setEligibilityVerified(true), 1400);
  }

  function saveManual() {
    setData((prev) => ({
      ...prev,
      insurance: { provider: "", memberId: "", planType: "", groupNumber: "" },
    }));
    setMode("captured");
    setEligibilityVerified(false);
    window.setTimeout(() => setEligibilityVerified(true), 1400);
  }

  function skipWithoutCard() {
    setData((prev) => ({ ...prev, insurance: null }));
    onContinue();
  }

  return (
    <div className="flex flex-1 flex-col">
      <WizardStepBar step="insurance" onBack={onBack} />

      {mode === "confirm" && data.insurance && (
        <>
          <Heading title="Your insurance" subtitle="Still using this plan?" />
          <ScreenBody>
            <Card className="ring-2 ring-inset ring-brand">
              <p className="text-sm font-semibold text-brand">
                ✓ {data.insurance.provider} {data.insurance.planType}
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <InsuranceRow label="Ending" value={data.insurance.memberId.slice(-4)} />
                <InsuranceRow label="Group number" value={data.insurance.groupNumber} />
              </dl>
              <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-xs text-green-700">
                <span aria-hidden>✓</span> Eligibility verified
              </p>
            </Card>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={onContinue}>Yes, continue</PrimaryButton>
            <TextLink onClick={() => setMode("capture")}>Update insurance</TextLink>
          </ScreenFooter>
        </>
      )}

      {mode === "capture" && (
        <>
          <Heading
            title="Scan your insurance card"
            subtitle="We'll fill in the details automatically."
          />
          <ScreenBody>
            <button
              type="button"
              onClick={simulateScan}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand/60 bg-brand/5 py-10 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full border-2 border-brand text-brand">
                <CameraIcon size={22} />
              </span>
              <span className="text-sm font-semibold text-brand">Scan card</span>
              <span className="text-xs text-muted-2">
                Hold steady — we&rsquo;ll capture it for you.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="mt-3 flex w-full items-center justify-between rounded-2xl border border-line px-4 py-4 text-sm font-semibold text-ink"
            >
              Enter details manually
              <span aria-hidden>›</span>
            </button>

            <Card className="mt-4">
              <p className="text-sm font-semibold text-ink">What we&rsquo;ll capture</p>
              <ul className="mt-2 grid grid-cols-2 gap-1 text-sm text-muted">
                <li>✓ Provider name</li>
                <li>✓ Group number</li>
                <li>✓ Member ID</li>
                <li>✓ Plan type</li>
              </ul>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-2">
                <LockIcon /> Your information is encrypted and secure — eligibility
                is verified in the background while you continue.
              </p>
            </Card>
          </ScreenBody>
          <ScreenFooter>
            <TextLink onClick={skipWithoutCard}>I don&rsquo;t have my card</TextLink>
          </ScreenFooter>
        </>
      )}

      {mode === "manual" && (
        <>
          <Heading title="Enter insurance details" />
          <ScreenBody>
            <Card>
              <div className="space-y-3">
                <ManualField label="Provider name" />
                <ManualField label="Member ID" />
                <ManualField label="Plan type" />
                <ManualField label="Group number" />
              </div>
            </Card>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={saveManual}>Save details</PrimaryButton>
            <TextLink onClick={() => setMode("capture")}>Back</TextLink>
          </ScreenFooter>
        </>
      )}

      {mode === "captured" && data.insurance && (
        <>
          <Heading title="Insurance details captured" />
          <ScreenBody>
            <Card className="ring-2 ring-inset ring-brand">
              <p className="text-sm font-semibold text-brand">✓ Insurance details captured</p>
              <dl className="mt-3 space-y-2 text-sm">
                <InsuranceRow label="Provider" value={data.insurance.provider || "—"} />
                <InsuranceRow label="Member ID" value={data.insurance.memberId || "—"} />
                <InsuranceRow label="Plan type" value={data.insurance.planType || "—"} />
                <InsuranceRow label="Group number" value={data.insurance.groupNumber || "—"} />
              </dl>
              <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-xs text-muted-2">
                {eligibilityVerified ? (
                  <span className="flex items-center gap-1.5 text-green-700">
                    <span aria-hidden>✓</span> Eligibility verified
                  </span>
                ) : (
                  "Eligibility is being verified in the background — no need to wait."
                )}
              </p>
              <button
                type="button"
                onClick={() => setMode("capture")}
                className="mt-3 text-sm font-semibold text-brand"
              >
                Re-scan
              </button>
            </Card>
          </ScreenBody>
          <ScreenFooter>
            <PrimaryButton onClick={onContinue}>Continue →</PrimaryButton>
          </ScreenFooter>
        </>
      )}
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 17 17 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden>
      <path
        d="M12.7 3.3a1.5 1.5 0 0 1 2.1 0l1.9 1.9a1.5 1.5 0 0 1 0 2.1L6.4 17.6l-4 .8.8-4L12.7 3.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  const [showDetails, setShowDetails] = useState(false);
  const [editingBilling, setEditingBilling] = useState(false);
  const [cvvVisible, setCvvVisible] = useState(false);
  const [menuCardId, setMenuCardId] = useState<string | null>(null);
  const [hiddenCardIds, setHiddenCardIds] = useState<string[]>([]);

  const usingNew = data.paymentMethod === "new";
  const visibleCards = SAVED_CARDS.filter((c) => !hiddenCardIds.includes(c.id));
  const selectedSavedCard = visibleCards.find((c) => c.id === data.paymentMethod);
  const hasSelection = usingNew ? data.newCard.cardNumber.trim() !== "" : Boolean(selectedSavedCard);
  // Even a saved card needs its CVV re-confirmed per transaction — this
  // costs the returning patient one extra tap versus a pure one-tap pay,
  // but verifying it every time is the safer default.
  const needsCvv = hasSelection && data.paymentCvv.trim() === "";
  const payingNow = copayPayingNow(data.selectedCopayItems);
  const remaining = COPAY_LINE_ITEMS.reduce((sum, i) => sum + i.amount, 0) - payingNow;

  function selectSavedCard(id: string) {
    setData((prev) => ({ ...prev, paymentMethod: id, paymentCvv: "" }));
    setShowPicker(false);
  }

  function toggleCopayItem(id: string) {
    setData((prev) => ({
      ...prev,
      selectedCopayItems: prev.selectedCopayItems.includes(id)
        ? prev.selectedCopayItems.filter((x) => x !== id)
        : [...prev.selectedCopayItems, id],
    }));
  }

  function simulateScanCard() {
    setScanning(true);
    window.setTimeout(() => {
      setData((prev) => ({
        ...prev,
        paymentMethod: "new",
        paymentCvv: "",
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
    setData((prev) => ({ ...prev, paymentMethod: "new", paymentCvv: prev.newCard.cvv }));
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

  const canPay = payingNow > 0 && hasSelection && data.paymentCvv.trim().length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <WizardStepBar step="copay" onBack={onBack} />
      <Heading title="Your copay" subtitle="Confirm the amount and you're set." />
      <ScreenBody>
        <Card className="ring-2 ring-inset ring-teal">
          <div className="flex items-center justify-between">
            <SectionLabel>Due today</SectionLabel>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="flex items-center gap-1 text-sm font-semibold text-brand"
            >
              View details
              <ChevronDownIcon up={showDetails} />
            </button>
          </div>
          <p className="mt-1 text-4xl font-bold text-ink">${payingNow.toFixed(2)}</p>
          <p className="mt-1 text-sm text-muted-2">Annual Physical</p>
          <p className="text-xs text-muted-2">Insurance estimate applied</p>
          {remaining > 0 && (
            <p className="mt-1 text-sm text-muted-2">${remaining.toFixed(2)} remaining</p>
          )}
          {showDetails && (
            <div className="mt-3 divide-y divide-line border-t border-line">
              {COPAY_LINE_ITEMS.map((item) => {
                const checked = data.selectedCopayItems.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleCopayItem(item.id)}
                    className="flex w-full items-center gap-3 py-2.5 text-left"
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                        checked ? "border-teal bg-teal text-white" : "border-line-strong"
                      }`}
                    >
                      {checked && <span aria-hidden className="text-[10px]">✓</span>}
                    </span>
                    <span className="flex-1 text-sm font-medium text-ink">{item.label}</span>
                    <span className="text-sm font-semibold text-ink">${item.amount.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-background px-4 py-3 text-xs text-muted">
          <span aria-hidden>ℹ️</span>
          Check what you&rsquo;d like to pay now — we&rsquo;ll handle the rest at your visit.
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Pay with</SectionLabel>
            <span className="flex items-center gap-1 text-xs text-muted-2">
              <LockIcon /> Secure payment
            </span>
          </div>

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
                {!needsCvv && hasSelection && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-brand text-white">
                    <span aria-hidden className="text-[10px]">✓</span>
                  </span>
                )}
              </div>
              {needsCvv && (
                <div className="relative mt-3">
                  <input
                    autoFocus
                    type={cvvVisible ? "text" : "password"}
                    value={data.paymentCvv}
                    onChange={(e) => setData((prev) => ({ ...prev, paymentCvv: e.target.value }))}
                    placeholder="Enter CVV to enable payment"
                    inputMode="numeric"
                    maxLength={4}
                    className="w-full rounded-2xl border border-line-strong px-3 py-2.5 pr-10 text-sm font-medium text-ink outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setCvvVisible((v) => !v)}
                    aria-label={cvvVisible ? "Hide CVV" : "Show CVV"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-2"
                  >
                    {cvvVisible ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              )}

              {!usingNew && selectedSavedCard && (
                <div className="mt-3 border-t border-line pt-3">
                  {editingBilling ? (
                    <div className="space-y-2">
                      <BoxField
                        label="Street"
                        value={data.streetAddress}
                        onChange={(v) => setData((prev) => ({ ...prev, streetAddress: v }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <BoxField label="City" value={data.city} onChange={(v) => setData((prev) => ({ ...prev, city: v }))} />
                        <BoxField label="ZIP" value={data.zip} onChange={(v) => setData((prev) => ({ ...prev, zip: v }))} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingBilling(false)}
                        className="text-sm font-semibold text-brand"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-2">Billing address</p>
                        <p className="text-sm text-ink">
                          {data.streetAddress}, {data.city}, {data.state} {data.zip}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingBilling(true)}
                        aria-label="Edit billing address"
                        className="shrink-0 text-muted-2"
                      >
                        <PencilIcon />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="mt-3 text-sm font-semibold text-brand"
              >
                Use a different card
              </button>
            </div>
          )}

          {showPicker && addFlow === "idle" && (
            <div className="mt-1.5 space-y-2">
              {visibleCards.map((card) => {
                const selected = !usingNew && data.paymentMethod === card.id;
                return (
                  <div
                    key={card.id}
                    className={`overflow-hidden rounded-2xl border ${
                      card.expired
                        ? "border-line bg-background/60"
                        : selected
                          ? "border-brand bg-brand/5"
                          : "border-line bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        disabled={card.expired}
                        onClick={() => selectSavedCard(card.id)}
                        className={`flex flex-1 items-center gap-3 text-left ${card.expired ? "opacity-60" : ""}`}
                      >
                        <CardBrandMark brand={card.brand} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-ink">
                            {card.brand === "visa" ? "Visa" : "Mastercard"} •••• {card.last4}
                          </p>
                          <p className="text-xs text-muted-2">Expires {card.expiry}</p>
                        </div>
                      </button>
                      {card.expired ? (
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="whitespace-nowrap rounded-full border border-orange px-2.5 py-1 text-xs font-bold text-orange">
                            Expired
                          </span>
                          <button
                            type="button"
                            onClick={() => setMenuCardId(menuCardId === card.id ? null : card.id)}
                            aria-label="Card options"
                            className="px-1 text-muted-2"
                          >
                            ⋮
                          </button>
                        </div>
                      ) : (
                        selected && (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-brand text-white">
                            <span aria-hidden className="text-[10px]">✓</span>
                          </span>
                        )
                      )}
                    </div>
                    {menuCardId === card.id && (
                      <div className="border-t border-line px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setHiddenCardIds((prev) => [...prev, card.id]);
                            setMenuCardId(null);
                          }}
                          className="text-sm font-semibold text-red-500"
                        >
                          Remove card
                        </button>
                      </div>
                    )}
                  </div>
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
                <CameraIcon />
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

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-green-700">
          <LockIcon /> 256-bit encrypted payment
        </p>
      </ScreenBody>
      <ScreenFooter>
        <PrimaryButton onClick={pay} disabled={!canPay || status !== "idle"}>
          {status === "paid"
            ? "✓ Payment successful"
            : status === "paying"
              ? "Processing…"
              : needsCvv
                ? "Enter CVV to pay"
                : `Pay $${payingNow.toFixed(2)}`}
        </PrimaryButton>
        <TextLink
          onClick={() => {
            setData((prev) => ({ ...prev, payDecision: "later" }));
            onContinue();
          }}
        >
          Pay at check-in
        </TextLink>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-2">
          <LockIcon /> Secure &amp; HIPAA-compliant
        </p>
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
  const docs: { key: keyof PatientData["consents"]; title: string; desc: string; fullText: string }[] = [
    {
      key: "privacy",
      title: "Notice of Privacy Practices",
      desc: "HIPAA-required acknowledgment of how we handle your health information.",
      fullText:
        "This notice describes how Oakwood Primary Care may use and disclose your protected health information to carry out treatment, payment, or healthcare operations, and how you can access that information. We're required by law to maintain the privacy of your health information and to provide you with this notice of our legal duties and privacy practices.",
    },
    {
      key: "treatment",
      title: "Consent to Treatment",
      desc: "Authorization for Dr. Chen to provide evaluation and treatment.",
      fullText:
        "You authorize Dr. Sarah Chen and associated clinical staff at Oakwood Primary Care to provide medical evaluation, diagnostic testing, and treatment as clinically appropriate for your care during this and future visits, until this consent is revoked in writing.",
    },
    {
      key: "financial",
      title: "Financial Responsibility",
      desc: "Agreement to pay for services not covered by your insurance.",
      fullText:
        "You agree to be financially responsible for any charges not covered by your insurance plan, including copays, deductibles, and coinsurance. Payment is due at the time of service unless other arrangements have been made with our billing office.",
    },
  ];

  // For this returning patient, nothing about these documents changed
  // since the last visit, so consents default to already-affirmed —
  // opening one is an optional read, not a gate. A practice whose
  // documents *did* change, or a first-time patient, would have this
  // driven by configuration to require a fresh look before signing.
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const allChecked = docs.every((d) => data.consents[d.key]);
  const canSubmit = allChecked && Boolean(data.signature);

  function toggleView(key: string) {
    setExpandedDoc((prev) => (prev === key ? null : key));
  }

  return (
    <div className="flex flex-1 flex-col">
      <WizardStepBar step="consents" onBack={onBack} />
      <Heading
        title="Your consents are unchanged"
        subtitle="Nothing here is different from your last visit. Review anytime, or just sign below."
      />
      <ScreenBody>
        <Card className="divide-y divide-line p-0">
          {docs.map((doc) => (
            <div key={doc.key} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span aria-hidden className="text-green-600">✓</span>
                  <p className="text-sm font-semibold text-ink">{doc.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleView(doc.key)}
                  className="shrink-0 text-xs font-semibold text-brand"
                >
                  {expandedDoc === doc.key ? "Hide" : "Review"}
                </button>
              </div>
              {expandedDoc === doc.key && (
                <p className="mt-3 border-t border-line pt-3 text-xs text-muted">{doc.fullText}</p>
              )}
            </div>
          ))}
        </Card>

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

  // A hub, not a forced wizard — the patient controls which of these (if
  // any) they open, in whatever order, instead of being pushed through
  // three mandatory-feeling screens for something that's genuinely optional.
  const [openKey, setOpenKey] = useState<DeferredKey | null>(null);

  function finish() {
    setData((prev) => ({
      ...prev,
      deferred: {
        ...prev.deferred,
        pushedToPortal: items.some((i) => !prev.deferred[i.key]),
      },
    }));
    onDone();
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenBody>
        <div className="flex flex-col items-center px-2 pt-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand/10 text-2xl text-brand">
            ✓
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">You&rsquo;re checked in</h1>
          <p className="mt-1 text-sm text-muted">
            If you have another minute, you can update:
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {items.map((item) => {
            const answered = Boolean(data.deferred[item.key]);
            const open = openKey === item.key;
            return (
              <div
                key={item.key}
                className="overflow-hidden rounded-2xl border border-line bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenKey(open ? null : item.key)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <div>
                    <p className="text-sm font-bold text-ink">{item.title}</p>
                    <p className={`text-xs ${answered ? "font-semibold text-green-600" : "text-muted-2"}`}>
                      {answered ? "Added ✓" : "Not updated"}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand">
                    {answered ? "Edit" : "Add"}
                    <ChevronDownIcon up={open} />
                  </span>
                </button>
                {open && (
                  <div className="border-t border-line p-4">
                    <p className="mb-2 text-xs text-muted">{item.benefit}</p>
                    <textarea
                      autoFocus
                      value={data.deferred[item.key]}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          deferred: { ...prev.deferred, [item.key]: e.target.value },
                        }))
                      }
                      placeholder={item.placeholder}
                      rows={2}
                      className="w-full rounded-2xl border border-line-strong px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScreenBody>
      <ScreenFooter>
        <PrimaryButton onClick={finish}>Finish</PrimaryButton>
      </ScreenFooter>
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
  const paidNow = copayPayingNow(data.selectedCopayItems);
  const totalDue = COPAY_LINE_ITEMS.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="flex flex-1 flex-col items-center px-6 pt-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand/10 text-3xl text-brand">
        ✓
      </span>
      <h1 className="mt-4 text-2xl font-bold text-ink">
        You&rsquo;re all set, {firstName}!
      </h1>

      <Card className="mt-6 w-full text-left">
        <p className="text-base font-bold text-ink">Annual Physical</p>
        <p className="mt-1 text-sm text-muted-2">Tomorrow · 8:00 AM</p>
        <p className="text-sm text-muted-2">Dr. Sarah Chen</p>
        <p className="text-sm text-muted-2">Oakwood Primary Care</p>
      </Card>

      <div className="mt-4 w-full space-y-2 text-left">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="text-green-600">✓</span> Check-in complete
        </div>
        {data.insurance && (
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="text-green-600">✓</span> Insurance verified
          </div>
        )}
        {data.payDecision === "paid" && (
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="text-green-600">✓</span> ${paidNow.toFixed(2)} copay paid
            {paidNow < totalDue && (
              <span className="font-normal text-muted-2">
                {" "}
                · ${(totalDue - paidNow).toFixed(2)} due at check-in
              </span>
            )}
          </div>
        )}
      </div>

      {data.deferred.pushedToPortal && (
        <p className="mt-4 text-xs text-muted-2">
          You can add {formatDeferredList(data)} later from your patient portal.
        </p>
      )}

      <div className="mt-8 w-full">
        <PrimaryButton onClick={onDone}>Return home</PrimaryButton>
      </div>
    </div>
  );
}
