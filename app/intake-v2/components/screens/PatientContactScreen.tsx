"use client";

import { useRef } from "react";
import { Ctx } from "../../ctx";
import { US_STATE_OPTIONS, ZIP_LOOKUP } from "../../constants";
import { AddressField, AddressLine2Field, CityField, EmailField, ZipField } from "../SmartField";
import { UserIcon } from "../Icons";
import { Card, Divider, Eyebrow, ScreenCopy, ScreenTitle, SelectField } from "../ui";

// Patient Information wizard — Step 4 of 6. Guardian1's contact
// details — mobile stays read-only (already phone-verified back on
// the very first screen of the whole app), everything else editable.
export function PatientContactScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;
  const addressRef = useRef<HTMLInputElement | null>(null);
  const address2Ref = useRef<HTMLInputElement | null>(null);
  const zipRef = useRef<HTMLInputElement | null>(null);
  const cityRef = useRef<HTMLInputElement | null>(null);
  const stateRef = useRef<HTMLButtonElement | null>(null);

  const handleZipChange = (zip: string) => {
    const match = ZIP_LOOKUP[zip];
    update((s) => ({ personal: { ...s.personal, zip, ...(match ? { city: match.city, state: match.state } : {}) } }));
  };

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>{state.reviewingFromPatientReview ? "Review contact information" : "Your information · Step 4 of 6"}</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Let&apos;s confirm your contact information</ScreenTitle>
      <ScreenCopy className="mb-6">We pre-filled this from your ID. Review and update anything that&apos;s changed.</ScreenCopy>

      <Card>
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--iv2-brand-tint)]">
            <UserIcon size={20} color="var(--iv2-brand)" />
          </span>
          <div>
            <div className="text-xs font-semibold tracking-[0.06em] text-[var(--iv2-text-muted)] uppercase">Parent / guardian</div>
            <div className="mt-0.5 text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.guardian1.name}</div>
          </div>
          <span className="ml-auto shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: "var(--iv2-success-surface)", color: "var(--iv2-success)" }}>
            From ID
          </span>
        </div>

        <Divider className="my-4" />

        <div className="flex flex-col gap-3.5">
          <div>
            <div className="mb-1.5 text-sm font-semibold text-[var(--iv2-text-primary)]">Mobile phone</div>
            <div className="flex h-13 w-full items-center justify-between gap-2 rounded-xl border border-[var(--iv2-border)] bg-[var(--iv2-surface-muted)] px-3.5" style={{ height: 52 }}>
              <span className="truncate text-[17px] font-semibold text-[var(--iv2-text-primary)]">{state.phoneOnFile}</span>
              <span className="shrink-0 text-xs font-bold text-[var(--iv2-success)]">✓ Verified</span>
            </div>
          </div>

          <EmailField value={state.personal.email} onChange={(v) => update((s) => ({ personal: { ...s.personal, email: v } }))} nextRef={addressRef} />
          <AddressField
            value={state.personal.address}
            onChange={(v) => update((s) => ({ personal: { ...s.personal, address: v } }))}
            fieldRef={addressRef}
            nextRef={address2Ref}
          />
          <AddressLine2Field
            value={state.personal.address2 ?? ""}
            onChange={(v) => update((s) => ({ personal: { ...s.personal, address2: v } }))}
            fieldRef={address2Ref}
            nextRef={zipRef}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <CityField
                value={state.personal.city ?? ""}
                onChange={(v) => update((s) => ({ personal: { ...s.personal, city: v } }))}
                fieldRef={cityRef}
                nextRef={stateRef}
              />
            </div>
            <div className="flex-1">
              <SelectField
                label="State"
                value={state.personal.state ?? ""}
                options={US_STATE_OPTIONS}
                placeholder="Select state"
                onChange={(v) => update((s) => ({ personal: { ...s.personal, state: v } }))}
                fieldRef={stateRef}
              />
            </div>
          </div>
          <ZipField value={state.personal.zip ?? ""} onChange={handleZipChange} fieldRef={zipRef} nextRef={cityRef} />
        </div>
      </Card>

      <button
        type="button"
        onClick={() => addressRef.current?.focus()}
        className="mt-4 cursor-pointer border-none bg-transparent text-[15px] font-semibold text-[var(--iv2-brand)]"
      >
        I&apos;ll update this information
      </button>
    </div>
  );
}
