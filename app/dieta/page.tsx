"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Coffee,
  Utensils,
  Apple,
  Moon,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  Repeat,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr, yesterdayStr, isRetroactiveWindow } from "@/lib/dates";
import {
  getCached,
  setCached,
  getCachedEntry,
  isCacheFresh,
  STATIC_DATA_TTL,
} from "@/lib/cache";
import SwipeCard from "@/components/SwipeCard";
import LoadState from "@/components/LoadState";
import BentoCard, { BentoLabel, BentoValue } from "@/components/BentoCard";
import RangeBar from "@/components/RangeBar";
import WaterTracker from "@/components/WaterTracker";
import BottomSheet from "@/components/BottomSheet";
import { useDailyData, invalidateDailyCache } from "@/components/DailyDataProvider";
import { showToast } from "@/lib/toast";
import type { Meal, MealItem } from "@/lib/types";

type DietaCache = {
  meals: Meal[];
  doneIds: string[];
  aguaMl: number;
  metaAgua: number;
  copoMl: number;
  metaProteina: number;
};

function readDietaCache(): DietaCache | null {
  return getCached<DietaCache>("dieta_data");
}

const ICONES: Record<string, React.ElementType> = {
  coffee: Coffee,
  utensils: Utensils,
  apple: Apple,
  moon: Moon,
};

const DEFAULT_META_PROT = 150;

const MEAL_VARIANTS = ["amber", "blue", "violet", "slate"] as const;

