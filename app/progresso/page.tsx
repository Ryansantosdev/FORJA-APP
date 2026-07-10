"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Check,
  Trophy,
  Target,
  Flame,
  Scale,
  NotebookPen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr, daysAgoStr, formatShort, toDateStr } from "@/lib/dates";
import {
  getCached,
  setCached,
  getCachedEntry,
  isCacheFresh,
  PROG_TTL,
  invalidateCache,
} from "@/lib/cache";
import { showToast } from "@/lib/toast";
import LoadState from "@/components/LoadState";
import BentoCard, { BentoLabel, BentoValue } from "@/components/BentoCard";
import RangeBar from "@/components/RangeBar";
import type { WeightPoint } from "@/components/ProgressoChart";
import { calcDayChecklist, sumMacros } from "@/lib/nutrition";
import { getScheduledWorkoutId } from "@/lib/schedule";
import type { Meal } from "@/lib/types";

const ProgressoChart = dynamic(() => import("@/components/ProgressoChart"), {
  ssr: false,
  loading: () => <div className="skeleton h-44 w-full" />,
});

type DayStatus = "full" | "partial" | "none";

type ProgCache = {
  weights: WeightPoint[];
  metaPeso: number | null;
  heatmap: Record<string, DayStatus>;
  adesao: {
    dieta: number;
    treino: number;
    dietaDone: number;
    dietaTotal: number;
    treinoDone: number;
  };
  volumeSemana: number;
  streak: { current: number; max: number };
  topPr: { nome: string; carga: number } | null;
  nota: string;
  peso: string;
  pesoSalvo: boolean;
  diarioHistorico: { date: string; nota: string }[];
  semanaResumo: {
    diasCompletos: number;
    mediaAguaL: number;
    mediaProtG: number;
  };
};

const PROG_KEY = "prog_payload";

function readProgCache(): ProgCache | null {
  return getCached<ProgCache>(PROG_KEY);
}

function applyProgCache(c: ProgCache, setters: {
  setWeights: (v: WeightPoint[]) => void;
  setMetaPeso: (v: number | null) => void;
  setHeatmap: (v: Record<string, DayStatus>) => void;
  setAdesao: (v: ProgCache["adesao"]) => void;
  setVolumeSemana: (v: number) => void;
  setStreak: (v: { current: number; max: number }) => void;
  setTopPr: (v: { nome: string; carga: number } | null) => void;
  setNota: (v: string) => void;
  setPeso: (v: string) => void;
  setPesoSalvo: (v: boolean) => void;
  setDiarioHistorico: (v: { date: string; nota: string }[]) => void;
  setSemanaResumo: (v: ProgCache["semanaResumo"]) => void;
}) {
  setters.setWeights(c.weights);
  setters.setMetaPeso(c.metaPeso);
  setters.setHeatmap(c.heatmap);
  setters.setAdesao(c.adesao);
  setters.setVolumeSemana(c.volumeSemana);
  setters.setStreak(c.streak);
  setters.setTopPr(c.topPr);
  setters.setNota(c.nota);
  setters.setPeso(c.peso);
  setters.setPesoSalvo(c.pesoSalvo);
  setters.setDiarioHistorico(c.diarioHistorico);
  setters.setSemanaResumo(
    c.semanaResumo ?? { diasCompletos: 0, mediaAguaL: 0, mediaProtG: 0 }
  );
}

function movingAvg(
  weights: { date: string; peso: number }[],
  i: number
): number | undefined {
  const slice = weights.slice(Math.max(0, i - 6), i + 1);
  if (slice.length < 3) return undefined;
  return (
    Math.round((slice.reduce((a, w) => a + w.peso, 0) / slice.length) * 10) /
    10
  );
}

function championMessage(
  streak: number,
  adesaoMedia: number,
  diasPerfeitos: number
): string {
  if (streak >= 14) return "Você está na trilha do campeão. Não pare agora.";
  if (adesaoMedia >= 80) return "Ritmo forte. Cada dia conta na corrida ao ouro.";
  if (diasPerfeitos >= 3) return `${diasPerfeitos} dias perfeitos recentes. Mantenha o fôlego.`;
  if (streak > 0) return "A corrida começou. Consistência vence talento.";
  return "Hoje é o primeiro passo da sua corrida ao ouro.";
}

