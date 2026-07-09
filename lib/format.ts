/** Exibição em litros: 3.0L, 0.5L (sempre com ponto) */

export function formatLiters(liters: number, decimals = 1): string {
  return `${liters.toFixed(decimals)}L`;
}

export function formatLitersFromMl(ml: number, decimals = 1): string {
  return formatLiters(ml / 1000, decimals);
}

export function formatLitersPair(currentMl: number, metaMl: number): string {
  return `${formatLitersFromMl(currentMl)} / ${formatLitersFromMl(metaMl)}`;
}
