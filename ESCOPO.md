# ESCOPO DO PROJETO — Forja (PWA de Dieta, Treino e Disciplina)

> App pessoal do Ryan para forjar disciplina através de rastreamento de dieta, treino, peso, foco e motivação de choque de realidade. Mobile-first (iPhone), instalável como PWA.

---

## 1. Objetivo

Um único app que responda todos os dias: **"Você fez o que devia hoje?"**
Sem positividade tóxica. Gamificação por streak, heatmap de consistência e recordes pessoais.

## 2. Stack Tecnológica

| Camada | Tecnologia |
| --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript |
| Estilização | Tailwind CSS v4 — dark mode (cinza chumbo, textos claros, verde neon/dourado nos reforços positivos) |
| Componentes | shadcn/ui + lucide-react (ícones — **sem emojis na UI**) |
| Gráficos | Recharts |
| Banco / Auth / Storage | Supabase (plano free) com Row Level Security |
| PWA | @ducanh2912/next-pwa (manifest, service worker, ícones iOS) |
| Push | Web Push (VAPID) + Vercel Cron — iOS 16.4+ com PWA instalado |
| Hospedagem | Vercel (free, HTTPS obrigatório para PWA/push) |

**Sem OpenAI / APIs pagas.** Os insights motivacionais vêm de uma biblioteca local (~300 frases) empacotada no app: custo zero, offline, zero consumo de banco.

## 3. Navegação (Bottom Navigation fixo — 5 abas)

1. **Home** (Dashboard)
2. **Dieta**
3. **Treino**
4. **Mente** (Motivação + Deep Work)
5. **Progresso**

Tela de **Configurações** acessada por ícone no header.

## 4. Funcionalidades por Aba

### 4.1 Dashboard (Home)

- **Streak (Ofensiva)** em destaque: dias seguidos com 100% das metas (todas as refeições + treino). Se o dia anterior não fechou 100%, o streak **zera à meia-noite** ("Modo Goggins").
- **Conquistas**: badges nos marcos de 7, 30, 66 e 100 dias de streak.
- **Resumo do dia**: "Faltam 2 refeições", "Treino B pendente", progresso de água, kcal consumidas vs. planejadas.
- **Frase do dia**: insight determinístico baseado na data (biblioteca local).
- **Horas de foco da semana** ("horas construindo a máquina").
- **Input rápido de peso**.
- **Diário de 1 linha** (opcional): "como foi o dia".

### 4.2 Dieta

- **Cardápio 100% editável no app**: adicionar/remover/editar refeições e itens (nome, quantidade, kcal, substituições).
- **Check por refeição**: ao marcar, fica verde e salva no Supabase. Soma kcal marcadas vs. total do dia.
- **Substituições**: cada item pode listar trocas equivalentes (ex.: 120g frango = 100g patinho), exibidas ao tocar no item.
- **Água**: botões +/− (copo configurável, padrão 250ml), barra de progresso até a meta (padrão 3L), lembretes push configuráveis.

**Cardápio inicial (seed):**

| Refeição | Itens | Total |
| --- | --- | --- |
| 1 — Café da Manhã | Ovos 150g (~215) · Requeijão light 30g (~55) · Pão 50g (~140) · Fruta 100g (~60) · Bebida 0 kcal | ~470 kcal |
| 2 — Almoço | Proteína 120g frango/carne (~220) · Batata inglesa 150g (~130) · Salada/Vegetais 150g (~30) | ~380 kcal |
| 3 — Lanche / Suplementação | Fruta 100g (~60) · Whey 30g (~120) · Creatina 5g (0) | ~180 kcal |
| 4 — Jantar | Proteína 120g (~220) · Batata inglesa 150g (~130) · Salada/Vegetais 150g (~30) | ~380 kcal |
| **Total diário** | | **~1.410 kcal** |

### 4.3 Treino (Mandala ABC)

- Seleção do treino do dia:
  - **A (Peito/Tríceps)**: Supino Reto, Supino Inclinado (Halter), Crossover, Tríceps Pulley, Tríceps Corda
  - **B (Costas/Bíceps)**: Puxada Frontal, Remada Curvada, Remada Baixa, Rosca Direta, Rosca Martelo
  - **C (Perna/Ombro)**: Agachamento, Leg Press, Extensora, Flexora, Desenvolvimento, Elevação Lateral
- **Registro de carga e reps** por exercício; mostra a última carga como referência ("supere ou repita").
- **PRs (recordes pessoais)**: destaque visual quando a carga registrada supera o máximo histórico.
- **Timer automático de 90s**: ao marcar um exercício, banner não-intrusivo acima da navegação inicia o descanso (vibração/aviso ao terminar).

### 4.4 Mente (Motivação + Foco)

- **Botão "Forjar Mente"**: sorteia um insight curto e direto da biblioteca local, com autor e categoria, evitando repetir os últimos vistos.
- **Categorias (~300 frases)**: Cristã · Estoica (Sêneca, Marco Aurélio, Epicteto) · David Goggins · Nietzsche · Clóvis de Barros Filho · **Foco & Alavancagem** (choques de realidade personalizados — ver Anexo A). Filtro por categoria.
- **Modo Deep Work**: timer de blocos de 50 min; sessões concluídas somam nas "horas construindo a máquina".

### 4.5 Progresso

