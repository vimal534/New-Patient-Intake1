"use client";

import { Ctx } from "../../ctx";
import { CalendarIcon, ChevronRightIcon, MailIcon, ShieldLockIcon } from "../Icons";

const BRAND_LABEL: Record<string, string> = { MC: "mastercard", AMEX: "AMEX", VISA: "VISA" };

// Screen 12 — Payment. Order per README: amount → visit → payment method
// → authorization → pay.
export function PaymentScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const selCard = state.cards.find((c) => c.id === state.selectedCardId && !c.expired) || null;
  const applePaySelected = state.selectedCardId === "applepay";

  return (
    <div className="px-6 pt-7 pb-6">
      <div className="mb-3 text-xl font-bold text-[var(--iv2-text-primary)]">Due today</div>

      <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--iv2-border)] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iv2-brand-tint)]">
          <CalendarIcon size={20} color="#1677E8" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-bold text-[var(--iv2-text-primary)]">Annual Physical</div>
          <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">Tomorrow · 8:00 AM</div>
          <div className="text-[15px] text-[var(--iv2-text-secondary)]">Main St. Clinic</div>
        </div>
        <div className="text-xl font-bold text-[var(--iv2-text-primary)]">$40.00</div>
      </div>

      <div className="my-6.5 flex items-center justify-between">
        <div className="text-lg font-bold text-[var(--iv2-text-primary)]">Payment method</div>
        <div className="flex items-center gap-1.5 text-sm text-[var(--iv2-text-secondary)]">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <rect x="4" y="11" width="16" height="10" rx="2" stroke="#667085" strokeWidth={2} />
            <path d="M8 11V8a4 4 0 018 0v3" stroke="#667085" strokeWidth={2} />
          </svg>
          Secure payment
        </div>
      </div>

      {applePaySelected ? (
        <div
          className="flex min-h-[132px] flex-col justify-center gap-2 rounded-2xl p-5"
          style={{ background: "var(--iv2-brand-gradient)" }}
        >
          <div className="text-2xl font-extrabold text-white italic">Apple Pay</div>
          <div className="text-[15px] text-white/85">Fast, secure and easy.</div>
        </div>
      ) : selCard ? (
        <div
          className="flex min-h-[132px] flex-col justify-between rounded-2xl p-5"
          style={{ background: "var(--iv2-brand-gradient)" }}
        >
          <div className="text-[22px] font-extrabold tracking-[0.02em] text-white italic">
            {BRAND_LABEL[selCard.brand]}
          </div>
          <div>
            <div className="text-[19px] font-semibold tracking-[0.14em] text-white">•••• •••• •••• {selCard.last4}</div>
            <div className="mt-3 flex items-end justify-between">
              <div className="text-[15px] text-white/86">{selCard.exp}</div>
              <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white text-[13px] font-extrabold text-[var(--iv2-brand)]">
                ✓
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-[1.5px] border-dashed border-[var(--iv2-border-strong)] p-6 text-center text-base text-[var(--iv2-text-secondary)]">
          No payment method selected yet.
        </div>
      )}

      <button
        type="button"
        onClick={() => update({ methodsOpen: true })}
        className="mt-3 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--iv2-border)] bg-white p-4"
      >
        <span className="text-base text-[var(--iv2-text-primary)]">Change payment method</span>
        <ChevronRightIcon />
      </button>

      <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[var(--iv2-surface-muted)] p-3.5">
        <ShieldLockIcon />
        <div className="text-[15px] leading-[1.45] text-[var(--iv2-text-secondary)]">
          Your payment information is encrypted and secure.
        </div>
      </div>

      <div className="my-6.5 text-lg font-bold text-[var(--iv2-text-primary)]">Receipt</div>
      <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--iv2-border)] bg-white p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--iv2-surface-muted)]">
          <MailIcon />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-[var(--iv2-text-primary)]">Email receipt</div>
          <div className="mt-px text-[15px] text-[var(--iv2-text-secondary)]">jane.doe@email.com</div>
        </div>
        <button
          type="button"
          onClick={() => update({ privacyOpen: true })}
          className="shrink-0 cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-brand)]"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
