/** Data local (não UTC) no formato YYYY-MM-DD */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function yesterdayStr(): string {
  return daysAgoStr(1);
}

export function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}

export function formatShort(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

/** 0=Dom … 6=Sáb (padrão JS) */
export function dayOfWeek(): number {
  return new Date().getDay();
}

/** Janela retroativa: até 9h pode fechar o dia anterior */
export function isRetroactiveWindow(): boolean {
  return new Date().getHours() < 9;
}

export const DIAS_SEMANA = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;
