"use client";

// Sticky footer — README "Sticky footer" section. `null` labels hide that
// tier entirely (used on otp/welcome/screener/success screens, matching
// the prototype's `hasFooter = !!primaryLabel`).
export function Footer({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  tertiaryLabel,
  onTertiary,
  primaryPill = false,
}: {
  primaryLabel: string | null;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string | null;
  onSecondary?: () => void;
  tertiaryLabel?: string | null;
  onTertiary?: () => void;
  // Full pill radius on the primary CTA instead of the standard 14px —
  // opt-in per screen (currently just Review) rather than a global
  // radius-token change, so the rest of the flow keeps the spec's 14px
  // CTA radius untouched.
  primaryPill?: boolean;
}) {
  if (!primaryLabel) return null;
  return (
    <div className="border-t border-[var(--iv2-border-subtle)] bg-white px-6 pt-3.5 pb-[30px]">
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryDisabled}
        className={[
          "h-14 w-full border-none text-base font-bold active:scale-[0.98]",
          primaryPill ? "rounded-full" : "rounded-2xl",
          primaryDisabled
            ? "cursor-not-allowed bg-[var(--iv2-disabled-bg)] text-[var(--iv2-disabled-fg)]"
            : "cursor-pointer bg-[var(--iv2-brand)] text-white hover:bg-[var(--iv2-brand-hover)]",
        ].join(" ")}
      >
        {primaryLabel}
      </button>
      {secondaryLabel ? (
        <button
          type="button"
          onClick={onSecondary}
          className="mt-2 h-13 w-full cursor-pointer rounded-2xl border-[1.5px] border-[var(--iv2-border)] bg-white text-base font-bold text-[var(--iv2-text-primary)] hover:border-[var(--iv2-brand)] hover:text-[var(--iv2-brand)] active:scale-[0.98]"
          style={{ height: 52 }}
        >
          {secondaryLabel}
        </button>
      ) : null}
      {tertiaryLabel ? (
        <button
          type="button"
          onClick={onTertiary}
          className="mt-0.5 h-11 w-full cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-text-muted)] hover:text-[var(--iv2-brand)]"
        >
          {tertiaryLabel}
        </button>
      ) : null}
    </div>
  );
}
