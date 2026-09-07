"use client";

import { Ctx } from "../../ctx";
import { BottomSheet, CloseCircleButton } from "../ui";

const MARK_BG: Record<string, string> = { AMEX: "#1677E8", MC: "#EB5C1E", VISA: "#1A56B0" };
const TITLE_BRAND: Record<string, string> = { VISA: "Visa", AMEX: "Amex", MC: "Mastercard" };

// Payment methods sheet — Apple Pay row + saved cards + "Add new card".
// An expired card opens the add-card sheet instead of selecting.
export function PaymentMethodsSheet({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  return (
    <BottomSheet open={state.methodsOpen} onClose={() => update({ methodsOpen: false })} zIndex={72} maxHeight="88%">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[22px] font-bold text-[var(--iv2-text-primary)]">Payment methods</div>
        <CloseCircleButton onClick={() => update({ methodsOpen: false })} />
      </div>

      <div className="overflow-auto">
        <button
          type="button"
          onClick={() => update({ selectedCardId: "applepay", methodsOpen: false })}
          className="flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left"
          style={{
            borderColor: state.selectedCardId === "applepay" ? "var(--iv2-brand)" : "var(--iv2-border)",
            backgroundColor: state.selectedCardId === "applepay" ? "var(--iv2-brand-surface)" : "#fff",
          }}
        >
          <span className="flex h-[34px] w-[46px] shrink-0 items-center justify-center rounded-lg bg-[var(--iv2-text-primary)] text-[11px] font-bold text-white">
            APPLE
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-semibold text-[var(--iv2-text-primary)]">Apple Pay</span>
            <span className="mt-0.5 block text-[15px] text-[var(--iv2-text-secondary)]">Fast, secure and easy.</span>
          </span>
          {state.selectedCardId === "applepay" ? (
            <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand)] text-[13px] font-extrabold text-white">
              ✓
            </span>
          ) : null}
        </button>

        <div className="mt-5.5 mb-3 text-lg font-bold text-[var(--iv2-text-primary)]">Saved cards</div>
        <div className="flex flex-col gap-2.5">
          {state.cards.map((c) => {
            const isSel = state.selectedCardId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  c.expired ? update({ cardSheetOpen: true }) : update({ selectedCardId: c.id, methodsOpen: false })
                }
                className="flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border-[1.5px] px-4 py-3.5 text-left"
                style={{
                  borderColor: isSel ? "var(--iv2-brand)" : "var(--iv2-border)",
                  backgroundColor: isSel ? "var(--iv2-brand-surface)" : "#fff",
                }}
              >
                <span
                  className="flex h-[34px] w-[46px] shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white"
                  style={{ backgroundColor: MARK_BG[c.brand] }}
                >
                  {c.brand}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-[17px] font-semibold whitespace-nowrap"
                    style={{ color: c.expired ? "var(--iv2-text-muted)" : "var(--iv2-text-primary)" }}
                  >
                    {TITLE_BRAND[c.brand]} •••• {c.last4}
                  </span>
                  <span className="mt-0.5 block text-[15px]" style={{ color: c.expired ? "var(--iv2-danger)" : "var(--iv2-text-secondary)" }}>
                    {c.expired ? `Expired ${c.exp}` : `Expires ${c.exp}`}
                  </span>
                </span>
                {isSel ? (
                  <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand)] text-[13px] font-extrabold text-white">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => update({ cardSheetOpen: true })}
          className="flex cursor-pointer items-center gap-2 border-none bg-transparent px-0.5 pt-4 pb-1 text-base font-semibold text-[var(--iv2-brand)]"
        >
          <span className="text-[19px] leading-none">+</span> Add new card
        </button>
      </div>
    </BottomSheet>
  );
}
