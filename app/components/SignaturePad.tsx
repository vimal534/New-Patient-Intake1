"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

function ClearIcon() {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SignaturePad({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStroke, setHasStroke] = useState(Boolean(value));

  // Match the canvas's internal resolution to how large it's actually
  // rendered, at device pixel ratio — without this, strokes drift from
  // the pointer (internal resolution didn't match the CSS box) and lines
  // render soft on high-DPI screens. Also restores a signature already in
  // `value`, so navigating back to this screen doesn't show it blank.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
    }
    // Intentionally mount-only — this pad is a fresh instance per screen visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getCtx() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }

  function pointerPos(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    // Without capture, a fast stroke that ends outside the canvas's visual
    // bounds delivers its "pointer up" to whatever's underneath instead of
    // the canvas — the drawing still looks signed, but our save-on-release
    // handler never runs, so `value` silently stays empty. Capture routes
    // every event for this pointer back to the canvas no matter where it
    // physically ends up.
    // Guarded: some pointer sessions (stylus edge cases, certain synthetic
    // events) can reject capture — that must never block the stroke itself
    // from being drawn and saved.
    try {
      canvas?.setPointerCapture(e.pointerId);
    } catch {
      // fall through — onPointerLeave remains as a fallback
    }
    drawing.current = true;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0d1f2d";
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasStroke) setHasStroke(true);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    } catch {
      // already released or never captured — fine either way
    }
    onChange(canvas.toDataURL());
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    onChange("");
  }

  return (
    <div>
      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-dashed border-line-strong bg-white">
        {!hasStroke && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-placeholder">
            Tap and drag to sign
          </span>
        )}
        {/* Decorative signature line — like the line on a paper form. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-8 border-t border-line"
        />
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none rounded-xl"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {hasStroke && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear signature"
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white text-muted shadow-[0_1px_4px_rgba(0,0,0,0.15)] hover:text-ink"
          >
            <ClearIcon />
          </button>
        )}
      </div>
      {hasStroke && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 text-xs font-medium text-muted hover:text-ink"
        >
          Clear signature
        </button>
      )}
    </div>
  );
}
