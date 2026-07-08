import type { ExerciseDef } from "./types";

export type WorkoutTemplate = {
  letra: string;
  nome: string;
  exercicios: ExerciseDef[];
};

export type TemplatePack = {
  id: string;
  nome: string;
  descricao: string;
  treinos: WorkoutTemplate[];
};

export const TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: "abc-boxe",
    nome: "ABC + Boxe (atual)",
    descricao: "Sua mandala ABC de musculação + treino de boxe",
    treinos: [
      {
        letra: "A",
        nome: "Peito / Tríceps",
        exercicios: [
          { nome: "Supino Reto", series: 4, reps_alvo: "8-10" },
          { nome: "Supino Inclinado (Halter)", series: 3, reps_alvo: "10-12" },
          { nome: "Crossover", series: 3, reps_alvo: "12-15" },
          { nome: "Tríceps Pulley", series: 3, reps_alvo: "10-12" },
          { nome: "Tríceps Corda", series: 3, reps_alvo: "12-15" },
        ],
      },
      {
        letra: "B",
        nome: "Costas / Bíceps",
        exercicios: [
          { nome: "Puxada Frontal", series: 4, reps_alvo: "8-10" },
          { nome: "Remada Curvada", series: 3, reps_alvo: "8-10" },
          { nome: "Remada Baixa", series: 3, reps_alvo: "10-12" },
          { nome: "Rosca Direta", series: 3, reps_alvo: "10-12" },
          { nome: "Rosca Martelo", series: 3, reps_alvo: "12-15" },
        ],
      },
      {
        letra: "C",
        nome: "Perna / Ombro",
        exercicios: [
          { nome: "Agachamento", series: 4, reps_alvo: "8-10" },
          { nome: "Leg Press", series: 3, reps_alvo: "10-12" },
          { nome: "Extensora", series: 3, reps_alvo: "12-15" },
          { nome: "Flexora", series: 3, reps_alvo: "12-15" },
          { nome: "Desenvolvimento", series: 3, reps_alvo: "8-10" },
          { nome: "Elevação Lateral", series: 3, reps_alvo: "12-15" },
        ],
      },
      {
        letra: "BX",
        nome: "Boxe",
        exercicios: [
          { nome: "Pular corda", series: 3, reps_alvo: "3 min" },
          { nome: "Sombra (shadow boxing)", series: 3, reps_alvo: "3 min" },
          { nome: "Saco pesado", series: 4, reps_alvo: "3 min" },
          { nome: "Manoplas / técnica", series: 3, reps_alvo: "3 min" },
          { nome: "Abdômen", series: 3, reps_alvo: "20" },
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    nome: "Upper / Lower 4x",
    descricao: "4 treinos por semana: superior e inferior alternados",
    treinos: [
      {
        letra: "U1",
        nome: "Superior — Força",
        exercicios: [
          { nome: "Supino Reto", series: 4, reps_alvo: "5-8" },
          { nome: "Remada Curvada", series: 4, reps_alvo: "5-8" },
          { nome: "Desenvolvimento", series: 3, reps_alvo: "6-10" },
          { nome: "Puxada Frontal", series: 3, reps_alvo: "8-10" },
          { nome: "Rosca Direta", series: 2, reps_alvo: "10-12" },
          { nome: "Tríceps Pulley", series: 2, reps_alvo: "10-12" },
        ],
      },
      {
        letra: "L1",
        nome: "Inferior — Força",
        exercicios: [
          { nome: "Agachamento", series: 4, reps_alvo: "5-8" },
          { nome: "Stiff", series: 3, reps_alvo: "8-10" },
          { nome: "Leg Press", series: 3, reps_alvo: "10-12" },
          { nome: "Panturrilha em Pé", series: 4, reps_alvo: "12-15" },
          { nome: "Abdômen", series: 3, reps_alvo: "15" },
        ],
      },
      {
        letra: "U2",
        nome: "Superior — Volume",
        exercicios: [
          { nome: "Supino Inclinado (Halter)", series: 4, reps_alvo: "10-12" },
          { nome: "Remada Baixa", series: 4, reps_alvo: "10-12" },
          { nome: "Elevação Lateral", series: 4, reps_alvo: "12-15" },
          { nome: "Crossover", series: 3, reps_alvo: "12-15" },
          { nome: "Rosca Martelo", series: 3, reps_alvo: "12-15" },
          { nome: "Tríceps Corda", series: 3, reps_alvo: "12-15" },
        ],
      },
      {
        letra: "L2",
        nome: "Inferior — Volume",
        exercicios: [
          { nome: "Leg Press", series: 4, reps_alvo: "10-12" },
          { nome: "Extensora", series: 3, reps_alvo: "12-15" },
          { nome: "Flexora", series: 3, reps_alvo: "12-15" },
          { nome: "Elevação Pélvica", series: 3, reps_alvo: "10-12" },
          { nome: "Panturrilha Sentado", series: 4, reps_alvo: "15-20" },
        ],
      },
    ],
  },
  {
    id: "ppl",
    nome: "Push / Pull / Legs",
    descricao: "Empurrar, puxar e pernas — clássico de hipertrofia",
    treinos: [
      {
        letra: "PU",
        nome: "Push — Peito/Ombro/Tríceps",
        exercicios: [
          { nome: "Supino Reto", series: 4, reps_alvo: "6-10" },
          { nome: "Desenvolvimento", series: 3, reps_alvo: "8-10" },
          { nome: "Supino Inclinado (Halter)", series: 3, reps_alvo: "10-12" },
          { nome: "Elevação Lateral", series: 3, reps_alvo: "12-15" },
          { nome: "Tríceps Pulley", series: 3, reps_alvo: "10-12" },
        ],
      },
      {
        letra: "PL",
        nome: "Pull — Costas/Bíceps",
        exercicios: [
          { nome: "Puxada Frontal", series: 4, reps_alvo: "6-10" },
          { nome: "Remada Curvada", series: 3, reps_alvo: "8-10" },
          { nome: "Remada Baixa", series: 3, reps_alvo: "10-12" },
          { nome: "Face Pull", series: 3, reps_alvo: "12-15" },
          { nome: "Rosca Direta", series: 3, reps_alvo: "10-12" },
        ],
      },
      {
        letra: "LG",
        nome: "Legs — Pernas completas",
        exercicios: [
          { nome: "Agachamento", series: 4, reps_alvo: "6-10" },
          { nome: "Leg Press", series: 3, reps_alvo: "10-12" },
          { nome: "Stiff", series: 3, reps_alvo: "8-10" },
          { nome: "Extensora", series: 3, reps_alvo: "12-15" },
          { nome: "Panturrilha em Pé", series: 4, reps_alvo: "12-15" },
        ],
      },
    ],
  },
  {
    id: "fullbody",
    nome: "Full Body 3x",
    descricao: "Corpo inteiro, 3x por semana — simples e brutal",
    treinos: [
      {
        letra: "F1",
        nome: "Full Body 1",
        exercicios: [
          { nome: "Agachamento", series: 3, reps_alvo: "6-10" },
          { nome: "Supino Reto", series: 3, reps_alvo: "6-10" },
          { nome: "Remada Curvada", series: 3, reps_alvo: "8-10" },
          { nome: "Desenvolvimento", series: 2, reps_alvo: "8-10" },
          { nome: "Abdômen", series: 3, reps_alvo: "15" },
        ],
      },
      {
        letra: "F2",
        nome: "Full Body 2",
        exercicios: [
          { nome: "Leg Press", series: 3, reps_alvo: "10-12" },
          { nome: "Supino Inclinado (Halter)", series: 3, reps_alvo: "10-12" },
          { nome: "Puxada Frontal", series: 3, reps_alvo: "8-10" },
          { nome: "Elevação Lateral", series: 3, reps_alvo: "12-15" },
          { nome: "Rosca Direta", series: 2, reps_alvo: "10-12" },
        ],
      },
      {
        letra: "F3",
        nome: "Full Body 3",
        exercicios: [
          { nome: "Stiff", series: 3, reps_alvo: "8-10" },
          { nome: "Crossover", series: 3, reps_alvo: "12-15" },
          { nome: "Remada Baixa", series: 3, reps_alvo: "10-12" },
          { nome: "Tríceps Corda", series: 2, reps_alvo: "12-15" },
          { nome: "Panturrilha em Pé", series: 3, reps_alvo: "15" },
        ],
      },
    ],
  },
  {
    id: "boxe-solo",
    nome: "Boxe (avulso)",
    descricao: "Só o treino de boxe, para adicionar à sua rotação",
    treinos: [
      {
        letra: "BX",
        nome: "Boxe",
        exercicios: [
          { nome: "Pular corda", series: 3, reps_alvo: "3 min" },
          { nome: "Sombra (shadow boxing)", series: 3, reps_alvo: "3 min" },
          { nome: "Saco pesado", series: 4, reps_alvo: "3 min" },
          { nome: "Manoplas / técnica", series: 3, reps_alvo: "3 min" },
          { nome: "Abdômen", series: 3, reps_alvo: "20" },
        ],
      },
    ],
  },
];
