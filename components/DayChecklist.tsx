"use client";

import { Check, Circle } from "lucide-react";
import type { DayChecklist } from "@/lib/nutrition";
import { aguasTomadas, totalAguas } from "@/lib/agua";

export default function DayChecklist({
  checklist,
  doneMeals,
  totalMeals,
  aguaMl,
  metaAgua,
  copoMl,
  treinoLabel,
}: {
  checklist: DayChecklist;
  doneMeals: number;
  totalMeals: number;
  aguaMl: number;
  metaAgua: number;
  copoMl: number;
  treinoLabel: string | null;
}) {
  const rows = [
    {
      ok: checklist.mealsOk,
      label: "Refeições",
      detail: `${doneMeals}/${totalMeals}`,
    },
    {
      ok: checklist.aguaOk,
      label: "Água",
      detail: `${aguasTomadas(aguaMl, copoMl)}/${totalAguas(metaAgua, copoMl)} copos`,
    },
    ...(checklist.hasTreinoHoje
      ? [
          {
            ok: checklist.treinoOk,
            label: "Treino",
            detail: treinoLabel ?? "pendente",
          },
        ]
      : []),
  ];

  return (
    <ul className="mt-3 space-y-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-2 text-sm">
          {row.ok ? (
            <Check size={16} className="shrink-0 text-mint" />
          ) : (
            <Circle size={14} className="shrink-0 text-white/25" />
          )}
          <span className={row.ok ? "text-white/70" : "text-white/90"}>
            {row.label}
          </span>
          <span className="ml-auto text-xs text-white/40">{row.detail}</span>
        </li>
      ))}
    </ul>
  );
}
