"use client";

import { Ctx } from "../../ctx";
import { formatCardExpiry, formatDigits } from "../../format";
import { ChevronLeftIcon } from "../Icons";
import { BottomSheet, InputField } from "../ui";

// Add new card sheet — live preview mirrors the typed fields as they're
// entered.
export function AddCardSheet({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  const digits = state.cardNumber.replace(/\D/g, "").padEnd(16, "•");
  const previewNumber = `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12, 16)}`;
  const enoughDigits = state.cardNumber.replace(/\D/g, "").length >= 4;

  const close = () => update({ cardSheetOpen: false });

  const save = () => {
    const last4 = state.cardNumber.replace(/\D/g, "").slice(-4) || "4242";
    const id = `c${state.cards.length + 1}`;
    update((s) => ({
      cardSheetOpen: false,
      methodsOpen: false,
      cardNumber: "",
      cardExp: "",
      cardCvc: "",
      cardName: "",
      selectedCardId: id,
      cards: [...s.cards, { id, brand: "VISA", name: `Visa •••• ${last4}`, last4, exp: "04/29", expired: false, isDefault: false }],
    }));
    ctx.showToast("Card added successfully");
  };

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
          <div className="text-2xl font-extrabold text-white italic">VISA</div>
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
            onChange={(v) => update({ cardNumber: v.replace(/[^0-9 ]/g, "") })}
          />
        </div>
        <div className="mt-3.5 flex gap-3">
          <div className="flex-1">
            <InputField
              label="Expiration date"
              value={state.cardExp}
              placeholder="MM / YY"
              inputMode="numeric"
              onChange={(v) => update({ cardExp: formatCardExpiry(v) })}
            />
          </div>
          <div className="flex-1">
            <InputField
              label="CVV"
              value={state.cardCvc}
              placeholder="123"
              inputMode="numeric"
              onChange={(v) => update({ cardCvc: formatDigits(v, 4) })}
            />
          </div>
        </div>
        <div className="mt-3.5">
          <InputField label="Cardholder name" value={state.cardName} placeholder="Jane Doe" onChange={(v) => update({ cardName: v })} />
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
      </div>

      <button
        type="button"
        onClick={save}
        disabled={!enoughDigits}
        className="mt-5 h-14 w-full shrink-0 rounded-2xl border-none text-base font-bold"
        style={{
          backgroundColor: enoughDigits ? "var(--iv2-brand)" : "var(--iv2-disabled-bg)",
          color: enoughDigits ? "#fff" : "var(--iv2-disabled-fg)",
          cursor: enoughDigits ? "pointer" : "not-allowed",
        }}
      >
        Add card
      </button>
    </BottomSheet>
  );
}
