-- migration-v5: proteína nos itens do cardápio padrão
-- Rode no SQL Editor do Supabase após migration-v4 (se houver).

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

-- Cardápios existentes sem proteina_g em nenhum item
update public.meals m
set itens = case m.ordem
  when 1 then '[
    {"nome": "Ovos", "quantidade": "150g", "kcal": 215, "proteina_g": 19, "substituicoes": []},
    {"nome": "Requeijão light", "quantidade": "30g", "kcal": 55, "proteina_g": 2, "substituicoes": []},
    {"nome": "Pão", "quantidade": "50g", "kcal": 140, "proteina_g": 4, "substituicoes": ["1 pão francês", "2 fatias de pão de forma"]},
    {"nome": "Fruta", "quantidade": "100g", "kcal": 60, "proteina_g": 1, "substituicoes": ["Maçã", "Mamão", "Morango"]},
    {"nome": "Café puro / bebida zero", "quantidade": "-", "kcal": 0, "proteina_g": 0, "substituicoes": []}
  ]'::jsonb
  when 2 then '[
    {"nome": "Proteína (frango ou carne)", "quantidade": "120g pronta", "kcal": 220, "proteina_g": 28, "substituicoes": ["120g frango", "100g patinho"]},
    {"nome": "Batata inglesa", "quantidade": "150g pronta", "kcal": 130, "proteina_g": 3, "substituicoes": []},
    {"nome": "Salada / vegetais", "quantidade": "150g", "kcal": 30, "proteina_g": 2, "substituicoes": []}
  ]'::jsonb
  when 3 then '[
    {"nome": "Fruta", "quantidade": "100g", "kcal": 60, "proteina_g": 1, "substituicoes": ["Maçã", "Mamão", "Morango"]},
    {"nome": "Whey Protein", "quantidade": "30g", "kcal": 120, "proteina_g": 24, "substituicoes": []},
    {"nome": "Creatina", "quantidade": "5g", "kcal": 0, "proteina_g": 0, "substituicoes": []}
  ]'::jsonb
  when 4 then '[
    {"nome": "Proteína (frango ou carne)", "quantidade": "120g pronta", "kcal": 220, "proteina_g": 28, "substituicoes": ["120g frango", "100g patinho"]},
    {"nome": "Batata inglesa", "quantidade": "150g pronta", "kcal": 130, "proteina_g": 3, "substituicoes": []},
    {"nome": "Salada / vegetais", "quantidade": "150g", "kcal": 30, "proteina_g": 2, "substituicoes": []}
  ]'::jsonb
  else m.itens
end
where not exists (
  select 1
  from jsonb_array_elements(m.itens) elem
  where elem ? 'proteina_g'
);
