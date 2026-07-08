import type { WorkoutTemplate } from "./workout-templates";
import { TEMPLATE_PACKS } from "./workout-templates";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Insere treinos de um modelo no Supabase (tabela workouts precisa existir) */
export async function insertWorkoutPack(
  supabase: SupabaseClient,
  userId: string,
  packId: string,
  startOrdem = 0
): Promise<{ ok: boolean; error?: string; count: number }> {
  const pack = TEMPLATE_PACKS.find((p) => p.id === packId);
  if (!pack) return { ok: false, error: "Modelo não encontrado.", count: 0 };

  for (let i = 0; i < pack.treinos.length; i++) {
    const t: WorkoutTemplate = pack.treinos[i];
    const { error } = await supabase.from("workouts").insert({
      user_id: userId,
      ordem: startOrdem + i + 1,
      letra: t.letra,
      nome: t.nome,
      exercicios: t.exercicios,
    });
    if (error) return { ok: false, error: error.message, count: i };
  }
  return { ok: true, count: pack.treinos.length };
}

export const DEFAULT_PACK_ID = "abc-boxe";
