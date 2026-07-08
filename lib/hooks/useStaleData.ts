"use client";

import { useCallback, useEffect, useState } from "react";
import { getCached, setCached, getCachedEntry, isCacheFresh } from "@/lib/cache";

const TIMEOUT_MS = 18_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("A conexão demorou demais. Tente de novo.")), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Erro ao carregar dados.";
}

/** Mostra cache imediatamente; com ttlMs evita refetch se ainda válido */
export function useStaleData<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  ttlMs?: number
) {
  const [data, setData] = useState<T | null>(() => getCached<T>(key));
  const [loading, setLoading] = useState(!getCached<T>(key));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (force = false) => {
      const entry = getCachedEntry<T>(key);
      if (!force && ttlMs && isCacheFresh(entry, ttlMs) && entry?.data != null) {
        setData(entry.data);
        setLoading(false);
        setError(null);
        return;
      }

      const hadCache = Boolean(getCached<T>(key));
      if (!hadCache) setLoading(true);
      setError(null);
      try {
        const fresh = await withTimeout(fetcher(), TIMEOUT_MS);
        setData(fresh);
        setCached(key, fresh);
      } catch (e) {
        setError(errMsg(e));
        if (!getCached<T>(key)) setData(null);
      } finally {
        setLoading(false);
      }
    },
    [key, fetcher, ttlMs]
  );

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refresh, setData };
}
