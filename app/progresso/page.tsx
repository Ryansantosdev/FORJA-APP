"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Download, Ruler, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr, daysAgoStr, formatShort, toDateStr } from "@/lib/dates";
import { getCached, setCached } from "@/lib/cache";
import { SkeletonCard } from "@/components/Skeleton";
import type { WeightPoint } from "@/components/ProgressoChart";

const ProgressoChart = dynamic(() => import("@/components/ProgressoChart"), {
  ssr: false,
  loading: () => <div className="skeleton h-52 w-full" />,
});

type DayStatus = "full" | "partial" | "none";

function movingAvg(weights: { date: string; peso: number }[], i: number): number | undefined {
  const slice = weights.slice(Math.max(0, i - 6), i + 1);
  if (slice.length < 3) return undefined;
  return Math.round((slice.reduce((a, w) => a + w.peso, 0) / slice.length) * 10) / 10;
}

export default function ProgressoPage() {
  const [weights, setWeights] = useState<WeightPoint[]>([]);
  const [metaPeso, setMetaPeso] = useState<number | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, DayStatus>>({});
  const [adesao, setAdesao] = useState<{ dieta: number; treino: number; dietaDone: number; dietaTotal: number; treinoDone: number } | null>(null);
  const [volumeSemana, setVolumeSemana] = useState(0);
  const [medidas, setMedidas] = useState({ cintura: "", braco: "", peito: "" });
  const [medidasSalvas, setMedidasSalvas] = useState(false);
  const [loading, setLoading] = useState(!getCached("prog_data"));

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const d7 = daysAgoStr(6);
    const [weightsRes, mealsRes, mealLogsRes, workoutsRes, settingsRes, exRes, medidasRes] = await Promise.all([
      supabase.from("weight_logs").select("date, peso").eq("user_id", user.id).order("date"),
      supabase.from("meals").select("id").eq("user_id", user.id),
      supabase.from("meal_logs").select("date, meal_id").eq("user_id", user.id).gte("date", daysAgoStr(89)),
      supabase.from("workout_logs").select("date, concluido").eq("user_id", user.id).gte("date", daysAgoStr(89)),
      supabase.from("user_settings").select("meta_peso").eq("user_id", user.id).maybeSingle(),
      supabase.from("exercise_logs").select("carga, reps, date").eq("user_id", user.id).gte("date", d7),
      supabase.from("measurements").select("cintura, braco, peito").eq("user_id", user.id).order("date", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const raw = (weightsRes.data ?? []).map((w) => ({ date: w.date, peso: Number(w.peso) }));
    const chartData: WeightPoint[] = raw.map((w, i) => ({ ...w, media7: movingAvg(raw, i) }));
    setWeights(chartData);
    setMetaPeso(settingsRes.data?.meta_peso ?? null);

    const vol = (exRes.data ?? []).reduce((a, e) => a + Number(e.carga) * e.reps, 0);
    setVolumeSemana(vol);

    const totalMeals = mealsRes.data?.length ?? 0;
    const mealsByDay: Record<string, number> = {};
    for (const log of mealLogsRes.data ?? []) mealsByDay[log.date] = (mealsByDay[log.date] ?? 0) + 1;
    const workoutByDay: Record<string, boolean> = {};
    for (const w of workoutsRes.data ?? []) workoutByDay[w.date] = w.concluido;

    const map: Record<string, DayStatus> = {};
    for (let i = 0; i < 90; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = toDateStr(d);
      const dietaOk = totalMeals > 0 && (mealsByDay[ds] ?? 0) >= totalMeals;
      const treinoOk = workoutByDay[ds] === true;
      map[ds] = dietaOk && treinoOk ? "full" : (mealsByDay[ds] ?? 0) > 0 || treinoOk ? "partial" : "none";
    }
    setHeatmap(map);

    let dietaDone = 0, treinoDone = 0;
    for (let i = 0; i < 7; i++) {
      const ds = daysAgoStr(i);
      dietaDone += Math.min(mealsByDay[ds] ?? 0, totalMeals);
      if (workoutByDay[ds]) treinoDone++;
    }
    const dietaTotal = totalMeals * 7;
    setAdesao({
      dieta: dietaTotal > 0 ? Math.round((dietaDone / dietaTotal) * 100) : 0,
      treino: Math.round((treinoDone / 7) * 100),
      dietaDone, dietaTotal, treinoDone,
    });

    if (medidasRes.data) {
      setMedidas({
        cintura: medidasRes.data.cintura?.toString() ?? "",
        braco: medidasRes.data.braco?.toString() ?? "",
        peito: medidasRes.data.peito?.toString() ?? "",
      });
    }
    setCached("prog_data", true);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function salvarMedidas() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("measurements").upsert({
      user_id: user.id, date: todayStr(),
      cintura: parseFloat(medidas.cintura.replace(",", ".")) || null,
      braco: parseFloat(medidas.braco.replace(",", ".")) || null,
      peito: parseFloat(medidas.peito.replace(",", ".")) || null,
    }, { onConflict: "user_id,date" });
    setMedidasSalvas(true);
    setTimeout(() => setMedidasSalvas(false), 2000);
  }

  async function exportarCsv() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [w, ex, m, ml, wk, fl] = await Promise.all([
      supabase.from("weight_logs").select("date, peso").eq("user_id", user.id).order("date"),
      supabase.from("exercise_logs").select("date, exercicio, carga, reps").eq("user_id", user.id).order("date"),
      supabase.from("measurements").select("date, cintura, braco, peito").eq("user_id", user.id).order("date"),
      supabase.from("meal_logs").select("date, meal_id").eq("user_id", user.id).order("date"),
      supabase.from("workout_logs").select("date, tipo_treino, concluido").eq("user_id", user.id).order("date"),
      supabase.from("focus_logs").select("date, minutos").eq("user_id", user.id).order("date"),
    ]);
    const lines = ["tipo,data,campo1,campo2,campo3"];
    for (const r of w.data ?? []) lines.push(`peso,${r.date},${r.peso},,`);
    for (const r of ex.data ?? []) lines.push(`exercicio,${r.date},"${r.exercicio}",${r.carga},${r.reps}`);
    for (const r of m.data ?? []) lines.push(`medidas,${r.date},${r.cintura ?? ""},${r.braco ?? ""},${r.peito ?? ""}`);
    for (const r of ml.data ?? []) lines.push(`refeicao_ok,${r.date},${r.meal_id},,`);
    for (const r of wk.data ?? []) lines.push(`treino,${r.date},${r.tipo_treino},${r.concluido ? "ok" : "pend"},`);
    for (const r of fl.data ?? []) lines.push(`foco,${r.date},${r.minutos},,`);
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `forja-${todayStr()}.csv`;
    a.click();
  }

  const dias = Array.from({ length: 90 }, (_, i) => daysAgoStr(89 - i));
  const delta = weights.length >= 2 ? (weights[weights.length - 1].peso - weights[0].peso).toFixed(1) : null;

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Progresso</h1>
          <p className="text-xs text-muted">Volume semanal: {(volumeSemana / 1000).toFixed(1)}t</p>
        </div>
        <button onClick={exportarCsv} className="flex items-center gap-1 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-muted">
          <Download size={14} /> CSV
        </button>
      </header>

      {loading ? <SkeletonCard /> : (
        <>
          <section className="rounded-2xl bg-surface p-4">
            <div className="mb-1 flex justify-between">
              <p className="text-sm font-semibold">Peso</p>
              {delta && <p className={`text-sm font-bold ${Number(delta) <= 0 ? "text-primary" : "text-amber"}`}>{Number(delta) > 0 ? "+" : ""}{delta} kg</p>}
            </div>
            {weights.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Registre o peso no Dashboard.</p>
            ) : (
              <ProgressoChart data={weights} metaPeso={metaPeso} />
            )}
            <p className="mt-2 text-[10px] text-muted">Linha cinza = média 7 dias · Amarelo = meta</p>
          </section>

          <section className="rounded-2xl bg-surface p-4">
            <p className="mb-3 text-sm font-semibold">Consistência — 90 dias</p>
            <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
              {dias.map((d) => {
                const s = heatmap[d] ?? "none";
                return <div key={d} title={formatShort(d)} className={`h-3.5 w-3.5 rounded-[4px] ${s === "full" ? "bg-primary" : s === "partial" ? "bg-primary-dim" : "bg-elev"}`} />;
              })}
            </div>
          </section>

          {adesao && (
            <section className="rounded-2xl bg-surface p-4">
              <p className="mb-3 text-sm font-semibold">Adesão — 7 dias</p>
              <Bar label="Dieta" pct={adesao.dieta} detail={`${adesao.dietaDone}/${adesao.dietaTotal}`} />
              <Bar label="Treino" pct={adesao.treino} detail={`${adesao.treinoDone}/7`} />
            </section>
          )}

          <section className="rounded-2xl bg-surface p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Ruler size={16} className="text-muted" /> Medidas (cm)</div>
            <div className="flex gap-2">
              {([["cintura", "Cintura"], ["braco", "Braço"], ["peito", "Peito"]] as const).map(([k, l]) => (
                <div key={k} className="flex-1">
                  <label className="mb-1 block text-[10px] text-muted">{l}</label>
                  <input type="number" value={medidas[k]} onChange={(e) => setMedidas({ ...medidas, [k]: e.target.value })}
                    className="w-full rounded-xl border border-line bg-elev px-3 py-3 text-center outline-none focus:border-primary" />
                </div>
              ))}
              <button onClick={salvarMedidas} className="self-end rounded-xl bg-primary px-4 py-3 font-bold text-black">
                {medidasSalvas ? <Check size={20} /> : "OK"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Bar({ label, pct, detail }: { label: string; pct: number; detail: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span><span className="text-muted">{detail} · <b className="text-ink">{pct}%</b></span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-elev">
        <div className={`h-full rounded-full ${pct >= 100 ? "bg-primary" : pct >= 70 ? "bg-amber" : "bg-danger"}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
