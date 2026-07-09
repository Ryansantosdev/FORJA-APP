"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { pctAgua } from "@/lib/agua";
import { formatLitersFromMl, formatLitersPair } from "@/lib/format";
import RangeBar from "@/components/RangeBar";

const INCREMENTOS = [200, 250, 500, 1000] as const;

/** Barra compacta de hidratação — fica no topo da Dieta */
export default function WaterTracker({
  aguaMl,
  metaMl,
  copoMl,
  onChange,
}: {
  aguaMl: number;
  metaMl: number;
  copoMl: number;
  onChange: (ml: number) => void;
}) {
  const [incremento, setIncremento] = useState(
    INCREMENTOS.includes(copoMl as (typeof INCREMENTOS)[number])
      ? copoMl
      : 250
  );
  const pct = pctAgua(aguaMl, metaMl);

  function addMl(delta: number) {
    onChange(Math.max(0, aguaMl + delta));
  }

  return (
    <div className="water-bar animate-fade-up">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="bento-label">Hidratação</p>
          <p className="truncate text-sm font-bold tabular-nums">
            {formatLitersPair(aguaMl, metaMl)}
          </p>
          <p className="text-[10px] text-white/35">
            +{formatLitersFromMl(incremento)} por toque
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => addMl(-incremento)}
            disabled={aguaMl <= 0}
            className="btn-ghost !p-2 disabled:opacity-30"
            aria-label="Remover água"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={() => addMl(incremento)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform active:scale-95"
            aria-label="Adicionar água"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {INCREMENTOS.map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => setIncremento(ml)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
              incremento === ml
                ? "bg-primary/20 text-primary"
                : "bg-white/[0.06] text-white/45"
            }`}
          >
            {formatLitersFromMl(ml)}
          </button>
        ))}
      </div>
      <RangeBar pct={pct} color="white" />
    </div>
  );
}
