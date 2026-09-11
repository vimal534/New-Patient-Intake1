"use client";

import { Ctx } from "../../ctx";
import { formatDob } from "../../format";
import { Eyebrow, InputField, ScreenCopy, ScreenTitle } from "../ui";

// Insurance — single manual page. Shared component (spec Part 1) used
// by returning/specialty visits that need their own coverage on file
// rather than the new-patient scan-first flow — here, Scenario 5's
// Sports Pre-Participation Physical (spec Part 6). One page, six
// fields, all required.
export function InsuranceManualScreen({ ctx }: { ctx: Ctx }) {
  const { state, update } = ctx;

  return (
    <div className="px-6 pt-8 pb-6">
      <Eyebrow>Insurance</Eyebrow>
      <ScreenTitle className="mb-2 leading-[1.28]">Insurance for today&apos;s visit</ScreenTitle>
      <ScreenCopy className="mb-6">This visit needs its own coverage details on file.</ScreenCopy>

      <div className="flex flex-col gap-3.5">
        <InputField label="Insurance company name" value={state.carrier} placeholder="Blue Shield PPO" onChange={(v) => update({ carrier: v })} />
        <InputField label="Member ID#" value={state.memberId} placeholder="VZ48213" onChange={(v) => update({ memberId: v })} />
        <InputField label="Group ID#" value={state.groupValue} placeholder="00921" onChange={(v) => update({ groupValue: v })} />
        <InputField label="Policy holder name" value={state.policyholderName} placeholder="Full name" onChange={(v) => update({ policyholderName: v })} />
        <InputField
          label="Policy holder date of birth"
          value={state.policyholderDob}
          placeholder="MM/DD/YYYY"
          inputMode="numeric"
          onChange={(v) => update({ policyholderDob: formatDob(v) })}
        />
        <InputField label="Policy holder address" value={state.policyholderAddress} placeholder="123 Main St, City, State ZIP" onChange={(v) => update({ policyholderAddress: v })} />
      </div>
    </div>
  );
}
