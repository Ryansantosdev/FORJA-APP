"use client";

import { useEffect, useRef, useState } from "react";
import { TimerReset, X } from "lucide-react";

const REST_SECONDS = 90;

export default function RestTimer({
  startKey,
  onDismiss,
}: {
  /** Muda a cada início — reinicia o timer. null = escondido. */
  startKey: number | null;
  onDismiss: () => void;
}) {
  const [left, setLeft] = useState(REST_SECONDS);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startKey === null) return;
    setLeft(REST_SECONDS);
    if (interval.current) clearInterval(interval.current);
    interval.current = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          if (interval.current) clearInterval(interval.current);
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate?.([200, 100, 200]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [startKey]);

  if (startKey === null) return null;

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const pct = (left / REST_SECONDS) * 100;
  const done = left === 0;

  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-40 mx-auto max-w-md px-4">
      <div
        className={`overflow-hidden rounded-2xl border shadow-lg ${
          done ? "border-primary bg-primary/15" : "border-line bg-elev"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <TimerReset
            size={20}
            className={done ? "animate-pulse-neon text-primary" : "text-amber"}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {done ? "Descanso encerrado. Próxima série." : "Descanso"}
            </p>
            <p
              className={`text-2xl font-black tabular-nums ${
                done ? "text-primary" : ""
              }`}
            >
              {mm}:{ss}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="p-2 text-muted"
            aria-label="Fechar timer"
          >
            <X size={18} />
          </button>
        </div>
        <div className="h-1 bg-surface">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              done ? "bg-primary" : "bg-amber"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
