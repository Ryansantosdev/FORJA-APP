// Cache local com TTL — dados pesados (treinos, cardápio) ficam no celular
// e só sincronizam de novo quando você altera algo ou força atualização.

const PREFIX = "forja_cache_";
const CACHE_VERSION = 1;

export type CacheEntry<T> = {
  v: number;
  at: number;
  data: T;
};

export function getCachedEntry<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (parsed.v !== CACHE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Compatível com código antigo que guardava só o dado */
export function getCached<T>(key: string): T | null {
  const entry = getCachedEntry<T>(key);
  return entry?.data ?? null;
}

export function setCachedEntry<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { v: CACHE_VERSION, at: Date.now(), data };
    localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // storage cheio: segue sem cache
  }
}

export function setCached(key: string, data: unknown) {
  setCachedEntry(key, data);
}

export function isCacheFresh(
  entry: CacheEntry<unknown> | null,
  ttlMs: number
): boolean {
  if (!entry) return false;
  return Date.now() - entry.at < ttlMs;
}

export function invalidateCache(...keys: string[]) {
  if (typeof window === "undefined") return;
  for (const key of keys) {
    localStorage.removeItem(PREFIX + key);
  }
}

export function clearCache() {
  if (typeof window === "undefined") return;
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith(PREFIX)) localStorage.removeItem(k);
  }
}

/** Treinos/cardápio: válido por 7 dias ou até invalidar manualmente */
export const STATIC_DATA_TTL = 7 * 24 * 60 * 60 * 1000;

/** Resumo do dia: 2 minutos */
export const DAILY_TTL = 2 * 60 * 1000;
