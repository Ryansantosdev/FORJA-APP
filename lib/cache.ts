// Cache local simples (stale-while-revalidate): as abas abrem instantaneamente
// com os últimos dados e atualizam em segundo plano.

const PREFIX = "forja_cache_";

export function getCached<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setCached(key: string, data: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch {
    // storage cheio/indisponível: segue sem cache
  }
}

export function clearCache() {
  if (typeof window === "undefined") return;
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith(PREFIX)) localStorage.removeItem(k);
  }
}
