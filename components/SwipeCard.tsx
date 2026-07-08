"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";

export default function SwipeCard({
  children,
  onSwipe,
  disabled,
}: {
  children: React.ReactNode;
  onSwipe: () => void;
  disabled?: boolean;
}) {
  const startX = useRef(0);
  const [dx, setDx] = useState(0);
  const [swiped, setSwiped] = useState(false);

  function onStart(x: number) {
    if (disabled) return;
    startX.current = x;
  }

  function onMove(x: number) {
    if (disabled) return;
    const delta = Math.max(0, x - startX.current);
    setDx(Math.min(delta, 120));
  }

  function onEnd() {
    if (dx > 80) {
      setSwiped(true);
      onSwipe();
      setTimeout(() => {
        setDx(0);
        setSwiped(false);
      }, 300);
    } else {
      setDx(0);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div
        className="absolute inset-y-0 left-0 flex w-24 items-center justify-center bg-primary text-black"
        style={{ opacity: dx / 120 }}
      >
        <Check size={24} strokeWidth={3} />
      </div>
      <div
        className={`transition-transform ${swiped ? "animate-check-pop" : ""}`}
        style={{ transform: `translateX(${dx}px)` }}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => e.buttons === 1 && onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >
        {children}
      </div>
    </div>
  );
}
