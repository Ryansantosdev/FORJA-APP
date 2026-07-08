import { dayOfWeek } from "./dates";
import type { Workout } from "./types";

/** Retorna o workout_id agendado para hoje (ou null = descanso) */
export function getScheduledWorkoutId(
  agenda: Record<string, string | null>,
  dow = dayOfWeek()
): string | null {
  const key = String(dow);
  return agenda[key] ?? null;
}

export function findWorkoutById(
  workouts: Workout[],
  id: string | null
): Workout | null {
  if (!id) return null;
  return workouts.find((w) => w.id === id) ?? null;
}
