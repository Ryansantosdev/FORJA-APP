"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  UtensilsCrossed,
  Dumbbell,
  Quote,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  todayStr,
  daysAgoStr,
  isRetroactiveWindow,
} from "@/lib/dates";
import { syncStreak, ACHIEVEMENTS } from "@/lib/streak";
import { insightOnAppOpen, type Insight } from "@/lib/insights";
import { getScheduledWorkoutId, findWorkoutById } from "@/lib/schedule";
import { getCached, setCached, getCachedEntry, isCacheFresh, DAILY_TTL } from "@/lib/cache";
import { getTreinoBundle, isTreinoCacheFresh } from "@/lib/treino-cache";
import { aguasTomadas, totalAguas } from "@/lib/agua";
import { formatLitersFromMl } from "@/lib/format";
import BentoCard, { BentoLabel, BentoValue } from "@/components/BentoCard";
import RangeBar from "@/components/RangeBar";
import ProgressRing from "@/components/ProgressRing";
import { SkeletonCard } from "@/components/Skeleton";
import type { Workout, Meal } from "@/lib/types";

type Resumo = {
  totalMeals: number;
  doneMeals: number;
  kcalDone: number;
  kcalTotal: number;
  treinoDone: boolean;
  treinoNome: string | null;
  aguaMl: number;
  metaAgua: number;
  copoMl: number;
  focoMinSemana: number;
  pctDia: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [streak, setStreak] = useState<{ current: number; max: number }>();
  const [resumo, setResumo] = useState<Resumo>();
  const [nextMeal, setNextMeal] = useState<Meal | null>(null);
  const [scheduled, setScheduled] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const today = todayStr();
  const [frase, setFrase] = useState<Insight | null>(null);
  const [hour, setHour] = useState(0);
  const atRisk = hour >= 18 && (resumo?.pctDia ?? 0) < 100;

  useEffect(() => {
    setHour(new Date().getHours());
    setFrase(insightOnAppOpen());
  }, []);

  const load = useCallback(async () => {
    const dashEntry = getCachedEntry<Resumo>("dash_resumo");
    if (isCacheFresh(dashEntry, DAILY_TTL) && dashEntry?.data) {
      setResumo(dashEntry.data);
      setLoading(false);
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const s = await syncStreak(supabase, user.id);
    setStreak(s);

    const treinoBundle = isTreinoCacheFresh() ? getTreinoBundle() : null;
    const workoutsQuery = treinoBundle
      ? Promise.resolve({ data: treinoBundle.workouts, error: null })
      : supabase
          .from("workouts")
          .select("id, ordem, letra, nome, exercicios")
          .eq("user_id", user.id);

    const [meals, mealLogs, workout, daily, settings, focus, workouts] =
      await Promise.all([
        supabase.from("meals").select("id, ordem, nome, icone, itens").eq("user_id", user.id).order("ordem"),
        supabase.from("meal_logs").select("meal_id").eq("user_id", user.id).eq("date", today),
        supabase.from("workout_logs").select("concluido, workout_id, tipo_treino").eq("user_id", user.id).eq("date", today).maybeSingle(),
        supabase.from("daily_logs").select("agua_ml").eq("user_id", user.id).eq("date", today).maybeSingle(),
        supabase.from("user_settings").select("meta_agua_ml, meta_peso, copo_ml, agenda_treino, onboarding_done").eq("user_id", user.id).maybeSingle(),
        supabase.from("focus_logs").select("minutos").eq("user_id", user.id).gte("date", daysAgoStr(6)),
        workoutsQuery,
      ]);

    if (settings.data && !settings.data.onboarding_done) {
      router.push("/onboarding");
      return;
    }

    const doneIds = new Set(mealLogs.data?.map((l) => l.meal_id));
    const mealList = (meals.data as Meal[]) ?? [];
    let kcalDone = 0, kcalTotal = 0;
    for (const m of mealList) {
      const kcal = m.itens.reduce((a, i) => a + (i.kcal || 0), 0);
      kcalTotal += kcal;
      if (doneIds.has(m.id)) kcalDone += kcal;
    }

    const metaAgua = settings.data?.meta_agua_ml ?? 3000;
    const copoMl = settings.data?.copo_ml ?? 250;
    const aguaMl = daily.data?.agua_ml ?? 0;
    const treinoDone = workout.data?.concluido ?? false;
    const agenda =
      treinoBundle?.agenda ??
      ((settings.data?.agenda_treino as Record<string, string | null>) ?? {});
    const schedId = getScheduledWorkoutId(agenda);
    const sched = findWorkoutById((workouts.data as Workout[]) ?? [], schedId);
    setScheduled(sched);

    const mealPct = mealList.length ? (doneIds.size / mealList.length) * 100 : 0;
    const aguaPct = metaAgua ? Math.min(100, (aguaMl / metaAgua) * 100) : 0;
    const treinoPct = treinoDone ? 100 : schedId ? 0 : 100;

    const hasTreinoHoje = !!schedId;
    const pctDia = hasTreinoHoje
      ? (mealPct * 0.4 + aguaPct * 0.2 + treinoPct * 0.4)
      : (mealPct * 0.5 + aguaPct * 0.5);

    const r: Resumo = {
      totalMeals: mealList.length,
      doneMeals: doneIds.size,
      kcalDone,
      kcalTotal,
      treinoDone,
      treinoNome: sched ? `${sched.letra} — ${sched.nome}` : null,
      aguaMl,
      metaAgua,
      copoMl,
      focoMinSemana: focus.data?.reduce((a, f) => a + f.minutos, 0) ?? 0,
      pctDia,
    };
    setResumo(r);
    setCached("dash_resumo", r);

    const pending = mealList.find((m) => !doneIds.has(m.id));
    setNextMeal(pending ?? null);
    setLoading(false);
  }, [today, router]);

  useEffect(() => {
    load();
  }, [load]);

  const conquistas = ACHIEVEMENTS.filter((a) => (streak?.max ?? 0) >= a.dias);

  return (
    <div className="space-y-4 pb-2">
      <header className="animate-fade-up flex items-center justify-between pt-1">
        <div>
          <p className="section-label">Painel do dia</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Hoje</h1>
        </div>
        <Link href="/configuracoes" className="btn-ghost p-2.5">
          <Settings size={20} />
        </Link>
      </header>

      {isRetroactiveWindow() && (
        <div className="card animate-fade-up border-amber/25 bg-amber/10 px-4 py-3 text-sm text-amber">
          Até 9h você ainda pode fechar{" "}
          <Link href="/dieta" className="font-semibold underline">
            o dia de ontem
          </Link>
          .
        </div>
      )}

      {loading ? (
        <SkeletonCard />
      ) : (
        <>
          <BentoCard variant="violet" className="flex animate-fade-up items-center gap-5 !min-h-0 py-5" span={2}>
            <ProgressRing pct={resumo?.pctDia ?? 0} atRisk={atRisk} />
            <div className="flex-1">
              <BentoLabel>Dia fechado</BentoLabel>
              <p className={`bento-hero-value ${atRisk ? "text-amber" : ""}`}>
                {streak?.current ?? 0}
              </p>
              <p className="mt-1 text-sm text-white/50">
                {atRisk
                  ? "Streak em risco — feche o dia"
                  : (streak?.current ?? 0) > 0
                    ? `dias · recorde ${streak?.max}`
                    : "Hoje você define o ritmo"}
              </p>
              {conquistas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {conquistas.map((c) => (
                    <span
                      key={c.dias}
                      className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-amber"
                    >
                      <Trophy size={10} /> {c.nome}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </BentoCard>

          {atRisk && (
            <BentoCard variant="amber" className="!min-h-0 animate-fade-up" span={2}>
              <BentoLabel>Streak em risco</BentoLabel>
              <p className="mb-3 text-sm text-white/70">
                Falta pouco para fechar o dia — {Math.round(resumo?.pctDia ?? 0)}% concluído.
              </p>
              <div className="flex flex-col gap-2">
                {nextMeal && (
                  <Link
                    href="/dieta"
                    className="btn-primary flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <UtensilsCrossed size={16} />
                      Marcar {nextMeal.nome}
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                )}
                {scheduled && !resumo?.treinoDone && (
                  <Link
                    href="/treino"
                    className="btn-ghost flex items-center justify-between border border-white/10 px-4 py-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Dumbbell size={16} />
                      Iniciar {scheduled.letra} — {scheduled.nome}
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                )}
                {(resumo?.aguaMl ?? 0) < (resumo?.metaAgua ?? 3000) && (
                  <Link
                    href="/dieta"
                    className="btn-ghost flex items-center justify-between border border-white/10 px-4 py-3 text-sm"
                  >
                    <span>Completar hidratação</span>
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            </BentoCard>
          )}

          {/* PRÓXIMA AÇÃO */}
          {(nextMeal || (scheduled && !resumo?.treinoDone)) && (
            <section className="card animate-fade-up p-4">
              <p className="section-label mb-3">Próxima ação</p>
              {nextMeal && (
                <Link href="/dieta" className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2">
                    <UtensilsCrossed size={18} className="text-primary" />
                    Marcar {nextMeal.nome}
                  </span>
                  <ChevronRight size={16} className="text-muted" />
                </Link>
              )}
              {scheduled && !resumo?.treinoDone && (
                <Link href="/treino" className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2">
                    <Dumbbell size={18} className="text-primary" />
                    Iniciar {scheduled.letra} — {scheduled.nome}
                  </span>
                  <ChevronRight size={16} className="text-muted" />
                </Link>
              )}
            </section>
          )}

          {/* FRASE DO DIA */}
          <section className="card animate-fade-up p-4">
            <Quote size={16} className="mb-2 text-amber" />
            {frase ? (
              <>
                <p className="text-sm leading-relaxed">{frase.t}</p>
                <p className="mt-1 text-xs text-muted">{frase.a}</p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            )}
          </section>

          <div className="bento-grid">
            <Link href="/dieta" className="block">
              <BentoCard variant="amber" className="h-full transition-transform active:scale-[0.98]">
                <BentoLabel>Refeições</BentoLabel>
                <BentoValue sub={`${resumo?.kcalDone}/${resumo?.kcalTotal} kcal`}>
                  {resumo?.doneMeals}/{resumo?.totalMeals}
                </BentoValue>
              </BentoCard>
            </Link>
            <Link href="/treino" className="block">
              <BentoCard variant="rose" className="h-full transition-transform active:scale-[0.98]">
                <BentoLabel>Treino</BentoLabel>
                <BentoValue
                  sub={
                    resumo?.treinoDone
                      ? "concluído"
                      : resumo?.treinoNome
                        ? "pendente"
                        : "descanso"
                  }
                >
                  {resumo?.treinoNome?.split(" — ")[0] ?? "—"}
                </BentoValue>
              </BentoCard>
            </Link>
            <Link href="/dieta" className="block">
              <BentoCard variant="blue" className="h-full transition-transform active:scale-[0.98]">
                <BentoLabel>Água</BentoLabel>
                <BentoValue
                  sub={formatLitersFromMl(resumo?.aguaMl ?? 0)}
                >
                  {aguasTomadas(resumo?.aguaMl ?? 0, resumo?.copoMl ?? 250)}/
                  {totalAguas(resumo?.metaAgua ?? 3000, resumo?.copoMl ?? 250)}
                </BentoValue>
                <RangeBar
                  pct={
                    resumo?.metaAgua
                      ? Math.min(
                          100,
                          Math.round(
                            ((resumo?.aguaMl ?? 0) / resumo.metaAgua) * 100
                          )
                        )
                      : 0
                  }
                />
              </BentoCard>
            </Link>
            <Link href="/motivacao" className="block">
              <BentoCard variant="slate" className="h-full transition-transform active:scale-[0.98]">
                <BentoLabel>Foco</BentoLabel>
                <BentoValue sub="últimos 7 dias">
                  {Math.floor((resumo?.focoMinSemana ?? 0) / 60)}h
                  {String((resumo?.focoMinSemana ?? 0) % 60).padStart(2, "0")}
                </BentoValue>
              </BentoCard>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
