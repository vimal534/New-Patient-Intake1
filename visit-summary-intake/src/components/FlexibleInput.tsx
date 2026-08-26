import { useState } from "react";

// Interaction pattern #2 — used only when QuickSelect's chips can't
// capture the patient's situation. The mic button mocks voice input by
// inserting sample transcribed text, since this is a prototype with no
// real speech-to-text.
export function FlexibleInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Type or speak...",
  sampleVoiceText,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  sampleVoiceText?: string;
}) {
  const [listening, setListening] = useState(false);

  function mockVoice() {
    if (!sampleVoiceText) return;
    setListening(true);
    setTimeout(() => {
      onChange(sampleVoiceText);
      setListening(false);
    }, 900);
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onSubmit();
        }}
        placeholder={listening ? "Listening..." : placeholder}
        className="min-h-[40px] flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
      />
      <button
        type="button"
        onClick={mockVoice}
        aria-pressed={listening}
        aria-label="Speak your answer"
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm transition ${
          listening ? "bg-red-500 text-white" : "border border-neutral-200 bg-white text-neutral-500"
        }`}
      >
        🎤
      </button>
      {value.trim() && (
        <button type="button" onClick={onSubmit} className="flex-shrink-0 text-xs font-bold text-neutral-900">
          Add
        </button>
      )}
    </div>
  );
}
