"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Coffee,
  Utensils,
  Apple,
  Moon,
  Droplets,
  Plus,
  Minus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Repeat,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr, yesterdayStr, isRetroactiveWindow } from "@/lib/dates";
import { getCached, setCached } from "@/lib/cache";
import SwipeCard from "@/components/SwipeCard";
import { SkeletonCard } from "@/components/Skeleton";
import type { Meal, MealItem } from "@/lib/types";

const ICONES: Record<string, React.ElementType> = {
  coffee: Coffee,
  utensils: Utensils,
  apple: Apple,
  moon: Moon,
};

export default function DietaPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [aguaMl, setAguaMl] = useState(0);
  const [metaAgua, setMetaAgua] = useState(3000);
  const [copoMl, setCopoMl] = useState(250);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const today = todayStr();
  const [activeDate, setActiveDate] = useState(() => todayStr());

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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
        .select("meta_agua_ml, copo_ml")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    setMeals((mealsRes.data as Meal[]) ?? []);
    setDone(new Set(logsRes.data?.map((l) => l.meal_id)));
    if (activeDate === today) setAguaMl(dailyRes.data?.agua_ml ?? 0);
    if (settingsRes.data) {
      setMetaAgua(settingsRes.data.meta_agua_ml);
      setCopoMl(settingsRes.data.copo_ml);
    }
    setLoading(false);
  }, [activeDate, today]);

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
    } else {
      newDone.add(mealId);
      setDone(newDone);
      await supabase
        .from("meal_logs")
        .upsert(
          { user_id: user.id, date: activeDate, meal_id: mealId },
          { onConflict: "user_id,date,meal_id" }
        );
    }
  }

  async function mudarAgua(delta: number) {
    const novo = Math.max(0, aguaMl + delta);
    setAguaMl(novo);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("daily_logs")
      .upsert(
        { user_id: user.id, date: today, agua_ml: novo },
        { onConflict: "user_id,date" }
      );
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
      if (data) setMeals([...meals, data as Meal]);
    } else {
      await supabase
        .from("meals")
        .update({ nome: meal.nome, itens: meal.itens })
        .eq("id", meal.id)
        .eq("user_id", user.id);
      setMeals(meals.map((m) => (m.id === meal.id ? meal : m)));
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
    setMeals(meals.filter((m) => m.id !== mealId));
    setEditing(null);
  }

  const kcalTotal = meals.reduce(
    (acc, m) => acc + m.itens.reduce((a, i) => a + (i.kcal || 0), 0),
    0
  );
  const kcalDone = meals
    .filter((m) => done.has(m.id))
    .reduce((acc, m) => acc + m.itens.reduce((a, i) => a + (i.kcal || 0), 0), 0);
  const protTotal = meals.reduce(
    (acc, m) => acc + m.itens.reduce((a, i) => a + (i.proteina_g || 0), 0),
    0
  );
  const protDone = meals
    .filter((m) => done.has(m.id))
    .reduce((acc, m) => acc + m.itens.reduce((a, i) => a + (i.proteina_g || 0), 0), 0);
  const pctAgua = Math.min(100, Math.round((aguaMl / metaAgua) * 100));
  const isYesterday = activeDate === yesterdayStr();
  const canRetro = isRetroactiveWindow();

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Dieta</h1>
          <p className="text-xs text-muted">
            {kcalDone}/{kcalTotal} kcal · {protDone}/{protTotal}g prot · {done.size}/{meals.length} refeições
          </p>
          {isYesterday && (
            <p className="text-xs text-amber">Registrando ontem</p>
          )}
        </div>
        <div className="flex gap-2">
          {canRetro && (
            <button
              onClick={() => setActiveDate(isYesterday ? today : yesterdayStr())}
              className="rounded-xl border border-line bg-surface px-2 py-2 text-[10px] font-semibold text-muted"
            >
              {isYesterday ? "Hoje" : "Ontem"}
            </button>
          )}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
              editMode ? "border-primary/40 bg-primary/10 text-primary" : "border-line bg-surface text-muted"
            }`}
          >
            {editMode ? "Pronto" : "Editar"}
          </button>
        </div>
      </header>

      {/* ÁGUA */}
      <section className="rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets size={18} className="text-[#4db8ff]" />
            <span className="text-sm font-semibold">
              {(aguaMl / 1000).toFixed(2).replace(".", ",")}L
              <span className="text-muted">
                {" "}
                / {(metaAgua / 1000).toFixed(1).replace(".", ",")}L
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => mudarAgua(-copoMl)}
              className="rounded-lg border border-line bg-elev p-2 text-muted"
              aria-label="Remover copo"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-14 text-center text-xs text-muted">
              copo {copoMl}ml
            </span>
            <button
              onClick={() => mudarAgua(copoMl)}
              className="rounded-lg bg-[#4db8ff] p-2 text-black"
              aria-label="Adicionar copo"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-elev">
          <div
            className="h-full rounded-full bg-[#4db8ff] transition-all"
            style={{ width: `${pctAgua}%` }}
          />
        </div>
      </section>

      {loading ? (
        <SkeletonCard />
      ) : (
        meals.map((meal) => {
          const Icon = ICONES[meal.icone] ?? Utensils;
          const isDone = done.has(meal.id);
          const kcal = meal.itens.reduce((a, i) => a + (i.kcal || 0), 0);
          const isOpen = expanded === meal.id;
          const card = (
            <section
              className={`rounded-2xl p-4 transition-colors ${
                isDone ? "bg-primary/5" : "bg-surface"
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleMeal(meal.id)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    isDone
                      ? "border-primary bg-primary text-black animate-check-pop"
                      : "border-line bg-elev text-muted"
                  }`}
                  aria-label={`Marcar ${meal.nome}`}
                >
                  {isDone ? <Check size={22} strokeWidth={3} /> : <Icon size={20} />}
                </button>
                <button
                  className="flex-1 text-left"
                  onClick={() => setExpanded(isOpen ? null : meal.id)}
                >
                  <p className={`font-semibold ${isDone ? "text-primary" : ""}`}>
                    {meal.nome}
                  </p>
                  <p className="text-xs text-muted">~{kcal} kcal</p>
                </button>
                {editMode && (
                  <button onClick={() => setEditing(meal)} className="p-2 text-muted">
                    <Pencil size={16} />
                  </button>
                )}
                <button
                  onClick={() => setExpanded(isOpen ? null : meal.id)}
                  className="p-1 text-muted"
                >
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              {isOpen && (
                <ul className="mt-3 space-y-2 border-t border-line pt-3">
                  {meal.itens.map((item, i) => (
                    <li key={i} className="text-sm">
                      <div className="flex justify-between">
                        <span>
                          {item.nome}{" "}
                          <span className="text-muted">({item.quantidade})</span>
                        </span>
                        <span className="text-muted">
                          {item.kcal} kcal
                          {item.proteina_g ? ` · ${item.proteina_g}g` : ""}
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
            </section>
          );
          return editMode ? (
            <div key={meal.id}>{card}</div>
          ) : (
            <SwipeCard
              key={meal.id}
              onSwipe={() => !isDone && toggleMeal(meal.id)}
              disabled={isDone}
            >
              {card}
            </SwipeCard>
          );
        })
      )}

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
          className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-line py-3 text-sm text-muted"
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

// ---------- Editor de refeição ----------

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

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70">
      <div className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-surface p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {meal.id === "nova" ? "Nova refeição" : "Editar refeição"}
          </h2>
          <button onClick={onClose} className="p-2 text-muted" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <label className="mb-1 block text-xs text-muted">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="ex: Café da Manhã"
          className="mb-4 w-full rounded-xl border border-line bg-elev px-4 py-3 text-base outline-none focus:border-neon"
        />

        <p className="mb-2 text-xs text-muted">Itens</p>
        <div className="space-y-3">
          {itens.map((item, i) => (
            <div key={i} className="rounded-xl border border-line bg-elev p-3">
              <div className="mb-2 flex gap-2">
                <input
                  value={item.nome}
                  onChange={(e) => setItem(i, { nome: e.target.value })}
                  placeholder="Alimento"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-neon"
                />
                <button
                  onClick={() => setItens(itens.filter((_, idx) => idx !== i))}
                  className="shrink-0 p-2 text-danger"
                  aria-label="Remover item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={item.quantidade}
                  onChange={(e) => setItem(i, { quantidade: e.target.value })}
                  placeholder="150g"
                  className="w-24 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-neon"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={item.kcal || ""}
                  onChange={(e) =>
                    setItem(i, { kcal: parseInt(e.target.value) || 0 })
                  }
                  placeholder="kcal"
                  className="w-20 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-neon"
                />
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
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-neon"
                />
              </div>
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
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-line py-3 text-sm text-muted"
        >
          <Plus size={16} /> Adicionar item
        </button>

        <div className="mt-5 flex gap-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-xl border border-danger/40 px-4 py-3 text-sm font-semibold text-danger"
            >
              Excluir
            </button>
          )}
          <button
            onClick={() =>
              nome.trim() && onSave({ ...meal, nome: nome.trim(), itens })
            }
            className="flex-1 rounded-xl bg-neon py-3 font-bold text-black"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
