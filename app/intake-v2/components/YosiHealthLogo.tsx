"use client";

// Practice-mark replacement for the appointment hub header — README's
// "Assets" section calls the stethoscope glyph a placeholder to be
// "swapped for the tenant's logo asset." This swaps it for the actual
// Yosi Health wordmark (icon + "Yosihealth" lockup), matching how it
// reads elsewhere in the product: a small leaf/pulse glyph in the brand
// teal followed by "Yosi" in ink and "health" in teal.
export function YosiHealthLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex shrink-0 items-center gap-1.5 ${className}`}>
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s-7-4.35-9.5-9.1C.7 8.2 2.9 4 7 4c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 4.1 0 6.3 4.2 4.5 7.9C19 16.65 12 21 12 21z"
          fill="var(--iv2-yosi-teal)"
        />
        <path d="M7 12h2.4l1.3-2.6 1.6 5.2 1.2-2.6H17" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="text-[17px] leading-none font-bold whitespace-nowrap">
        <span className="text-[var(--iv2-text-primary)]">Yosi</span>
        <span className="text-[var(--iv2-yosi-teal)]">health</span>
      </span>
    </div>
  );
}
