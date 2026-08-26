import { BottomBar } from "../components/BottomBar";

// Visit/Details/Coverage/Finish that don't need to be fully built yet —
// just enough to keep the 5-step flow navigable end-to-end.
export function PlaceholderScreen({
  title,
  description,
  onComplete,
  continueLabel,
}: {
  title: string;
  description: string;
  onComplete: () => void;
  continueLabel?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-10 text-center">
        <div className="text-lg font-bold text-slate-900">{title}</div>
        <div className="max-w-xs text-sm text-slate-500">{description}</div>
      </div>
      <BottomBar
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
        placeholder=""
        showComposer={false}
        onContinue={onComplete}
        continueLabel={continueLabel}
      />
    </div>
  );
}
