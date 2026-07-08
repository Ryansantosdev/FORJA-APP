"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Dumbbell,
  Trophy,
  CheckCircle2,
  Calendar,
  Plus,
  Pencil,
  X,
  Trash2,
  Download,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr, DIAS_SEMANA, dayOfWeek } from "@/lib/dates";
import { getScheduledWorkoutId, findWorkoutById } from "@/lib/schedule";
import { TEMPLATE_PACKS } from "@/lib/workout-templates";
import { getCached, setCached } from "@/lib/cache";
import LoadState from "@/components/LoadState";
import RestTimer from "@/components/RestTimer";
import type { Workout, ExerciseDef } from "@/lib/types";

type SerieState = Record<string, number>; // exercicio → série atual (0-based)

export default function TreinoPage() {
  const [workouts, setWorkouts] = useState<Workout[]>(
    () => getCached<Workout[]>("treino_workouts") ?? []
  );
  const [agenda, setAgenda] = useState<Record<string, string | null>>(
    () => getCached<Record<string, string | null>>("treino_agenda") ?? {}
  );
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
  const [loading, setLoading] = useState(!getCached("treino_workouts"));
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const load = useCallback(async () => {
    setLoadError(null);
    const hadCache = Boolean(getCached("treino_workouts"));
    if (!hadCache) setLoading(true);

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

      const ws = (wRes.data as Workout[]) ?? [];
      const ag = (sRes.data?.agenda_treino as Record<string, string | null>) ?? {};
      setWorkouts(ws);
      setAgenda(ag);
      setCached("treino_workouts", ws);
      setCached("treino_agenda", ag);

      const schedId = getScheduledWorkoutId(ag);
      let nextActive: string | null = null;
      if (logRes.data?.workout_id && ws.some((w) => w.id === logRes.data!.workout_id)) {
        nextActive = logRes.data.workout_id;
        setConcluido(logRes.data.concluido);
      } else if (schedId && ws.some((w) => w.id === schedId)) {
        nextActive = schedId;
        setConcluido(logRes.data?.concluido ?? false);
      } else {
        setConcluido(false);
      }
      setActiveId(nextActive);

      const last: Record<string, { carga: number; reps: number }> = {};
      const maxes: Record<string, number> = {};
      for (const log of allLogs.data ?? []) {
        if (!last[log.exercicio])
          last[log.exercicio] = { carga: Number(log.carga), reps: log.reps };
        maxes[log.exercicio] = Math.max(
          maxes[log.exercicio] ?? 0,
          Number(log.carga)
        );
      }
      setLastLoads(last);
      setPrs(maxes);

      const series: SerieState = {};
      for (const ex of exToday.data ?? []) {
        series[ex.exercicio] = (series[ex.exercicio] ?? 0) + 1;
      }
      setSerieAtual(series);
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Erro ao carregar treinos.";
      if (msg.includes("workouts") || msg.includes("schema")) {
        setLoadError(
          "Tabela de treinos não encontrada. Rode supabase/migration-v2.sql no Supabase."
        );
      } else {
        setLoadError(msg.includes("demorou") ? msg : "Não foi possível carregar. Verifique a conexão.");
      }
    } finally {
      setLoading(false);
    }
  }, [today]);

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
    await supabase.from("workout_logs").upsert(
      {
        user_id: user.id,
        date: today,
        tipo_treino: w.letra,
        workout_id: w.id,
        concluido: false,
      },
      { onConflict: "user_id,date" }
    );
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
    if (carga > prAnt) {
      setNewPr(ex.nome);
      setTimeout(() => setNewPr(null), 4000);
    }
    setPrs({ ...prs, [ex.nome]: Math.max(prAnt, carga) });
    setLastLoads({ ...lastLoads, [ex.nome]: { carga, reps } });
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
    await supabase.from("workout_logs").upsert(
      {
        user_id: user.id,
        date: today,
        tipo_treino: active.letra,
        workout_id: active.id,
        concluido: true,
      },
      { onConflict: "user_id,date" }
    );
    setConcluido(true);
    setTimerKey(null);
  }

  async function salvarAgenda(nova: Record<string, string | null>) {
    setAgenda(nova);
    setCached("treino_agenda", nova);
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
      for (let i = 0; i < pack.treinos.length; i++) {
        const t = pack.treinos[i];
        const { error } = await supabase.from("workouts").insert({
          user_id: user.id,
          ordem: startOrdem + i + 1,
          letra: t.letra,
          nome: t.nome,
          exercicios: t.exercicios,
        });
        if (error) throw error;
      }
      setImportFeedback(`Modelo "${pack.nome}" importado com sucesso.`);
      setShowTemplates(false);
      setEditMode(false);
      await load();
    } catch (e) {
      const err =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Falha ao importar.";
      setImportFeedback(
        err.includes("workouts")
          ? "Erro: rode migration-v2.sql no Supabase (tabela workouts)."
          : `Erro: ${err}`
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
    if (w.id === "nova") {
      await supabase.from("workouts").insert({
        user_id: user.id,
        ordem: workouts.length + 1,
        letra: w.letra,
        nome: w.nome,
        exercicios: w.exercicios,
      });
    } else {
      await supabase
        .from("workouts")
        .update({ letra: w.letra, nome: w.nome, exercicios: w.exercicios })
        .eq("id", w.id)
        .eq("user_id", user.id);
    }
    setEditing(null);
    load();
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
    load();
  }

  const isBoxe = active?.letra === "BX";

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Treino</h1>
          <p className="text-xs text-muted">
            {scheduled
              ? `Hoje: ${scheduled.letra} — ${scheduled.nome}`
              : "Descanso hoje"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="rounded-xl border border-line bg-surface p-2.5 text-muted"
            aria-label="Modelos de treino"
          >
            <Download size={18} />
          </button>
          <button
            onClick={() => setShowAgenda(!showAgenda)}
            className="rounded-xl border border-line bg-surface p-2.5 text-muted"
            aria-label="Agenda semanal"
          >
            <Calendar size={18} />
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
              editMode
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-line bg-surface text-muted"
            }`}
          >
            {editMode ? "Pronto" : "Editar"}
          </button>
        </div>
      </header>

      {/* AGENDA SEMANAL */}
      {showAgenda && (
        <section className="rounded-2xl bg-surface p-4">
          <p className="mb-3 text-sm font-semibold">Agenda da semana</p>
          <div className="space-y-2">
            {DIAS_SEMANA.map((dia, i) => (
              <div key={dia} className="flex items-center gap-2">
                <span
                  className={`w-8 text-xs font-medium ${
                    i === dayOfWeek() ? "text-primary" : "text-muted"
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
                  className="flex-1 rounded-xl border border-line bg-elev px-3 py-2 text-sm outline-none focus:border-primary"
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
        </section>
      )}

      {importFeedback && (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
          {importFeedback}
        </p>
      )}

      <LoadState
        loading={loading}
        error={loadError}
        onRetry={() => load()}
        empty={!loading && !loadError && workouts.length === 0}
        emptyTitle="Nenhum treino cadastrado"
        emptyDesc="Importe um modelo pronto ou crie seu primeiro treino."
        emptyAction={
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="w-full rounded-xl bg-primary py-3 font-bold text-black"
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
              className="flex w-full items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 p-4 text-left"
            >
              <div>
                <p className="text-xs text-primary">Treino do dia</p>
                <p className="font-bold">
                  {scheduled.letra} — {scheduled.nome}
                </p>
              </div>
              <ChevronRight className="text-primary" />
            </button>
          )}

          {/* LISTA DE TREINOS */}
          {(!active || editMode) && workouts.length > 0 && (
            <div className="space-y-2">
              {workouts.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-2 rounded-2xl bg-surface p-3"
                >
                  <button
                    onClick={() => !editMode && iniciarTreino(w)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-elev text-lg font-black text-primary">
                      {w.letra}
                    </span>
                    <div>
                      <p className="font-semibold">{w.nome}</p>
                      <p className="text-xs text-muted">
                        {w.exercicios.length} exercícios
                        {w.letra === "BX" ? " · Boxe" : ""}
                      </p>
                    </div>
                  </button>
                  {editMode && (
                    <button
                      onClick={() => setEditing(w)}
                      className="p-2 text-muted"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                </div>
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
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-dashed border-line py-3 text-sm text-muted"
                  >
                    <Plus size={16} /> Novo treino
                  </button>
                  <button
                    onClick={() => setShowTemplates(true)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-line bg-elev py-3 text-sm text-muted"
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
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold">
                  {active.letra} — {active.nome}
                </p>
                <button
                  onClick={() => setActiveId(null)}
                  className="text-xs text-muted"
                >
                  Trocar
                </button>
              </div>

              {active.exercicios.map((ex) => {
                const serie = serieAtual[ex.nome] ?? 0;
                const total = ex.series;
                const done = serie >= total;
                const last = lastLoads[ex.nome];
                const input = inputs[ex.nome] ?? { carga: "", reps: "" };
                const isTimeBased = ex.reps_alvo.includes("min");

                return (
                  <section
                    key={ex.nome}
                    className={`rounded-2xl p-4 ${
                      done ? "bg-primary/5" : "bg-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-semibold ${done ? "text-primary" : ""}`}>
                          {ex.nome}
                        </p>
                        <p className="text-xs text-muted">
                          Série {Math.min(serie + 1, total)} de {total} · alvo{" "}
                          {ex.reps_alvo}
                          {last && !isTimeBased
                            ? ` · última ${last.carga}kg×${last.reps}`
                            : ""}
                        </p>
                      </div>
                      {done && (
                        <Check size={20} className="text-primary" strokeWidth={3} />
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
                            className="flex-1 rounded-xl bg-primary py-3 font-bold text-black"
                          >
                            {ex.reps_alvo} — concluir
                          </button>
                        ) : (
                          <>
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder={last ? `${last.carga}` : "kg"}
                              value={input.carga}
                              onChange={(e) =>
                                setInputs({
                                  ...inputs,
                                  [ex.nome]: { ...input, carga: e.target.value },
                                })
                              }
                              className="w-20 rounded-xl border border-line bg-elev px-3 py-3 text-center outline-none focus:border-primary"
                            />
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder={last ? `${last.reps}` : "reps"}
                              value={input.reps}
                              onChange={(e) =>
                                setInputs({
                                  ...inputs,
                                  [ex.nome]: { ...input, reps: e.target.value },
                                })
                              }
                              className="w-20 rounded-xl border border-line bg-elev px-3 py-3 text-center outline-none focus:border-primary"
                            />
                            <button
                              onClick={() => registrarSerie(ex)}
                              className="flex-1 rounded-xl bg-primary py-3 font-bold text-black"
                            >
                              Registrar
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}

              <button
                onClick={finalizarTreino}
                disabled={concluido}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold ${
                  concluido
                    ? "border border-primary/40 bg-primary/10 text-primary"
                    : "bg-primary text-black"
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
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70"
          onClick={() => !importingId && setShowTemplates(false)}
        >
          <div
            className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Modelos de treino</h2>
              <button onClick={() => setShowTemplates(false)} disabled={!!importingId}>
                <X size={20} />
              </button>
            </div>
            {TEMPLATE_PACKS.map((p) => (
              <button
                key={p.id}
                disabled={!!importingId}
                onClick={() => importarTemplate(p.id)}
                className="mb-2 w-full rounded-xl border border-line bg-elev p-4 text-left disabled:opacity-50"
              >
                <p className="font-semibold">
                  {importingId === p.id ? "Importando..." : p.nome}
                </p>
                <p className="text-xs text-muted">{p.descricao}</p>
              </button>
            ))}
          </div>
        </div>
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70">
      <div className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {workout.id === "nova" ? "Novo treino" : "Editar treino"}
          </h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="mb-3 flex gap-2">
          <input
            value={letra}
            onChange={(e) => setLetra(e.target.value.toUpperCase())}
            placeholder="Letra (A, BX...)"
            className="w-24 rounded-xl border border-line bg-elev px-3 py-3 text-center outline-none focus:border-primary"
          />
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do treino"
            className="flex-1 rounded-xl border border-line bg-elev px-3 py-3 outline-none focus:border-primary"
          />
        </div>
        {exs.map((ex, i) => (
          <div key={i} className="mb-2 rounded-xl bg-elev p-3">
            <div className="flex gap-2">
              <input
                value={ex.nome}
                onChange={(e) =>
                  setExs(exs.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))
                }
                placeholder="Exercício"
                className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
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
                className="w-16 rounded-lg border border-line bg-surface px-2 py-2 text-sm text-center"
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
                className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              />
            </div>
          </div>
        ))}
        <button
          onClick={() =>
            setExs([...exs, { nome: "", series: 3, reps_alvo: "8-10" }])
          }
          className="mb-4 w-full rounded-xl border border-dashed border-line py-3 text-sm text-muted"
        >
          + Exercício
        </button>
        <div className="flex gap-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-xl border border-danger/40 px-4 py-3 text-sm text-danger"
            >
              Excluir
            </button>
          )}
          <button
            onClick={() =>
              letra.trim() && nome.trim() && onSave({ ...workout, letra, nome, exercicios: exs })
            }
            className="flex-1 rounded-xl bg-primary py-3 font-bold text-black"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
