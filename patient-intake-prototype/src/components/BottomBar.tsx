import { useState } from "react";

// The sticky bottom action bar shared by every screen: an optional
// mic-enabled "flexible input" field (interaction layer 2) plus the
// Continue button. Screens that don't need free text (placeholders) just
// omit onSubmit/pass showComposer={false}.
export function BottomBar({
  value,
  onChange,
  onSubmit,
  placeholder,
  continueLabel = "Continue",
  onContinue,
  continueDisabled = false,
  showComposer = true,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  continueLabel?: string;
  onContinue: () => void;
  continueDisabled?: boolean;
  showComposer?: boolean;
}) {
  const [listening, setListening] = useState(false);

  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
      {showComposer && (
        <div className="mb-3 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) onSubmit();
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setListening((v) => !v)}
            aria-pressed={listening}
            aria-label="Speak your answer"
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm ${
              listening ? "bg-red-500 text-white" : "border border-slate-200 bg-white text-slate-500"
            }`}
          >
            🎤
          </button>
          {value.trim() && (
            <button type="button" onClick={onSubmit} className="flex-shrink-0 text-xs font-bold text-blue-600">
              Add
            </button>
          )}
        </div>
      )}
      <button
        type="button"
        disabled={continueDisabled}
        onClick={onContinue}
        className={`w-full rounded-full py-3.5 text-sm font-bold text-white transition ${
          continueDisabled ? "cursor-not-allowed bg-slate-300" : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
        }`}
      >
        {continueLabel}
      </button>
    </div>
  );
}
