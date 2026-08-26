// The sticky bottom CTA bar present on every step. `children` lets a
// screen slot in a FlexibleInput above the button when it needs one.
export function BottomBar({
  children,
  ctaLabel = "Continue",
  onCta,
  ctaDisabled = false,
}: {
  children?: React.ReactNode;
  ctaLabel?: string;
  onCta: () => void;
  ctaDisabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-neutral-200 bg-white/95 px-5 py-3 backdrop-blur">
      {children && <div className="mb-3">{children}</div>}
      <button
        type="button"
        disabled={ctaDisabled}
        onClick={onCta}
        className={`min-h-[48px] w-full rounded-full text-sm font-bold text-white transition ${
          ctaDisabled ? "cursor-not-allowed bg-neutral-300" : "bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99]"
        }`}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
