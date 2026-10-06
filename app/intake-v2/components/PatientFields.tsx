"use client";

import { useState } from "react";
import { formatAgeFromDob } from "../format";
import { CalendarIcon, CheckIcon } from "./Icons";
import { DobWheelSheet } from "./sheets/DobWheelSheet";
import { FORM_LABEL } from "./ui";

// "MM/DD/YYYY" → "Jun 12, 2026" — deterministic given the string
// itself (not the current date), so safe to call during render.
export function formatDobDisplay(dob: string): string {
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Date of birth as a tappable box (calendar icon at the right) that
// opens the wheel picker, with the computed age underneath. `value` /
// `onChange` use the app-wide "MM/DD/YYYY" string.
export function DobPickerField({ value, onChange, label = "Date of birth" }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const display = formatDobDisplay(value);
  const age = formatAgeFromDob(value);
  return (
    <div>
      <div className={`mb-1.5 ${FORM_LABEL}`}>{label}</div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--iv2-border)] bg-[var(--iv2-surface)] px-3.5 text-left outline-none transition-colors hover:border-[var(--iv2-text-muted)]"
        style={{ height: 52 }}
      >
        <span className={`text-[17px] font-semibold ${display ? "text-[var(--iv2-text-primary)]" : "text-[var(--iv2-text-muted)]"}`}>
          {display || "Select date of birth"}
        </span>
        <CalendarIcon size={18} />
      </button>
      {age ? <div className="mt-2 text-sm font-semibold text-[var(--iv2-success)]">{age}</div> : null}
      <DobWheelSheet open={open} onClose={() => setOpen(false)} value={value} onConfirm={onChange} />
    </div>
  );
}

// A value that can't be changed here (the verified phone number, which
// is masked on file) in the same box shape as the editable fields, on a
// muted fill so it reads as locked.
export function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className={`mb-1.5 ${FORM_LABEL}`}>{label}</div>
      <div
        className="flex items-center rounded-xl border border-[var(--iv2-border)] bg-[var(--iv2-surface-muted)] px-3.5"
        style={{ height: 52 }}
      >
        <span className="truncate text-[17px] font-semibold text-[var(--iv2-text-primary)]">{value}</span>
      </div>
    </div>
  );
}

const SEX_OPTIONS = ["Female", "Male"];

// Female / Male as two tap-to-pick option boxes (selected one gets the
// brand border, tint and a check; the other an empty ring).
export function SexOptionsField({ value, onChange, label = "Gender" }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div>
      <div className={`mb-3 ${FORM_LABEL}`}>{label}</div>
      <div className="grid grid-cols-2 gap-2.5">
        {SEX_OPTIONS.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className="flex min-h-12 cursor-pointer items-center justify-between rounded-xl border px-4 py-2 text-left text-base transition-colors duration-150"
              style={{
                borderColor: selected ? "var(--iv2-brand)" : "var(--iv2-border)",
                backgroundColor: selected ? "var(--iv2-brand-surface)" : "var(--iv2-surface)",
              }}
            >
              <span className={selected ? "font-bold text-[var(--iv2-brand)]" : "font-semibold text-[var(--iv2-text-primary)]"}>{opt}</span>
              {selected ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand)]">
                  <CheckIcon size={13} color="#fff" strokeWidth={3} />
                </span>
              ) : (
                <span className="h-6 w-6 shrink-0 rounded-full border-2 border-[var(--iv2-border-strong)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
