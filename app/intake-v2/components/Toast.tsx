"use client";

import { useEffect } from "react";
import { CheckIcon } from "./ui";

// Brief bottom confirmation toast — "Card added successfully",
// "Payment successful". `key={toastId}` on the mount site (page.tsx)
// forces a fresh mount for every ctx.showToast() call — including two
// calls with the identical message back to back — so the CSS entrance
// animation (globals.css .iv2-toast-pop) always replays. The auto-hide
// timeout calls `onDone` to clear the message in the parent's state
// rather than toggling local visibility, since setting state
// synchronously inside an effect body is the thing to avoid, not
// scheduling a state update for later via a timeout callback.
export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const hide = window.setTimeout(onDone, 2400);
    return () => window.clearTimeout(hide);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDone is a fresh closure every render; re-running the timeout on that alone would never let it fire.
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-[90] flex justify-center px-6" aria-live="polite">
      <div className="iv2-toast-pop flex items-center gap-2.5 rounded-full bg-[var(--iv2-text-primary)] py-3 pr-5 pl-4 shadow-[0_8px_24px_rgba(16,24,40,0.24)]">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success)]">
          <CheckIcon size={11} color="#fff" strokeWidth={3} />
        </span>
        <span className="text-sm font-semibold whitespace-nowrap text-white">{message}</span>
      </div>
    </div>
  );
}
