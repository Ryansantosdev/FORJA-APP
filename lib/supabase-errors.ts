/** Mensagens de erro do Supabase em português */

export function supabaseErrorMessage(e: unknown): string {
  if (!e || typeof e !== "object") return "Erro desconhecido.";
  const err = e as { message?: string; code?: string; details?: string };
  const msg = err.message ?? "";
  const code = err.code ?? "";

  if (
    code === "PGRST205" ||
    code === "42P01" ||
    /relation.*workouts.*does not exist/i.test(msg) ||
    /Could not find the table.*workouts/i.test(msg)
  ) {
    return "MIGRATION_WORKOUTS";
  }

  if (/workout_id/i.test(msg) && /column/i.test(msg)) {
    return "MIGRATION_WORKOUTS";
  }

  if (/tipo_treino_check/i.test(msg) || /violates check constraint/i.test(msg)) {
    return "MIGRATION_CONSTRAINT";
  }

  return msg || "Erro ao conectar com o Supabase.";
}

export const MIGRATION_HINT =
  "Abra o Supabase → SQL Editor → cole o arquivo supabase/migration-v2.sql → Run.";