export default function DietaPage() {
  const { snapshot } = useDailyData();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const [aguaMl, setAguaMl] = useState(0);
  const [metaAgua, setMetaAgua] = useState(3000);
  const [copoMl, setCopoMl] = useState(250);
  const [metaProteina, setMetaProteina] = useState(DEFAULT_META_PROT);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const today = todayStr();
  const [activeDate, setActiveDate] = useState(() => todayStr());

  const persistCache = useCallback(
    (patch: Partial<DietaCache> & { doneIds?: string[] }) => {
      const base = readDietaCache();
      setCached("dieta_data", {
        meals: patch.meals ?? meals,
        doneIds: patch.doneIds ?? [...done],
        aguaMl: patch.aguaMl ?? aguaMl,
        metaAgua: patch.metaAgua ?? metaAgua,
        copoMl: patch.copoMl ?? copoMl,
        metaProteina: patch.metaProteina ?? metaProteina,
      });
      if (base && patch.meals === undefined) {
        /* keep meals from state via args above */
      }
    },
    [meals, done, aguaMl, metaAgua, copoMl, metaProteina]
  );

  const load = useCallback(
    async (force = false) => {
      setLoadError(null);
      const entry = getCachedEntry<DietaCache>("dieta_data");
      const hadCache = Boolean(entry?.data.meals.length);
      const mealsFresh =
        !force && isCacheFresh(entry, STATIC_DATA_TTL) && hadCache;

      if (!hadCache) setLoading(true);

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const settingsSelect = "meta_agua_ml, copo_ml, meta_proteina_g";

        if (
          mealsFresh &&
          entry &&
          activeDate === today &&
          snapshot?.meals.length
        ) {
          const doneIds = snapshot.mealDoneIds;
          setMeals(entry.data.meals);
          setDone(new Set(doneIds));
          setAguaMl(snapshot.aguaMl);
          setMetaAgua(snapshot.settings.meta_agua_ml);
          setCopoMl(snapshot.settings.copo_ml);
          setMetaProteina(snapshot.settings.meta_proteina_g);
          setCached("dieta_data", {
            meals: entry.data.meals,
            doneIds,
            aguaMl: snapshot.aguaMl,
            metaAgua: snapshot.settings.meta_agua_ml,
            copoMl: snapshot.settings.copo_ml,
            metaProteina: snapshot.settings.meta_proteina_g,
          });
          return;
        }

        if (mealsFresh && entry) {
          const [logsRes, dailyRes, settingsRes] = await Promise.all([
            supabase
              .from("meal_logs")
              .select("meal_id")
              .eq("user_id", user.id)
              .eq("date", activeDate),
            activeDate === today
              ? supabase
                  .from("daily_logs")
                  .select("agua_ml")
                  .eq("user_id", user.id)
                  .eq("date", today)
                  .maybeSingle()
              : Promise.resolve({ data: null, error: null }),
            supabase
              .from("user_settings")
              .select(settingsSelect)
              .eq("user_id", user.id)
              .maybeSingle(),
          ]);

          const doneIds = logsRes.data?.map((l) => l.meal_id) ?? [];
          const agua =
            activeDate === today
              ? (dailyRes.data?.agua_ml ?? entry.data.aguaMl)
              : aguaMl;
          const metaProt =
            settingsRes.data?.meta_proteina_g ??
            entry.data.metaProteina ??
            DEFAULT_META_PROT;

          setMeals(entry.data.meals);
          setDone(new Set(doneIds));
          if (activeDate === today) setAguaMl(agua);
          setMetaAgua(settingsRes.data?.meta_agua_ml ?? entry.data.metaAgua);
          setCopoMl(settingsRes.data?.copo_ml ?? entry.data.copoMl);
          setMetaProteina(metaProt);
          setCached("dieta_data", {
            meals: entry.data.meals,
            doneIds,
            aguaMl: agua,
            metaAgua: settingsRes.data?.meta_agua_ml ?? entry.data.metaAgua,
            copoMl: settingsRes.data?.copo_ml ?? entry.data.copoMl,
            metaProteina: metaProt,
          });
          return;
        }

        const [mealsRes, logsRes, dailyRes, settingsRes] = await Promise.all([
          supabase
            .from("meals")
            .select("id, ordem, nome, icone, itens")
            .eq("user_id", user.id)
            .order("ordem"),
          supabase
            .from("meal_logs")
            .select("meal_id")
            .eq("user_id", user.id)
            .eq("date", activeDate),
          supabase
            .from("daily_logs")
            .select("agua_ml")
            .eq("user_id", user.id)
            .eq("date", today)
            .maybeSingle(),
          supabase
            .from("user_settings")
            .select(settingsSelect)
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (mealsRes.error) throw mealsRes.error;

        const m = (mealsRes.data as Meal[]) ?? [];
        const doneIds = logsRes.data?.map((l) => l.meal_id) ?? [];
        const agua =
          activeDate === today ? (dailyRes.data?.agua_ml ?? 0) : aguaMl;
        const meta = settingsRes.data?.meta_agua_ml ?? 3000;
        const copo = settingsRes.data?.copo_ml ?? 250;
        const metaProt =
          settingsRes.data?.meta_proteina_g ?? DEFAULT_META_PROT;

        setMeals(m);
        setDone(new Set(doneIds));
        if (activeDate === today) setAguaMl(agua);
        setMetaAgua(meta);
        setCopoMl(copo);
        setMetaProteina(metaProt);
        setCached("dieta_data", {
          meals: m,
          doneIds,
          aguaMl: agua,
          metaAgua: meta,
          copoMl: copo,
          metaProteina: metaProt,
        });
      } catch (e) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message: string }).message)
            : "Erro ao carregar dieta.";
        setLoadError(
          msg.includes("meals")
            ? "Cardápio não encontrado. Rode supabase/schema.sql no Supabase."
            : "Não foi possível carregar. Verifique a conexão."
        );
      } finally {
        setLoading(false);
      }
    },
    [activeDate, today, aguaMl, snapshot]
  );

  useEffect(() => {
    const c = readDietaCache();
    if (c?.meals.length) {
      setMeals(c.meals);
      setDone(new Set(c.doneIds));
      setAguaMl(c.aguaMl);
      setMetaAgua(c.metaAgua);
      setCopoMl(c.copoMl);
      setMetaProteina(c.metaProteina);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleMeal(mealId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const newDone = new Set(done);
    if (done.has(mealId)) {
      newDone.delete(mealId);
      setDone(newDone);
      await supabase
        .from("meal_logs")
        .delete()
        .eq("user_id", user.id)
        .eq("date", activeDate)
        .eq("meal_id", mealId);
      showToast("Refeição desmarcada");
    } else {
      newDone.add(mealId);
      setDone(newDone);
      await supabase.from("meal_logs").upsert(
        { user_id: user.id, date: activeDate, meal_id: mealId },
        { onConflict: "user_id,date,meal_id" }
      );
      const meal = meals.find((m) => m.id === mealId);
      showToast(meal ? `${meal.nome} marcada ✓` : "Refeição marcada ✓");
    }
    persistCache({ doneIds: [...newDone] });
    if (activeDate === today) invalidateDailyCache();
  }

  async function mudarAgua(novoMl: number) {
    setAguaMl(novoMl);
    persistCache({ aguaMl: novoMl });
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("daily_logs").upsert(
      { user_id: user.id, date: today, agua_ml: novoMl },
      { onConflict: "user_id,date" }
    );
    showToast("Água atualizada ✓");
    invalidateDailyCache();
  }

  async function salvarMeal(meal: Meal) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (meal.id === "nova") {
      const { data } = await supabase
        .from("meals")
        .insert({
          user_id: user.id,
          ordem: meals.length + 1,
          nome: meal.nome,
          icone: meal.icone,
          itens: meal.itens,
        })
        .select("id, ordem, nome, icone, itens")
        .single();
      if (data) {
        const next = [...meals, data as Meal];
        setMeals(next);
        persistCache({ meals: next });
      }
    } else {
      await supabase
        .from("meals")
        .update({ nome: meal.nome, itens: meal.itens })
        .eq("id", meal.id)
        .eq("user_id", user.id);
      const next = meals.map((m) => (m.id === meal.id ? meal : m));
      setMeals(next);
      persistCache({ meals: next });
    }
    setEditing(null);
  }

  async function excluirMeal(mealId: string) {
    if (!confirm("Excluir esta refeição do cardápio?")) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("meals")
      .delete()
      .eq("id", mealId)
      .eq("user_id", user.id);
    const next = meals.filter((m) => m.id !== mealId);
    setMeals(next);
    persistCache({ meals: next });
    setEditing(null);
  }

  const kcalTotal = meals.reduce(
    (acc, m) => acc + m.itens.reduce((a, i) => a + (i.kcal || 0), 0),
    0
  );
  const kcalDone = meals
    .filter((m) => done.has(m.id))
    .reduce(
      (acc, m) => acc + m.itens.reduce((a, i) => a + (i.kcal || 0), 0),
      0
    );
  const protTotal = meals.reduce(
    (acc, m) => acc + m.itens.reduce((a, i) => a + (i.proteina_g || 0), 0),
    0
  );
  const protDone = meals
    .filter((m) => done.has(m.id))
    .reduce(
      (acc, m) => acc + m.itens.reduce((a, i) => a + (i.proteina_g || 0), 0),
      0
    );
  const isYesterday = activeDate === yesterdayStr();
  const canRetro = isRetroactiveWindow();
  const showWater = activeDate === today;

  return (
    <div className="space-y-4 pb-2">
      <header className="page-header flex items-end justify-between pt-1">
        <div>
          <p className="section-label">Nutrição</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Dieta</h1>
          <p className="mt-0.5 text-sm font-medium text-white/55">
            {isYesterday
              ? "Registrando ontem"
              : `${done.size}/${meals.length} refeições · ${kcalDone}/${kcalTotal} kcal`}
          </p>
        </div>
        <div className="flex gap-2">
          {canRetro && (
            <button
              onClick={() =>
                setActiveDate(isYesterday ? today : yesterdayStr())
              }
              className={`btn-ghost px-3 py-2 text-[10px] font-bold ${
                isYesterday ? "active" : ""
              }`}
            >
              {isYesterday ? "Hoje" : "Ontem"}
            </button>
          )}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`btn-ghost px-3 py-2 text-xs font-bold ${
              editMode ? "active" : ""
            }`}
          >
            {editMode ? "Pronto" : "Editar"}
          </button>
        </div>
      </header>

      {showWater && (
        <WaterTracker
          aguaMl={aguaMl}
          metaMl={metaAgua}
          copoMl={copoMl}
          onChange={mudarAgua}
        />
      )}

      {/* Macros */}
      <div className="bento-grid">
        <BentoCard variant="amber" className="!min-h-0">
          <BentoLabel>Calorias</BentoLabel>
          <BentoValue compact sub="kcal hoje">
            {kcalDone}/{kcalTotal}
          </BentoValue>
          <RangeBar
            pct={kcalTotal ? Math.round((kcalDone / kcalTotal) * 100) : 0}
            color="amber"
          />
        </BentoCard>
        <BentoCard variant="mint" className="!min-h-0">
          <BentoLabel>Proteína</BentoLabel>
          <BentoValue compact sub={`meta ${metaProteina}g`}>
            {protDone}/{Math.max(protTotal, metaProteina)}g
          </BentoValue>
          <RangeBar
            pct={
              metaProteina
                ? Math.min(100, Math.round((protDone / metaProteina) * 100))
                : 0
            }
            color="mint"
          />
        </BentoCard>
      </div>

      {!editMode && meals.length > 0 && (
        <p className="section-label px-1">Cardápio</p>
      )}

      {!editMode && meals.length > 0 && (
        <p className="px-1 text-center text-[10px] text-white/35">
          Toque no card para marcar · deslize → também funciona
        </p>
      )}

      <LoadState
        loading={loading}
        error={loadError}
        onRetry={() => load(true)}
        skeleton="dieta"
        empty={!loading && !loadError && meals.length === 0}
        emptyTitle="Cardápio vazio"
        emptyDesc="Adicione refeições ou rode o schema no Supabase."
        emptyAction={
          <button
            onClick={() =>
              setEditing({
                id: "nova",
                ordem: 1,
                nome: "Nova refeição",
                icone: "utensils",
                itens: [],
              })
            }
            className="btn-primary w-full px-4 py-3"
          >
            Adicionar refeição
          </button>
        }
      >
        {meals.map((meal, idx) => {
          const Icon = ICONES[meal.icone] ?? Utensils;
          const isDone = done.has(meal.id);
          const kcal = meal.itens.reduce((a, i) => a + (i.kcal || 0), 0);
          const prot = meal.itens.reduce((a, i) => a + (i.proteina_g || 0), 0);
          const isOpen = expanded === meal.id;
          const variant = isDone ? "mint" : MEAL_VARIANTS[idx % MEAL_VARIANTS.length];

          function handleCardTap() {
            if (editMode) return;
            if (isOpen) return;
            if (!isDone) {
              toggleMeal(meal.id);
            } else {
              setExpanded(meal.id);
            }
          }

          const card = (
            <BentoCard
              variant={variant}
              className={`!min-h-0 !p-3 ${!editMode && !isDone ? "cursor-pointer active:scale-[0.99]" : ""}`}
              onClick={!editMode ? handleCardTap : undefined}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-no-mark
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMeal(meal.id);
                  }}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
                    isDone
                      ? "bg-mint/25 text-mint animate-check-pop ring-2 ring-mint/30"
                      : "bg-white/[0.06] text-white/50"
                  }`}
                  aria-label={`Marcar ${meal.nome}`}
                >
                  {isDone ? (
                    <Check size={20} strokeWidth={3} />
                  ) : (
                    <Icon size={18} />
                  )}
                </button>
                <div className="min-w-0 flex-1 text-left">
                  <p
                    className={`truncate font-semibold ${isDone ? "text-mint" : ""}`}
                  >
                    {meal.nome}
                  </p>
                  <p className="text-xs text-white/45">
                    ~{kcal} kcal
                    {prot > 0 ? ` · ${prot}g prot` : ""}
                  </p>
                </div>
                {editMode && (
                  <button
                    type="button"
                    data-no-mark
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(meal);
                    }}
                    className="btn-ghost p-2"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                <button
                  type="button"
                  data-no-mark
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(isOpen ? null : meal.id);
                  }}
                  className="btn-ghost p-1"
                >
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              {isOpen && (
                <ul className="mt-3 space-y-2 border-t border-white/[0.08] pt-3">
                  {meal.itens.map((item, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="min-w-0">
                          {item.nome}{" "}
                          <span className="text-white/40">
                            ({item.quantidade})
                          </span>
                        </span>
                        <span className="shrink-0 text-right text-white/45">
                          {item.kcal} kcal
                          {item.proteina_g ? (
                            <span className="text-mint">
                              {" "}
                              · {item.proteina_g}g
                            </span>
                          ) : null}
                        </span>
                      </div>
                      {item.substituicoes.length > 0 && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-amber">
                          <Repeat size={11} />
                          {item.substituicoes.join(" · ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </BentoCard>
          );
          return editMode ? (
            <div key={meal.id}>{card}</div>
          ) : (
            <SwipeCard
              key={meal.id}
              onSwipe={() => !isDone && toggleMeal(meal.id)}
              disabled={isDone}
              hint={idx === 0 && !isDone}
            >
              {card}
            </SwipeCard>
          );
        })}
      </LoadState>

      {editMode && (
        <button
          onClick={() =>
            setEditing({
              id: "nova",
              ordem: meals.length + 1,
              nome: "",
              icone: "utensils",
              itens: [],
            })
          }
          className="btn-ghost flex w-full items-center justify-center gap-1 border border-dashed border-white/15 py-3.5 text-sm"
        >
          <Plus size={16} /> Nova refeição
        </button>
      )}

      {editing && (
        <MealEditor
          meal={editing}
          onSave={salvarMeal}
          onDelete={
            editing.id !== "nova" ? () => excluirMeal(editing.id) : undefined
          }
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function MealEditor({
  meal,
  onSave,
  onDelete,
  onClose,
}: {
  meal: Meal;
  onSave: (m: Meal) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(meal.nome);
  const [itens, setItens] = useState<MealItem[]>(meal.itens);

  function setItem(i: number, patch: Partial<MealItem>) {
    setItens(itens.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  const totalProt = itens.reduce((a, i) => a + (i.proteina_g || 0), 0);
  const totalKcal = itens.reduce((a, i) => a + (i.kcal || 0), 0);

  return (
    <BottomSheet
      title={meal.id === "nova" ? "Nova refeição" : "Editar refeição"}
      subtitle={`${totalKcal} kcal · ${totalProt}g prot`}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="btn-ghost border border-danger/40 px-4 py-3 text-sm font-semibold text-danger"
            >
              Excluir
            </button>
          )}
          <button
            onClick={() =>
              nome.trim() && onSave({ ...meal, nome: nome.trim(), itens })
            }
            className="btn-primary flex-1 py-3"
          >
            Salvar
          </button>
        </div>
      }
    >
        <label className="section-label mb-1 block">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="ex: Café da Manhã"
          className="input-field mb-4 w-full px-4 py-3 text-base"
        />

        <p className="section-label mb-2">Itens</p>
        <div className="space-y-3">
          {itens.map((item, i) => (
            <div key={i} className="rounded-xl bg-white/[0.04] p-3">
              <div className="mb-2 flex gap-2">
                <input
                  value={item.nome}
                  onChange={(e) => setItem(i, { nome: e.target.value })}
                  placeholder="Alimento"
                  className="input-field min-w-0 flex-1 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => setItens(itens.filter((_, idx) => idx !== i))}
                  className="shrink-0 p-2 text-danger"
                  aria-label="Remover item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={item.quantidade}
                  onChange={(e) => setItem(i, { quantidade: e.target.value })}
                  placeholder="150g"
                  className="input-field px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={item.kcal || ""}
                  onChange={(e) =>
                    setItem(i, { kcal: parseInt(e.target.value) || 0 })
                  }
                  placeholder="kcal"
                  className="input-field px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={item.proteina_g || ""}
                  onChange={(e) =>
                    setItem(i, {
                      proteina_g: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="prot g"
                  className="input-field px-3 py-2 text-sm"
                />
              </div>
              <input
                value={item.substituicoes.join(", ")}
                onChange={(e) =>
                  setItem(i, {
                    substituicoes: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="substituições (vírgula)"
                className="input-field mt-2 w-full px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() =>
            setItens([
              ...itens,
              { nome: "", quantidade: "", kcal: 0, substituicoes: [] },
            ])
          }
          className="btn-ghost mt-3 flex w-full items-center justify-center gap-1 border border-dashed border-white/15 py-3 text-sm"
        >
          <Plus size={16} /> Adicionar item
        </button>
    </BottomSheet>
  );
}
