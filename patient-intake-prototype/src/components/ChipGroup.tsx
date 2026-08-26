// Handles ~80% of the app's interactions on its own: single- or
// multi-select pill chips with a visible checkmark on selection. The
// screen just owns `value`/`onChange` — toggle semantics live here so
// no screen has to reimplement single-vs-multi selection logic.
export function ChipGroup({
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
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
              on
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
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
