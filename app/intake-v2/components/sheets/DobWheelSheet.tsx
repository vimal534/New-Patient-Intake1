"use client";

import { useEffect, useRef, useState } from "react";
import { Button, BottomSheet } from "../ui";

const ITEM_HEIGHT = 40;
// Odd so the middle row lines up with the highlight window — matches
// the reference's 5-visible-row wheel (2 rows of context above/below
// the selected one).
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const PAD = (ITEM_HEIGHT * (VISIBLE_ROWS - 1)) / 2;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Static range (not derived from `new Date()` at render) would drift
// a day at midnight — fine here since it's only ever read once, at
// mount, to build the list.
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 130 }, (_, i) => String(CURRENT_YEAR - i)).reverse();

// The Day column's own options depend on which Month (and, for
// February, which Year — leap years) are currently selected — day 0
// of "next month" is JS's own idiom for "the last day of this month",
// so this stays correct for 28/29/30/31 without a lookup table.
function daysInMonth(month: string, year: string): number {
  const monthIndex = MONTHS.indexOf(month);
  return new Date(Number(year), monthIndex + 1, 0).getDate();
}

// One scrollable, snap-to-row column — the wheel's actual mechanic is
// plain CSS scroll-snap (native momentum/rubber-banding for free) plus
// a scroll listener that settles the nearest row and reports it, no
// drag-physics reimplementation needed.
function WheelColumn({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const lastReported = useRef(value);

  useEffect(() => {
    const idx = Math.max(0, options.indexOf(value));
    if (ref.current) ref.current.scrollTop = idx * ITEM_HEIGHT;
    // Only ever re-sync from an external value change (e.g. opening
    // the sheet with an existing DOB) — never on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const idx = Math.max(0, Math.min(options.length - 1, Math.round(el.scrollTop / ITEM_HEIGHT)));
      el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
      const next = options[idx];
      if (next !== lastReported.current) {
        lastReported.current = next;
        onChange(next);
      }
    }, 90);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="flex-1 snap-y snap-mandatory overflow-y-scroll scroll-smooth [&::-webkit-scrollbar]:hidden"
      style={{ height: WHEEL_HEIGHT, paddingTop: PAD, paddingBottom: PAD, scrollbarWidth: "none" }}
    >
      {options.map((opt) => (
        <div
          key={opt}
          className={`flex snap-center items-center justify-center text-[17px] font-semibold transition-colors ${
            opt === value ? "text-[var(--iv2-text-primary)]" : "text-[var(--iv2-text-muted)]"
          }`}
          style={{ height: ITEM_HEIGHT }}
        >
          {opt}
        </div>
      ))}
    </div>
  );
}

// The actual three-wheel picker — split out from DobWheelSheet so it
// only ever exists (and only ever calls useState's initializer) while
// the sheet is open. Remounting on every open, rather than one
// long-lived instance synced via an effect, is what gives a reopen
// (e.g. to adjust an already-picked date) a fresh starting position
// with no extra state-sync effect at all.
function DobWheelPicker({ value, onClose, onConfirm }: { value: string; onClose: () => void; onConfirm: (v: string) => void }) {
  const digits = value.replace(/\D/g, "");
  const initMonth = digits.length >= 2 && Number(digits.slice(0, 2)) >= 1 && Number(digits.slice(0, 2)) <= 12 ? MONTHS[Number(digits.slice(0, 2)) - 1] : MONTHS[0];
  const initDay = digits.length >= 4 ? String(Number(digits.slice(2, 4)) || 1) : "1";
  const initYear = digits.length >= 8 ? digits.slice(4, 8) : String(CURRENT_YEAR - 30);

  const [month, setMonth] = useState(initMonth);
  const [day, setDay] = useState(initDay);
  const [year, setYear] = useState(initYear);

  // Rebuilt from scratch on every render off month/year — cheap, and
  // means there's no separate state to fall out of sync with the two
  // values it depends on. When the currently-picked day no longer
  // exists in the new list (e.g. was "31" and the month became
  // February), it clamps down to that month's actual last day instead
  // of silently keeping an impossible date like Feb 31 selected.
  const maxDay = daysInMonth(month, year);
  const dayOptions = Array.from({ length: maxDay }, (_, i) => String(i + 1));
  const effectiveDay = Number(day) > maxDay ? String(maxDay) : day;

  const confirm = () => {
    const mm = String(MONTHS.indexOf(month) + 1).padStart(2, "0");
    const dd = effectiveDay.padStart(2, "0");
    onConfirm(`${mm}/${dd}/${year}`);
    onClose();
  };

  return (
    <>
      <div className="mb-1 text-center text-xl font-bold text-[var(--iv2-text-primary)]">When were you born?</div>
      <div className="mx-auto mb-5 max-w-[260px] text-center text-sm leading-[1.4] text-[var(--iv2-text-secondary)]">
        This is used to verify your identity.
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 -translate-y-1/2 rounded-xl bg-[var(--iv2-brand-tint)]" style={{ height: ITEM_HEIGHT }} />
        <div className="relative z-10 flex">
          <WheelColumn options={MONTHS} value={month} onChange={setMonth} />
          <WheelColumn key={maxDay} options={dayOptions} value={effectiveDay} onChange={setDay} />
          <WheelColumn options={YEARS} value={year} onChange={setYear} />
        </div>
      </div>

      <Button onClick={confirm} className="mt-5 h-14 w-full">
        Done
      </Button>
    </>
  );
}

// Apple-style wheel picker, in a bottom sheet — replaces free-text DOB
// entry wherever tapping the field should feel like the reference's
// "When were you born?" screen: three scroll-snapped columns (Month
// spelled out, Day, Year) with a fixed highlight band behind the
// centered row, and a single "Continue" that commits the combined
// date back to the same "MM/DD/YYYY" string every other DOB field in
// the app already uses.
export function DobWheelSheet({
  open,
  onClose,
  value,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onConfirm: (v: string) => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} zIndex={80} maxHeight="none">
      {open ? <DobWheelPicker value={value} onClose={onClose} onConfirm={onConfirm} /> : null}
    </BottomSheet>
  );
}
