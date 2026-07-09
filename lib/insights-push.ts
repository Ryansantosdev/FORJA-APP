import { INSIGHTS } from "./insights";

/** Frase determinística para push (sem localStorage — roda no servidor). */
export function insightForPush(seed: string): { title: string; body: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const ins = INSIGHTS[hash % INSIGHTS.length];
  return {
    title: "Forja — Mente",
    body: `${ins.t} — ${ins.a}`,
  };
}

/** Hora atual deve disparar lembrete de frase? (cron roda no minuto 0) */
export function deveEnviarFrase(
  hora: number,
  inicio: number,
  fim: number,
  intervaloMin: number
): boolean {
  if (hora < inicio || hora > fim) return false;
  if (intervaloMin <= 0) return false;
  const minutosDesdeInicio = (hora - inicio) * 60;
  return minutosDesdeInicio % intervaloMin === 0;
}
