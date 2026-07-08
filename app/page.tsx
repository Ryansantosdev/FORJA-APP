"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  Settings,
  UtensilsCrossed,
  Dumbbell,
  Droplets,
  Scale,
  Quote,
  Timer,
  Trophy,
  NotebookPen,
  Check,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  todayStr,
  daysAgoStr,
  yesterdayStr,
  isRetroactiveWindow,
  dayOfWeek,
} from "@/lib/dates";
import { syncStreak, ACHIEVEMENTS } from "@/lib/streak";
import { insightOfTheDay } from "@/lib/insights";
import { getScheduledWorkoutId, findWorkoutById } from "@/lib/schedule";
import { getCached, setCached, getCachedEntry, isCacheFresh, DAILY_TTL } from "@/lib/cache";
import { getTreinoBundle, isTreinoCacheFresh } from "@/lib/treino-cache";
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
  focoMinSemana: number;
  nota: string;
  pctDia: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [streak, setStreak] = useState<{ current: number; max: number }>();
  const [resumo, setResumo] = useState<Resumo>();
  const [peso, setPeso] = useState("");
  const [pesoSalvo, setPesoSalvo] = useState(false);
  const [nota, setNota] = useState("");
  const [notaSalva, setNotaSalva] = useState(false);
  const [nextMeal, setNextMeal] = useState<Meal | null>(null);
  const [scheduled, setScheduled] = useState<Workout | null>(null);
  const [diarioSemana, setDiarioSemana] = useState<
    { date: string; nota: string }[]
  >([]);
  const [loading, setLoading] = useState(() => {
    const entry = getCachedEntry<Resumo>("dash_resumo");
    return !isCacheFresh(entry, DAILY_TTL);
  });
  const today = todayStr();
  const frase = insightOfTheDay(today);
  const hour = new Date().getHours();
  const atRisk = hour >= 18 && (resumo?.pctDia ?? 0) < 100;
  const isSunday = dayOfWeek() === 0;

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

    const [meals, mealLogs, workout, daily, settings, focus, weight, workouts, weekNotes] =
      await Promise.all([
        supabase.from("meals").select("id, ordem, nome, icone, itens").eq("user_id", user.id).order("ordem"),
        supabase.from("meal_logs").select("meal_id").eq("user_id", user.id).eq("date", today),
        supabase.from("workout_logs").select("concluido, workout_id, tipo_treino").eq("user_id", user.id).eq("date", today).maybeSingle(),
        supabase.from("daily_logs").select("agua_ml, nota").eq("user_id", user.id).eq("date", today).maybeSingle(),
        supabase.from("user_settings").select("meta_agua_ml, meta_peso, agenda_treino, onboarding_done").eq("user_id", user.id).maybeSingle(),
        supabase.from("focus_logs").select("minutos").eq("user_id", user.id).gte("date", daysAgoStr(6)),
        supabase.from("weight_logs").select("peso").eq("user_id", user.id).eq("date", today).maybeSingle(),
        workoutsQuery,
        supabase.from("daily_logs").select("date, nota").eq("user_id", user.id).gte("date", daysAgoStr(6)).not("nota", "is", null),
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
      focoMinSemana: focus.data?.reduce((a, f) => a + f.minutos, 0) ?? 0,
      nota: daily.data?.nota ?? "",
      pctDia,
    };
    setResumo(r);
    setCached("dash_resumo", r);

    const pending = mealList.find((m) => !doneIds.has(m.id));
    setNextMeal(pending ?? null);
    setNota(daily.data?.nota ?? "");
    if (weight.data?.peso) {
      setPeso(String(weight.data.peso));
      setPesoSalvo(true);
    }
    setDiarioSemana(
      (weekNotes.data ?? [])
        .filter((d) => d.nota?.trim())
        .map((d) => ({ date: d.date, nota: d.nota! }))
    );
    setLoading(false);
  }, [today, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function salvarPeso() {
    const valor = parseFloat(peso.replace(",", "."));
    if (!valor || valor <= 0) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("weight_logs").upsert(
      { user_id: user.id, date: today, peso: valor },
      { onConflict: "user_id,date" }
    );
    setPesoSalvo(true);
  }

  async function salvarNota() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("daily_logs").upsert(
      { user_id: user.id, date: today, nota, agua_ml: resumo?.aguaMl ?? 0 },
      { onConflict: "user_id,date" }
    );
    setNotaSalva(true);
    setTimeout(() => setNotaSalva(false), 2000);
  }

  const conquistas = ACHIEVEMENTS.filter((a) => (streak?.max ?? 0) >= a.dias);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Flame size={22} className={atRisk ? "text-amber" : "text-primary"} />
          <h1 className="text-xl font-bold">Hoje</h1>
        </div>
        <Link href="/configuracoes" className="p-2 text-muted">
          <Settings size={20} />
        </Link>
      </header>

      {isRetroactiveWindow() && (
        <div className="rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">
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
          {/* ANEL + STREAK */}
          <section className="flex items-center gap-6 rounded-2xl bg-surface p-5">
            <ProgressRing pct={resumo?.pctDia ?? 0} atRisk={atRisk} />
            <div className="flex-1">
              <p className={`text-4xl font-black tabular-nums ${atRisk ? "text-amber" : "text-primary"}`}>
                {streak?.current ?? 0}
              </p>
              <p className="text-sm text-muted">
                {atRisk
                  ? "Streak em risco. Feche o dia."
                  : (streak?.current ?? 0) > 0
                    ? `dias · recorde ${streak?.max}`
                    : "Streak zerado. Hoje decide."}
              </p>
              {conquistas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {conquistas.map((c) => (
                    <span key={c.dias} className="inline-flex items-center gap-1 rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[10px] text-amber">
                      <Trophy size={10} /> {c.nome}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* PRÓXIMA AÇÃO */}
          {(nextMeal || (scheduled && !resumo?.treinoDone)) && (
            <section className="rounded-2xl bg-surface p-4">
              <p className="mb-2 text-xs font-semibold text-muted">Próxima ação</p>
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
          <section className="rounded-2xl bg-surface p-4">
            <Quote size={16} className="mb-2 text-amber" />
            <p className="text-sm leading-relaxed">{frase.t}</p>
            <p className="mt-1 text-xs text-muted">{frase.a}</p>
          </section>

          {/* CARDS RESUMO */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dieta" className="rounded-2xl bg-surface p-4">
              <UtensilsCrossed size={18} className="text-primary" />
              <p className="mt-2 text-lg font-bold">
                {resumo?.doneMeals}/{resumo?.totalMeals}
              </p>
              <p className="text-xs text-muted">{resumo?.kcalDone}/{resumo?.kcalTotal} kcal</p>
            </Link>
            <Link href="/treino" className="rounded-2xl bg-surface p-4">
              <Dumbbell size={18} className={resumo?.treinoDone ? "text-primary" : "text-muted"} />
              <p className="mt-2 text-sm font-bold">
                {resumo?.treinoNome ?? "Descanso"}
              </p>
              <p className="text-xs text-muted">
                {resumo?.treinoDone ? "concluído" : resumo?.treinoNome ? "pendente" : "—"}
              </p>
            </Link>
            <Link href="/dieta" className="rounded-2xl bg-surface p-4">
              <Droplets size={18} className="text-[#4db8ff]" />
              <p className="mt-2 text-lg font-bold">
                {((resumo?.aguaMl ?? 0) / 1000).toFixed(1)}L
              </p>
              <p className="text-xs text-muted">de {((resumo?.metaAgua ?? 3000) / 1000).toFixed(1)}L</p>
            </Link>
            <Link href="/motivacao" className="rounded-2xl bg-surface p-4">
              <Timer size={18} className="text-amber" />
              <p className="mt-2 text-lg font-bold">
                {Math.floor((resumo?.focoMinSemana ?? 0) / 60)}h
                {String((resumo?.focoMinSemana ?? 0) % 60).padStart(2, "0")}
              </p>
              <p className="text-xs text-muted">foco (7d)</p>
            </Link>
          </div>

          {/* REVISÃO SEMANAL (domingo) */}
          {isSunday && (
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle size={16} className="text-primary" />
                Revisão da semana
              </p>
              {diarioSemana.length > 0 ? (
                <ul className="space-y-1 text-xs text-muted">
                  {diarioSemana.map((d) => (
                    <li key={d.date}>
                      <span className="text-ink">{d.date.slice(5)}:</span> {d.nota}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">
                  Nenhuma nota esta semana. Use o diário de 1 linha abaixo.
                </p>
              )}
            </section>
          )}

          {/* PESO + DIÁRIO */}
          <section className="rounded-2xl bg-surface p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Scale size={16} className="text-muted" /> Peso de hoje
            </div>
            <div className="mb-4 flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="ex: 105.0"
                value={peso}
                onChange={(e) => { setPeso(e.target.value); setPesoSalvo(false); }}
                className="flex-1 rounded-xl border border-line bg-elev px-4 py-3 outline-none focus:border-primary"
              />
              <button onClick={salvarPeso} className={`rounded-xl px-5 font-bold ${pesoSalvo ? "bg-primary-dim text-white" : "bg-primary text-black"}`}>
                {pesoSalvo ? <Check size={20} /> : "kg"}
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <NotebookPen size={16} className="text-muted" /> Diário
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                maxLength={200}
                placeholder="1 linha de honestidade"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="flex-1 rounded-xl border border-line bg-elev px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <button onClick={salvarNota} className="rounded-xl border border-line bg-elev px-4 text-sm">
                {notaSalva ? <Check size={18} className="text-primary" /> : "OK"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
