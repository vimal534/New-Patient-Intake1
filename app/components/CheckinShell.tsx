"use client";

import type { ReactNode } from "react";

export function StepBar({
  onBack,
  sectionLabel,
  stepLabel,
  progress,
}: {
  onBack: () => void;
  sectionLabel?: string;
  stepLabel: string;
  progress: number; // 0..1
}) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[1.2px] text-muted-2"
      >
        <span aria-hidden>←</span>
        {sectionLabel ?? "Back"}
      </button>
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[1.2px] text-muted-2 whitespace-nowrap">
          {stepLabel}
        </span>
        <div className="h-1 w-[92px] overflow-hidden rounded-full bg-line-strong">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="px-5 pt-4 pb-2">
      <h1 className="text-2xl font-bold leading-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[1.2px] text-muted-2">
      {children}
    </p>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[20px] border border-line bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="h-14 w-full rounded-full bg-brand text-base font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-2 text-center text-sm text-muted hover:text-ink"
    >
      {children}
    </button>
  );
}

export function ScreenFooter({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-line bg-white px-5 py-4">{children}</div>
  );
}

export function ScreenBody({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>;
}
