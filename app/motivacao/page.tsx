"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, Quote, Play, Square, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr } from "@/lib/dates";
import {
  drawInsight,
  contextualInsight,
  CATEGORIAS,
  type Categoria,
  type Insight,
  type DayContext,
} from "@/lib/insights";

const DEEP_WORK_MIN = 50;

export default function MentePage() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [contextual, setContextual] = useState<Insight | null>(null);
  const [categoria, setCategoria] = useState<Categoria | undefined>();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const today = todayStr();
      const hour = new Date().getHours();
      const [workout, stats, meals, mealLogs] = await Promise.all([
        supabase.from("workout_logs").select("concluido").eq("user_id", user.id).eq("date", today).maybeSingle(),
        supabase.from("user_stats").select("current_streak").eq("user_id", user.id).maybeSingle(),
        supabase.from("meals").select("id").eq("user_id", user.id),
        supabase.from("meal_logs").select("meal_id").eq("user_id", user.id).eq("date", today),
      ]);
      const total = meals.data?.length ?? 0;
      const done = mealLogs.data?.length ?? 0;
      const treinoDone = workout.data?.concluido ?? false;
      const ctx: DayContext = {
        hour,
        treinoDone,
        treinoPendente: !treinoDone && hour >= 17,
        streak: stats.data?.current_streak ?? 0,
        diaIncompleto: done < total || !treinoDone,
      };
      setContextual(contextualInsight(ctx));
    })();
  }, []);

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <h1 className="text-xl font-bold">Mente</h1>
        <p className="text-xs text-muted">Choque de realidade e trabalho profundo</p>
      </header>

      {contextual && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">Para agora</p>
          <p className="text-sm leading-relaxed">{contextual.t}</p>
          <p className="mt-1 text-xs text-muted">{contextual.a}</p>
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCategoria(undefined)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${!categoria ? "border-primary bg-primary/10 text-primary" : "border-line text-muted"}`}>Todas</button>
        {CATEGORIAS.map((c) => (
          <button key={c} onClick={() => setCategoria(c)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${categoria === c ? "border-primary bg-primary/10 text-primary" : "border-line text-muted"}`}>{c}</button>
        ))}
      </div>

      <section className="rounded-2xl bg-surface p-6">
        {insight ? (
          <>
            <Quote size={22} className="mb-3 text-amber" />
            <p className="text-lg font-medium leading-relaxed">{insight.t}</p>
            <p className="mt-3 text-sm text-muted">{insight.a} · {insight.c}</p>
          </>
        ) : (
          <p className="py-4 text-center text-sm text-muted">A mente que você não forja de manhã te sabota à noite.</p>
        )}
      </section>

      <button onClick={() => setInsight(drawInsight(categoria))} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-black">
        <Flame size={20} /> Forjar Mente
      </button>

      <DeepWork />
    </div>
  );
}

function DeepWork() {
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(DEEP_WORK_MIN * 60);
  const [doneToday, setDoneToday] = useState(0);
  const [sessionDone, setSessionDone] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("focus_logs").select("minutos").eq("user_id", user.id).eq("date", todayStr());
      setDoneToday(data?.reduce((a, f) => a + f.minutos, 0) ?? 0);
    })();
    return () => { if (interval.current) clearInterval(interval.current); };
  }, []);

  async function salvarSessao(minutos: number) {
    if (minutos < 1) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("focus_logs").insert({ user_id: user.id, date: todayStr(), minutos });
    setDoneToday((d) => d + minutos);
  }

  function start() {
    setRunning(true); setSessionDone(false); setLeft(DEEP_WORK_MIN * 60);
    startedAt.current = Date.now();
    interval.current = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          if (interval.current) clearInterval(interval.current);
          setRunning(false); setSessionDone(true); salvarSessao(DEEP_WORK_MIN);
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
    salvarSessao(startedAt.current ? Math.floor((Date.now() - startedAt.current) / 60000) : 0);
    setLeft(DEEP_WORK_MIN * 60);
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <section className="rounded-2xl bg-surface p-6 text-center">
      <p className="text-sm font-semibold">Modo Deep Work</p>
      <p className="mb-4 text-xs text-muted">{DEEP_WORK_MIN} min sem distrações</p>
      <p className={`text-6xl font-black tabular-nums ${running ? "text-primary" : ""}`}>{mm}:{ss}</p>
      {sessionDone && <p className="mt-2 text-sm font-semibold text-primary"><CheckCircle2 size={16} className="inline" /> Bloco concluído</p>}
      <div className="mt-4">
        {running ? (
          <button onClick={stop} className="inline-flex items-center gap-2 rounded-xl border border-danger/50 px-6 py-3 font-bold text-danger"><Square size={16} /> Encerrar</button>
        ) : (
          <button onClick={start} className="inline-flex items-center gap-2 rounded-xl bg-amber px-6 py-3 font-bold text-black"><Play size={16} /> Iniciar bloco</button>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">Hoje: {Math.floor(doneToday / 60)}h{String(doneToday % 60).padStart(2, "0")}</p>
    </section>
  );
}
