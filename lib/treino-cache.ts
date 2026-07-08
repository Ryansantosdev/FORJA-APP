import type { Workout } from "./types";
import {
  getCached,
  getCachedEntry,
  setCachedEntry,
  isCacheFresh,
  STATIC_DATA_TTL,
} from "./cache";

export type TreinoBundle = {
  workouts: Workout[];
  agenda: Record<string, string | null>;
  lastLoads: Record<string, { carga: number; reps: number }>;
  prs: Record<string, number>;
};

export const TREINO_BUNDLE_KEY = "treino_bundle";

export function getTreinoBundle(): TreinoBundle | null {
  const entry = getCachedEntry<TreinoBundle>(TREINO_BUNDLE_KEY);
  if (entry) return entry.data;

  const workouts = getCached<Workout[]>("treino_workouts");
  if (!workouts?.length) return null;

  return {
    workouts,
    agenda: getCached<Record<string, string | null>>("treino_agenda") ?? {},
    lastLoads: {},
    prs: {},
  };
}

export function isTreinoCacheFresh(): boolean {
  const entry = getCachedEntry<TreinoBundle>(TREINO_BUNDLE_KEY);
  return (
    isCacheFresh(entry, STATIC_DATA_TTL) &&
    Boolean(entry?.data.workouts.length)
  );
}

export function saveTreinoBundle(bundle: TreinoBundle) {
  setCachedEntry(TREINO_BUNDLE_KEY, bundle);
}

export function patchTreinoBundle(patch: Partial<TreinoBundle>) {
  const current = getTreinoBundle();
  if (!current) return;
  saveTreinoBundle({ ...current, ...patch });
}
