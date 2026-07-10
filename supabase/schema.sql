-- ============================================================
-- FORJA — Schema do banco (Supabase)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique RUN.
-- Pode rodar mais de uma vez sem quebrar (idempotente).
-- ============================================================

-- ---------- TABELAS ----------

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ordem int not null default 0,
  nome text not null,
  icone text not null default 'utensils',
  itens jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  meal_id uuid not null references public.meals (id) on delete cascade,
  unique (user_id, date, meal_id)
);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  agua_ml int not null default 0 check (agua_ml >= 0 and agua_ml <= 20000),
  nota text,
  unique (user_id, date)
);

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  tipo_treino text not null check (tipo_treino in ('A', 'B', 'C')),
  concluido boolean not null default false,
  unique (user_id, date)
);

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  exercicio text not null,
  carga numeric(6, 2) not null check (carga >= 0 and carga <= 1000),
  reps int not null check (reps > 0 and reps <= 200),
  created_at timestamptz not null default now()
);

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  peso numeric(5, 2) not null check (peso > 0 and peso < 500),
  unique (user_id, date)
);

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  cintura numeric(5, 1),
  braco numeric(5, 1),
  peito numeric(5, 1),
  unique (user_id, date)
);

create table if not exists public.focus_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  minutos int not null check (minutos > 0 and minutos <= 600),
  created_at timestamptz not null default now()
);

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak int not null default 0,
  max_streak int not null default 0,
  last_completed_date date
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  meta_agua_ml int not null default 3000,
  copo_ml int not null default 250,
  meta_proteina_g int not null default 150,
  meta_peso numeric(5, 2),
  agua_lembrete_inicio int not null default 8,
  agua_lembrete_fim int not null default 22,
  agua_lembrete_intervalo_min int not null default 120,
  hora_lembrete_metas int not null default 21,
  lembretes_ativos boolean not null default true
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------- ÍNDICES ----------

create index if not exists idx_meal_logs_user_date on public.meal_logs (user_id, date);
create index if not exists idx_daily_logs_user_date on public.daily_logs (user_id, date);
create index if not exists idx_workout_logs_user_date on public.workout_logs (user_id, date);
create index if not exists idx_exercise_logs_user_date on public.exercise_logs (user_id, date);
create index if not exists idx_exercise_logs_user_ex on public.exercise_logs (user_id, exercicio);
create index if not exists idx_weight_logs_user_date on public.weight_logs (user_id, date);
create index if not exists idx_focus_logs_user_date on public.focus_logs (user_id, date);

-- ---------- ROW LEVEL SECURITY ----------
-- Regra de ouro: cada usuário só enxerga e altera as próprias linhas.

do $$
declare
  t text;
begin
  foreach t in array array[
    'meals', 'meal_logs', 'daily_logs', 'workout_logs', 'exercise_logs',
    'weight_logs', 'measurements', 'focus_logs', 'user_stats',
    'user_settings', 'push_subscriptions'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows select" on public.%I', t);
    execute format('drop policy if exists "own rows insert" on public.%I', t);
    execute format('drop policy if exists "own rows update" on public.%I', t);
    execute format('drop policy if exists "own rows delete" on public.%I', t);
    execute format(
      'create policy "own rows select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format(
      'create policy "own rows insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "own rows update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "own rows delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end
$$;

-- ---------- SEED AUTOMÁTICO PARA NOVOS USUÁRIOS ----------
-- Quando você cria seu usuário, o cardápio inicial, as stats e as
-- configurações padrão são criados automaticamente.

create or replace function public.seed_user(uid uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_stats (user_id) values (uid)
  on conflict (user_id) do nothing;

  insert into public.user_settings (user_id) values (uid)
  on conflict (user_id) do nothing;

  -- só cria o cardápio se o usuário ainda não tiver nenhum
  if exists (select 1 from public.meals where user_id = uid) then
    return;
  end if;

  insert into public.meals (user_id, ordem, nome, icone, itens) values
  (uid, 1, 'Café da Manhã', 'coffee', '[
    {"nome": "Ovos", "quantidade": "150g", "kcal": 215, "proteina_g": 19, "substituicoes": []},
    {"nome": "Requeijão light", "quantidade": "30g", "kcal": 55, "proteina_g": 2, "substituicoes": []},
    {"nome": "Pão", "quantidade": "50g", "kcal": 140, "proteina_g": 4, "substituicoes": ["1 pão francês", "2 fatias de pão de forma"]},
    {"nome": "Fruta", "quantidade": "100g", "kcal": 60, "proteina_g": 1, "substituicoes": ["Maçã", "Mamão", "Morango"]},
    {"nome": "Café puro / bebida zero", "quantidade": "-", "kcal": 0, "proteina_g": 0, "substituicoes": []}
  ]'::jsonb),
  (uid, 2, 'Almoço', 'utensils', '[
    {"nome": "Proteína (frango ou carne)", "quantidade": "120g pronta", "kcal": 220, "proteina_g": 28, "substituicoes": ["120g frango", "100g patinho"]},
    {"nome": "Batata inglesa", "quantidade": "150g pronta", "kcal": 130, "proteina_g": 3, "substituicoes": []},
    {"nome": "Salada / vegetais", "quantidade": "150g", "kcal": 30, "proteina_g": 2, "substituicoes": []}
  ]'::jsonb),
  (uid, 3, 'Lanche / Suplementação', 'apple', '[
    {"nome": "Fruta", "quantidade": "100g", "kcal": 60, "proteina_g": 1, "substituicoes": ["Maçã", "Mamão", "Morango"]},
    {"nome": "Whey Protein", "quantidade": "30g", "kcal": 120, "proteina_g": 24, "substituicoes": []},
    {"nome": "Creatina", "quantidade": "5g", "kcal": 0, "proteina_g": 0, "substituicoes": []}
  ]'::jsonb),
  (uid, 4, 'Jantar', 'moon', '[
    {"nome": "Proteína (frango ou carne)", "quantidade": "120g pronta", "kcal": 220, "proteina_g": 28, "substituicoes": ["120g frango", "100g patinho"]},
    {"nome": "Batata inglesa", "quantidade": "150g pronta", "kcal": 130, "proteina_g": 3, "substituicoes": []},
    {"nome": "Salada / vegetais", "quantidade": "150g", "kcal": 30, "proteina_g": 2, "substituicoes": []}
  ]'::jsonb);
end;
$$;

-- Trigger: roda o seed automaticamente quando um usuário novo é criado
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.seed_user(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Caso você já tenha criado sua conta ANTES de rodar este script,
-- a linha abaixo aplica o seed para todos os usuários existentes:
do $$
declare
  u record;
begin
  for u in select id from auth.users loop
    perform public.seed_user(u.id);
  end loop;
end
$$;
