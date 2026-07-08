-- ============================================================
-- FORJA — Migração v2 (treinos editáveis, agenda semanal, boxe,
-- lembretes de água em horários fixos)
-- Cole TUDO no SQL Editor do Supabase e clique RUN.
-- Pode rodar mais de uma vez sem quebrar.
-- ============================================================

-- ---------- TABELA DE TREINOS (editável no app) ----------

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ordem int not null default 0,
  letra text not null,            -- rótulo curto: A, B, C, BX...
  nome text not null,             -- ex: Peito / Tríceps
  exercicios jsonb not null default '[]'::jsonb, -- [{nome, series, reps_alvo}]
  created_at timestamptz not null default now()
);

alter table public.workouts enable row level security;
drop policy if exists "own rows select" on public.workouts;
drop policy if exists "own rows insert" on public.workouts;
drop policy if exists "own rows update" on public.workouts;
drop policy if exists "own rows delete" on public.workouts;
create policy "own rows select" on public.workouts for select using (auth.uid() = user_id);
create policy "own rows insert" on public.workouts for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.workouts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows delete" on public.workouts for delete using (auth.uid() = user_id);

create index if not exists idx_workouts_user on public.workouts (user_id, ordem);

-- ---------- workout_logs: aceitar qualquer treino (não só A/B/C) ----------

alter table public.workout_logs drop constraint if exists workout_logs_tipo_treino_check;

-- ---------- user_settings: agenda semanal + horários de água ----------

alter table public.user_settings
  add column if not exists agenda_treino jsonb not null default '{}'::jsonb,
  add column if not exists agua_lembrete_horas jsonb not null default '[8, 11, 14, 17, 20]'::jsonb,
  add column if not exists onboarding_done boolean not null default false;

alter table public.workout_logs
  add column if not exists workout_id uuid references public.workouts (id) on delete set null;

-- ---------- SEED DE TREINOS (A, B, C + Boxe) ----------

create or replace function public.seed_workouts(uid uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (select 1 from public.workouts where user_id = uid) then
    return;
  end if;

  insert into public.workouts (user_id, ordem, letra, nome, exercicios) values
  (uid, 1, 'A', 'Peito / Tríceps', '[
    {"nome": "Supino Reto", "series": 4, "reps_alvo": "8-10"},
    {"nome": "Supino Inclinado (Halter)", "series": 3, "reps_alvo": "10-12"},
    {"nome": "Crossover", "series": 3, "reps_alvo": "12-15"},
    {"nome": "Tríceps Pulley", "series": 3, "reps_alvo": "10-12"},
    {"nome": "Tríceps Corda", "series": 3, "reps_alvo": "12-15"}
  ]'::jsonb),
  (uid, 2, 'B', 'Costas / Bíceps', '[
    {"nome": "Puxada Frontal", "series": 4, "reps_alvo": "8-10"},
    {"nome": "Remada Curvada", "series": 3, "reps_alvo": "8-10"},
    {"nome": "Remada Baixa", "series": 3, "reps_alvo": "10-12"},
    {"nome": "Rosca Direta", "series": 3, "reps_alvo": "10-12"},
    {"nome": "Rosca Martelo", "series": 3, "reps_alvo": "12-15"}
  ]'::jsonb),
  (uid, 3, 'C', 'Perna / Ombro', '[
    {"nome": "Agachamento", "series": 4, "reps_alvo": "8-10"},
    {"nome": "Leg Press", "series": 3, "reps_alvo": "10-12"},
    {"nome": "Extensora", "series": 3, "reps_alvo": "12-15"},
    {"nome": "Flexora", "series": 3, "reps_alvo": "12-15"},
    {"nome": "Desenvolvimento", "series": 3, "reps_alvo": "8-10"},
    {"nome": "Elevação Lateral", "series": 3, "reps_alvo": "12-15"}
  ]'::jsonb),
  (uid, 4, 'BX', 'Boxe', '[
    {"nome": "Pular corda", "series": 3, "reps_alvo": "3 min"},
    {"nome": "Sombra (shadow boxing)", "series": 3, "reps_alvo": "3 min"},
    {"nome": "Saco pesado", "series": 4, "reps_alvo": "3 min"},
    {"nome": "Manoplas / técnica", "series": 3, "reps_alvo": "3 min"},
    {"nome": "Abdômen", "series": 3, "reps_alvo": "20"}
  ]'::jsonb);

  -- agenda padrão: Seg A · Ter B · Qua C · Qui Boxe · Sex A · Sáb Boxe · Dom descanso
  update public.user_settings
  set agenda_treino = (
    select jsonb_build_object(
      '1', (select id from public.workouts where user_id = uid and letra = 'A' limit 1),
      '2', (select id from public.workouts where user_id = uid and letra = 'B' limit 1),
      '3', (select id from public.workouts where user_id = uid and letra = 'C' limit 1),
      '4', (select id from public.workouts where user_id = uid and letra = 'BX' limit 1),
      '5', (select id from public.workouts where user_id = uid and letra = 'A' limit 1),
      '6', (select id from public.workouts where user_id = uid and letra = 'BX' limit 1)
    )
  )
  where user_id = uid;
end;
$$;

-- inclui os treinos no seed de novos usuários
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.seed_user(new.id);
  perform public.seed_workouts(new.id);
  return new;
end;
$$;

-- aplica para usuários já existentes (você)
do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    perform public.seed_user(u.id);
    perform public.seed_workouts(u.id);
  end loop;
end
$$;

-- Garante Boxe para quem já tinha só A/B/C (re-rodar é seguro)
insert into public.workouts (user_id, ordem, letra, nome, exercicios)
select u.id, coalesce((select max(ordem) from public.workouts w where w.user_id = u.id), 0) + 1,
  'BX', 'Boxe', '[
    {"nome": "Pular corda", "series": 3, "reps_alvo": "3 min"},
    {"nome": "Sombra (shadow boxing)", "series": 3, "reps_alvo": "3 min"},
    {"nome": "Saco pesado", "series": 4, "reps_alvo": "3 min"},
    {"nome": "Manoplas / técnica", "series": 3, "reps_alvo": "3 min"},
    {"nome": "Abdômen", "series": 3, "reps_alvo": "20"}
  ]'::jsonb
from auth.users u
where not exists (
  select 1 from public.workouts w where w.user_id = u.id and w.letra = 'BX'
);
