import { useEffect, useState } from "react";
import { ChipGroup } from "../components/ChipGroup";
import { AICard } from "../components/AICard";
import { BottomBar } from "../components/BottomBar";
import { SummaryCard } from "../components/SummaryCard";
import { ON_FILE_CONDITIONS, HAS_ASTHMA_PLAN } from "../data/onFile";
import { parseFreeText } from "../lib/aiParse";
import type { ParsedField } from "../types";

type ChangedState = "unknown" | "no" | "yes";
type Category = "Allergy" | "Medication" | "Condition" | "Surgery" | "Something else";

export function HealthScreen({ onComplete }: { onComplete: (summary: string) => void }) {
  const [changed, setChanged] = useState<ChangedState>("unknown");
  const [category, setCategory] = useState<Category | null>(null);
  const [categoryInput, setCategoryInput] = useState("");

  const [inhalerAnswer, setInhalerAnswer] = useState<string[]>([]);
  const [nightAnswer, setNightAnswer] = useState<string[]>([]);

  const [freeText, setFreeText] = useState("");
  const [aiAck, setAiAck] = useState<string | null>(null);
  const [pendingFields, setPendingFields] = useState<ParsedField[]>([]);
  const [confirmedFields, setConfirmedFields] = useState<ParsedField[]>([]);

  const [done, setDone] = useState(false);

  // Collapse to a summary card, then auto-advance a beat later — long
  // enough to register as "done" without feeling like a delay.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => onComplete(summaryLine()), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function submitFreeText() {
    if (!freeText.trim()) return;
    const fields = parseFreeText(freeText);
    setPendingFields(fields);
    setAiAck(`Got it. I found ${fields.length} update${fields.length === 1 ? "" : "s"}.`);
    setFreeText("");
  }

  function confirmParsed() {
    setConfirmedFields((f) => [...f, ...pendingFields]);
    setPendingFields([]);
    setAiAck(null);
  }

  function summaryLine() {
    const newMeds = confirmedFields.filter((f) => f.kind === "medication").length;
    const newAllergies = confirmedFields.filter((f) => f.kind === "allergy").length;
    const bits: string[] = [];
    if (newMeds) bits.push(`${newMeds} new medication${newMeds > 1 ? "s" : ""}`);
    if (HAS_ASTHMA_PLAN) bits.push("Asthma reviewed");
    bits.push(newAllergies ? `${newAllergies} new allerg${newAllergies > 1 ? "ies" : "y"}` : "No new allergies");
    return bits.join(", ");
  }

  if (done) {
    return (
      <div className="flex flex-1 flex-col px-5 py-5">
        <SummaryCard title="✓ HEALTH COMPLETE" detail={summaryLine()} />
      </div>
    );
  }

  const readyForAsthmaFollowUp = changed === "no" || (changed === "yes" && !!category);
  const canContinue = changed !== "unknown";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">On file</div>
            <button type="button" className="text-xs font-bold text-blue-600">
              Edit
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {ON_FILE_CONDITIONS.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{c.label}</span>
                <span className="text-xs text-slate-400">{c.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {changed === "unknown" && (
          <div>
            <div className="mb-2 text-base font-bold text-slate-900">Has anything changed since last visit?</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setChanged("no")}
                className="flex-1 rounded-full border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 hover:border-slate-300"
              >
                Nothing&rsquo;s changed
              </button>
              <button
                type="button"
                onClick={() => setChanged("yes")}
                className="flex-1 rounded-full border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 hover:border-slate-300"
              >
                Something changed
              </button>
            </div>
          </div>
        )}

        {changed === "yes" && (
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">What changed?</div>
            <ChipGroup
              options={["Allergy", "Medication", "Condition", "Surgery", "Something else"]}
              value={category ? [category] : []}
              onChange={(v) => setCategory((v[0] as Category | undefined) ?? null)}
            />
          </div>
        )}
        {category && (
          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">Tell us about the {category.toLowerCase()}</div>
            <input
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              placeholder="Type or speak..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-400"
            />
          </div>
        )}

        {HAS_ASTHMA_PLAN && readyForAsthmaFollowUp && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">Rescue inhaler in the past 7 days?</div>
              <ChipGroup options={["Yes", "No", "Not sure"]} value={inhalerAnswer} onChange={setInhalerAnswer} />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">Nighttime asthma symptoms this month?</div>
              <ChipGroup options={["Yes", "No", "Not sure"]} value={nightAnswer} onChange={setNightAnswer} />
            </div>
          </div>
        )}

        {aiAck && (
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-teal-700">
              <span aria-hidden="true">✦</span>
              {aiAck}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {pendingFields.map((f) => (
                <AICard key={f.id} field={f} onRemove={() => setPendingFields((p) => p.filter((x) => x.id !== f.id))} />
              ))}
            </div>
            <button type="button" onClick={confirmParsed} className="mt-3 w-full rounded-full bg-slate-900 py-3 text-sm font-bold text-white">
              Confirm updates
            </button>
          </div>
        )}

        {confirmedFields.length > 0 && (
          <div className="flex flex-col gap-2">
            {confirmedFields.map((f) => (
              <AICard key={f.id} field={f} />
            ))}
          </div>
        )}
      </div>

      <BottomBar
        value={freeText}
        onChange={setFreeText}
        onSubmit={submitFreeText}
        placeholder="Tell us anything else..."
        onContinue={() => setDone(true)}
        continueDisabled={!canContinue}
      />
    </div>
  );
}
