import type { SupabaseClient } from "@supabase/supabase-js";
import { todayStr, daysAgoStr } from "./dates";

/** Até esta hora do dia seguinte ainda dá para fechar o dia anterior (registro retroativo). */
export const GRACE_HOUR = 9;

/** Um dia está 100% quando todas as refeições + treino (se houver na agenda) foram marcados. */
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

  const totalMeals = mealsRes.data?.length ?? 0;
  const doneMeals = logsRes.data?.length ?? 0;
  const d = new Date(date + "T12:00:00");
  const dow = String(d.getDay());
  const agenda = (settingsRes.data?.agenda_treino as Record<string, string | null>) ?? {};
  const treinoAgendado = Boolean(agenda[dow]);
  const workoutDone = workoutRes.data?.concluido === true;
  const treinoOk = !treinoAgendado || workoutDone;

  return totalMeals > 0 && doneMeals >= totalMeals && treinoOk;
}

/**
 * "Modo Goggins" com janela de tolerância:
 * - Dia 100% → streak conta.
 * - Ontem incompleto ainda pode ser fechado até as 9h de hoje (retroativo).
 * - Depois da janela, dia incompleto = streak zera.
 */
export async function syncStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<{ current: number; max: number }> {
  const today = todayStr();
  const yesterday = daysAgoStr(1);
  const dayBefore = daysAgoStr(2);
  const inGrace = new Date().getHours() < GRACE_HOUR;

  const { data: stats } = await supabase
    .from("user_stats")
    .select("current_streak, max_streak, last_completed_date")
    .eq("user_id", userId)
    .maybeSingle();

  let current = stats?.current_streak ?? 0;
  let max = stats?.max_streak ?? 0;
  let lastDone = stats?.last_completed_date ?? null;

  // 1) fechamento retroativo de ontem (dentro da janela de tolerância)
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

  // 2) dia de hoje
  const todayComplete = await isDayComplete(supabase, userId, today);

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
    // fora da janela de tolerância e a corrente quebrou → zera
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

export const ACHIEVEMENTS = [
  { dias: 7, nome: "1 Semana de Ferro" },
  { dias: 30, nome: "1 Mês Imparável" },
  { dias: 66, nome: "Hábito Forjado" },
  { dias: 100, nome: "Centurião" },
];
