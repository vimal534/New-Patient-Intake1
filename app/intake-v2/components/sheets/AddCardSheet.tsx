"use client";

import { useState } from "react";
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
import { CardBrand } from "../../types";
import { AlertCircleIcon, ChevronLeftIcon } from "../Icons";
import { BottomSheet, CheckIcon, InputField } from "../ui";

const BRAND_LABEL: Record<CardBrand, string> = { VISA: "VISA", MC: "MASTERCARD", AMEX: "AMEX" };

// A well-known "generic decline" test number (Stripe's own convention)
// — lets state 8 (payment error) actually be reached and retried in
// this demo, rather than being a design that can never fire.
const DECLINE_DIGITS = "4000000000000002";

type Touched = { cardNumber: boolean; cardExp: boolean; cardCvc: boolean; cardName: boolean };
const UNTOUCHED: Touched = { cardNumber: false, cardExp: false, cardCvc: false, cardName: false };

// Add new card sheet — live preview mirrors the typed fields as
// they're entered. Every field validates independently (card
// number/expiry/CVV against its detected brand, cardholder name just
// non-empty), surfacing its error only once that field's been left
// (or "Add card" was pressed with something still invalid) so a
// patient mid-keystroke never sees a premature red border. "Add card"
// itself simulates a brief processor round-trip, ending in either the
// success panel or — for the one recognized test-decline number — a
// retryable error banner, so both outcomes are actually reachable.
export function AddCardSheet({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  const [touched, setTouched] = useState<Touched>(UNTOUCHED);
  const [attempted, setAttempted] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "processing" | "error" | "success">("idle");

  const digits = state.cardNumber.replace(/\D/g, "");
  const brand = detectCardBrand(digits);
  const previewDigits = digits.padEnd(16, "•");
  const previewNumber = `${previewDigits.slice(0, 4)} ${previewDigits.slice(4, 8)} ${previewDigits.slice(8, 12)} ${previewDigits.slice(12, 16)}`;

  const cardNumberError = validateCardNumber(state.cardNumber);
  const cardExpError = validateCardExpiry(state.cardExp);
  const cardCvcError = validateCvv(state.cardCvc, brand);
  const cardNameError = validateCardholderName(state.cardName);
  const formValid = !cardNumberError && !cardExpError && !cardCvcError && !cardNameError;

  const showError = (field: keyof Touched) => (touched[field] || attempted) && submitState !== "success";
  const markTouched = (field: keyof Touched) => setTouched((t) => ({ ...t, [field]: true }));

  const resetForm = () => {
    setTouched(UNTOUCHED);
    setAttempted(false);
    setSubmitState("idle");
    update({ cardNumber: "", cardExp: "", cardCvc: "", cardName: "" });
  };
  const close = () => {
    update({ cardSheetOpen: false });
    resetForm();
  };

  const finalizeCard = () => {
    const last4 = digits.slice(-4) || "4242";
    const id = `c${state.cards.length + 1}`;
    const savedBrand = brand ?? "VISA";
    update((s) => ({
      selectedCardId: id,
      cards: [...s.cards, { id, brand: savedBrand, name: `${BRAND_LABEL[savedBrand]} •••• ${last4}`, last4, exp: state.cardExp.replace(/\s/g, ""), expired: false, isDefault: false }],
    }));
  };

  const submit = () => {
    if (!formValid) {
      setAttempted(true);
      return;
    }
    setSubmitState("processing");
    window.setTimeout(() => {
      if (digits === DECLINE_DIGITS) {
        setSubmitState("error");
        return;
      }
      finalizeCard();
      setSubmitState("success");
    }, 700);
  };

  const done = () => {
    update({ cardSheetOpen: false, methodsOpen: false });
    resetForm();
    ctx.showToast("Card added successfully");
  };

  if (submitState === "success") {
    return (
      <BottomSheet open={state.cardSheetOpen} onClose={done} zIndex={78} maxHeight="92%">
        <div className="flex flex-col items-center px-2 py-6 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--iv2-success-surface)]">
            <CheckIcon size={28} color="var(--iv2-success)" strokeWidth={3} />
          </div>
          <div className="mb-2 text-[22px] font-bold text-[var(--iv2-text-primary)]">Card added</div>
          <div className="text-base leading-[1.5] text-[var(--iv2-text-secondary)]">Your card has been saved securely.</div>
          <button type="button" onClick={done} className="mt-8 h-14 w-full cursor-pointer rounded-2xl border-none bg-[var(--iv2-brand)] text-base font-bold text-white">
            Done
          </button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet open={state.cardSheetOpen} onClose={close} zIndex={78} maxHeight="92%">
      <div className="mb-4.5 flex items-center gap-2.5">
        <button type="button" onClick={close} className="flex cursor-pointer items-center border-none bg-transparent p-0">
          <ChevronLeftIcon size={12} />
        </button>
        <div className="mr-6 flex-1 text-center text-[19px] font-bold text-[var(--iv2-text-primary)]">Add new card</div>
      </div>

      <div className="overflow-auto">
        <div className="flex min-h-[126px] flex-col justify-between rounded-2xl p-5" style={{ background: "var(--iv2-card-gradient)" }}>
          <div className="text-2xl font-extrabold text-white italic">{brand ? BRAND_LABEL[brand] : "VISA"}</div>
          <div>
            <div className="text-[19px] font-semibold tracking-[0.14em] text-white">{previewNumber}</div>
            <div className="mt-3 text-[13px] tracking-[0.04em] text-white/82">{state.cardExp || "MM/YY"}</div>
            <div className="text-[13px] tracking-[0.04em] text-white/82">{(state.cardName || "CARDHOLDER NAME").toUpperCase()}</div>
          </div>
        </div>

        <div className="mt-5">
          <InputField
            label="Card number"
            value={state.cardNumber}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            tone={showError("cardNumber") && cardNumberError ? "danger" : "default"}
            errorText={cardNumberError ?? undefined}
            valueColor={digits.length > 0 && !(showError("cardNumber") && cardNumberError) ? "var(--iv2-brand)" : undefined}
            onChange={(v) => update({ cardNumber: formatCardNumber(v) })}
            onBlur={() => markTouched("cardNumber")}
            rightAdornment={
              showError("cardNumber") && cardNumberError ? (
                <AlertCircleIcon />
              ) : brand && digits.length > 0 ? (
                <span className="text-xs font-extrabold text-[var(--iv2-brand)]">{BRAND_LABEL[brand]}</span>
              ) : null
            }
          />
        </div>
        <div className="mt-3.5 flex gap-3">
          <div className="flex-1">
            <InputField
              label="Expiration date"
              value={state.cardExp}
              placeholder="MM / YY"
              inputMode="numeric"
              tone={showError("cardExp") && cardExpError ? "danger" : "default"}
              errorText={cardExpError ?? undefined}
              onChange={(v) => update({ cardExp: formatCardExpiry(v) })}
              onBlur={() => markTouched("cardExp")}
              rightAdornment={showError("cardExp") && cardExpError ? <AlertCircleIcon /> : null}
            />
          </div>
          <div className="flex-1">
            <InputField
              label="CVV"
              value={state.cardCvc}
              placeholder="123"
              inputMode="numeric"
              tone={showError("cardCvc") && cardCvcError ? "danger" : "default"}
              errorText={cardCvcError ?? undefined}
              onChange={(v) => update({ cardCvc: formatDigits(v, 4) })}
              onBlur={() => markTouched("cardCvc")}
              rightAdornment={showError("cardCvc") && cardCvcError ? <AlertCircleIcon /> : null}
            />
          </div>
        </div>
        <div className="mt-3.5">
          <InputField
            label="Cardholder name"
            value={state.cardName}
            placeholder="Jane Doe"
            tone={showError("cardName") && cardNameError ? "danger" : "default"}
            errorText={cardNameError ?? undefined}
            onChange={(v) => update({ cardName: v })}
            onBlur={() => markTouched("cardName")}
            rightAdornment={showError("cardName") && cardNameError ? <AlertCircleIcon /> : null}
          />
        </div>

        <button
          type="button"
          onClick={() => update({ saveCardChecked: !state.saveCardChecked })}
          className="flex w-full cursor-pointer items-start gap-3 border-none bg-transparent pt-4.5 text-left"
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
            <span className="block text-base text-[var(--iv2-text-primary)]">Save this card for future visits</span>
            <span className="mt-0.5 block text-[15px] text-[var(--iv2-text-secondary)]">You can manage your cards anytime.</span>
          </span>
        </button>

        {submitState === "error" ? (
          <div className="mt-4.5 flex items-start gap-2.5 rounded-2xl bg-[var(--iv2-danger-surface)] p-3.5">
            <AlertCircleIcon size={20} />
            <div>
              <div className="text-[15px] font-bold text-[var(--iv2-danger)]">We couldn&apos;t add this card</div>
              <div className="mt-0.5 text-sm leading-[1.4] text-[var(--iv2-text-secondary)]">Please check your card details and try again.</div>
            </div>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={submitState === "processing"}
        className="mt-5 h-14 w-full shrink-0 rounded-2xl border-none text-base font-bold"
        style={{
          backgroundColor: formValid && submitState !== "processing" ? "var(--iv2-brand)" : "var(--iv2-disabled-bg)",
          color: formValid && submitState !== "processing" ? "#fff" : "var(--iv2-disabled-fg)",
          cursor: submitState === "processing" ? "wait" : formValid ? "pointer" : "not-allowed",
        }}
      >
        {submitState === "processing" ? "Adding card…" : "Add card"}
      </button>
    </BottomSheet>
  );
}
