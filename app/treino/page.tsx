"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  Check,
  Dumbbell,
  Trophy,
  CheckCircle2,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Download,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr, DIAS_SEMANA, dayOfWeek } from "@/lib/dates";
import { getScheduledWorkoutId, findWorkoutById } from "@/lib/schedule";
import { TEMPLATE_PACKS } from "@/lib/workout-templates";
import {
  invalidateCache,
  STATIC_DATA_TTL,
  getCachedEntry,
  isCacheFresh,
} from "@/lib/cache";
import { useDailyData, invalidateDailyCache } from "@/components/DailyDataProvider";
import {
  getTreinoBundle,
  saveTreinoBundle,
  patchTreinoBundle,
  TREINO_BUNDLE_KEY,
  type TreinoBundle,
} from "@/lib/treino-cache";
import { supabaseErrorMessage, MIGRATION_HINT } from "@/lib/supabase-errors";
import { insertWorkoutPack, DEFAULT_PACK_ID } from "@/lib/seed-workouts";
import LoadState from "@/components/LoadState";
import RestTimer from "@/components/RestTimer";
import BottomSheet from "@/components/BottomSheet";
import BentoCard, { BentoLabel } from "@/components/BentoCard";
import RangeBar from "@/components/RangeBar";
import type { Workout, ExerciseDef } from "@/lib/types";

type SerieState = Record<string, number>; // exercicio → série atual (0-based)

function migrationUserMessage(code: string): string {
  if (code === "MIGRATION_WORKOUTS") {
    return `Tabela de treinos não encontrada. ${MIGRATION_HINT}`;
  }
  if (code === "MIGRATION_CONSTRAINT") {
    return `Banco desatualizado (só aceita A/B/C). ${MIGRATION_HINT}`;
  }
  return code;
}

