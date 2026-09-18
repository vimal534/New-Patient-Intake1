"use client";

import { useState } from "react";
import { Ctx } from "../../ctx";
import { CalendarIcon, ShieldCheckIcon } from "../Icons";
import { DobWheelSheet } from "../sheets/DobWheelSheet";
import { Button, InputField } from "../ui";

// "That's not me," reached from VerifyIntroScreen — the identified
// PATIENT is wrong (as opposed to "I can't access this number," where
// the right patient just can't use that phone; that's a different
// recovery path this screen must not be conflated with). Deliberately
// does not let the visitor edit the phone number on file — instead it's
// a fully separate identity check: full name + date of birth, the same
// two facts front-desk staff would ask for in person. Rendered by
// page.tsx in place of the normal flow (state.identityFallbackOpen)
// rather than as its own flow step, so dismissing it or finishing it
// never has to unwind a skipped step in `idx`.
//
// There's no real backend to re-verify against here — "Continue" just
// treats the shared details as identity confirmed (the same trust an
// OTP tap would have granted) and lands on the appointment hub
// (`welcome`) exactly where a normal phone verification would have,
// rather than adding an extra "thanks, that's on file" confirmation
// step in between.
export function IdentityFallbackScreen({ ctx }: { ctx: Ctx }) {
  const { update, go } = ctx;
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const ready = name.trim().length > 0 && dob.length === 10;
  const close = () => update({ identityFallbackOpen: false });
  const continueVerified = () => {
    if (!ready) return;
    update({ identityFallbackOpen: false });
    go("welcome");
  };

  return (
    <div className="flex min-h-full flex-col px-6 pt-10 pb-6 text-center">
      <div className="mx-auto mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
        <ShieldCheckIcon size={36} />
      </div>

      <div className="mb-3 text-[28px] leading-[1.2] font-bold text-[var(--iv2-text-primary)]">Verify a different way</div>
      <div className="mx-auto mb-7 max-w-[300px] text-base leading-[1.5] text-[var(--iv2-text-secondary)]">
        That number isn&apos;t you. Share a few details to verify your identity.
      </div>

      <div className="flex flex-col gap-3.5 text-left">
        <InputField label="Patient's full name" value={name} placeholder="Full name" onChange={setName} />
        <div>
          <div className="mb-1.5 text-sm font-semibold text-[var(--iv2-text-muted)]">Date of birth</div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-13 w-full cursor-pointer items-center justify-between rounded-xl border border-[var(--iv2-border)] bg-[var(--iv2-surface)] px-3.5 text-left outline-none transition-colors hover:border-[var(--iv2-text-muted)]"
            style={{ height: 52 }}
          >
            <span className={`text-[17px] font-semibold ${dob ? "text-[var(--iv2-text-primary)]" : "text-[var(--iv2-text-muted)]"}`}>{dob || "MM/DD/YYYY"}</span>
            <CalendarIcon size={18} />
          </button>
        </div>
      </div>

      <DobWheelSheet open={pickerOpen} onClose={() => setPickerOpen(false)} value={dob} onConfirm={setDob} />

      <div className="mt-auto pt-8">
        <Button onClick={continueVerified} disabled={!ready} className="h-14 w-full">
          Continue
        </Button>

        <Button variant="tertiary" onClick={close} className="mt-2 h-11 w-full">
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
