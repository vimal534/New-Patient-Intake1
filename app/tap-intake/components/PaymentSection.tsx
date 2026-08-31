"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { useVisit } from "../state";
import { ON_FILE_RECORD } from "../mockData";
import { OptionTile, PrimaryButton, QuestionBlock, StepHeader, TextField, TextLink } from "./ui";

// --- Formatting helpers -----------------------------------------------
// Card number: digits only, capped at 16, grouped into 4s as the parent
// types — "4242424242424242" -> "4242 4242 4242 4242".
function formatCardNumber(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(" ") ?? digits;
}

// Expiry: single MM/YY field, slash inserted automatically — never typed.
// Handles the common "backspace right after the auto-inserted /" case
// specially (see handleExpiryKeyDown) so deleting feels natural instead of
// getting stuck bouncing off the slash.
function formatExpiry(digits: string) {
  const d = digits.slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d.length === 2 ? `${d}/` : d;
}

function expiryMonthValid(digits: string) {
  if (digits.length < 2) return true; // not enough typed yet to judge
  const mm = parseInt(digits.slice(0, 2), 10);
  return mm >= 1 && mm <= 12;
}

// One component for both patient types, same as before this redesign —
// `hasCardOnFile` (only ever true for returning patients, via
// ON_FILE_RECORD.payment.cardLast4) is what already made "Card on file"
// appear or not; nothing about the new 3-step shape needed a New/Returning
// split. Rebuilt from a reference: select method -> (new card details,
// only if chosen) -> a review/confirm step before the final action,
// instead of the old single screen with inline card fields and an
// immediate "Continue".
export function PaymentSection({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const p = state.payment;
  const hasCardOnFile = !!p.cardLast4;

  const [step, setStep] = useState<"select" | "newCard" | "confirm">("select");

  const cardDigits = p.newCard.number.replace(/\D/g, "");
  const expDigits = p.newCard.exp.replace(/\D/g, "");
  const zipDigits = p.newCard.zip.replace(/\D/g, "");

  const cardValid = cardDigits.length === 16;
  const expValid = expDigits.length === 4 && expiryMonthValid(expDigits);
  const zipValid = zipDigits.length === 5;

  const [touched, setTouched] = useState({ number: false, exp: false, zip: false });
  const expiryRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  // Only returning patients have a real copay figure (ON_FILE_RECORD) —
  // a new patient's coverage was just entered this visit and hasn't been
  // through eligibility, so there's nothing real to quote yet. Extracting
  // just the "$25" out of "$25 for this visit type" keeps the big
  // confirm-step figure clean; the descriptive tail is redundant with the
  // "For" row below it anyway.
  const copayMatch = state.coverage.copay.match(/\$[\d,.]+/);
  const copayAmount = copayMatch ? copayMatch[0] : null;

  // What this payment is actually for — a scheduled visit type/time for
  // returning patients (on file), or just today's stated concern for new
  // patients (no appointment record exists for them yet — see
  // VisitCompleteScreen's identical reasoning).
  const visitLabel =
    state.patientType === "returning"
      ? `${ON_FILE_RECORD.nextVisit.visitType} · ${ON_FILE_RECORD.nextVisit.date} ${ON_FILE_RECORD.nextVisit.time}`
      : state.concern.reason
        ? `Visit for ${state.concern.reason.toLowerCase()}`
        : "Today's visit";

  function handleCardNumberChange(raw: string) {
    const formatted = formatCardNumber(raw);
    dispatch({ type: "SET_NEW_CARD_FIELD", field: "number", value: formatted });
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 16) {
      setTouched((t) => ({ ...t, number: true }));
      expiryRef.current?.focus(); // triggers this field's onBlur too
    }
  }

  function handleExpiryChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    const formatted = formatExpiry(digits);
    dispatch({ type: "SET_NEW_CARD_FIELD", field: "exp", value: formatted });
    if (digits.length === 4) {
      setTouched((t) => ({ ...t, exp: true }));
      zipRef.current?.focus();
    }
  }

  function handleExpiryKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Backspace right after "MM/" should remove the digit AND the slash in
    // one tap, not just the slash (which our own formatting would
    // immediately re-insert, leaving backspace feeling stuck).
    if (e.key === "Backspace" && p.newCard.exp.endsWith("/")) {
      e.preventDefault();
      const digits = p.newCard.exp.replace(/\D/g, "").slice(0, -1);
      dispatch({ type: "SET_NEW_CARD_FIELD", field: "exp", value: formatExpiry(digits) });
    }
  }

  function handleZipChange(raw: string) {
    dispatch({ type: "SET_NEW_CARD_FIELD", field: "zip", value: raw.replace(/\D/g, "").slice(0, 5) });
  }

  function complete() {
    dispatch({ type: "MARK_SECTION_READY", key: "payment" });
    onDone();
  }

  if (step === "select") {
    const canContinue = p.method === "on_file" || p.method === "new_card";
    return (
      <>
        <StepHeader eyebrow="Payment" stepLabel="Step 1 of 3" progressPercent={33} onBack={onDone} />

        <QuestionBlock
          eyebrow="Copay / payment"
          prompt={`How would you like to pay ${copayAmount ? `today's ${copayAmount}` : "today's copay"}?`}
        >
          <div className="flex flex-col gap-2">
            {hasCardOnFile ? (
              <OptionTile
                label={`Card on file · •••• ${p.cardLast4}`}
                selected={p.method === "on_file"}
                onClick={() => dispatch({ type: "SET_PAYMENT_METHOD", method: "on_file" })}
              />
            ) : null}
            <OptionTile
              label="New card"
              selected={p.method === "new_card"}
              onClick={() => dispatch({ type: "SET_PAYMENT_METHOD", method: "new_card" })}
            />
          </div>
        </QuestionBlock>

        <PrimaryButton
          disabled={!canContinue}
          onClick={() => setStep(p.method === "new_card" ? "newCard" : "confirm")}
        >
          Continue
        </PrimaryButton>

        <div className="text-center">
          <TextLink
            onClick={() => {
              dispatch({ type: "SET_PAYMENT_METHOD", method: "at_visit" });
              setStep("confirm");
            }}
          >
            I&apos;ll pay at the visit instead
          </TextLink>
        </div>
      </>
    );
  }

  if (step === "newCard") {
    return (
      <>
        <StepHeader eyebrow="Payment" stepLabel="Step 2 of 3" progressPercent={66} onBack={() => setStep("select")} />

        <h2 className="mt-1 text-lg font-bold text-ink">
          Add a new card{copayAmount ? ` for today's ${copayAmount}` : ""}
        </h2>

        <div className="grid gap-3">
          <TextField
            label="Card number"
            value={p.newCard.number}
            onChange={handleCardNumberChange}
            onBlur={() => setTouched((t) => ({ ...t, number: true }))}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            autoComplete="cc-number"
            icon="💳"
            error={touched.number && !cardValid ? (cardDigits.length === 0 ? "Card number is required" : "Enter all 16 digits") : undefined}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Expiry"
              value={p.newCard.exp}
              onChange={handleExpiryChange}
              onKeyDown={handleExpiryKeyDown}
              onBlur={() => setTouched((t) => ({ ...t, exp: true }))}
              inputRef={expiryRef}
              placeholder="MM/YY"
              inputMode="numeric"
              autoComplete="cc-exp"
              maxLength={5}
              error={
                touched.exp && !expValid
                  ? expDigits.length === 0
                    ? "Expiry is required"
                    : !expiryMonthValid(expDigits)
                      ? "Enter a valid month (01–12)"
                      : "Enter MM/YY"
                  : undefined
              }
            />
            <TextField
              label="ZIP"
              value={p.newCard.zip}
              onChange={handleZipChange}
              onBlur={() => setTouched((t) => ({ ...t, zip: true }))}
              inputRef={zipRef}
              placeholder="78701"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              error={touched.zip && !zipValid ? (zipDigits.length === 0 ? "ZIP is required" : "Enter a 5-digit ZIP") : undefined}
            />
          </div>
        </div>

        <div className="text-xs text-muted">
          🔒 Encrypted and processed by Stripe. We never see your card number. UI only — no real processing in this
          prototype.
        </div>

        <PrimaryButton disabled={!(cardValid && expValid && zipValid)} onClick={() => setStep("confirm")}>
          Save card and continue
        </PrimaryButton>
      </>
    );
  }

  // step === "confirm"
  const methodLabel =
    p.method === "at_visit"
      ? "Pay at the visit"
      : p.method === "new_card"
        ? `New card ending ${cardDigits.slice(-4) || "----"}`
        : `Card on file ending ${p.cardLast4}`;
  const cta =
    p.method === "at_visit" ? "Confirm — I'll pay at the visit" : copayAmount ? `Pay ${copayAmount}` : "Confirm payment method";

  return (
    <>
      <StepHeader
        eyebrow="Payment"
        stepLabel="Step 3 of 3"
        progressPercent={100}
        onBack={() => setStep(p.method === "new_card" ? "newCard" : "select")}
      />

      <h2 className="mt-1 text-xl font-bold text-ink">Your copay.</h2>
      <p className="text-sm text-muted">
        {p.method === "at_visit"
          ? "Settle this when you arrive."
          : "Confirm now to skip the front desk, or go back and change how you pay."}
      </p>

      <div className="rounded-2xl border border-teal bg-white p-4">
        <div className="text-[10px] font-bold uppercase tracking-wide text-muted-2">
          {copayAmount ? "Amount due" : "Copay"}
        </div>
        <div className="mt-1 text-3xl font-bold text-ink">{copayAmount ?? "Confirmed at check-in"}</div>
        <div className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted">To</span>
            <span className="text-right text-ink">Brightline Pediatrics</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">For</span>
            <span className="text-right text-ink">{visitLabel}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted">Method</span>
            <span className="text-right text-ink">{methodLabel}</span>
          </div>
        </div>
      </div>

      {p.method !== "at_visit" ? (
        <TextLink onClick={() => setStep("select")}>Need a different card? Change payment method.</TextLink>
      ) : null}

      <PrimaryButton onClick={complete}>{cta}</PrimaryButton>
    </>
  );
}
