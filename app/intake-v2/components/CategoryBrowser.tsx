"use client";

import { ReactNode, useState } from "react";
import { ChevronRightIcon } from "./Icons";
import { ShowMoreLink } from "./ui";

export type BrowseCategory = { name: string; items: string[] };

const CATEGORIES_VISIBLE = 5;

// "Browse by category" list shared by every Health History catalog
// (conditions, surgeries, family history, allergies, medications): one
// row per category — name, an "N selected" badge, a chevron — that opens
// inline to show that category's items. `renderItem` supplies each item
// (a CatalogChip, or the expanded detail card the section swaps in for
// the item being filled in), so each section keeps its own add/edit
// flow untouched; this only owns the category chrome. Only the first
// few categories show up front, the rest behind a "Show N more" link
// (the open category always stays listed so a panel never disappears
// mid-use).
export function BrowseByCategory({
  categories,
  selectedCount,
  renderItem,
}: {
  categories: BrowseCategory[];
  selectedCount: (categoryName: string) => number;
  renderItem: (itemName: string) => ReactNode;
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const visible = showMore ? categories : categories.filter((c, i) => i < CATEGORIES_VISIBLE || c.name === openCategory);

  return (
    <>
      <div className="mt-8 mb-1 text-[13px] font-semibold tracking-[0.04em] text-[var(--iv2-text-muted)] uppercase">Browse by category</div>
      <div>
        {visible.map((cat) => {
          const open = openCategory === cat.name;
          const count = selectedCount(cat.name);
          return (
            <div key={cat.name} className="border-b border-[var(--iv2-border-subtle)]">
              <button
                type="button"
                onClick={() => setOpenCategory(open ? null : cat.name)}
                aria-expanded={open}
                className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent py-4 text-left"
              >
                <span className="flex-1 text-base font-semibold text-[var(--iv2-text-primary)]">{cat.name}</span>
                {count > 0 ? (
                  <span className="rounded-full bg-[var(--iv2-brand-tint)] px-2.5 py-0.5 text-xs font-bold text-[var(--iv2-brand)]">{count} selected</span>
                ) : null}
                <span className={`flex transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
                  <ChevronRightIcon />
                </span>
              </button>
              {open && cat.items.length > 0 ? <div className="grid grid-cols-2 gap-2.5 pb-4">{cat.items.map(renderItem)}</div> : null}
            </div>
          );
        })}
      </div>
      {categories.length > CATEGORIES_VISIBLE ? (
        <ShowMoreLink count={categories.length - CATEGORIES_VISIBLE} expanded={showMore} onToggle={() => setShowMore(!showMore)} />
      ) : null}
    </>
  );
}
