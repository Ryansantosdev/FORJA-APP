"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";

const THRESHOLD = 72;
const MAX_DRAG = 140;

export default function SwipeCard({
  children,
  onSwipe,
  disabled,
  hint,
}: {
  children: React.ReactNode;
  onSwipe: () => void;
  disabled?: boolean;
  hint?: boolean;
}) {
  const startX = useRef(0);
  const dragging = useRef(false);
  const [dx, setDx] = useState(0);
  const [swiped, setSwiped] = useState(false);
  const [animating, setAnimating] = useState(false);

  function onStart(x: number) {
    if (disabled) return;
    dragging.current = true;
    startX.current = x;
    setAnimating(false);
  }

  function onMove(x: number) {
    if (disabled || !dragging.current) return;
    const delta = Math.max(0, x - startX.current);
    setDx(Math.min(delta, MAX_DRAG));
  }

  function onEnd() {
    if (!dragging.current) return;
    dragging.current = false;
    setAnimating(true);

    if (dx > THRESHOLD) {
      setSwiped(true);
      if (navigator.vibrate) navigator.vibrate(12);
      onSwipe();
      setTimeout(() => {
        setDx(0);
        setSwiped(false);
        setAnimating(false);
      }, 320);
    } else {
      setDx(0);
      setTimeout(() => setAnimating(false), 200);
    }
  }

  const progress = Math.min(1, dx / THRESHOLD);
  const ready = dx > THRESHOLD * 0.85;

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-bento)]">
      <div
        className="absolute inset-y-0 left-0 flex w-[5.5rem] items-center justify-center gap-1 bg-primary text-black"
        style={{ opacity: progress * 0.95 }}
      >
        <Check size={22} strokeWidth={3} />
        <span className="text-xs font-bold">{ready ? "Ok!" : "→"}</span>
      </div>
      <div
        className={`touch-pan-y ${swiped ? "animate-check-pop" : ""}`}
        style={{
          transform: `translateX(${dx}px)`,
          transition: animating ? "transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)" : "none",
        }}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => e.buttons === 1 && onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={() => dragging.current && onEnd()}
      >
        {children}
        {hint && !disabled && dx === 0 && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <span className="animate-swipe-hint text-[10px] font-semibold text-muted/60">
              deslize →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
