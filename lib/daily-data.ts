import type { SupabaseClient } from "@supabase/supabase-js";
import type { Meal } from "./types";
import { todayStr, daysAgoStr } from "./dates";

export type DailySnapshot = {
  today: string;
  meals: Meal[];
  mealDoneIds: string[];
  workoutLog: {
    concluido: boolean;
    workout_id: string | null;
    tipo_treino?: string;
  } | null;
  aguaMl: number;
  settings: {
    meta_agua_ml: number;
    copo_ml: number;
    meta_peso: number | null;
    meta_proteina_g: number;
    agenda_treino: Record<string, string | null>;
    onboarding_done: boolean;
  };
  hasSettingsRow: boolean;
  focusWeekMin: number;
  focusByDay: Record<string, number>;
  streak: { current: number; max: number; last_completed_date: string | null };
};

export async function fetchDailySnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<DailySnapshot> {
  const today = todayStr();
  const d7 = daysAgoStr(6);

  const [
    mealsRes,
    mealLogsRes,
    workoutRes,
    dailyRes,
    settingsRes,
    focusRes,
    statsRes,
  ] = await Promise.all([
    supabase
      .from("meals")
      .select("id, ordem, nome, icone, itens")
      .eq("user_id", userId)
      .order("ordem"),
    supabase
      .from("meal_logs")
      .select("meal_id")
      .eq("user_id", userId)
      .eq("date", today),
    supabase
      .from("workout_logs")
      .select("concluido, workout_id, tipo_treino")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("daily_logs")
      .select("agua_ml")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("focus_logs")
      .select("date, minutos")
      .eq("user_id", userId)
      .gte("date", d7),
    supabase
      .from("user_stats")
      .select("current_streak, max_streak, last_completed_date")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (mealsRes.error) throw mealsRes.error;

  const meals = (mealsRes.data as Meal[]) ?? [];
  const mealDoneIds = mealLogsRes.data?.map((l) => l.meal_id) ?? [];
  const settings = settingsRes.data;
  const agenda =
    (settings?.agenda_treino as Record<string, string | null>) ?? {};

  const focusByDay: Record<string, number> = {};
  for (const f of focusRes.data ?? []) {
    focusByDay[f.date] = (focusByDay[f.date] ?? 0) + f.minutos;
  }

  return {
    today,
    meals,
    mealDoneIds,
    workoutLog: workoutRes.data ?? null,
    aguaMl: dailyRes.data?.agua_ml ?? 0,
    hasSettingsRow: Boolean(settings),
    settings: {
      meta_agua_ml: settings?.meta_agua_ml ?? 3000,
      copo_ml: settings?.copo_ml ?? 250,
      meta_peso: settings?.meta_peso ?? null,
      meta_proteina_g: settings?.meta_proteina_g ?? 150,
      agenda_treino: agenda,
      onboarding_done: settings?.onboarding_done ?? true,
    },
    focusWeekMin: focusRes.data?.reduce((a, f) => a + f.minutos, 0) ?? 0,
    focusByDay,
    streak: {
      current: statsRes.data?.current_streak ?? 0,
      max: statsRes.data?.max_streak ?? 0,
      last_completed_date: statsRes.data?.last_completed_date ?? null,
    },
  };
}
