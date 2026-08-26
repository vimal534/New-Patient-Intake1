import { SECTIONS, SECTION_INDEX, type Section } from "../flow";

// Persistent step/progress header, e.g. "HEALTH · 2 OF 5" plus a
// segmented bar — one segment per section, not per screen, since a
// section can contain several screens.
export function StepHeader({ section }: { section: Section }) {
  const idx = SECTION_INDEX[section];
  return (
    <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 px-5 pt-4 pb-3 backdrop-blur">
      <div className="text-xs font-bold tracking-wide text-neutral-500">
        {section} · {idx} OF {SECTIONS.length}
      </div>
      <div className="mt-2 flex gap-1">
        {SECTIONS.map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${SECTION_INDEX[s] <= idx ? "bg-neutral-900" : "bg-neutral-200"}`} />
        ))}
      </div>
    </div>
  );
}