export default function TreinoPage() {
  const { snapshot } = useDailyData();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [agenda, setAgenda] = useState<Record<string, string | null>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [serieAtual, setSerieAtual] = useState<SerieState>({});
  const [lastLoads, setLastLoads] = useState<
    Record<string, { carga: number; reps: number }>
  >({});
  const [prs, setPrs] = useState<Record<string, number>>({});
  const [inputs, setInputs] = useState<
    Record<string, { carga: string; reps: string }>
  >({});
  const [newPr, setNewPr] = useState<string | null>(null);
  const [timerKey, setTimerKey] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showAgenda, setShowAgenda] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const today = todayStr();

  const scheduledId = getScheduledWorkoutId(agenda);
  const scheduled = findWorkoutById(workouts, scheduledId);
  const active = findWorkoutById(workouts, activeId);

  const applyTodayState = useCallback(
    (
      ws: Workout[],
      ag: Record<string, string | null>,
      logData: {
        workout_id?: string | null;
        tipo_treino?: string;
        concluido?: boolean;
      } | null,
      exToday: { exercicio: string }[],
      persist = true
    ) => {
      const schedId = getScheduledWorkoutId(ag);
      let nextActive: string | null = null;
      let nextConcluido = false;
      if (
        logData?.workout_id &&
        ws.some((w) => w.id === logData.workout_id)
      ) {
        nextActive = logData.workout_id;
        nextConcluido = logData.concluido ?? false;
      } else if (schedId && ws.some((w) => w.id === schedId)) {
        nextActive = schedId;
        nextConcluido = logData?.concluido ?? false;
      }
      setActiveId(nextActive);
      setConcluido(nextConcluido);

      const series: SerieState = {};
      for (const ex of exToday) {
        series[ex.exercicio] = (series[ex.exercicio] ?? 0) + 1;
      }
      setSerieAtual(series);

      if (persist) {
        patchTreinoBundle({
          today: {
            date: today,
            activeId: nextActive,
            concluido: nextConcluido,
            serieAtual: series,
          },
        });
      }
    },
    [today]
  );

  const syncToday = useCallback(
    async (
      supabase: ReturnType<typeof createClient>,
      userId: string,
      ws: Workout[],
      ag: Record<string, string | null>
    ) => {
      const [logRes, exToday] = await Promise.all([
        supabase
          .from("workout_logs")
          .select("workout_id, tipo_treino, concluido")
          .eq("user_id", userId)
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("exercise_logs")
          .select("exercicio")
          .eq("user_id", userId)
          .eq("date", today),
      ]);
      applyTodayState(ws, ag, logRes.data, exToday.data ?? []);
    },
    [today, applyTodayState]
  );

  const load = useCallback(
    async (force = false) => {
      setLoadError(null);
      setOfflineNotice(null);

      const entry = getCachedEntry<TreinoBundle>(TREINO_BUNDLE_KEY);
      const cached = entry?.data ?? getTreinoBundle();
      const cacheOk =
        !force &&
        isCacheFresh(entry, STATIC_DATA_TTL) &&
        Boolean(cached?.workouts.length);

      if (cacheOk && cached) {
        setWorkouts(cached.workouts);
        setAgenda(cached.agenda);
        setLastLoads(cached.lastLoads);
        setPrs(cached.prs);

        if (cached.today?.date === today) {
          setActiveId(cached.today.activeId);
          setConcluido(cached.today.concluido);
          setSerieAtual(cached.today.serieAtual);
        } else if (snapshot) {
          const exFromSeries = Object.entries(cached.today?.serieAtual ?? {}).flatMap(
            ([nome, count]) =>
              Array.from({ length: count }, () => ({ exercicio: nome }))
          );
          applyTodayState(
            cached.workouts,
            cached.agenda,
            snapshot.workoutLog,
            cached.today?.date === today ? exFromSeries : [],
            true
          );
        }

        setLoading(false);

        const needsSync = !cached.today || cached.today.date !== today;

        if (needsSync) {
          try {
            const supabase = createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await syncToday(supabase, user.id, cached.workouts, cached.agenda);
            }
          } catch {
            // cache já exibido
          }
        }
        return;
      }

      if (!cached?.workouts.length) setLoading(true);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const [wRes, sRes, logRes, exToday, allLogs] = await Promise.all([
          supabase
            .from("workouts")
            .select("id, ordem, letra, nome, exercicios")
            .eq("user_id", user.id)
            .order("ordem"),
          supabase
            .from("user_settings")
            .select("agenda_treino")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("workout_logs")
            .select("workout_id, tipo_treino, concluido")
            .eq("user_id", user.id)
            .eq("date", today)
            .maybeSingle(),
          supabase
            .from("exercise_logs")
            .select("exercicio")
            .eq("user_id", user.id)
            .eq("date", today),
          supabase
            .from("exercise_logs")
            .select("exercicio, carga, reps, date")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(120),
        ]);

        if (wRes.error) throw wRes.error;

        let ws = (wRes.data as Workout[]) ?? [];
        const ag =
          (sRes.data?.agenda_treino as Record<string, string | null>) ?? {};

        if (ws.length === 0) {
          const seed = await insertWorkoutPack(
            supabase,
            user.id,
            DEFAULT_PACK_ID
          );
          if (seed.ok) {
            const refetch = await supabase
              .from("workouts")
              .select("id, ordem, letra, nome, exercicios")
              .eq("user_id", user.id)
              .order("ordem");
            if (!refetch.error) ws = (refetch.data as Workout[]) ?? [];
          }
        }

        const last: Record<string, { carga: number; reps: number }> = {};
        const maxes: Record<string, number> = {};
        for (const log of allLogs.data ?? []) {
          if (!last[log.exercicio])
            last[log.exercicio] = {
              carga: Number(log.carga),
              reps: log.reps,
            };
          maxes[log.exercicio] = Math.max(
            maxes[log.exercicio] ?? 0,
            Number(log.carga)
          );
        }

        const bundle: TreinoBundle = {
          workouts: ws,
          agenda: ag,
          lastLoads: last,
          prs: maxes,
        };
        saveTreinoBundle(bundle);
        setWorkouts(ws);
        setAgenda(ag);
        setLastLoads(last);
        setPrs(maxes);
        applyTodayState(ws, ag, logRes.data, exToday.data ?? []);
      } catch (e) {
        const code = supabaseErrorMessage(e);
        const fallback = cached ?? getTreinoBundle();

        if (fallback?.workouts.length) {
          setWorkouts(fallback.workouts);
          setAgenda(fallback.agenda);
          setLastLoads(fallback.lastLoads);
          setPrs(fallback.prs);
          setLoadError(null);
          if (code === "MIGRATION_WORKOUTS" || code === "MIGRATION_CONSTRAINT") {
            setOfflineNotice(
              `Treinos do celular. Para importar/criar novos: ${MIGRATION_HINT}`
            );
          } else {
            setOfflineNotice("Usando treinos salvos no celular.");
          }
        } else if (code === "MIGRATION_WORKOUTS" || code === "MIGRATION_CONSTRAINT") {
          setLoadError(migrationUserMessage(code));
        } else {
          setLoadError(
            code.includes("demorou")
              ? code
              : "Não foi possível carregar. Verifique a conexão."
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [today, applyTodayState, syncToday, snapshot]
  );

  useLayoutEffect(() => {
    const bundle = getTreinoBundle();
    if (!bundle?.workouts.length) return;

    setWorkouts(bundle.workouts);
    setAgenda(bundle.agenda);
    setLastLoads(bundle.lastLoads);
    setPrs(bundle.prs);

    if (bundle.today?.date === today) {
      setActiveId(bundle.today.activeId);
      setConcluido(bundle.today.concluido);
      setSerieAtual(bundle.today.serieAtual);
    } else if (snapshot?.workoutLog) {
      applyTodayState(
        bundle.workouts,
        bundle.agenda,
        snapshot.workoutLog,
        [],
        false
      );
    }

    setLoading(false);
  }, [today, snapshot, applyTodayState]);

  useEffect(() => {
    load();
  }, [load]);

  async function iniciarTreino(w: Workout) {
    setActiveId(w.id);
    setConcluido(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const base = {
      user_id: user.id,
      date: today,
      tipo_treino: w.letra,
      concluido: false,
    };
    const { error } = await supabase.from("workout_logs").upsert(
      { ...base, workout_id: w.id },
      { onConflict: "user_id,date" }
    );
    if (error?.message?.includes("workout_id")) {
      await supabase.from("workout_logs").upsert(base, {
        onConflict: "user_id,date",
      });
    }
  }

  async function registrarSerie(ex: ExerciseDef) {
    const input = inputs[ex.nome] ?? { carga: "", reps: "" };
    const carga = parseFloat(input.carga.replace(",", "."));
    const reps = parseInt(input.reps);
    if (!carga || carga <= 0 || !reps || reps <= 0) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("exercise_logs").insert({
      user_id: user.id,
      date: today,
      exercicio: ex.nome,
      carga,
      reps,
    });

    const prAnt = prs[ex.nome] ?? 0;
    const newPrs = { ...prs, [ex.nome]: Math.max(prAnt, carga) };
    const newLast = { ...lastLoads, [ex.nome]: { carga, reps } };
    if (carga > prAnt) {
      setNewPr(ex.nome);
      setTimeout(() => setNewPr(null), 4000);
    }
    setPrs(newPrs);
    setLastLoads(newLast);
    patchTreinoBundle({ prs: newPrs, lastLoads: newLast });
    setSerieAtual({ ...serieAtual, [ex.nome]: (serieAtual[ex.nome] ?? 0) + 1 });
    setInputs({ ...inputs, [ex.nome]: { carga: "", reps: "" } });
    setTimerKey(Date.now());
  }

  async function finalizarTreino() {
    if (!active) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const base = {
      user_id: user.id,
      date: today,
      tipo_treino: active.letra,
      concluido: true,
    };
    const { error } = await supabase.from("workout_logs").upsert(
      { ...base, workout_id: active.id },
      { onConflict: "user_id,date" }
    );
    if (error?.message?.includes("workout_id")) {
      await supabase.from("workout_logs").upsert(base, {
        onConflict: "user_id,date",
      });
    }
    setConcluido(true);
    setTimerKey(null);
    invalidateDailyCache();
  }

  async function salvarAgenda(nova: Record<string, string | null>) {
    setAgenda(nova);
    patchTreinoBundle({ agenda: nova });
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, agenda_treino: nova });
  }

  async function importarTemplate(packId: string) {
    const pack = TEMPLATE_PACKS.find((p) => p.id === packId);
    if (!pack) return;

    const msg =
      workouts.length > 0
        ? `Adicionar ${pack.treinos.length} treinos do modelo "${pack.nome}" aos seus treinos atuais?`
        : `Importar o modelo "${pack.nome}" (${pack.treinos.length} treinos)?`;
    if (!confirm(msg)) return;

    setImportingId(packId);
    setImportFeedback(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setImportingId(null);
      return;
    }

    try {
      const startOrdem = workouts.length;
      const result = await insertWorkoutPack(
        supabase,
        user.id,
        packId,
        startOrdem
      );
      if (!result.ok) throw new Error(result.error ?? "Falha ao importar.");

      invalidateCache(TREINO_BUNDLE_KEY);
      setImportFeedback(`Modelo "${pack.nome}" importado com sucesso.`);
      setShowTemplates(false);
      setEditMode(false);
      await load(true);
    } catch (e) {
      const code = supabaseErrorMessage(e);
      setImportFeedback(
        code === "MIGRATION_WORKOUTS" || code === "MIGRATION_CONSTRAINT"
          ? migrationUserMessage(code)
          : `Erro: ${code}`
      );
    } finally {
      setImportingId(null);
    }
  }

  async function salvarWorkout(w: Workout) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (w.id === "nova") {
        const { error } = await supabase.from("workouts").insert({
          user_id: user.id,
          ordem: workouts.length + 1,
          letra: w.letra,
          nome: w.nome,
          exercicios: w.exercicios,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("workouts")
          .update({ letra: w.letra, nome: w.nome, exercicios: w.exercicios })
          .eq("id", w.id)
          .eq("user_id", user.id);
        if (error) throw error;
      }
      setEditing(null);
      invalidateCache(TREINO_BUNDLE_KEY);
      await load(true);
    } catch (e) {
      const code = supabaseErrorMessage(e);
      setImportFeedback(
        code === "MIGRATION_WORKOUTS" || code === "MIGRATION_CONSTRAINT"
          ? migrationUserMessage(code)
          : `Erro ao salvar: ${code}`
      );
    }
  }

  async function excluirWorkout(id: string) {
    if (!confirm("Excluir este treino?")) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("workouts").delete().eq("id", id).eq("user_id", user.id);
    setEditing(null);
    invalidateCache(TREINO_BUNDLE_KEY);
    load(true);
  }

  const isBoxe = active?.letra === "BX";

  return (
    <div className="space-y-4">
      <header className="page-header flex items-end justify-between pt-1">
        <div>
          <p className="section-label">Treino</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Sessão</h1>
          <p className="text-xs text-muted">
            {scheduled
              ? `Hoje: ${scheduled.letra} — ${scheduled.nome}`
              : "Descanso hoje"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="btn-ghost p-2.5"
            aria-label="Modelos de treino"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => setShowAgenda(!showAgenda)}
            className="btn-ghost p-2.5"
            aria-label="Agenda semanal"
          >
            <Calendar size={18} />
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`btn-ghost px-3 py-2 text-xs font-semibold ${
              editMode ? "text-primary" : ""
            }`}
          >
            {editMode ? "Pronto" : "Editar"}
          </button>
        </div>
      </header>

      {/* AGENDA SEMANAL */}
      {showAgenda && (
        <BentoCard variant="glass" className="!min-h-0" span={2}>
          <BentoLabel>Agenda da semana</BentoLabel>
          <div className="mt-3 space-y-2">
            {DIAS_SEMANA.map((dia, i) => (
              <div key={dia} className="flex items-center gap-2">
                <span
                  className={`w-8 text-xs font-medium ${
                    i === dayOfWeek() ? "text-primary" : "text-white/45"
                  }`}
                >
                  {dia}
                </span>
                <select
                  value={agenda[String(i)] ?? ""}
                  onChange={(e) =>
                    salvarAgenda({
                      ...agenda,
                      [String(i)]: e.target.value || null,
                    })
                  }
                  className="input-field flex-1 px-3 py-2 text-sm"
                >
                  <option value="">Descanso</option>
                  {workouts.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.letra} — {w.nome}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </BentoCard>
      )}

      {importFeedback && (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
          {importFeedback}
        </p>
      )}

      {offlineNotice && (
        <p className="rounded-xl border border-amber/30 bg-amber/10 px-4 py-2 text-sm text-amber">
          {offlineNotice}
        </p>
      )}

      <LoadState
        loading={loading && workouts.length === 0}
        error={loadError}
        onRetry={() => load(true)}
        skeleton="treino"
        empty={workouts.length === 0 && !loadError}
        emptyTitle="Nenhum treino cadastrado"
        emptyDesc="Importe um modelo pronto ou crie seu primeiro treino."
        emptyAction={
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="btn-primary w-full py-3"
            >
              Ver modelos
            </button>
            <button
              onClick={() => {
                setEditMode(true);
                setEditing({
                  id: "nova",
                  ordem: 1,
                  letra: "",
                  nome: "",
                  exercicios: [],
                });
              }}
              className="w-full rounded-xl border border-line py-3 text-sm text-muted"
            >
              Criar treino manual
            </button>
          </div>
        }
      >
        <>
          {/* SUGESTÃO DO DIA */}
          {scheduled && activeId !== scheduled.id && !concluido && (
            <button
              onClick={() => iniciarTreino(scheduled)}
              className="block w-full text-left"
            >
              <BentoCard
                variant="rose"
                className="!min-h-0 transition-transform active:scale-[0.98]"
                span={2}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <BentoLabel>Treino do dia</BentoLabel>
                    <p className="text-lg font-bold">
                      {scheduled.letra} — {scheduled.nome}
                    </p>
                  </div>
                  <ChevronRight className="text-white/50" />
                </div>
              </BentoCard>
            </button>
          )}

          {/* LISTA DE TREINOS */}
          {(!active || editMode) && workouts.length > 0 && (
            <div className="space-y-2">
              {workouts.map((w) => (
                <BentoCard
                  key={w.id}
                  variant="slate"
                  className="!min-h-0 !p-3"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => !editMode && iniciarTreino(w)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-lg font-black text-primary">
                        {w.letra}
                      </span>
                      <div>
                        <p className="font-semibold">{w.nome}</p>
                        <p className="text-xs text-white/45">
                          {w.exercicios.length} exercícios
                          {w.letra === "BX" ? " · Boxe" : ""}
                        </p>
                      </div>
                    </button>
                    {editMode && (
                      <button
                        onClick={() => setEditing(w)}
                        className="btn-ghost p-2"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                </BentoCard>
              ))}
              {editMode && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setEditing({
                        id: "nova",
                        ordem: workouts.length + 1,
                        letra: "",
                        nome: "",
                        exercicios: [],
                      })
                    }
                    className="btn-ghost flex flex-1 items-center justify-center gap-1 border border-dashed border-white/15 py-3 text-sm"
                  >
                    <Plus size={16} /> Novo treino
                  </button>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="btn-ghost flex flex-1 items-center justify-center gap-1 py-3 text-sm"
                  >
                    <Download size={16} /> Modelos
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SESSÃO ATIVA */}
          {active && !editMode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-lg font-bold">
                  {active.letra} — {active.nome}
                </p>
                <button
                  onClick={() => setActiveId(null)}
                  className="btn-ghost px-2 py-1 text-xs"
                >
                  Trocar
                </button>
              </div>

              {(() => {
                const exDone = active.exercicios.filter(
                  (ex) => (serieAtual[ex.nome] ?? 0) >= ex.series
                ).length;
                const exTotal = active.exercicios.length;
                const pctSessao = exTotal
                  ? Math.round((exDone / exTotal) * 100)
                  : 0;
                return (
                  <BentoCard variant="glass" className="!min-h-0 !py-3" span={2}>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <BentoLabel>Progresso da sessão</BentoLabel>
                      <span className="font-bold text-white/70">
                        {exDone}/{exTotal} exercícios
                      </span>
                    </div>
                    <RangeBar pct={pctSessao} color="white" />
                  </BentoCard>
                );
              })()}

              {active.exercicios.map((ex) => {
                const serie = serieAtual[ex.nome] ?? 0;
                const total = ex.series;
                const done = serie >= total;
                const last = lastLoads[ex.nome];
                const input = inputs[ex.nome] ?? { carga: "", reps: "" };
                const isTimeBased = ex.reps_alvo.includes("min");

                return (
                  <BentoCard
                    key={ex.nome}
                    variant={done ? "mint" : "glass"}
                    className="!min-h-0"
                    span={2}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          className={`font-semibold ${done ? "text-mint" : ""}`}
                        >
                          {ex.nome}
                        </p>
                        <p className="text-xs text-white/45">
                          Série {Math.min(serie + 1, total)} de {total} · alvo{" "}
                          {ex.reps_alvo}
                          {last && !isTimeBased
                            ? ` · última ${last.carga} kg × ${last.reps}`
                            : ""}
                        </p>
                      </div>
                      {done && (
                        <Check
                          size={20}
                          className="text-mint"
                          strokeWidth={3}
                        />
                      )}
                    </div>

                    {newPr === ex.nome && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-sm font-semibold text-amber">
                        <Trophy size={16} /> NOVO RECORDE!
                      </div>
                    )}

                    {!done && (
                      <div className="mt-3 flex gap-2">
                        {isTimeBased ? (
                          <button
                            onClick={() => {
                              setSerieAtual({
                                ...serieAtual,
                                [ex.nome]: serie + 1,
                              });
                              setTimerKey(Date.now());
                            }}
                            className="btn-primary flex-1 py-3"
                          >
                            {ex.reps_alvo} — concluir
                          </button>
                        ) : (
                          <>
                            <div className="flex w-24 flex-col">
                              <label className="mb-1 text-[10px] text-white/40">
                                kg
                              </label>
                              <input
                                type="number"
                                inputMode="decimal"
                                placeholder={last ? `${last.carga}` : "0"}
                                value={input.carga}
                                onChange={(e) =>
                                  setInputs({
                                    ...inputs,
                                    [ex.nome]: {
                                      ...input,
                                      carga: e.target.value,
                                    },
                                  })
                                }
                                className="input-field w-full px-3 py-3 text-center"
                              />
                            </div>
                            <div className="flex w-24 flex-col">
                              <label className="mb-1 text-[10px] text-white/40">
                                reps
                              </label>
                              <input
                                type="number"
                                inputMode="numeric"
                                placeholder={last ? `${last.reps}` : "0"}
                                value={input.reps}
                                onChange={(e) =>
                                  setInputs({
                                    ...inputs,
                                    [ex.nome]: {
                                      ...input,
                                      reps: e.target.value,
                                    },
                                  })
                                }
                                className="input-field w-full px-3 py-3 text-center"
                              />
                            </div>
                            <button
                              onClick={() => registrarSerie(ex)}
                              className="btn-primary mt-5 flex-1 self-end py-3"
                            >
                              Registrar
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </BentoCard>
                );
              })}

              <button
                onClick={finalizarTreino}
                disabled={concluido}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold ${
                  concluido
                    ? "border border-mint/40 bg-mint/10 text-mint"
                    : "btn-primary"
                }`}
              >
                {concluido ? (
                  <>
                    <CheckCircle2 size={20} />{" "}
                    {isBoxe ? "Boxe" : `Treino ${active.letra}`} concluído
                  </>
                ) : (
                  <>
                    <Dumbbell size={20} /> Concluir treino
                  </>
                )}
              </button>
            </div>
          )}
        </>
      </LoadState>

      {showTemplates && (
        <BottomSheet
          title="Modelos de treino"
          onClose={() => !importingId && setShowTemplates(false)}
        >
          {TEMPLATE_PACKS.map((p) => (
            <button
              key={p.id}
              disabled={!!importingId}
              onClick={() => importarTemplate(p.id)}
              className="btn-ghost mb-2 w-full p-4 text-left disabled:opacity-50"
            >
              <p className="font-semibold">
                {importingId === p.id ? "Importando..." : p.nome}
              </p>
              <p className="text-xs text-muted">{p.descricao}</p>
            </button>
          ))}
        </BottomSheet>
      )}

      {editing && (
        <WorkoutEditor
          workout={editing}
          onSave={salvarWorkout}
          onDelete={
            editing.id !== "nova" ? () => excluirWorkout(editing.id) : undefined
          }
          onClose={() => setEditing(null)}
        />
      )}

      <RestTimer startKey={timerKey} onDismiss={() => setTimerKey(null)} />
    </div>
  );
}

function WorkoutEditor({
  workout,
  onSave,
  onDelete,
  onClose,
}: {
  workout: Workout;
  onSave: (w: Workout) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [letra, setLetra] = useState(workout.letra);
  const [nome, setNome] = useState(workout.nome);
  const [exs, setExs] = useState<ExerciseDef[]>(workout.exercicios);

  return (
    <BottomSheet
      title={workout.id === "nova" ? "Novo treino" : "Editar treino"}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="btn-ghost border border-danger/40 px-4 py-3 text-sm text-danger"
            >
              Excluir
            </button>
          )}
          <button
            onClick={() =>
              letra.trim() &&
              nome.trim() &&
              onSave({ ...workout, letra, nome, exercicios: exs })
            }
            className="btn-primary flex-1 py-3"
          >
            Salvar
          </button>
        </div>
      }
    >
        <div className="mb-3 flex gap-2">
          <input
            value={letra}
            onChange={(e) => setLetra(e.target.value.toUpperCase())}
            placeholder="Letra (A, BX...)"
            className="input-field w-24 px-3 py-3 text-center"
          />
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do treino"
            className="input-field min-w-0 flex-1 px-3 py-3"
          />
        </div>
        {exs.map((ex, i) => (
          <div key={i} className="mb-2 rounded-xl bg-white/[0.04] p-3">
            <div className="flex gap-2">
              <input
                value={ex.nome}
                onChange={(e) =>
                  setExs(exs.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))
                }
                placeholder="Exercício"
                className="input-field min-w-0 flex-1 px-3 py-2 text-sm"
              />
              <button onClick={() => setExs(exs.filter((_, j) => j !== i))}>
                <Trash2 size={16} className="text-danger" />
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                value={ex.series}
                onChange={(e) =>
                  setExs(
                    exs.map((x, j) =>
                      j === i ? { ...x, series: parseInt(e.target.value) || 1 } : x
                    )
                  )
                }
                className="input-field w-16 px-2 py-2 text-center text-sm"
              />
              <span className="self-center text-xs text-muted">séries</span>
              <input
                value={ex.reps_alvo}
                onChange={(e) =>
                  setExs(
                    exs.map((x, j) =>
                      j === i ? { ...x, reps_alvo: e.target.value } : x
                    )
                  )
                }
                placeholder="8-10 ou 3 min"
                className="input-field min-w-0 flex-1 px-3 py-2 text-sm"
              />
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            setExs([...exs, { nome: "", series: 3, reps_alvo: "8-10" }])
          }
          className="btn-ghost w-full border border-dashed border-white/15 py-3 text-sm"
        >
          + Exercício
        </button>
    </BottomSheet>
  );
}
