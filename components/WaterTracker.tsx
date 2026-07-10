"use client";

import { Droplets, RotateCcw } from "lucide-react";
import { pctAgua } from "@/lib/agua";
import { formatLitersFromMl, formatLitersPair } from "@/lib/format";
import RangeBar from "@/components/RangeBar";

/** Hidratação — toque rápido para registrar copos (sem travar a tela). */
export default function WaterTracker({
  aguaMl,
  metaMl,
  copoMl,
  onAdd,
}: {
  aguaMl: number;
  metaMl: number;
  copoMl: number;
  onAdd: (deltaMl: number) => void;
}) {
  const pct = pctAgua(aguaMl, metaMl);
  const copo = copoMl > 0 ? copoMl : 250;
  const copos = Math.floor(aguaMl / copo);
  const metaCopos = Math.ceil(metaMl / copo);

  return (
    <div className="bento bento-blue bento-glass !min-h-0 !p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="bento-label flex items-center gap-1.5">
            <Droplets size={12} className="text-water" />
            Hidratação
          </p>
          <p className="text-xl font-extrabold tabular-nums tracking-tight">
            {formatLitersPair(aguaMl, metaMl)}
          </p>
          <p className="text-xs text-white/45">
            {copos}/{metaCopos} copos · {pct}% da meta
          </p>
        </div>
        {aguaMl > 0 && (
          <button
            type="button"
            onClick={() => onAdd(-copo)}
            className="btn-ghost shrink-0 !px-2.5 !py-2 text-[10px] text-white/50"
            aria-label="Desfazer último copo"
          >
            <RotateCcw size={12} className="mr-1 inline" />
            Desfazer
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={() => onAdd(copo)}
          className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base"
        >
          <Droplets size={18} />
          +1 copo ({formatLitersFromMl(copo)})
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onAdd(500)}
            className="btn-ghost py-3 text-sm"
          >
            +500 ml
          </button>
          <button
            type="button"
            onClick={() => onAdd(1000)}
            className="btn-ghost py-3 text-sm"
          >
            +1 L
          </button>
        </div>
      </div>

      <div className="mt-3">
        <RangeBar pct={pct} color="white" />
      </div>
    </div>
  );
}
