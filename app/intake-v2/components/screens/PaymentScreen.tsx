"use client";

import { useEffect, useState } from "react";
import { Ctx } from "../../ctx";
import {
  detectCardBrand,
  formatCardExpiry,
  formatCardNumber,
  formatDigits,
  validateCardExpiry,
  validateCardNumber,
  validateCardholderName,
  validateCvv,
} from "../../format";
import { CalendarIcon, CardIcon, CheckIcon, LockIcon, MailIcon, ShieldCheckIcon } from "../Icons";
import { Button, Card, Eyebrow, InputField, ScreenCopy, ScreenTitle } from "../ui";

const BRAND_LABEL: Record<string, string> = { MC: "Mastercard", AMEX: "Amex", VISA: "Visa" };
const BRAND_MARK_BG: Record<string, string> = { AMEX: "#1677E8", MC: "#EB5C1E", VISA: "#1A56B0" };

function GreenCheckBadge() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success)]">
      <CheckIcon size={11} color="#fff" strokeWidth={3} />
    </span>
  );
}

// The two-column Apple Pay / Card toggle — a filled ring with a
// checkmark when selected, an empty ring otherwise, matching the
// reference's radio-style method picker rather than this app's usual
// solid-fill chip (this pair sits above its own detail panel, so the
// selected state needs to read at a glance without taking over the
// whole tile in color).
function MethodTile({ selected, onClick, title, subtitle, icon }: { selected: boolean; onClick: () => void; title: React.ReactNode; subtitle: string; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-2xl border p-4 text-left transition-colors duration-150"
      style={{
        borderColor: selected ? "var(--iv2-brand)" : "var(--iv2-border)",
        backgroundColor: selected ? "var(--iv2-brand-surface)" : "var(--iv2-surface)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 text-base font-bold text-[var(--iv2-text-primary)]">
          {icon}
          {title}
        </span>
        <span
          className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border-2"
          style={{ borderColor: selected ? "var(--iv2-brand)" : "var(--iv2-border-strong)", backgroundColor: selected ? "var(--iv2-brand)" : "transparent" }}
        >
          {selected ? <CheckIcon size={11} color="#fff" strokeWidth={3} /> : null}
        </span>
      </div>
      <div className="mt-2 text-sm leading-[1.35] text-[var(--iv2-text-secondary)]">{subtitle}</div>
    </button>
  );
}

// Screen 12 — Payment. "Your copay" hero card, then a two-column Apple
// Pay / Card method picker (reference: two ringed tiles, not a stacked
// pair of full-width rows). Picking "Card" with nothing on file drops
// straight into an inline "Card details" form on this same screen —
// no bottom sheet — and a completed, valid form saves itself onto
// state.cards the moment it validates, the same way AddCardSheet's
// "Add card" used to, so the shared Footer's "Pay $40.00" gate (which
// only checks state.cards/selectedCardId) lights up without needing
// its own submit step. A card already on file instead shows as a flat
// "Selected card" summary with an "Edit" link back into the existing
// multi-card switcher sheet.
export function PaymentScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const selCard = state.cards.find((c) => c.id === state.selectedCardId && !c.expired) || null;
  const applePaySelected = state.selectedCardId === "applepay";
  const cardholderName = state.guardian1.name.trim() || state.scheduling.patientName;

  const chooseApple = () => update({ selectedCardId: "applepay" });
  const chooseCard = () => update({ selectedCardId: state.cards[0] ? state.cards[0].id : null });

  const [zip, setZip] = useState("");
  const digits = state.cardNumber.replace(/\D/g, "");
  const brand = detectCardBrand(digits);
  const cardNumberValid = !validateCardNumber(state.cardNumber);
  const cardExpValid = !validateCardExpiry(state.cardExp);
  const cardCvcValid = !validateCvv(state.cardCvc, brand);
  const cardNameValid = !validateCardholderName(state.cardName);
  const zipValid = /^\d{5}$/.test(zip);
  const cardFormValid = cardNumberValid && cardExpValid && cardCvcValid && cardNameValid && zipValid;

  // Finalize the card onto state.cards the instant every field reads
  // valid — mirrors AddCardSheet's finalizeCard(), just triggered by
  // the form becoming complete instead of a separate "Add card" tap.
  useEffect(() => {
    if (!cardFormValid || applePaySelected || selCard) return;
    const last4 = digits.slice(-4);
    const id = `c${state.cards.length + 1}`;
    const savedBrand = brand ?? "VISA";
    update((s) => ({
      selectedCardId: id,
      cards: [...s.cards, { id, brand: savedBrand, name: `${BRAND_LABEL[savedBrand]} •••• ${last4}`, last4, exp: state.cardExp.replace(/\s/g, ""), expired: false, isDefault: false }],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardFormValid]);

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

      <div className="grid grid-cols-2 gap-2.5">
        <MethodTile selected={applePaySelected} onClick={chooseApple} title="Pay" subtitle="Pay quickly and securely" />
        <MethodTile
          selected={!applePaySelected}
          onClick={chooseCard}
          title="Card"
          subtitle="Visa, Mastercard, Amex, Discover"
          icon={<CardIcon size={17} color="var(--iv2-text-primary)" />}
        />
      </div>

      {!applePaySelected && selCard ? (
        <div className="mt-3 rounded-2xl border border-[var(--iv2-card-border)] bg-[var(--iv2-surface)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-bold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Selected card</div>
            <button
              type="button"
              onClick={() => update({ selectedCardId: null, cardName: cardholderName, cardExp: formatCardExpiry(selCard.exp), cardNumber: "", cardCvc: "" })}
              className="cursor-pointer border-none bg-transparent text-sm font-semibold text-[var(--iv2-brand)]"
            >
              Edit
            </button>
          </div>
          <div className="flex items-center gap-3.5">
            <span
              className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
              style={{ backgroundColor: BRAND_MARK_BG[selCard.brand] }}
            >
              {selCard.brand}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-[var(--iv2-text-primary)]">
                {BRAND_LABEL[selCard.brand]} ending in {selCard.last4}
              </div>
              <div className="mt-0.5 text-sm text-[var(--iv2-text-secondary)]">Expires {selCard.exp}</div>
              <div className="text-sm text-[var(--iv2-text-secondary)]">{cardholderName}</div>
            </div>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-success)]">
              <CheckIcon size={13} color="#fff" strokeWidth={3} />
            </span>
          </div>
        </div>
      ) : null}

      {!applePaySelected && !selCard ? (
        <div className="mt-3 rounded-2xl border border-[var(--iv2-card-border)] bg-[var(--iv2-surface)] p-4">
          <div className="mb-3.5 text-base font-bold text-[var(--iv2-text-primary)]">Card details</div>
          <div className="flex flex-col gap-3.5">
            <InputField
              label="Name on card"
              value={state.cardName}
              placeholder="Jane Doe"
              onChange={(v) => update({ cardName: v })}
              rightAdornment={cardNameValid ? <GreenCheckBadge /> : null}
            />
            <InputField
              label="Card number"
              value={state.cardNumber}
              placeholder="1234 1234 1234 1234"
              inputMode="numeric"
              onChange={(v) => update({ cardNumber: formatCardNumber(v) })}
              rightAdornment={cardNumberValid ? <GreenCheckBadge /> : null}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <InputField
                  label="Expiration date"
                  value={state.cardExp}
                  placeholder="MM / YY"
                  inputMode="numeric"
                  onChange={(v) => update({ cardExp: formatCardExpiry(v) })}
                  rightAdornment={cardExpValid ? <GreenCheckBadge /> : null}
                />
              </div>
              <div className="flex-1">
                <InputField
                  label="CVV"
                  value={state.cardCvc}
                  placeholder="123"
                  inputMode="numeric"
                  onChange={(v) => update({ cardCvc: formatDigits(v, 4) })}
                  rightAdornment={cardCvcValid ? <GreenCheckBadge /> : null}
                />
              </div>
            </div>
            <InputField
              label="Billing ZIP code"
              value={zip}
              placeholder="12345"
              inputMode="numeric"
              onChange={(v) => setZip(formatDigits(v, 5))}
              rightAdornment={zipValid ? <GreenCheckBadge /> : null}
            />
          </div>

          <button
            type="button"
            onClick={() => update({ saveCardChecked: !state.saveCardChecked })}
            className="mt-4 flex w-full cursor-pointer items-start gap-3 border-none bg-transparent p-0 text-left"
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-[1.5px] text-[13px] font-extrabold text-white"
              style={{
                borderColor: state.saveCardChecked ? "var(--iv2-brand)" : "var(--iv2-border-strong)",
                backgroundColor: state.saveCardChecked ? "var(--iv2-brand)" : "#fff",
              }}
            >
              {state.saveCardChecked ? "✓" : ""}
            </span>
            <span>
              <span className="block text-[15px] font-semibold text-[var(--iv2-text-primary)]">Save this card for future payments</span>
              <span className="mt-0.5 block text-sm text-[var(--iv2-text-secondary)]">You can remove it anytime.</span>
            </span>
          </button>
        </div>
      ) : null}

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
