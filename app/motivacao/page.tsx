"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Quote, Play, Square, CheckCircle2, Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr, daysAgoStr, formatShort } from "@/lib/dates";
import { showToast } from "@/lib/toast";
import BentoCard, { BentoLabel, BentoValue } from "@/components/BentoCard";
import { SkeletonMente } from "@/components/Skeleton";
import { useDailyData, invalidateDailyCache } from "@/components/DailyDataProvider";
import {
  drawInsight,
  contextualInsight,
  CATEGORIAS,
  type Categoria,
  type Insight,
} from "@/lib/insights";

const DEEP_WORK_MIN = 50;

export default function MentePage() {
  const { snapshot, loading } = useDailyData();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [contextual, setContextual] = useState<Insight | null>(null);
  const [categoria, setCategoria] = useState<Categoria | undefined>();

  useEffect(() => {
    if (!snapshot) return;
    const hour = new Date().getHours();
    const total = snapshot.meals.length;
    const done = snapshot.mealDoneIds.length;
    const treinoDone = snapshot.workoutLog?.concluido ?? false;
    setContextual(
      contextualInsight({
        hour,
        treinoDone,
        treinoPendente: !treinoDone && hour >= 17,
        streak: snapshot.streak.current,
        diaIncompleto: done < total || !treinoDone,
      })
    );
  }, [snapshot]);

  const focoSemana = useMemo(() => {
    if (!snapshot) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const d = daysAgoStr(6 - i);
      return { date: d, minutos: snapshot.focusByDay[d] ?? 0 };
    });
  }, [snapshot]);

  const totalSemana = focoSemana.reduce((a, d) => a + d.minutos, 0);
  const blocosSemana = focoSemana.filter(
    (d) => d.minutos >= DEEP_WORK_MIN
  ).length;

  const showSkeleton = loading && !snapshot;

  return (
    <div className="space-y-4">
      <header className="page-header pt-1">
        <p className="section-label">Foco mental</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Mente</h1>
        <p className="mt-0.5 text-xs text-white/45">
          Choque de realidade e trabalho profundo
        </p>
      </header>

      {showSkeleton ? (
        <SkeletonMente />
      ) : (
        <>
          {contextual && (
            <BentoCard variant="violet" className="!min-h-0">
              <BentoLabel>Para agora</BentoLabel>
              <p className="text-sm leading-relaxed">{contextual.t}</p>
              <p className="mt-1 text-xs text-white/45">{contextual.a}</p>
            </BentoCard>
          )}

          <BentoCard variant="slate" className="!min-h-0" span={2}>
            <div className="mb-3 flex items-center gap-2">
              <Brain size={14} className="text-white/50" />
              <BentoLabel>Foco esta semana</BentoLabel>
            </div>
            <BentoValue sub={`${blocosSemana} blocos de ${DEEP_WORK_MIN} min`}>
              {Math.floor(totalSemana / 60)}h
              {String(totalSemana % 60).padStart(2, "0")}
            </BentoValue>
            <div className="mt-3 flex justify-between gap-1">
              {focoSemana.map((d) => {
                const pct = Math.min(
                  100,
                  Math.round((d.minutos / DEEP_WORK_MIN) * 100)
                );
                return (
                  <div
                    key={d.date}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      className="w-full overflow-hidden rounded-full bg-white/[0.06]"
                      style={{ height: 40 }}
                    >
                      <div
                        className="w-full rounded-full bg-primary transition-[height,margin] duration-300"
                        style={{
                          height: `${Math.max(4, pct)}%`,
                          marginTop: `${100 - Math.max(4, pct)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-white/35">
                      {formatShort(d.date).slice(0, 5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </BentoCard>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoria(undefined)}
              className={`btn-ghost shrink-0 rounded-full px-3 py-1.5 text-xs ${
                !categoria ? "text-primary" : ""
              }`}
            >
              Todas
            </button>
            {CATEGORIAS.map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={`btn-ghost shrink-0 rounded-full px-3 py-1.5 text-xs ${
                  categoria === c ? "text-primary" : ""
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <BentoCard variant="slate" className="p-6">
            {insight ? (
              <>
                <Quote size={22} className="mb-3 text-amber" />
                <p className="text-lg font-medium leading-relaxed">{insight.t}</p>
                <p className="mt-3 text-sm text-muted">
                  {insight.a} · {insight.c}
                </p>
              </>
            ) : (
              <p className="py-4 text-center text-sm text-muted">
                A mente que você não forja de manhã te sabota à noite.
              </p>
            )}
          </BentoCard>

          <button
            onClick={() => setInsight(drawInsight(categoria))}
            className="btn-primary flex w-full items-center justify-center gap-2 py-4"
          >
            <Flame size={20} /> Forjar Mente
          </button>

          <DeepWork focusTodayMin={snapshot?.focusByDay[todayStr()] ?? 0} />
        </>
      )}
    </div>
  );
}

function DeepWork({ focusTodayMin }: { focusTodayMin: number }) {
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(DEEP_WORK_MIN * 60);
  const [doneToday, setDoneToday] = useState(focusTodayMin);
  const [sessionDone, setSessionDone] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    setDoneToday(focusTodayMin);
  }, [focusTodayMin]);

  async function salvarSessao(minutos: number) {
    if (minutos < 1) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("focus_logs").insert({
      user_id: user.id,
      date: todayStr(),
      minutos,
    });
    setDoneToday((d) => d + minutos);
    invalidateDailyCache();
    showToast(`${minutos} min de foco salvos ✓`);
  }

  function start() {
    setRunning(true);
    setSessionDone(false);
    setLeft(DEEP_WORK_MIN * 60);
    startedAt.current = Date.now();
    interval.current = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          if (interval.current) clearInterval(interval.current);
          setRunning(false);
          setSessionDone(true);
          salvarSessao(DEEP_WORK_MIN);
          navigator.vibrate?.([300, 150, 300]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stop() {
    if (interval.current) clearInterval(interval.current);
    setRunning(false);
    const mins = startedAt.current
      ? Math.floor((Date.now() - startedAt.current) / 60000)
      : 0;
    salvarSessao(mins);
    setLeft(DEEP_WORK_MIN * 60);
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <BentoCard
      variant="blue"
      className={`!min-h-0 text-center ${running ? "bento-timer-active" : ""}`}
      span={2}
    >
      <BentoLabel>Foco profundo</BentoLabel>
      <p className="mb-1 text-xs text-white/45">
        {running
          ? "Bloco em andamento — sem distrações"
          : `${DEEP_WORK_MIN} min sem distrações`}
      </p>
      <p
        className={`text-6xl font-black tabular-nums ${running ? "text-primary animate-pulse-neon" : "text-white"}`}
      >
        {mm}:{ss}
      </p>
      {running && (
        <p className="mt-1 text-sm font-semibold text-primary">
          {mm}:{ss} restantes
        </p>
      )}
      {sessionDone && !running && (
        <p className="mt-2 text-sm font-semibold text-mint">
          <CheckCircle2 size={16} className="inline" /> Bloco concluído
        </p>
      )}
      <div className="mt-4">
        {running ? (
          <button
            onClick={stop}
            className="btn-ghost inline-flex items-center gap-2 border border-danger/50 px-6 py-3 font-bold text-danger"
          >
            <Square size={16} /> Encerrar
          </button>
        ) : (
          <button
            onClick={start}
            className="btn-primary inline-flex items-center gap-2 px-6 py-3"
          >
            <Play size={16} /> Iniciar bloco
          </button>
        )}
      </div>
      <p className="mt-4 text-xs text-white/45">
        Hoje: {Math.floor(doneToday / 60)}h
        {String(doneToday % 60).padStart(2, "0")}
      </p>
    </BentoCard>
  );
}
