"use client";

import { Ctx } from "../../ctx";
import { formatPhone } from "../../format";
import { ArrowRightIcon, BoltIcon, ChevronLeftIcon, LockIcon, PhoneIcon, ShieldUserIcon } from "../Icons";
import { InputField } from "../ui";

// Screen 0 (new) — Verify intro. Sits before the OTP auto-fill screen —
// "Text me a code" advances into that existing flow; this screen only
// sets the phone number's expectation and sells why re-verifying is
// quick. No shared header (matches otp/welcome/success) and no shared
// sticky Footer either — the trust line at the very bottom needs to sit
// *below* the action buttons, which the shared Footer can't do, so this
// screen renders its own bottom section and footerFor suppresses the
// shared one for this key.
//
// Phone + OTP is the only verification path now — once it succeeds we
// can identify the patient's appointment for today and take them
// straight into check-in, so there's no DOB/last-name fallback step to
// offer here (that alternate path was removed; see git history for the
// prior "Use another way" version if it's ever needed again).
//
// One inline sub-view, same pattern as HealthScreen's hhEditing focus
// page — a boolean flips this screen's content in place rather than
// becoming its own flow step:
//   - phoneEditOpen: "Edit" next to the masked number, reachable BEFORE
//     any code is sent (not gated behind a failed send).
export function VerifyIntroScreen({ ctx }: { ctx: Ctx }) {
  const { state, update, next } = ctx;

  if (state.phoneEditOpen) {
    return <PhoneEditView ctx={ctx} />;
  }

  return (
    <div className="flex min-h-full flex-col px-6 pt-10 pb-6 text-center">
      <div className="mx-auto mb-4 flex h-[110px] w-[110px] items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(16,24,40,0.08)]">
        <ShieldUserIcon size={44} />
      </div>

      <div className="mt-3 mb-1.5 text-lg font-semibold text-[var(--iv2-brand)]">Welcome back, Jane</div>
      <div className="mb-3 text-[28px] leading-[1.2] font-bold text-[var(--iv2-text-primary)]">Let&apos;s verify it&apos;s you</div>
      <div className="mx-auto mb-7 max-w-[300px] text-base leading-[1.5] text-[var(--iv2-text-secondary)]">
        We&apos;ll send a one-time code to the phone number we have on file.
      </div>

      <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--iv2-border)] p-4 text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iv2-brand-tint)]">
          <PhoneIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Phone on file</div>
          <div className="mt-0.5 text-lg font-bold text-[var(--iv2-text-primary)]">{state.phoneOnFile}</div>
        </div>
        <button
          type="button"
          onClick={() => update({ phoneEditOpen: true, phoneDraft: "" })}
          className="shrink-0 cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-brand)]"
        >
          Edit
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4 text-left">
        <div className="flex items-start gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
            <BoltIcon size={18} />
          </span>
          <div>
            <div className="text-base font-bold text-[var(--iv2-text-primary)]">No password needed</div>
            <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">One tap on the text we send confirms it&apos;s you.</div>
          </div>
        </div>
        <div className="flex items-start gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
            <LockIcon size={16} color="#1677E8" />
          </span>
          <div>
            <div className="text-base font-bold text-[var(--iv2-text-primary)]">Keeps your information safe</div>
            <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">Protects your health information, always.</div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={next}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border-none bg-[var(--iv2-brand)] text-base font-bold text-white"
        >
          Text me a code
          <ArrowRightIcon />
        </button>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--iv2-border-subtle)]" />
          <div className="flex shrink-0 items-center gap-1.5 text-[13px] text-[var(--iv2-text-muted)]">
            <ShieldUserIcon size={14} color="#98A2B3" />
            Your privacy is our priority.
          </div>
          <div className="h-px flex-1 bg-[var(--iv2-border-subtle)]" />
        </div>
      </div>
    </div>
  );
}

// "Edit" next to the masked phone — reachable straight from the intro,
// before any code has ever been sent (fix for the flow that only
// surfaced this after a failed send). Saving re-masks to the new
// number's own last 4 rather than showing it in the clear.
function PhoneEditView({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const digitCount = state.phoneDraft.replace(/\D/g, "").length;

  const cancel = () => update({ phoneEditOpen: false, phoneDraft: "" });
  const save = () => {
    const last4 = state.phoneDraft.replace(/\D/g, "").slice(-4);
    update({ phoneOnFile: `(***) ***-${last4}`, phoneEditOpen: false, phoneDraft: "" });
    ctx.showToast("Phone number updated");
  };

  return (
    <div className="flex min-h-full flex-col px-6 pt-6 pb-6">
      <button type="button" onClick={cancel} className="mb-5 flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-left">
        <ChevronLeftIcon size={12} />
        <span className="text-[15px] font-semibold text-[var(--iv2-text-secondary)]">Back</span>
      </button>

      <div className="mb-1.5 text-[22px] font-bold text-[var(--iv2-text-primary)]">Update your phone number</div>
      <div className="mb-6 text-base leading-[1.5] text-[var(--iv2-text-secondary)]">
        We&apos;ll send your one-time code to this number instead.
      </div>

      <InputField
        label="Mobile number"
        value={state.phoneDraft}
        placeholder="(555) 123-4567"
        inputMode="tel"
        onChange={(v) => update({ phoneDraft: formatPhone(v) })}
      />

      <button
        type="button"
        onClick={save}
        disabled={digitCount < 10}
        className="mt-auto h-14 w-full shrink-0 rounded-full border-none text-base font-bold"
        style={{
          backgroundColor: digitCount >= 10 ? "var(--iv2-brand)" : "var(--iv2-disabled-bg)",
          color: digitCount >= 10 ? "#fff" : "var(--iv2-disabled-fg)",
          cursor: digitCount >= 10 ? "pointer" : "not-allowed",
        }}
      >
        Save number
      </button>
    </div>
  );
}
