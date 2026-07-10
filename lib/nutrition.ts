import type { Meal } from "./types";

export function mealKcal(meal: Meal): number {
  return meal.itens.reduce((a, i) => a + (i.kcal || 0), 0);
}

export function mealProtein(meal: Meal): number {
  return meal.itens.reduce((a, i) => a + (i.proteina_g || 0), 0);
}

export function sumMacros(
  meals: Meal[],
  doneIds: Set<string> | string[]
): { kcalDone: number; kcalTotal: number; protDone: number; protTotal: number } {
  const done = doneIds instanceof Set ? doneIds : new Set(doneIds);
  let kcalDone = 0;
  let kcalTotal = 0;
  let protDone = 0;
  let protTotal = 0;
  for (const m of meals) {
    const k = mealKcal(m);
    const p = mealProtein(m);
    kcalTotal += k;
    protTotal += p;
    if (done.has(m.id)) {
      kcalDone += k;
      protDone += p;
    }
  }
  return { kcalDone, kcalTotal, protDone, protTotal };
}

export type DayChecklist = {
  mealsOk: boolean;
  aguaOk: boolean;
  treinoOk: boolean;
  hasTreinoHoje: boolean;
  mealPct: number;
  aguaPct: number;
  pctDia: number;
  diaCompleto: boolean;
};

/** % do dia = partes iguais (refeições + água + treino se houver). Proteína fica só na Dieta. */
export function calcDayChecklist(input: {
  mealsCount: number;
  mealsDone: number;
  aguaMl: number;
  metaAguaMl: number;
  treinoDone: boolean;
  hasTreinoHoje: boolean;
}): DayChecklist {
  const mealPct =
    input.mealsCount > 0 ? (input.mealsDone / input.mealsCount) * 100 : 100;
  const aguaPct = input.metaAguaMl
    ? Math.min(100, (input.aguaMl / input.metaAguaMl) * 100)
    : 100;
  const treinoPct = input.hasTreinoHoje ? (input.treinoDone ? 100 : 0) : 100;

  const parts = input.hasTreinoHoje ? 3 : 2;
  const pctDia = (mealPct + aguaPct + treinoPct) / parts;

  const mealsOk = input.mealsCount > 0 && input.mealsDone >= input.mealsCount;
  const aguaOk = input.aguaMl >= input.metaAguaMl;
  const treinoOk = !input.hasTreinoHoje || input.treinoDone;

  return {
    mealsOk,
    aguaOk,
    treinoOk,
    hasTreinoHoje: input.hasTreinoHoje,
    mealPct,
    aguaPct,
    pctDia,
    diaCompleto: mealsOk && aguaOk && treinoOk,
  };
}

/** Horário sugerido por ordem da refeição no cardápio. */
export function horarioSugeridoRefeicao(ordem: number): string | null {
  const map: Record<number, string> = {
    1: "~8h",
    2: "~12h",
    3: "~15h",
    4: "~19h",
    5: "~21h",
  };
  return map[ordem] ?? null;
}

export function cardapioSemProteina(meals: Meal[]): boolean {
  if (!meals.length) return false;
  return meals.every((m) => mealProtein(m) === 0);
}
