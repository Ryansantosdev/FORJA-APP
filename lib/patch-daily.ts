import { getCached, setCached, invalidateCache } from "@/lib/cache";
import type { DailySnapshot } from "@/lib/daily-data";

const SNAPSHOT_KEY = "daily_snapshot";
const INVALIDATE_EVENT = "forja-invalidate-daily";

let invalidateTimer: ReturnType<typeof setTimeout> | null = null;

/** Atualiza água no cache do dia sem refetch completo (evita “piscar” na Dieta). */
export function patchDailyAguaMl(aguaMl: number) {
  const snap = getCached<DailySnapshot>(SNAPSHOT_KEY);
  if (snap) {
    setCached(SNAPSHOT_KEY, { ...snap, aguaMl });
  }
}

/** Invalida outras telas depois de um intervalo — não sobrescreve o valor local na hora. */
export function scheduleDailyInvalidate(ms = 1200) {
  if (typeof window === "undefined") return;
  if (invalidateTimer) clearTimeout(invalidateTimer);
  invalidateTimer = setTimeout(() => {
    invalidateCache(SNAPSHOT_KEY, "dash_resumo", "mente_data", "prog_payload");
    window.dispatchEvent(new CustomEvent(INVALIDATE_EVENT));
    invalidateTimer = null;
  }, ms);
}
