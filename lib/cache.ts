// Cache local com TTL — dados pesados ficam no celular e sincronizam quando necessário.

const PREFIX = "forja_cache_";
const CACHE_VERSION = 1;

let cacheUserId: string | null = null;

/** Escopo por usuário (sem limpar no logout — aparelho pessoal). */
export function setCacheUserId(userId: string | null) {
  cacheUserId = userId;
}

function scopedKey(key: string): string {
  return cacheUserId ? `${cacheUserId}:${key}` : key;
}

export type CacheEntry<T> = {
  v: number;
  at: number;
  data: T;
};

function readRaw(key: string): CacheEntry<unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<unknown>;
    if (parsed.v !== CACHE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getCachedEntry<T>(key: string): CacheEntry<T> | null {
  const scoped = readRaw(scopedKey(key));
  if (scoped) return scoped as CacheEntry<T>;
  if (cacheUserId) {
    const legacy = readRaw(key);
    if (legacy) return legacy as CacheEntry<T>;
  }
  return null;
}

export function getCached<T>(key: string): T | null {
  const entry = getCachedEntry<T>(key);
  return entry?.data ?? null;
}

export function setCachedEntry<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { v: CACHE_VERSION, at: Date.now(), data };
    localStorage.setItem(PREFIX + scopedKey(key), JSON.stringify(entry));
  } catch {
    // storage cheio
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
    localStorage.removeItem(PREFIX + scopedKey(key));
    if (cacheUserId) localStorage.removeItem(PREFIX + key);
  }
}

export function clearCache() {
  if (typeof window === "undefined") return;
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith(PREFIX)) localStorage.removeItem(k);
  }
}

/** Treinos/cardápio: 7 dias */
export const STATIC_DATA_TTL = 7 * 24 * 60 * 60 * 1000;

/** Resumo do dia / snapshot compartilhado: 2 min */
export const DAILY_TTL = 2 * 60 * 1000;

/** Progresso agregado: 10 min */
export const PROG_TTL = 10 * 60 * 1000;

/** Configurações: 5 min */
export const SETTINGS_TTL = 5 * 60 * 1000;
