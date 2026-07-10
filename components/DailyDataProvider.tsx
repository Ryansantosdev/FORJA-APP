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
import { syncStreakFromSnapshot } from "@/lib/streak";

const SNAPSHOT_KEY = "daily_snapshot";
const INVALIDATE_EVENT = "forja-invalidate-daily";

type DailyContextValue = {
  snapshot: DailySnapshot | null;
  loading: boolean;
  ready: boolean;
  error: string | null;
  refresh: (force?: boolean) => Promise<void>;
  invalidate: () => void;
};

const DailyContext = createContext<DailyContextValue | null>(null);

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    return String((e as { message: string }).message);
  }
  return "Não foi possível carregar os dados.";
}

export function DailyDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (force = false) => {
    setError(null);

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
      if (!user) {
        setError("Sessão expirada. Faça login novamente.");
        return;
      }

      setCacheUserId(user.id);
      const fresh = await fetchDailySnapshot(supabase, user.id);
      setSnapshot(fresh);
      setCached(SNAPSHOT_KEY, fresh);

      void (async () => {
        try {
          const agenda = fresh.settings.agenda_treino;
          const streak = await syncStreakFromSnapshot(supabase, user.id, {
            mealsCount: fresh.meals.length,
            mealDoneCount: fresh.mealDoneIds.length,
            workoutDone: fresh.workoutLog?.concluido === true,
            agenda,
            stats: {
              current_streak: fresh.streak.current,
              max_streak: fresh.streak.max,
              last_completed_date: fresh.streak.last_completed_date,
            },
          });
          setSnapshot((prev) => {
            if (!prev) return prev;
            const next = {
              ...prev,
              streak: { ...streak, last_completed_date: prev.streak.last_completed_date },
            };
            setCached(SNAPSHOT_KEY, next);
            return next;
          });
        } catch {
          // streak em background
        }
      })();
    } catch (e) {
      const cached = getCached<DailySnapshot>(SNAPSHOT_KEY);
      if (cached) {
        setSnapshot(cached);
      } else {
        setError(errMsg(e));
      }
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  const invalidate = useCallback(() => {
    invalidateCache(SNAPSHOT_KEY, "dash_resumo", "mente_data", "prog_payload");
    void refresh(true);
  }, [refresh]);

  useEffect(() => {
    const cached = getCached<DailySnapshot>(SNAPSHOT_KEY);
    if (cached) {
      setSnapshot(cached);
      setLoading(false);
      setReady(true);
    }
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onInvalidate = () => void refresh(true);
    window.addEventListener(INVALIDATE_EVENT, onInvalidate);
    return () => window.removeEventListener(INVALIDATE_EVENT, onInvalidate);
  }, [refresh]);

  const value = useMemo(
    () => ({ snapshot, loading, ready, error, refresh, invalidate }),
    [snapshot, loading, ready, error, refresh, invalidate]
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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INVALIDATE_EVENT));
  }
}
