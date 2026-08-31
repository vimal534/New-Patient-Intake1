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
// v2: the previous pass split identity (avatar next to the heading) from
// visit logistics (a separate status card) into two pieces, dropped the
// "why this screen" framing the original copy had, and repeated the time
// estimate twice (subtitle + below the button). This version restores a
// single, dominant heading with that framing back in the subtitle, folds
// everything visit-related into ONE card (no redundant name/avatar repeat
// — the heading already names the patient), and states the time estimate
// exactly once.
//
// v3: the CTA is a sticky footer, not part of the scrolling content and
// not pushed down by a flex-1 spacer either. IntroScreen's flex-1 approach
// only anchors the button to the bottom when content is tall enough to
// reach it — on a real (short) phone viewport with tall content it can
// still force the button below the fold; letting it flow inline after
// short content (the v2 fix) leaves it stranded mid-screen with dead
// space below. A footer that's a fixed flex item below an independently
// scrolling content area is correct in both directions: always visible,
// content scrolls under it if it's ever too long to fit.
export function ReturningHome({ onStart }: { onStart: () => void }) {
  const { child, nextVisit, goodToKnow } = ON_FILE_RECORD;

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 pt-6">
          <h1 className="text-[28px] font-bold leading-tight text-ink">How&apos;s {child.name} doing?</h1>
          <p className="mt-2 text-sm text-muted">
            Tell us before the visit so {nextVisit.provider} is ready. Takes about two minutes.
          </p>

          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <ProgressRing percent={0} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-ink">
                {nextVisit.date} · {nextVisit.time}
              </div>
              <div className="text-sm text-muted">
                {nextVisit.visitType} · {nextVisit.provider}
              </div>
              <div className="text-xs text-muted-2">{nextVisit.location}</div>
              <span className="mt-1.5 inline-block rounded-full bg-brand/15 px-2.5 py-1 text-xs font-semibold text-brand">
                Not started
              </span>
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
            Tell us what&apos;s going on <span aria-hidden="true">→</span>
          </PrimaryButton>
        </div>
      </div>
    </PhoneFrame>
  );
}
