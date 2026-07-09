-- FORJA — Migração v3 (meta de proteína)
-- Cole no SQL Editor e clique RUN. Pode rodar mais de uma vez.

alter table public.user_settings
  add column if not exists meta_proteina_g int not null default 150;
