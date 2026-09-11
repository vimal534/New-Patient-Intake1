"use client";

import { useState } from "react";
import { Ctx } from "../../ctx";
import { REVIEW_TITLE } from "../../constants";
import { CalendarIcon, CardIcon, ChevronRightIcon, LockIcon, MailIcon, ShieldCheckIcon } from "../Icons";
import { Card, Divider, Eyebrow, InputField, ScreenCopy, ScreenTitle } from "../ui";

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

  // The receipt goes to the patient's own email on file, not a hardcoded
  // placeholder — falls back the same way ConfirmInfoScreen does when
  // it's still blank this early in a new-patient flow.
  const receiptEmail = state.personal.email || `${state.scheduling.patientName.split(" ")[0].toLowerCase()}@email.com`;
  const [editingEmail, setEditingEmail] = useState(false);
  const [draftEmail, setDraftEmail] = useState(receiptEmail);
  const openEmailEdit = () => {
    setDraftEmail(receiptEmail);
    setEditingEmail(true);
  };
  const saveEmailEdit = () => {
    const v = draftEmail.trim();
    if (v) update((s) => ({ personal: { ...s.personal, email: v } }));
    setEditingEmail(false);
  };

  return (
    <div className="px-6 pt-7 pb-6">
      <Eyebrow>{state.reviewingFromSuccess ? REVIEW_TITLE.payment : "Payment"}</Eyebrow>
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
        <div className="text-[17px] font-bold text-[var(--iv2-text-primary)]">{state.scheduling.reason}</div>
        <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">Tomorrow · 8:00 AM · Main St. Clinic</div>
      </Card>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <Eyebrow muted>Payment method</Eyebrow>
        <div className="flex items-center gap-1.5 text-sm text-[var(--iv2-text-secondary)]">
          <LockIcon />
          Secure payment
        </div>
      </div>

      {applePaySelected || selCard ? (
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
          ) : null}

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
      ) : (
        <div>
          <div className="flex items-start gap-3.5 rounded-2xl bg-[var(--iv2-brand-surface)] p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
              <ShieldCheckIcon size={22} />
            </span>
            <div>
              <div className="text-base font-bold text-[var(--iv2-text-primary)]">Add a payment method</div>
              <div className="mt-0.5 text-[15px] leading-[1.4] text-[var(--iv2-text-secondary)]">Choose a secure payment method to complete your check-in.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => update({ methodsOpen: true })}
            className="mt-2.5 flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-[var(--iv2-border)] bg-white p-4 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
              <CardIcon size={20} color="var(--iv2-brand)" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-[var(--iv2-text-primary)]">Credit or debit card</div>
              <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">Visa, Mastercard, Amex, Discover</div>
            </div>
            <ChevronRightIcon />
          </button>

          <button
            type="button"
            onClick={() => update({ selectedCardId: "applepay" })}
            className="mt-2.5 flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border border-[var(--iv2-border)] bg-white p-4 text-left"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-surface-muted)] text-[11px] font-bold text-[var(--iv2-text-primary)]">
              APPLE
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-[var(--iv2-text-primary)]">Apple Pay</div>
              <div className="mt-0.5 text-[15px] text-[var(--iv2-text-secondary)]">Pay quickly and securely</div>
            </div>
            <ChevronRightIcon />
          </button>
        </div>
      )}

      <div className="mt-3 flex items-start gap-3 rounded-2xl bg-[var(--iv2-brand-surface)] p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
          <ShieldCheckIcon size={18} />
        </span>
        <div>
          <div className="text-[15px] font-bold text-[var(--iv2-text-primary)]">Your payment information is encrypted and secure.</div>
          <div className="mt-0.5 text-sm leading-[1.4] text-[var(--iv2-text-secondary)]">We never store your full card number.</div>
        </div>
      </div>

      <div className="mt-6 mb-3">
        <Eyebrow muted>Receipt</Eyebrow>
      </div>
      {editingEmail ? (
        <div className="rounded-2xl border border-[var(--iv2-brand)] bg-white p-4">
          <InputField label="Email receipt" value={draftEmail} placeholder="name@email.com" inputMode="email" onChange={setDraftEmail} />
          <div className="mt-3.5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setEditingEmail(false)}
              className="h-11 flex-1 cursor-pointer rounded-xl border-[1.5px] border-[var(--iv2-border)] bg-white text-[15px] font-bold text-[var(--iv2-text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEmailEdit}
              disabled={!draftEmail.trim()}
              className={`h-11 flex-1 rounded-xl border-none text-[15px] font-bold ${
                draftEmail.trim() ? "cursor-pointer bg-[var(--iv2-brand)] text-white" : "cursor-not-allowed bg-[var(--iv2-disabled-bg)] text-[var(--iv2-disabled-fg)]"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--iv2-border)] bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--iv2-surface-muted)]">
            <MailIcon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-[var(--iv2-text-primary)]">Email receipt</div>
            <div className="mt-px truncate text-[15px] text-[var(--iv2-text-secondary)]">{receiptEmail}</div>
          </div>
          <button
            type="button"
            onClick={openEmailEdit}
            className="shrink-0 cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-brand)]"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
