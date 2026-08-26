// Interaction pattern #1 — handles the majority of the app's questions on
// its own. Single- or multi-select pill chips with a visible checkmark on
// selection; the screen just owns `value`/`onChange`.
export function QuickSelect({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
}) {
  function handleClick(opt: string) {
    if (multi) {
      onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
    } else {
      onChange(value.includes(opt) ? [] : [opt]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => handleClick(opt)}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
              on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
            }`}
          >
            {on && <span aria-hidden="true">✓</span>}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
