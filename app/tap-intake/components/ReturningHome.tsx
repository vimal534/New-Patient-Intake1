"use client";

import { PrimaryButton } from "@/app/components/CheckinShell";
import { ON_FILE_RECORD } from "../mockData";
import { PhoneFrame } from "./PhoneFrame";

const DOT_COLOR: Record<string, string> = {
  amber: "#f5a623",
  gray: "var(--color-muted-2)",
  teal: "var(--color-teal)",
};

// A personalized landing for returning patients — identity, the upcoming
// visit, and a few scannable on-file flags — before asking anything. Merges
// the "here's your visit" pattern (root app's home screen) with the
// "here's the patient" pattern (a pediatric health-module home) into one
// screen, so a returning guardian sees what's already known before being
// asked to tell us what's going on today.
export function ReturningHome({ onStart }: { onStart: () => void }) {
  const { child, nextVisit, goodToKnow } = ON_FILE_RECORD;

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-6">
        <h1 className="text-[28px] font-bold leading-tight text-ink">How is {child.name} doing?</h1>
        <p className="mt-2 text-sm text-muted">
          Tell us before the visit so {nextVisit.provider} is ready. Takes about two minutes.
        </p>

        <div className="mt-5 rounded-2xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/15 text-lg font-bold text-teal">
              {child.name[0]}
            </span>
            <div>
              <div className="text-base font-bold text-ink">{child.name}</div>
              <div className="text-sm text-muted">{child.age} years · Child</div>
            </div>
          </div>

          <div className="my-4 border-t border-line" />

          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-2">Next visit</div>
          <div className="mt-0.5 text-sm font-semibold text-ink">
            {nextVisit.date} · {nextVisit.time} · {nextVisit.provider}
          </div>
        </div>

        <div className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-muted-2">Good to know</div>
        <div className="mt-2 space-y-2">
          {goodToKnow.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: DOT_COLOR[item.dot] }} />
              <span className="flex-1 text-sm font-semibold text-ink">{item.title}</span>
              <span className="text-xs text-muted">{item.status}</span>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <div className="pt-8">
          <PrimaryButton onClick={onStart}>Tell us what&apos;s going on</PrimaryButton>
        </div>
      </div>
    </PhoneFrame>
  );
}
