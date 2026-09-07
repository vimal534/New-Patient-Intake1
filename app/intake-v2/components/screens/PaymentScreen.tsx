"use client";

import { Ctx } from "../../ctx";
import { CalendarIcon, ChevronRightIcon, LockIcon, MailIcon, ShieldLockIcon } from "../Icons";
import { Card, Divider, Eyebrow, ScreenCopy, ScreenTitle } from "../ui";

const BRAND_LABEL: Record<string, string> = { MC: "Mastercard", AMEX: "Amex", VISA: "Visa" };
const BRAND_MARK_BG: Record<string, string> = { AMEX: "#1677E8", MC: "#EB5C1E", VISA: "#1A56B0" };

// Screen 12 — Payment. Restyled to a reference: "Your copay" hero card
// (icon + Due today/$amount, then the appointment line), a compact
// on-file card row (small brand mark + masked number + expiry +
// "✓ Card on file" pill) instead of the full gradient hero, and
// small-caps section labels ("PAYMENT METHOD", "RECEIPT") instead of
// bold headings.
export function PaymentScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const selCard = state.cards.find((c) => c.id === state.selectedCardId && !c.expired) || null;
  const applePaySelected = state.selectedCardId === "applepay";

  return (
    <div className="px-6 pt-7 pb-6">
      <Eyebrow>Payment</Eyebrow>
      <ScreenTitle>Your copay</ScreenTitle>
      <ScreenCopy className="mb-6">Review your copay and payment method.</ScreenCopy>

      <Card>
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iv2-brand-tint)]">
            <CalendarIcon size={20} color="#1677E8" />
          </div>
          <div>
            <div className="text-[15px] text-[var(--iv2-text-secondary)]">Due today</div>
            <div className="text-2xl font-bold text-[var(--iv2-text-primary)]">$40.00</div>
          </div>
        </div>
        <Divider className="my-4" />
        <div className="text-[17px] font-bold text-[var(--iv2-text-primary)]">Annual Physical</div>
        <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">Tomorrow · 8:00 AM · Main St. Clinic</div>
      </Card>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <Eyebrow muted>Payment method</Eyebrow>
        <div className="flex items-center gap-1.5 text-sm text-[var(--iv2-text-secondary)]">
          <LockIcon />
          Secure payment
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--iv2-border)] bg-white">
        {applePaySelected ? (
          <div className="flex items-center gap-3.5 p-4">
            <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--iv2-text-primary)] text-[11px] font-bold text-white">
              APPLE
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-[var(--iv2-text-primary)]">Apple Pay</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--iv2-success-surface)] px-2 py-0.5 text-xs font-bold text-[var(--iv2-success)]">
                ✓ Ready to pay
              </div>
            </div>
          </div>
        ) : selCard ? (
          <div className="flex items-center gap-3.5 p-4">
            <span
              className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
              style={{ backgroundColor: BRAND_MARK_BG[selCard.brand] }}
            >
              {selCard.brand}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-[var(--iv2-text-primary)]">
                {BRAND_LABEL[selCard.brand]} •••• {selCard.last4}
              </div>
              <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">Expires {selCard.exp}</div>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--iv2-success-surface)] px-2 py-0.5 text-xs font-bold text-[var(--iv2-success)]">
                ✓ Card on file
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-base text-[var(--iv2-text-secondary)]">No payment method selected yet.</div>
        )}

        <Divider />

        <button
          type="button"
          onClick={() => update({ methodsOpen: true })}
          className="flex w-full cursor-pointer items-center justify-between gap-3 p-4"
        >
          <span className="text-base text-[var(--iv2-text-primary)]">Change payment method</span>
          <ChevronRightIcon />
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[#f4f6f9] p-3.5">
        <ShieldLockIcon size={26} color="var(--iv2-brand)" />
        <div className="text-[15px] leading-[1.45] text-[var(--iv2-text-secondary)]">
          Your payment information is encrypted and secure. We never store your full card number.
        </div>
      </div>

      <div className="mt-6 mb-3">
        <Eyebrow muted>Receipt</Eyebrow>
      </div>
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
