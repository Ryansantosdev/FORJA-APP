"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getCached,
  setCached,
  getCachedEntry,
  isCacheFresh,
  setCacheUserId,
  invalidateCache,
  DAILY_TTL,
} from "@/lib/cache";
import { fetchDailySnapshot, type DailySnapshot } from "@/lib/daily-data";

const SNAPSHOT_KEY = "daily_snapshot";

type DailyContextValue = {
  snapshot: DailySnapshot | null;
  loading: boolean;
  ready: boolean;
  refresh: (force?: boolean) => Promise<void>;
  invalidate: () => void;
};

const DailyContext = createContext<DailyContextValue | null>(null);

export function DailyDataProvider({ children }: { children: ReactNode }) {
  const cached = typeof window !== "undefined" ? getCached<DailySnapshot>(SNAPSHOT_KEY) : null;
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [ready, setReady] = useState(Boolean(cached));

  const refresh = useCallback(async (force = false) => {
    const entry = getCachedEntry<DailySnapshot>(SNAPSHOT_KEY);
    if (!force && isCacheFresh(entry, DAILY_TTL) && entry?.data) {
      setSnapshot(entry.data);
      setLoading(false);
      setReady(true);
      return;
    }

    const hadData = Boolean(getCached<DailySnapshot>(SNAPSHOT_KEY));
    if (!hadData) setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setCacheUserId(user.id);
      const fresh = await fetchDailySnapshot(supabase, user.id);
      setSnapshot(fresh);
      setCached(SNAPSHOT_KEY, fresh);
    } catch {
      // mantém cache anterior
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  const invalidate = useCallback(() => {
    invalidateCache(SNAPSHOT_KEY, "dash_resumo", "mente_data");
    void refresh(true);
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ snapshot, loading, ready, refresh, invalidate }),
    [snapshot, loading, ready, refresh, invalidate]
  );

  return (
    <DailyContext.Provider value={value}>{children}</DailyContext.Provider>
  );
}

export function useDailyData() {
  const ctx = useContext(DailyContext);
  if (!ctx) {
    throw new Error("useDailyData must be used within DailyDataProvider");
  }
  return ctx;
}

/** Invalida snapshot compartilhado após mutações (refeição, água, treino). */
export function invalidateDailyCache() {
  invalidateCache(SNAPSHOT_KEY, "dash_resumo", "mente_data", "prog_payload");
}
