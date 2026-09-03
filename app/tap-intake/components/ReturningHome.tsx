"use client";

import { PrimaryButton } from "@/app/components/CheckinShell";
import { ON_FILE_RECORD } from "../mockData";
import { PhoneFrame } from "./PhoneFrame";

const DOT_COLOR: Record<string, string> = {
  amber: "#f5a623",
  gray: "var(--color-muted-2)",
  teal: "var(--color-teal)",
};

// Plain SVG ring, no chart library — at this screen the visit is always
// literally 0% (there's no persisted/resumable state to be further along
// yet), so it renders as a quiet, empty track rather than a fake-looking
// dynamic widget. Built to take a real percent if a resumable check-in
// ever exists, without needing to change how it's drawn.
function ProgressRing({ percent }: { percent: number }) {
  const size = 44;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-line)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-ink">{percent}%</div>
    </div>
  );
}

// A personalized landing for returning patients — identity, the upcoming
// visit, and a few scannable on-file flags — before asking anything. Merges
// the "here's your visit" pattern (root app's home screen) with the
// "here's the patient" pattern (a pediatric health-module home) into one
// screen, so a returning guardian sees what's already known before being
// asked to tell us what's going on today.
//
// v4 (per a reference screenshot): restructured around a "Welcome · see
// you {date}" eyebrow + large name (was one dense "How's Ana doing?"
// headline), the visit card split into two rows — ring + visit-type/time/
// location on top, a divided PROVIDER row with the status badge below —
// instead of squeezing all of it into one paragraph next to the ring, and
// the time estimate moved to sit under the CTA instead of the top
// subtitle. Two things the reference showed that this deliberately did
// NOT copy verbatim: an 80% progress ring (this screen is always
// genuinely 0% — see ProgressRing's own comment — showing a fake
// completion number just because a reference happened to have one would
// misrepresent real state) and a "First visit"/fasting-reminder card
// (neither describes this app's actual data — Ana has seen Dr. Reyes
// before, and a routine pediatric annual physical doesn't carry a fasting
// requirement the way the reference's adult well-woman-exam-style visit
// might). "Good to know" already covers "what's worth knowing before you
// arrive" with real clinical flags instead.
export function ReturningHome({ onStart }: { onStart: () => void }) {
  const { child, nextVisit, goodToKnow } = ON_FILE_RECORD;

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 pt-6">
          <div className="flex items-center justify-center gap-2 border-b border-line pb-4">
            <span className="text-teal">✚</span>
            <span className="text-lg font-bold text-brand">
              Health<span className="text-teal">pro</span>
            </span>
            <span className="text-lg font-normal text-ink">Clinic</span>
          </div>

          <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-muted-2">
            Welcome · see you {nextVisit.date.toLowerCase()}
          </div>
          <h1 className="text-[32px] font-bold leading-tight text-ink">{child.name}</h1>

          <div className="mt-5 text-[11px] font-semibold uppercase tracking-wide text-muted-2">
            {nextVisit.date}&apos;s visit
          </div>
          <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4 p-4">
              <ProgressRing percent={0} />
              <div className="min-w-0 flex-1">
                <div className="text-base font-bold text-ink">{nextVisit.visitType}</div>
                <div className="text-sm text-muted">
                  {nextVisit.date} · {nextVisit.time}
                </div>
                <div className="text-xs text-muted-2">{nextVisit.location}</div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-2">Provider</div>
                <div className="text-sm font-bold text-ink">{nextVisit.provider}</div>
              </div>
              <span className="rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">Not started</span>
            </div>
          </div>

          <div className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-muted-2">Good to know</div>
          {/* One merged, divided block instead of individually boxed rows —
              same "quiet compact list" treatment as the upcoming-sections
              list in ui.tsx's SectionShell: several same-weight scannable
              facts read better as one list than as a stack of separate
              cards. */}
          <div className="mt-2 divide-y divide-line rounded-2xl border border-line bg-white px-4">
            {goodToKnow.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: DOT_COLOR[item.dot] }} />
                <span className="flex-1 text-sm font-semibold text-ink">{item.title}</span>
                <span className="text-xs text-muted">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 border-t border-line px-6 py-4">
          <PrimaryButton onClick={onStart}>
            Start check-in <span aria-hidden="true">→</span>
          </PrimaryButton>
          <p className="mt-2 text-center text-xs text-muted">Takes about two minutes · we save as you go</p>
        </div>
      </div>
    </PhoneFrame>
  );
}
