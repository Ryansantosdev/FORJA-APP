"use client";

import { useCallback, useEffect, useState } from "react";
import { getCached, setCached } from "@/lib/cache";

/** Mostra cache imediatamente e atualiza em segundo plano */
export function useStaleData<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(() => getCached<T>(key));
  const [loading, setLoading] = useState(!getCached<T>(key));

  const refresh = useCallback(async () => {
    try {
      const fresh = await fetcher();
      setData(fresh);
      setCached(key, fresh);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, refresh, setData };
}
