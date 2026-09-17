"use client";

import { useState } from "react";
import { Ctx } from "../../ctx";
import { CalendarIcon, CardIcon, ChevronRightIcon, LockIcon, MailIcon, ShieldCheckIcon } from "../Icons";
import { Button, Card, Divider, Eyebrow, InputField, ScreenCopy, ScreenTitle } from "../ui";

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
    <div className="px-6 pt-5 pb-6">
      <ScreenTitle>Your copay</ScreenTitle>
      <ScreenCopy className="mb-6">Review your copay and payment method.</ScreenCopy>

      <Card>
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--iv2-brand-tint)]">
            <CalendarIcon size={20} color="var(--iv2-brand)" />
          </div>
          <div>
            <div className="text-[15px] text-[var(--iv2-text-secondary)]">Due today</div>
            <div className="text-2xl font-bold text-[var(--iv2-text-primary)]">$40.00</div>
          </div>
        </div>
      </Card>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <Eyebrow muted>Payment method</Eyebrow>
        <div className="flex items-center gap-1.5 text-sm text-[var(--iv2-text-secondary)]">
          <LockIcon />
          Secure payment
        </div>
      </div>

      {applePaySelected || selCard ? (
        <div
          className="overflow-hidden rounded-[22px] border border-[var(--iv2-card-border)] transition-shadow duration-150 hover:shadow-[0_16px_40px_rgba(27,38,36,0.08)]"
          style={{ background: "var(--iv2-brand-surface)" }}
        >
          {applePaySelected ? (
            <div className="flex items-center gap-3.5 p-4">
              <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--iv2-text-primary)] text-[11px] font-bold text-white">
                APPLE
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold text-[var(--iv2-text-primary)]">Apple Pay</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--iv2-surface)] px-2 py-0.5 text-xs font-bold text-[var(--iv2-success)]">
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
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--iv2-surface)] px-2 py-0.5 text-xs font-bold text-[var(--iv2-success)]">
                  ✓ Card on file
                </div>
              </div>
            </div>
          ) : null}

          <Divider style={{ backgroundColor: "rgba(22,119,232,0.14)" }} />

          <button
            type="button"
            onClick={() => update({ methodsOpen: true })}
            className="flex w-full cursor-pointer items-center justify-between gap-3 p-4"
          >
            <span className="text-base font-semibold text-[var(--iv2-brand-hover)]">Change payment method</span>
            <ChevronRightIcon color="var(--iv2-brand-hover)" />
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => update({ cardSheetOpen: true })}
            className="flex w-full cursor-pointer items-center gap-3.5 rounded-[22px] border border-[var(--iv2-card-border)] p-4 text-left transition-shadow duration-150 hover:shadow-[0_16px_40px_rgba(27,38,36,0.08)]"
            style={{ background: "var(--iv2-brand-surface)" }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-surface)]">
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
            className="mt-2.5 flex w-full cursor-pointer items-center gap-3.5 rounded-[22px] border border-[var(--iv2-card-border)] p-4 text-left transition-shadow duration-150 hover:shadow-[0_16px_40px_rgba(27,38,36,0.08)]"
            style={{ background: "var(--iv2-surface-muted)" }}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-surface)] text-[11px] font-bold text-[var(--iv2-text-primary)]">
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

      <div
        className="mt-3 flex items-start gap-3 rounded-[22px] border border-[var(--iv2-card-border)] p-4"
        style={{ background: "var(--iv2-success-surface)" }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-surface)]">
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
        <div className="rounded-[22px] border border-[var(--iv2-brand)] bg-[var(--iv2-surface)] p-4">
          <InputField label="Email receipt" value={draftEmail} placeholder="name@email.com" inputMode="email" onChange={setDraftEmail} />
          <div className="mt-3.5 flex gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => setEditingEmail(false)} className="h-11 flex-1">
              Cancel
            </Button>
            <Button size="sm" onClick={saveEmailEdit} disabled={!draftEmail.trim()} className="h-11 flex-1">
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3.5 rounded-[22px] border border-[var(--iv2-card-border)] bg-[var(--iv2-surface)] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--iv2-surface)]">
            <MailIcon color="var(--iv2-brand)" />
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
