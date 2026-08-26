// The "here's what's on file — still right?" read-only card reused
// across Health history, Details, and Coverage. `badge` lets a screen
// mark a card as freshly extracted ("Just scanned") vs. long-standing
// on-file data.
export function ConfirmCard({
  title,
  rows,
  badge,
}: {
  title: string;
  rows: { label: string; value: string }[];
  badge?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold tracking-wide text-neutral-500 uppercase">{title}</div>
        {badge && <div className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">{badge}</div>}
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex-shrink-0 text-neutral-500">{r.label}</span>
            <span className="text-right font-semibold text-neutral-900">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
