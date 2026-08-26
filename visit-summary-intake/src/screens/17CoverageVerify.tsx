import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { StepHeader } from "../components/StepHeader";
import { BottomBar } from "../components/BottomBar";
import { ConfirmCard } from "../components/ConfirmCard";

// Extracted fields shown as a confirm card. If one field came back
// uncertain, only that field gets re-asked — never the whole form.
export default function CoverageVerify() {
  const { store, patch } = useStore();
  const nav = useNavigate();
  const extracted = store.coverage.extracted;
  const [groupValue, setGroupValue] = useState("");

  if (!extracted) {
    nav("/coverage/scan");
    return null;
  }

  const uncertain = store.coverage.uncertainField;

  function confirm() {
    patch((prev) => ({
      coverage: {
        ...prev.coverage,
        extracted: prev.coverage.extracted ? { ...prev.coverage.extracted, group: groupValue || prev.coverage.extracted.group } : prev.coverage.extracted,
        verified: true,
      },
    }));
    nav("/coverage/result");
  }

  return (
    <div className="flex flex-1 flex-col">
      <StepHeader section="COVERAGE" />
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <ConfirmCard
          title="Here's what we found"
          badge="Just scanned"
          rows={[
            { label: "Payer", value: extracted.payer },
            { label: "Plan", value: extracted.plan },
            { label: "Member ID", value: extracted.memberId },
            ...(uncertain !== "group" ? [{ label: "Group", value: extracted.group }] : []),
          ]}
        />
        {uncertain === "group" && (
          <div>
            <div className="mb-2 text-sm font-semibold text-neutral-800">We couldn&rsquo;t quite read the group number — mind typing it in?</div>
            <input
              value={groupValue}
              onChange={(e) => setGroupValue(e.target.value)}
              placeholder="Group number"
              className="min-h-[44px] w-full rounded-xl border border-neutral-200 px-4 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            />
          </div>
        )}
      </div>
      <BottomBar onCta={confirm} ctaDisabled={uncertain === "group" && !groupValue.trim()} />
    </div>
  );
}