- **Gráfico de evolução de peso** (Recharts, linha) — marco inicial 105 kg, input semanal.
- **Heatmap de consistência (90 dias)** estilo GitHub: dia 100% verde forte, parcial verde fraco, vazio cinza.
- **Relatório de adesão (7 dias)**: % de refeições (x/28) e % de treinos (x/7), layout limpo para leitura e compartilhamento com nutricionista.
- **Medidas corporais**: cintura, braço e peito (registro mensal).
- **Exportar CSV**: botão que baixa todos os dados (peso, adesão, cargas, medidas) para enviar ao nutricionista/coach.

### 4.6 Configurações

- Meta de água (ml) e tamanho do copo.
- Meta de peso.
- Horários dos lembretes: água (início/fim/intervalo — padrão 8h–22h a cada 2h) e metas do dia (padrão 21h).

## 5. Notificações Push

- **Lembrete de metas (21h)**: se o dia não estiver 100% — "O dia ainda não acabou. Feche as metas."
- **Lembretes de água**: no intervalo configurado, com ação rápida de marcar como bebido.
- Requisitos: iOS 16.4+, PWA instalado na tela de início, app hospedado com HTTPS (Vercel). Disparo via Vercel Cron + chaves VAPID.

## 6. Modelagem do Banco (Supabase — otimizada para o plano free)

Todas as tabelas com `user_id` + RLS (`auth.uid() = user_id`) e índice `(user_id, date)` nos logs.

| Tabela | Campos principais | Observação |
| --- | --- | --- |
| `meals` | ordem, nome, icone, itens (jsonb: nome/quantidade/kcal/substituições) | Cardápio editável; jsonb evita tabela extra de itens |
| `meal_logs` | date, meal_id (unique por user/date/meal) | Existência da linha = refeição concluída |
| `daily_logs` | date (unique), agua_ml, nota | Água + diário na mesma tabela |
| `workout_logs` | date (unique), tipo_treino (A/B/C), concluido | |
| `exercise_logs` | date, exercicio, carga, reps | PRs calculados via max(carga) — sem tabela extra |
| `weight_logs` | date, peso | |
| `measurements` | date, cintura, braco, peito | |
| `focus_logs` | date, minutos | Sessões de Deep Work |
| `user_stats` | current_streak, max_streak, last_completed_date | Conquistas derivadas de max_streak |
| `user_settings` | metas e horários de lembretes | |
| `push_subscriptions` | endpoint, keys (jsonb) | |

**Por que cabe no free tier**: uso single-user gera ~10 linhas/dia (KBs por mês vs. 500 MB de limite). Frases motivacionais ficam fora do banco. Sem fotos = zero uso de Storage. Único cuidado: o Supabase free pausa projetos após ~1 semana sem atividade — com uso diário do app, não acontece.

## 7. Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=          # somente servidor — nunca exposta no bundle
```

## 8. Segurança (conforme security.md)

- Nenhuma chave privada no client; RLS em todas as tabelas; filtros sempre no banco.
- Proibido `dangerouslySetInnerHTML`; validação também no backend (constraints do Postgres).

## 9. Fase 2 (fora do escopo atual)

- Fotos de progresso (exigiria Supabase Storage)
- Relatório compartilhável como imagem
- Linha de meta + média móvel no gráfico de peso

---

## Anexo A — Choques de Realidade (categoria Foco & Alavancagem)

1. Todo projeto paralelo que você começa é um empréstimo tomado contra o projeto principal — com juros compostos de tempo que você nunca recupera.
2. Você não está "explorando oportunidades". Você está fugindo da única tarefa que te assusta porque é a única que importa.
3. O funcionário aperta o botão e recebe pelo aperto. O estrategista constrói a máquina de botões e recebe enquanto dorme — hoje você foi qual dos dois?
4. R$ 8.000/mês é o preço que pagam pelo seu tempo. Enquanto você vender horas, o teto é a sua agenda.
5. A teoria perfeita de amanhã vale zero. O rascunho publicado hoje já está gerando dados, audiência e dinheiro.
6. Perfeccionismo não é padrão alto. É medo de ser julgado, vestido com gravata de "qualidade".
7. Você tem CS + Tech + audiência e ainda pede permissão para cobrar. O mercado não espera você se sentir pronto.
8. Cada dia sem monetizar sua habilidade rara é um dia em que alguém pior que você fatura no seu lugar.
9. Morpheus não pediu desculpas por oferecer a pílula. Autoridade se constrói afirmando, não se justificando.
10. Dispersão é confortável porque quem começa tudo e não termina nada nunca é julgado por um resultado — porque ele não existe.
11. Você quer escala, mas gasta as noites em tarefas que morrem sem você. Sistema é o que funciona quando você sai da sala.
12. Melhorar em público por 90 dias constrói mais autoridade do que 2 anos planejando o conteúdo perfeito no rascunho.
13. Se a sua estratégia depende de motivação, você não tem estratégia. Tem humor.
14. O algoritmo não recompensa quem sabe mais. Recompensa quem aparece todo dia — você sabe demais e aparece de menos.
15. Fechar a aba inútil custa 1 segundo. Mantê-la aberta custa a versão de você que já teria escalado.
16. Ninguém vai te promover a dono. Dono você se torna construindo o ativo que ninguém mandou você construir.
17. O impostor de verdade é quem finge que "um dia" vai começar. Quem executa mal hoje é mais real do que quem planeja bem há meses.
18. IA e automação são alavancas. Alavanca sem ponto de apoio — foco — só move o ar.
19. Todo "sim" para uma distração é um "não" assinado contra a sua liberdade financeira. Você tem assinado muitos.
20. Aos 23 você tem o ativo que os ricos tentam comprar de volta: tempo. Queimá-lo em dispersão é vender barato a alavanca mais cara do mundo.
