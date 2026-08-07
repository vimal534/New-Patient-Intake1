"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

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
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0d1f2d";
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasStroke) setHasStroke(true);
  }

  function handlePointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL());
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
      <div className="relative h-20 w-full rounded-xl border border-dashed border-line-strong">
        {!hasStroke && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-placeholder">
            Tap and drag to sign
          </span>
        )}
        <canvas
          ref={canvasRef}
          width={640}
          height={160}
          className="h-full w-full touch-none rounded-xl"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
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
