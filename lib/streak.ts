import type { SupabaseClient } from "@supabase/supabase-js";
import { todayStr, daysAgoStr } from "./dates";

/** Até esta hora do dia seguinte ainda dá para fechar o dia anterior (registro retroativo). */
export const GRACE_HOUR = 9;

export type DaySnapshot = {
  mealsCount: number;
  mealDoneCount: number;
  workoutDone: boolean;
  agenda: Record<string, string | null>;
};

export function isDayCompleteFromSnapshot(
  date: string,
  snap: DaySnapshot
): boolean {
  const d = new Date(date + "T12:00:00");
  const dow = String(d.getDay());
  const treinoAgendado = Boolean(snap.agenda[dow]);
  const treinoOk = !treinoAgendado || snap.workoutDone;
  return snap.mealsCount > 0 && snap.mealDoneCount >= snap.mealsCount && treinoOk;
}

/** Versão com queries — usada quando não há snapshot pré-carregado. */
export async function isDayComplete(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<boolean> {
  const [mealsRes, logsRes, workoutRes, settingsRes] = await Promise.all([
    supabase.from("meals").select("id").eq("user_id", userId),
    supabase
      .from("meal_logs")
      .select("meal_id")
      .eq("user_id", userId)
      .eq("date", date),
    supabase
      .from("workout_logs")
      .select("concluido")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle(),
    supabase
      .from("user_settings")
      .select("agenda_treino")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const agenda =
    (settingsRes.data?.agenda_treino as Record<string, string | null>) ?? {};
  return isDayCompleteFromSnapshot(date, {
    mealsCount: mealsRes.data?.length ?? 0,
    mealDoneCount: logsRes.data?.length ?? 0,
    workoutDone: workoutRes.data?.concluido === true,
    agenda,
  });
}

type StatsRow = {
  current_streak: number;
  max_streak: number;
  last_completed_date: string | null;
};

/** Streak usando dados já buscados — evita queries duplicadas no dashboard. */
export async function syncStreakFromSnapshot(
  supabase: SupabaseClient,
  userId: string,
  todaySnap: DaySnapshot & { stats: StatsRow | null }
): Promise<{ current: number; max: number }> {
  const today = todayStr();
  const yesterday = daysAgoStr(1);
  const dayBefore = daysAgoStr(2);
  const inGrace = new Date().getHours() < GRACE_HOUR;

  let current = todaySnap.stats?.current_streak ?? 0;
  let max = todaySnap.stats?.max_streak ?? 0;
  let lastDone = todaySnap.stats?.last_completed_date ?? null;

  const todayComplete = isDayCompleteFromSnapshot(today, todaySnap);

  if (lastDone !== yesterday && lastDone !== today && inGrace) {
    const ydayComplete = await isDayComplete(supabase, userId, yesterday);
    if (ydayComplete) {
      current = lastDone === dayBefore ? current + 1 : 1;
      max = Math.max(max, current);
      lastDone = yesterday;
      await supabase.from("user_stats").upsert({
        user_id: userId,
        current_streak: current,
        max_streak: max,
        last_completed_date: lastDone,
      });
    }
  }

  if (todayComplete && lastDone !== today) {
    current = lastDone === yesterday ? current + 1 : 1;
    max = Math.max(max, current);
    lastDone = today;
    await supabase.from("user_stats").upsert({
      user_id: userId,
      current_streak: current,
      max_streak: max,
      last_completed_date: lastDone,
    });
  } else if (!todayComplete && lastDone !== today && lastDone !== yesterday) {
    const stillProtected = inGrace && lastDone === dayBefore;
    if (!stillProtected && current !== 0) {
      current = 0;
      await supabase.from("user_stats").upsert({
        user_id: userId,
        current_streak: 0,
        max_streak: max,
        last_completed_date: lastDone,
      });
    }
  }

  return { current, max };
}

/**
 * "Modo Goggins" com janela de tolerância — fallback sem snapshot.
 */
export async function syncStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<{ current: number; max: number }> {
  const today = todayStr();
  const [mealsRes, logsRes, workoutRes, settingsRes, statsRes] =
    await Promise.all([
      supabase.from("meals").select("id").eq("user_id", userId),
      supabase
        .from("meal_logs")
        .select("meal_id")
        .eq("user_id", userId)
        .eq("date", today),
      supabase
        .from("workout_logs")
        .select("concluido")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("user_settings")
        .select("agenda_treino")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_stats")
        .select("current_streak, max_streak, last_completed_date")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  const agenda =
    (settingsRes.data?.agenda_treino as Record<string, string | null>) ?? {};

  return syncStreakFromSnapshot(supabase, userId, {
    mealsCount: mealsRes.data?.length ?? 0,
    mealDoneCount: logsRes.data?.length ?? 0,
    workoutDone: workoutRes.data?.concluido === true,
    agenda,
    stats: statsRes.data ?? null,
  });
}

export const ACHIEVEMENTS = [
  { dias: 7, nome: "1 Semana de Ferro" },
  { dias: 30, nome: "1 Mês Imparável" },
  { dias: 66, nome: "Hábito Forjado" },
  { dias: 100, nome: "Centurião" },
];
