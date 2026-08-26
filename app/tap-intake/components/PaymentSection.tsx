"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { useVisit } from "../state";
import { Chip, PrimaryButton, QuestionBlock, TextField } from "./ui";

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

export function PaymentSection({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const p = state.payment;
  const hasCardOnFile = !!p.cardLast4;

  const cardDigits = p.newCard.number.replace(/\D/g, "");
  const expDigits = p.newCard.exp.replace(/\D/g, "");
  const zipDigits = p.newCard.zip.replace(/\D/g, "");

  const cardValid = cardDigits.length === 16;
  const expValid = expDigits.length === 4 && expiryMonthValid(expDigits);
  const zipValid = zipDigits.length === 5;

  const [touched, setTouched] = useState({ number: false, exp: false, zip: false });
  const expiryRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const canContinue =
    p.method === "at_visit" ||
    (p.method === "on_file" && hasCardOnFile) ||
    (p.method === "new_card" && cardValid && expValid && zipValid);

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

  return (
    <>
      <QuestionBlock eyebrow="Copay / payment" prompt={`How would you like to handle today's ${state.coverage.copay || "copay"}?`}>
        <div className="flex flex-wrap gap-2">
          {hasCardOnFile ? (
            <Chip label={`Card on file · •••• ${p.cardLast4}`} selected={p.method === "on_file"} onClick={() => dispatch({ type: "SET_PAYMENT_METHOD", method: "on_file" })} />
          ) : null}
          <Chip label="New card" selected={p.method === "new_card"} onClick={() => dispatch({ type: "SET_PAYMENT_METHOD", method: "new_card" })} />
          <Chip label="Pay at the visit" selected={p.method === "at_visit"} onClick={() => dispatch({ type: "SET_PAYMENT_METHOD", method: "at_visit" })} />
        </div>
      </QuestionBlock>

      {p.method === "new_card" ? (
        <div className="grid gap-3">
          <TextField
            label="Card number"
            value={p.newCard.number}
            onChange={handleCardNumberChange}
            onBlur={() => setTouched((t) => ({ ...t, number: true }))}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            autoComplete="cc-number"
            error={touched.number && !cardValid ? (cardDigits.length === 0 ? "Card number is required" : "Enter all 16 digits") : undefined}
          />
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
          <div className="col-span-full text-xs text-[var(--color-muted)]">UI only — no real card processing in this prototype.</div>
        </div>
      ) : null}

      <PrimaryButton
        disabled={!canContinue}
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "payment" });
          onDone();
        }}
      >
        Continue
      </PrimaryButton>
    </>
  );
}
