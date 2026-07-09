export type MealItem = {
  nome: string;
  quantidade: string;
  kcal: number;
  proteina_g?: number;
  substituicoes: string[];
};

export type Meal = {
  id: string;
  ordem: number;
  nome: string;
  icone: string;
  itens: MealItem[];
};

export type ExerciseDef = {
  nome: string;
  series: number;
  reps_alvo: string; // "8-10" ou "3 min"
};

export type Workout = {
  id: string;
  ordem: number;
  letra: string;
  nome: string;
  exercicios: ExerciseDef[];
};

export type UserStats = {
  current_streak: number;
  max_streak: number;
  last_completed_date: string | null;
};

export type UserSettings = {
  meta_agua_ml: number;
  copo_ml: number;
  meta_proteina_g: number;
  meta_peso: number | null;
  agua_lembrete_horas: number[];
  hora_lembrete_metas: number;
  lembretes_ativos: boolean;
  agenda_treino: Record<string, string | null>;
  onboarding_done?: boolean;
};
