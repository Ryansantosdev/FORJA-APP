/** Helpers para meta de água em litros e contagem de “águas” (copos) */

import { formatLitersFromMl, formatLitersPair } from "@/lib/format";

/** @deprecated use formatLitersFromMl */
export function litrosDeMl(ml: number): string {
  return formatLitersFromMl(ml);
}

export function mlDeLitros(l: number): number {
  return Math.round(l * 1000);
}

/** Quantas “águas” (copos) cabem na meta */
export function totalAguas(metaMl: number, copoMl: number): number {
  if (copoMl <= 0) return 12;
  return Math.max(1, Math.ceil(metaMl / copoMl));
}

/** Quantas águas já foram tomadas (inteiro) */
export function aguasTomadas(aguaMl: number, copoMl: number): number {
  if (copoMl <= 0) return 0;
  return Math.floor(aguaMl / copoMl);
}

export function pctAgua(aguaMl: number, metaMl: number): number {
  if (metaMl <= 0) return 0;
  return Math.min(100, Math.round((aguaMl / metaMl) * 100));
}