export default function ProgressoPage() {
  const [weights, setWeights] = useState<WeightPoint[]>([]);
  const [metaPeso, setMetaPeso] = useState<number | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, DayStatus>>({});
  const [adesao, setAdesao] = useState<{
    dieta: number;
    treino: number;
    dietaDone: number;
    dietaTotal: number;
    treinoDone: number;
  } | null>(null);
  const [volumeSemana, setVolumeSemana] = useState(0);
  const [streak, setStreak] = useState({ current: 0, max: 0 });
  const [topPr, setTopPr] = useState<{ nome: string; carga: number } | null>(
    null
  );
  const [peso, setPeso] = useState("");
  const [pesoSalvo, setPesoSalvo] = useState(false);
  const [nota, setNota] = useState("");
  const [notaSalva, setNotaSalva] = useState(false);
  const [diarioHistorico, setDiarioHistorico] = useState<
    { date: string; nota: string }[]
  >([]);
  const [semanaResumo, setSemanaResumo] = useState<ProgCache["semanaResumo"]>({
    diasCompletos: 0,
    mediaAguaL: 0,
    mediaProtG: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const today = todayStr();

  const load = useCallback(async (force = false) => {
    setLoadError(null);

    const entry = getCachedEntry<ProgCache>(PROG_KEY);
    if (!force && isCacheFresh(entry, PROG_TTL) && entry?.data) {
      applyProgCache(entry.data, {
        setWeights,
        setMetaPeso,
        setHeatmap,
        setAdesao,
        setVolumeSemana,
        setStreak,
        setTopPr,
        setNota,
        setPeso,
        setPesoSalvo,
        setDiarioHistorico,
        setSemanaResumo,
      });
      setLoading(false);
      return;
    }

    const hadCache = Boolean(readProgCache());
    if (!hadCache) setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const d7 = daysAgoStr(6);
      const d90 = daysAgoStr(89);
      const [
        weightsRes,
        mealsRes,
        mealLogsRes,
        workoutsRes,
        settingsRes,
        exRes,
        statsRes,
        allExRes,
        dailyRes,
        weightTodayRes,
        weekNotesRes,
        dailyWeekRes,
      ] = await Promise.all([
        supabase
          .from("weight_logs")
          .select("date, peso")
          .eq("user_id", user.id)
          .order("date"),
        supabase.from("meals").select("id, ordem, nome, icone, itens").eq("user_id", user.id),
        supabase
          .from("meal_logs")
          .select("date, meal_id")
          .eq("user_id", user.id)
          .gte("date", d90),
        supabase
          .from("workout_logs")
          .select("date, concluido")
          .eq("user_id", user.id)
          .gte("date", d90),
        supabase
          .from("user_settings")
          .select("meta_peso, meta_agua_ml, agenda_treino")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("exercise_logs")
          .select("carga, reps, date")
          .eq("user_id", user.id)
          .gte("date", d7),
        supabase
          .from("user_stats")
          .select("current_streak, max_streak")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("exercise_logs")
          .select("exercicio, carga")
          .eq("user_id", user.id)
          .order("carga", { ascending: false })
          .limit(1),
        supabase
          .from("daily_logs")
          .select("nota, agua_ml")
          .eq("user_id", user.id)
          .eq("date", todayStr())
          .maybeSingle(),
        supabase
          .from("weight_logs")
          .select("peso")
          .eq("user_id", user.id)
          .eq("date", todayStr())
          .maybeSingle(),
        supabase
          .from("daily_logs")
          .select("date, nota")
          .eq("user_id", user.id)
          .gte("date", daysAgoStr(13))
          .not("nota", "is", null),
        supabase
          .from("daily_logs")
          .select("date, agua_ml")
          .eq("user_id", user.id)
          .gte("date", d7),
      ]);

      const raw = (weightsRes.data ?? []).map((w) => ({
        date: w.date,
        peso: Number(w.peso),
      }));
      const chartData: WeightPoint[] = raw.map((w, i) => ({
        ...w,
        media7: movingAvg(raw, i),
      }));

      const vol = (exRes.data ?? []).reduce(
        (a, e) => a + Number(e.carga) * e.reps,
        0
      );

      const prRow = allExRes.data?.[0];
      const topPrVal = prRow
        ? { nome: prRow.exercicio, carga: Number(prRow.carga) }
        : null;

      const totalMeals = mealsRes.data?.length ?? 0;
      const mealsByDay: Record<string, number> = {};
      for (const log of mealLogsRes.data ?? [])
        mealsByDay[log.date] = (mealsByDay[log.date] ?? 0) + 1;
      const workoutByDay: Record<string, boolean> = {};
      for (const w of workoutsRes.data ?? [])
        workoutByDay[w.date] = w.concluido;

      const map: Record<string, DayStatus> = {};
      for (let i = 0; i < 90; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = toDateStr(d);
        const dietaOk =
          totalMeals > 0 && (mealsByDay[ds] ?? 0) >= totalMeals;
        const treinoOk = workoutByDay[ds] === true;
        map[ds] =
          dietaOk && treinoOk
            ? "full"
            : (mealsByDay[ds] ?? 0) > 0 || treinoOk
              ? "partial"
              : "none";
      }

      let dietaDone = 0,
        treinoDone = 0;
      for (let i = 0; i < 7; i++) {
        const ds = daysAgoStr(i);
        dietaDone += Math.min(mealsByDay[ds] ?? 0, totalMeals);
        if (workoutByDay[ds]) treinoDone++;
      }
      const dietaTotal = totalMeals * 7;
      const adesaoVal = {
        dieta: dietaTotal > 0 ? Math.round((dietaDone / dietaTotal) * 100) : 0,
        treino: Math.round((treinoDone / 7) * 100),
        dietaDone,
        dietaTotal,
        treinoDone,
      };

      const streakVal = {
        current: statsRes.data?.current_streak ?? 0,
        max: statsRes.data?.max_streak ?? 0,
      };

      const notaVal = dailyRes.data?.nota ?? "";
      const pesoVal = weightTodayRes.data?.peso
        ? String(weightTodayRes.data.peso)
        : "";
      const pesoSalvoVal = Boolean(weightTodayRes.data?.peso);
      const diarioVal = (weekNotesRes.data ?? [])
        .filter((d) => d.nota?.trim())
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((d) => ({ date: d.date, nota: d.nota! }));

      const mealsList = (mealsRes.data as Meal[]) ?? [];
      const metaAgua = settingsRes.data?.meta_agua_ml ?? 3000;
      const agenda =
        (settingsRes.data?.agenda_treino as Record<string, string | null>) ??
        {};
      const aguaByDay: Record<string, number> = {};
      for (const row of dailyWeekRes.data ?? []) {
        aguaByDay[row.date] = row.agua_ml ?? 0;
      }
      const logsByDay: Record<string, string[]> = {};
      for (const log of mealLogsRes.data ?? []) {
        if (!logsByDay[log.date]) logsByDay[log.date] = [];
        logsByDay[log.date].push(log.meal_id);
      }

      let diasCompletos = 0;
      let aguaSum = 0;
      let protSum = 0;
      for (let i = 0; i < 7; i++) {
        const ds = daysAgoStr(i);
        const doneIds = logsByDay[ds] ?? [];
        const macros = sumMacros(mealsList, doneIds);
        const aguaMl = aguaByDay[ds] ?? 0;
        const dow = new Date(`${ds}T12:00:00`).getDay();
        const schedId = getScheduledWorkoutId(agenda, dow);
        const checklist = calcDayChecklist({
          mealsCount: mealsList.length,
          mealsDone: doneIds.length,
          aguaMl,
          metaAguaMl: metaAgua,
          treinoDone: workoutByDay[ds] === true,
          hasTreinoHoje: Boolean(schedId),
        });
        if (checklist.diaCompleto) diasCompletos++;
        aguaSum += aguaMl;
        protSum += macros.protDone;
      }
      const semanaResumoVal = {
        diasCompletos,
        mediaAguaL: Math.round((aguaSum / 7 / 1000) * 10) / 10,
        mediaProtG: Math.round(protSum / 7),
      };

      setWeights(chartData);
      setMetaPeso(settingsRes.data?.meta_peso ?? null);
      setVolumeSemana(vol);
      setStreak(streakVal);
      setTopPr(topPrVal);
      setHeatmap(map);
      setAdesao(adesaoVal);
      setNota(notaVal);
      setPeso(pesoVal);
      setPesoSalvo(pesoSalvoVal);
      setDiarioHistorico(diarioVal);
      setSemanaResumo(semanaResumoVal);

      setCached(PROG_KEY, {
        weights: chartData,
        metaPeso: settingsRes.data?.meta_peso ?? null,
        heatmap: map,
        adesao: adesaoVal,
        volumeSemana: vol,
        streak: streakVal,
        topPr: topPrVal,
        nota: notaVal,
        peso: pesoVal,
        pesoSalvo: pesoSalvoVal,
        diarioHistorico: diarioVal,
        semanaResumo: semanaResumoVal,
      });
    } catch {
      setLoadError("Não foi possível carregar o progresso. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const c = readProgCache();
    if (c) {
      applyProgCache(c, {
        setWeights,
        setMetaPeso,
        setHeatmap,
        setAdesao,
        setVolumeSemana,
        setStreak,
        setTopPr,
        setNota,
        setPeso,
        setPesoSalvo,
        setDiarioHistorico,
        setSemanaResumo,
      });
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function rebuildChartData(
    raw: { date: string; peso: number }[]
  ): WeightPoint[] {
    const sorted = [...raw].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((w, i) => ({
      ...w,
      media7: movingAvg(sorted, i),
    }));
  }

  async function salvarPeso() {
    const valor = parseFloat(peso.replace(",", "."));
    if (!valor || valor <= 0) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("weight_logs").upsert(
      { user_id: user.id, date: today, peso: valor },
      { onConflict: "user_id,date" }
    );
    setWeights((prev) => {
      const raw = prev
        .filter((w) => w.date !== today)
        .map((w) => ({ date: w.date, peso: w.peso }));
      raw.push({ date: today, peso: valor });
      return rebuildChartData(raw);
    });
    setPesoSalvo(true);
    invalidateCache(PROG_KEY);
    showToast("Peso salvo ✓");
  }

  async function salvarNota() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("daily_logs").upsert(
      { user_id: user.id, date: today, nota },
      { onConflict: "user_id,date" }
    );
    setNotaSalva(true);
    setTimeout(() => setNotaSalva(false), 2000);
    showToast("Diário salvo ✓");
    invalidateCache(PROG_KEY);
    if (nota.trim()) {
      setDiarioHistorico((prev) => {
        const rest = prev.filter((d) => d.date !== today);
        return [{ date: today, nota: nota.trim() }, ...rest];
      });
    }
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function exportarCsv() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const [w, ex, m, ml, wk, fl] = await Promise.all([
      supabase
        .from("weight_logs")
        .select("date, peso")
        .eq("user_id", user.id)
        .order("date"),
      supabase
        .from("exercise_logs")
        .select("date, exercicio, carga, reps")
        .eq("user_id", user.id)
        .order("date"),
      supabase
        .from("measurements")
        .select("date, cintura, braco, peito")
        .eq("user_id", user.id)
        .order("date"),
      supabase
        .from("meal_logs")
        .select("date, meal_id")
        .eq("user_id", user.id)
        .order("date"),
      supabase
        .from("workout_logs")
        .select("date, tipo_treino, concluido")
        .eq("user_id", user.id)
        .order("date"),
      supabase
        .from("focus_logs")
        .select("date, minutos")
        .eq("user_id", user.id)
        .order("date"),
    ]);
    const lines = ["tipo,data,campo1,campo2,campo3"];
    for (const r of w.data ?? [])
      lines.push(`peso,${r.date},${r.peso},,`);
    for (const r of ex.data ?? [])
      lines.push(`exercicio,${r.date},"${r.exercicio}",${r.carga},${r.reps}`);
    for (const r of m.data ?? [])
      lines.push(
        `medidas,${r.date},${r.cintura ?? ""},${r.braco ?? ""},${r.peito ?? ""}`
      );
    for (const r of ml.data ?? [])
      lines.push(`refeicao_ok,${r.date},${r.meal_id},,`);
    for (const r of wk.data ?? [])
      lines.push(
        `treino,${r.date},${r.tipo_treino},${r.concluido ? "ok" : "pend"},`
      );
    for (const r of fl.data ?? [])
      lines.push(`foco,${r.date},${r.minutos},,`);
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `forja-${todayStr()}.csv`;
    a.click();
  }

  const dias = Array.from({ length: 90 }, (_, i) => daysAgoStr(89 - i));
  const pesoAtual = weights.length ? weights[weights.length - 1].peso : null;
  const delta =
    weights.length >= 2
      ? weights[weights.length - 1].peso - weights[0].peso
      : null;

  const diasPerfeitos7 = useMemo(() => {
    let n = 0;
    for (let i = 0; i < 7; i++) {
      if (heatmap[daysAgoStr(i)] === "full") n++;
    }
    return n;
  }, [heatmap]);

  const adesaoMedia = adesao
    ? Math.round((adesao.dieta + adesao.treino) / 2)
    : 0;

  const metaProgress =
    metaPeso && pesoAtual
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (1 -
                Math.abs(pesoAtual - metaPeso) /
                  Math.max(Math.abs(pesoAtual - metaPeso), 5)) *
                100
            )
          )
        )
      : null;

  const msg = championMessage(streak.current, adesaoMedia, diasPerfeitos7);

  return (
    <div className="space-y-5 pb-2">
      <header className="page-header flex items-start justify-between pt-1">
        <div>
          <p className="section-label">Sua jornada</p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Corrida ao ouro
          </h1>
        </div>
        <button
          onClick={exportarCsv}
          className="btn-ghost flex items-center gap-1.5 px-3 py-2"
        >
          <Download size={14} />
          <span className="text-[10px]">CSV</span>
        </button>
      </header>

      <LoadState
        loading={loading}
        error={loadError}
        onRetry={() => load(true)}
        skeleton="progresso"
      >
        <>
          {/* HERO — streak */}
          <BentoCard variant="violet" className="!min-h-0 py-6" span={2}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <BentoLabel>Sequência ativa</BentoLabel>
                <p className="bento-hero-value">{streak.current}</p>
                <p className="mt-2 max-w-[14rem] text-sm font-medium leading-snug text-white/60">
                  {msg}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <Flame
                  size={32}
                  className="text-amber animate-pulse-neon opacity-90"
                />
                <span className="text-xs text-white/45">
                  recorde {streak.max} dias
                </span>
              </div>
            </div>
          </BentoCard>

          <div className="bento-grid">
            <BentoCard variant="mint" className="!min-h-0">
              <BentoLabel>7 dias completos</BentoLabel>
              <BentoValue sub="refeições + água + treino">
                {semanaResumo.diasCompletos}/7
              </BentoValue>
            </BentoCard>
            <BentoCard variant="blue" className="!min-h-0">
              <BentoLabel>Água média</BentoLabel>
              <BentoValue sub="por dia">
                {semanaResumo.mediaAguaL}L
              </BentoValue>
            </BentoCard>
            <BentoCard variant="amber" className="col-span-2 !min-h-0">
              <BentoLabel>Proteína média</BentoLabel>
              <BentoValue sub="refeições marcadas · por dia">
                {semanaResumo.mediaProtG}g
              </BentoValue>
            </BentoCard>
          </div>

          {/* PESO DE HOJE */}
          <BentoCard id="peso-hoje" variant="rose" className="!min-h-0 scroll-mt-4" span={2}>
            <div className="mb-3 flex items-center gap-2">
              <Scale size={14} className="text-white/50" />
              <BentoLabel>Peso de hoje</BentoLabel>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                placeholder="ex: 105.0"
                value={peso}
                onChange={(e) => {
                  setPeso(e.target.value);
                  setPesoSalvo(false);
                }}
                className="input-field flex-1 px-4 py-3"
              />
              <button
                onClick={salvarPeso}
                className={`btn-primary px-5 ${pesoSalvo ? "opacity-80" : ""}`}
              >
                {pesoSalvo ? <Check size={20} /> : "kg"}
              </button>
            </div>
            {pesoAtual !== null && (
              <p className="mt-2 text-xs text-white/40">
                Último registro: {pesoAtual} kg
                {delta !== null &&
                  ` · ${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg no período`}
              </p>
            )}
          </BentoCard>

          {/* Gráfico peso */}
          <BentoCard variant="glass" className="!min-h-0" span={2}>
            <div className="mb-3 flex items-center justify-between">
              <BentoLabel>Evolução do peso</BentoLabel>
              {delta !== null && (
                <span
                  className={`text-xs font-bold ${delta <= 0 ? "text-mint" : "text-amber"}`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)} kg
                </span>
              )}
            </div>
            {weights.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-white/40">
                  Nenhum peso registrado ainda.
                </p>
                <button
                  type="button"
                  onClick={() => scrollTo("peso-hoje")}
                  className="btn-primary mt-4 px-5 py-2.5 text-sm"
                >
                  Registrar peso
                </button>
              </div>
            ) : (
              <ProgressoChart data={weights} metaPeso={metaPeso} />
            )}
            <p className="mt-3 text-[10px] text-white/35">
              Cinza = média 7 dias · Amarelo = meta
            </p>
          </BentoCard>

          {/* DIÁRIO */}
          <BentoCard variant="glass" className="!min-h-0" span={2}>
            <div className="mb-3 flex items-center gap-2">
              <NotebookPen size={14} className="text-white/50" />
              <BentoLabel>Diário — 1 linha de honestidade</BentoLabel>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={200}
                placeholder="Como foi o dia?"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="input-field flex-1 px-4 py-3 text-sm"
              />
              <button onClick={salvarNota} className="btn-ghost px-4 text-sm">
                {notaSalva ? (
                  <Check size={18} className="text-primary" />
                ) : (
                  "OK"
                )}
              </button>
            </div>
            {diarioHistorico.length > 0 ? (
              <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
                {diarioHistorico.slice(0, 14).map((d) => (
                  <li key={d.date} className="text-xs">
                    <span className="font-semibold text-white/60">
                      {formatShort(d.date)}
                    </span>
                    <span className="text-white/40"> — </span>
                    <span className="text-white/70">{d.nota}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-center text-[10px] text-white/35">
                Escreva uma linha e toque OK — seu histórico aparece aqui.
              </p>
            )}
          </BentoCard>

          {/* Heatmap */}
          <BentoCard variant="slate" className="!min-h-0" span={2}>
            <div className="mb-3 flex items-center gap-2">
              <Target size={14} className="text-white/50" />
              <BentoLabel>Mapa de consistência — 90 dias</BentoLabel>
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
              {dias.map((d) => {
                const s = heatmap[d] ?? "none";
                return (
                  <div
                    key={d}
                    title={formatShort(d)}
                    className={`h-3.5 w-3.5 rounded-[5px] transition-colors ${
                      s === "full"
                        ? "bg-mint shadow-[0_0_8px_rgba(74,222,154,0.4)]"
                        : s === "partial"
                          ? "bg-primary/50"
                          : "bg-white/[0.06]"
                    }`}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-[10px] text-white/40">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-mint" /> Dia completo
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-primary/50" /> Parcial
              </span>
            </div>
          </BentoCard>

          {/* BENTO métricas */}
          <div className="bento-grid">
            <BentoCard variant="rose">
              <BentoLabel>Peso atual</BentoLabel>
              <BentoValue
                sub={
                  delta !== null
                    ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg no período`
                    : "Registre acima"
                }
              >
                {pesoAtual !== null ? `${pesoAtual} kg` : "—"}
              </BentoValue>
            </BentoCard>

            <BentoCard variant="mint">
              <BentoLabel>Meta peso</BentoLabel>
              <BentoValue
                sub={
                  metaPeso
                    ? metaProgress !== null
                      ? `${metaProgress}% na trilha`
                      : "definida"
                    : "Configure em Ajustes"
                }
              >
                {metaPeso ? `${metaPeso} kg` : "—"}
              </BentoValue>
              {metaPeso && metaProgress !== null && (
                <RangeBar pct={metaProgress} color="mint" />
              )}
            </BentoCard>

            <BentoCard variant="amber">
              <BentoLabel>Adesão dieta</BentoLabel>
              <BentoValue sub="últimos 7 dias">
                {adesao ? `${adesao.dieta}%` : "—"}
              </BentoValue>
              {adesao && <RangeBar pct={adesao.dieta} color="amber" />}
            </BentoCard>

            <BentoCard variant="blue">
              <BentoLabel>Adesão treino</BentoLabel>
              <BentoValue sub={`${adesao?.treinoDone ?? 0}/7 sessões`}>
                {adesao ? `${adesao.treino}%` : "—"}
              </BentoValue>
              {adesao && <RangeBar pct={adesao.treino} color="white" />}
            </BentoCard>

            <BentoCard variant="slate" span={2}>
              <div className="flex items-start justify-between">
                <div>
                  <BentoLabel>Volume semanal</BentoLabel>
                  <BentoValue sub="carga × reps (força total)">
                    {(volumeSemana / 1000).toFixed(1)}t
                  </BentoValue>
                </div>
                {topPr && (
                  <div className="text-right">
                    <BentoLabel>Recorde</BentoLabel>
                    <p className="flex items-center gap-1 text-sm font-bold">
                      <Trophy size={14} className="text-amber" />
                      {topPr.carga} kg
                    </p>
                    <p className="text-[10px] text-white/45">{topPr.nome}</p>
                  </div>
                )}
              </div>
            </BentoCard>

            <BentoCard variant="glass">
              <BentoLabel>Dias perfeitos</BentoLabel>
              <BentoValue sub="dieta + treino · 7 dias">
                {diasPerfeitos7}/7
              </BentoValue>
            </BentoCard>

            <BentoCard variant="glass">
              <BentoLabel>Consistência</BentoLabel>
              <BentoValue sub="média dieta + treino">
                {adesaoMedia}%
              </BentoValue>
              <RangeBar pct={adesaoMedia} color="white" />
            </BentoCard>
          </div>
        </>
      </LoadState>
    </div>
  );
}
