"use client";

import { PrimaryButton } from "@/app/components/CheckinShell";
import { PhoneFrame } from "./PhoneFrame";

// A splash/consent screen, styled to match the phone-frame presentation
// used elsewhere in this repo (root app, /pediatric) — wordmark logo, trust
// badges, privacy note, single "Next" CTA.
export function IntroScreen({ onNext }: { onNext: () => void }) {
  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-6 pt-6">
        <div className="flex items-center justify-center gap-2">
          <span className="text-teal">✚</span>
          <span className="text-lg font-bold text-brand">
            Health<span className="text-teal">pro</span>
          </span>
          <span className="text-lg font-normal text-ink">Clinic</span>
        </div>

        <h1 className="mt-8 text-center text-[34px] font-bold leading-[1.15] text-ink">
          Let&apos;s get your child checked in
        </h1>
        <p className="mx-auto mt-3 max-w-[300px] text-center text-sm text-muted">
          A few quick taps — we&apos;ll only ask what&apos;s relevant to today&apos;s visit.
        </p>

        <p className="mt-10 text-xs font-semibold uppercase tracking-[1.2px] text-muted-2">
          About this check-in
        </p>

        <div className="mt-3">
          <TrustRow
            title="Built with pediatric care teams"
            subtitle="Structured around real clinic check-in workflows."
          />
          <TrustRow
            title="Nothing asked twice"
            subtitle="We reuse what's already on file for returning visits."
          />
          <TrustRow
            title="Used to prepare thousands of visits"
            subtitle="Helping care teams get ready before you arrive."
            last
          />
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-background/60 p-4">
          <ShieldIcon />
          <p className="text-sm text-muted">
            Your information is <span className="font-semibold text-ink">private and secure</span>. We never share
            your personal health information.
          </p>
        </div>

        <div className="flex-1" />

        <div className="pt-8">
          <PrimaryButton onClick={onNext}>Next →</PrimaryButton>
        </div>
      </div>
    </PhoneFrame>
  );
}

function TrustRow({ title, subtitle, last }: { title: string; subtitle: string; last?: boolean }) {
  return (
    <div className={`flex gap-3 py-3 ${last ? "" : "border-b border-line"}`}>
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">
        ✓
      </span>
      <div>
        <div className="text-sm font-semibold text-ink">{title}</div>
        <div className="text-sm text-muted">{subtitle}</div>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="mt-0.5 shrink-0">
      <path
        d="M10 2 3 4.5v5c0 4.4 3 7.5 7 8.5 4-1 7-4.1 7-8.5v-5L10 2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        className="text-muted-2"
      />
      <path d="M7 10l2.2 2.2L13.2 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-teal" />
    </svg>
  );
}
