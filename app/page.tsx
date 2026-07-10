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
} from "lucide-react";
import { isRetroactiveWindow } from "@/lib/dates";
import { ACHIEVEMENTS } from "@/lib/streak";
import { insightOnAppOpen, type Insight } from "@/lib/insights";
import { getScheduledWorkoutId, findWorkoutById } from "@/lib/schedule";
import { getTreinoBundle } from "@/lib/treino-cache";
import { aguasTomadas, totalAguas } from "@/lib/agua";
import { formatLitersFromMl } from "@/lib/format";
import BentoCard, { BentoLabel, BentoValue } from "@/components/BentoCard";
import RangeBar from "@/components/RangeBar";
import ProgressRing from "@/components/ProgressRing";
import { RefreshCw } from "lucide-react";
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
    let kcalDone = 0;
    let kcalTotal = 0;
    for (const m of mealList) {
      const kcal = m.itens.reduce((a, i) => a + (i.kcal || 0), 0);
      kcalTotal += kcal;
      if (doneIds.has(m.id)) kcalDone += kcal;
    }

    const metaAgua = snapshot.settings.meta_agua_ml;
    const copoMl = snapshot.settings.copo_ml;
    const aguaMl = snapshot.aguaMl;
    const treinoDone = snapshot.workoutLog?.concluido ?? false;
    const treinoBundle = getTreinoBundle();
    const workouts = treinoBundle?.workouts ?? [];
    const agenda =
      treinoBundle?.agenda ?? snapshot.settings.agenda_treino;
    const schedId = getScheduledWorkoutId(agenda);
    const sched = findWorkoutById(workouts, schedId);

    const mealPct = mealList.length ? (doneIds.size / mealList.length) * 100 : 0;
    const aguaPct = metaAgua ? Math.min(100, (aguaMl / metaAgua) * 100) : 0;
    const treinoPct = treinoDone ? 100 : schedId ? 0 : 100;
    const hasTreinoHoje = !!schedId;
    const pctDia = hasTreinoHoje
      ? mealPct * 0.4 + aguaPct * 0.2 + treinoPct * 0.4
      : mealPct * 0.5 + aguaPct * 0.5;

    return {
      totalMeals: mealList.length,
      doneMeals: doneIds.size,
      kcalDone,
      kcalTotal,
      treinoDone,
      treinoNome: sched ? `${sched.letra} — ${sched.nome}` : null,
      aguaMl,
      metaAgua,
      copoMl,
      focoMinSemana: snapshot.focusWeekMin,
      pctDia,
      sched,
      nextMeal: mealList.find((m) => !doneIds.has(m.id)) ?? null,
    };
  }, [snapshot]);

  const streak = snapshot?.streak;
  const atRisk = hour >= 18 && (resumo?.pctDia ?? 0) < 100;
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
          <BentoCard
            variant="violet"
            className="flex items-center gap-5 !min-h-0 py-5"
            span={2}
          >
            <ProgressRing pct={resumo.pctDia} atRisk={atRisk} />
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
            <BentoCard variant="amber" className="!min-h-0" span={2}>
              <BentoLabel>Streak em risco</BentoLabel>
              <p className="mb-3 text-sm text-white/70">
                Falta pouco para fechar o dia — {Math.round(resumo.pctDia)}%
                concluído.
              </p>
              <div className="flex flex-col gap-2">
                {resumo.nextMeal && (
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
                {resumo.aguaMl < resumo.metaAgua && (
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

          {(resumo.nextMeal || (resumo.sched && !resumo.treinoDone)) && (
            <section className="card p-4">
              <p className="section-label mb-3">Próxima ação</p>
              {resumo.nextMeal && (
                <Link href="/dieta" className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2">
                    <UtensilsCrossed size={18} className="text-primary" />
                    Marcar {resumo.nextMeal.nome}
                  </span>
                  <ChevronRight size={16} className="text-muted" />
                </Link>
              )}
              {resumo.sched && !resumo.treinoDone && (
                <Link href="/treino" className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2">
                    <Dumbbell size={18} className="text-primary" />
                    Iniciar {resumo.sched.letra} — {resumo.sched.nome}
                  </span>
                  <ChevronRight size={16} className="text-muted" />
                </Link>
              )}
            </section>
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
            <Link href="/dieta" className="block">
              <BentoCard variant="blue" className="h-full transition-transform active:scale-[0.98]">
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
              </BentoCard>
            </Link>
            <Link href="/motivacao" className="block">
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
