"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  UtensilsCrossed,
  Dumbbell,
  Quote,
  Trophy,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { isRetroactiveWindow } from "@/lib/dates";
import { ACHIEVEMENTS } from "@/lib/streak";
import { insightOnAppOpen, type Insight } from "@/lib/insights";
import { getScheduledWorkoutId, findWorkoutById } from "@/lib/schedule";
import { getTreinoBundle } from "@/lib/treino-cache";
import { aguasTomadas, totalAguas } from "@/lib/agua";
import { formatLitersFromMl } from "@/lib/format";
import {
  calcDayChecklist,
  sumMacros,
  horarioSugeridoRefeicao,
} from "@/lib/nutrition";
import BentoCard, { BentoLabel, BentoValue } from "@/components/BentoCard";
import RangeBar from "@/components/RangeBar";
import ProgressRing from "@/components/ProgressRing";
import DayChecklist from "@/components/DayChecklist";
import QuickWaterButton from "@/components/QuickWaterButton";
import { SkeletonDashboard } from "@/components/Skeleton";
import { useDailyData } from "@/components/DailyDataProvider";

export default function Dashboard() {
  const router = useRouter();
  const { snapshot, loading, ready, error, refresh } = useDailyData();
  const [frase, setFrase] = useState<Insight | null>(null);
  const [hour, setHour] = useState(0);

  useEffect(() => {
    setHour(new Date().getHours());
    setFrase(insightOnAppOpen());
  }, []);

  useEffect(() => {
    if (
      ready &&
      snapshot?.hasSettingsRow &&
      snapshot.settings.onboarding_done === false
    ) {
      router.push("/onboarding");
    }
  }, [ready, snapshot, router]);

  const resumo = useMemo(() => {
    if (!snapshot) return null;

    const mealList = snapshot.meals;
    const doneIds = new Set(snapshot.mealDoneIds);
    const macros = sumMacros(mealList, doneIds);

    const metaAgua = snapshot.settings.meta_agua_ml;
    const copoMl = snapshot.settings.copo_ml;
    const metaProt = snapshot.settings.meta_proteina_g;
    const aguaMl = snapshot.aguaMl;
    const treinoDone = snapshot.workoutLog?.concluido ?? false;
    const treinoBundle = getTreinoBundle();
    const workouts = treinoBundle?.workouts ?? [];
    const agenda = treinoBundle?.agenda ?? snapshot.settings.agenda_treino;
    const schedId = getScheduledWorkoutId(agenda);
    const sched = findWorkoutById(workouts, schedId);
    const hasTreinoHoje = !!schedId;

    const checklist = calcDayChecklist({
      mealsCount: mealList.length,
      mealsDone: doneIds.size,
      aguaMl,
      metaAguaMl: metaAgua,
      treinoDone,
      hasTreinoHoje,
    });

    const nextMeal = mealList.find((m) => !doneIds.has(m.id)) ?? null;

    return {
      totalMeals: mealList.length,
      doneMeals: doneIds.size,
      ...macros,
      metaProt,
      treinoDone,
      treinoNome: sched ? `${sched.letra} — ${sched.nome}` : null,
      sched,
      hasTreinoHoje,
      aguaMl,
      metaAgua,
      copoMl,
      focoMinSemana: snapshot.focusWeekMin,
      checklist,
      nextMeal,
      nextMealHorario: nextMeal ? horarioSugeridoRefeicao(nextMeal.ordem) : null,
    };
  }, [snapshot]);

  const streak = snapshot?.streak;
  const atRisk = !!(hour >= 18 && resumo && !resumo.checklist.diaCompleto);
  const showSkeleton = !ready || (loading && !snapshot);
  const conquistas = ACHIEVEMENTS.filter((a) => (streak?.max ?? 0) >= a.dias);

  return (
    <div className="space-y-4 pb-2">
      <header className="page-header flex items-center justify-between pt-1">
        <div>
          <p className="section-label">Painel do dia</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Hoje</h1>
        </div>
        <Link href="/configuracoes" className="btn-ghost p-2.5">
          <Settings size={20} />
        </Link>
      </header>

      {isRetroactiveWindow() && (
        <div className="card border-amber/25 bg-amber/10 px-4 py-3 text-sm text-amber">
          Até 9h você ainda pode fechar{" "}
          <Link href="/dieta" className="font-semibold underline">
            o dia de ontem
          </Link>
          .
        </div>
      )}

      {showSkeleton ? (
        <SkeletonDashboard />
      ) : error && !resumo ? (
        <div className="card p-6 text-center">
          <p className="mb-1 font-semibold">Não foi possível carregar</p>
          <p className="mb-4 text-xs text-white/45">{error}</p>
          <button
            type="button"
            onClick={() => void refresh(true)}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <RefreshCw size={16} /> Tentar de novo
          </button>
        </div>
      ) : resumo ? (
        <>
          {resumo.checklist.diaCompleto && (
            <BentoCard variant="mint" className="!min-h-0" span={2}>
              <p className="flex items-center gap-2 text-sm font-semibold text-mint">
                <Sparkles size={18} /> Dia completo
              </p>
              <p className="mt-1 text-xs text-white/55">
                Refeições, água e treino ok. Mantenha a sequência amanhã.
              </p>
            </BentoCard>
          )}

          <BentoCard
            variant="violet"
            className="flex items-start gap-4 !min-h-0 py-5"
            span={2}
          >
            <ProgressRing pct={resumo.checklist.pctDia} atRisk={atRisk} />
            <div className="min-w-0 flex-1">
              <BentoLabel>Sequência</BentoLabel>
              <p className={`bento-hero-value ${atRisk ? "text-amber" : ""}`}>
                {streak?.current ?? 0}
              </p>
              <p className="text-xs text-white/45">
                {Math.round(resumo.checklist.pctDia)}% do dia · recorde{" "}
                {streak?.max ?? 0}
              </p>
              <DayChecklist
                checklist={resumo.checklist}
                doneMeals={resumo.doneMeals}
                totalMeals={resumo.totalMeals}
                aguaMl={resumo.aguaMl}
                metaAgua={resumo.metaAgua}
                copoMl={resumo.copoMl}
                treinoLabel={
                  resumo.treinoDone
                    ? "concluído"
                    : resumo.sched
                      ? resumo.sched.letra
                      : null
                }
              />
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

          {resumo.nextMeal && !resumo.checklist.diaCompleto && (
            <BentoCard variant="amber" className="!min-h-0" span={2}>
              <BentoLabel>Próxima refeição</BentoLabel>
              <Link
                href="/dieta"
                className="btn-primary mt-2 flex items-center justify-between px-4 py-3.5 text-sm"
              >
                <span className="flex flex-col items-start gap-0.5">
                  <span className="flex items-center gap-2 font-bold">
                    <UtensilsCrossed size={16} />
                    Marcar {resumo.nextMeal.nome}
                  </span>
                  {resumo.nextMealHorario && (
                    <span className="text-[10px] font-normal opacity-70">
                      Sugestão {resumo.nextMealHorario}
                    </span>
                  )}
                </span>
                <ChevronRight size={16} />
              </Link>
            </BentoCard>
          )}

          {atRisk && (
            <BentoCard variant="amber" className="!min-h-0" span={2}>
              <BentoLabel>Streak em risco</BentoLabel>
              <p className="mb-3 text-sm text-white/70">
                Faltam itens para fechar o dia — {Math.round(resumo.checklist.pctDia)}%
                concluído.
              </p>
              <div className="flex flex-col gap-2">
                {!resumo.checklist.mealsOk && resumo.nextMeal && (
                  <Link
                    href="/dieta"
                    className="btn-primary flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <UtensilsCrossed size={16} />
                      Marcar {resumo.nextMeal.nome}
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                )}
                {resumo.sched && !resumo.treinoDone && (
                  <Link
                    href="/treino"
                    className="btn-ghost flex items-center justify-between border border-white/10 px-4 py-3 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Dumbbell size={16} />
                      Iniciar {resumo.sched.letra} — {resumo.sched.nome}
                    </span>
                    <ChevronRight size={16} />
                  </Link>
                )}
                {!resumo.checklist.aguaOk && (
                  <QuickWaterButton
                    aguaMl={resumo.aguaMl}
                    copoMl={resumo.copoMl}
                  />
                )}
              </div>
            </BentoCard>
          )}

          <section className="card p-4">
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
                <BentoValue sub={`${resumo.kcalDone}/${resumo.kcalTotal} kcal`}>
                  {resumo.doneMeals}/{resumo.totalMeals}
                </BentoValue>
              </BentoCard>
            </Link>
            <Link href="/dieta" className="block">
              <BentoCard variant="mint" className="h-full transition-transform active:scale-[0.98]">
                <BentoLabel>Proteína</BentoLabel>
                <BentoValue sub={`meta ${resumo.metaProt}g`}>
                  {resumo.protDone}g
                </BentoValue>
                <RangeBar
                  pct={
                    resumo.metaProt
                      ? Math.min(100, Math.round((resumo.protDone / resumo.metaProt) * 100))
                      : 0
                  }
                  color="mint"
                />
              </BentoCard>
            </Link>
            <Link href="/treino" className="block">
              <BentoCard variant="rose" className="h-full transition-transform active:scale-[0.98]">
                <BentoLabel>Treino</BentoLabel>
                <BentoValue
                  sub={
                    resumo.treinoDone
                      ? "concluído"
                      : resumo.treinoNome
                        ? "pendente"
                        : "descanso"
                  }
                >
                  {resumo.treinoNome?.split(" — ")[0] ?? "—"}
                </BentoValue>
              </BentoCard>
            </Link>
            <div className="block">
              <BentoCard variant="blue" className="h-full">
                <Link href="/dieta" className="block transition-transform active:scale-[0.98]">
                  <BentoLabel>Água</BentoLabel>
                  <BentoValue sub={formatLitersFromMl(resumo.aguaMl)}>
                    {aguasTomadas(resumo.aguaMl, resumo.copoMl)}/
                    {totalAguas(resumo.metaAgua, resumo.copoMl)}
                  </BentoValue>
                  <RangeBar
                    pct={
                      resumo.metaAgua
                        ? Math.min(
                            100,
                            Math.round((resumo.aguaMl / resumo.metaAgua) * 100)
                          )
                        : 0
                    }
                  />
                </Link>
                {!resumo.checklist.aguaOk && (
                  <div className="mt-2">
                    <QuickWaterButton
                      aguaMl={resumo.aguaMl}
                      copoMl={resumo.copoMl}
                    />
                  </div>
                )}
              </BentoCard>
            </div>
            <Link href="/motivacao" className="col-span-2 block">
              <BentoCard variant="slate" className="h-full transition-transform active:scale-[0.98]">
                <BentoLabel>Foco</BentoLabel>
                <BentoValue sub="últimos 7 dias">
                  {Math.floor(resumo.focoMinSemana / 60)}h
                  {String(resumo.focoMinSemana % 60).padStart(2, "0")}
                </BentoValue>
              </BentoCard>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
