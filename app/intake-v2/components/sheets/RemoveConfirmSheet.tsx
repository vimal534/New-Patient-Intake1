"use client";

import { Ctx } from "../../ctx";
import { BottomSheet } from "../ui";

// Removing an on-file condition is never silent — README: "Removal is
// never silent."
export function RemoveConfirmSheet({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const name = state.pendingRemove;

  return (
    <BottomSheet open={!!name} onClose={() => update({ pendingRemove: null })} zIndex={75} maxHeight="none">
      <div className="mb-5 text-xl leading-[1.35] font-bold text-[var(--iv2-text-primary)]">
        Remove {name} from your current health history?
      </div>
      <button
        type="button"
        onClick={() => update({ pendingRemove: null })}
        className="h-[54px] w-full cursor-pointer rounded-2xl border-[1.5px] border-[var(--iv2-border)] bg-white text-base font-bold text-[var(--iv2-text-primary)]"
      >
        Keep it
      </button>
      <button
        type="button"
        onClick={() =>
          update((s) => ({ onFileConds: s.onFileConds.filter((c) => c !== s.pendingRemove), pendingRemove: null }))
        }
        className="mt-2 h-[54px] w-full cursor-pointer rounded-2xl border-none bg-[var(--iv2-danger)] text-base font-bold text-white"
      >
        Remove
      </button>
    </BottomSheet>
  );
}
