-- FORJA — Migração v4 (lembretes de frases)
-- Cole no SQL Editor e clique RUN. Pode rodar mais de uma vez.

alter table public.user_settings
  add column if not exists frase_lembrete_ativo boolean not null default true;

alter table public.user_settings
  add column if not exists frase_lembrete_intervalo_min int not null default 60;

alter table public.user_settings
  add column if not exists frase_lembrete_inicio int not null default 8;

alter table public.user_settings
  add column if not exists frase_lembrete_fim int not null default 21;
