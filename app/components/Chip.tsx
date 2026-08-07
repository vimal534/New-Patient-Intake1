"use client";

import { useState } from "react";

export function Chip({
  label,
  selected,
  onClick,
  variant = "outline-check",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  variant?: "outline-check" | "solid";
}) {
  if (variant === "solid") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
          selected
            ? "border-brand bg-brand text-white"
            : "border-line-strong bg-white text-[#364153] hover:border-muted-2"
        }`}
      >
        {selected && <span aria-hidden>✓</span>}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-[16.8px] py-[8.8px] text-sm font-medium transition-colors ${
        selected
          ? "border-brand text-brand"
          : "border-line-strong text-[#364153] hover:border-muted-2"
      }`}
    >
      {selected && <span aria-hidden>✓</span>}
      {label}
    </button>
  );
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Add",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  function remove(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function add(raw: string) {
    const trimmed = raw.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setValue("");
    setEditing(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand px-3 py-1.5 text-sm font-medium text-brand"
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            aria-label={`Remove ${tag}`}
            className="text-brand/70 hover:text-brand"
          >
            ×
          </button>
        </span>
      ))}
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add(value);
            if (e.key === "Escape") {
              setValue("");
              setEditing(false);
            }
          }}
          onBlur={() => add(value)}
          placeholder="Type and press Enter"
          className="w-40 rounded-full border border-line-strong px-3 py-1.5 text-sm text-ink outline-none focus:border-brand"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-line-strong px-3 py-1.5 text-sm font-medium text-muted hover:border-muted-2"
        >
          + {placeholder}
        </button>
      )}
    </div>
  );
}
