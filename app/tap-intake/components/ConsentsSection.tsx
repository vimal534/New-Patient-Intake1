"use client";

import { useVisit } from "../state";
import { PrimaryButton } from "./ui";

export function ConsentsSection({ onDone }: { onDone: () => void }) {
  const { state, dispatch } = useVisit();
  const allAcked = state.consents.items.every((it) => it.acknowledged);
  const signedBy = state.guardian.name || "Guardian";

  return (
    <>
      <div className="rounded-lg bg-[var(--color-background)] p-3 text-sm text-[var(--color-muted)]">
        Signing as <span className="font-semibold text-[var(--color-ink)]">{signedBy}</span>
        <span className="text-xs"> — reused from Guardian Details, not re-asked.</span>
      </div>

      <div className="space-y-2">
        {state.consents.items.map((item) => (
          <label
            key={item.id}
            className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-[var(--color-line)] bg-white px-3 py-2"
          >
            <input
              type="checkbox"
              checked={item.acknowledged}
              onChange={() => dispatch({ type: "TOGGLE_CONSENT", id: item.id })}
              className="h-5 w-5 accent-[var(--color-brand)]"
            />
            <span className="text-sm text-[var(--color-ink)]">{item.label}</span>
          </label>
        ))}
      </div>

      <PrimaryButton
        disabled={!allAcked}
        onClick={() => {
          dispatch({ type: "MARK_SECTION_READY", key: "consents" });
          onDone();
        }}
      >
        Sign & Continue
      </PrimaryButton>
    </>
  );
}
