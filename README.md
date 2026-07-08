# FORJA — Dieta, Treino e Disciplina

PWA pessoal: dieta, treino ABC + Boxe, peso, foco e motivação. Next.js + Supabase.

---

## ANTES DE TUDO — Rodar a migração v2 no Supabase

Se você já rodou o `schema.sql` antes, rode também o arquivo **`supabase/migration-v2.sql`** no SQL Editor do Supabase. Ele adiciona:

- Tabela `workouts` (treinos editáveis, incluindo **Boxe**)
- Agenda semanal (qual treino em cada dia)
- Lembretes de água em 5 horários fixos
- Campo `onboarding_done`

---

## PARTE 1 — Configurar o Supabase (se ainda não fez)

1. [supabase.com](https://supabase.com) → criar projeto
2. **Settings → API Keys** → copiar URL e anon key
3. Criar `.env.local` na raiz (copie de `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

4. **SQL Editor** → rodar `supabase/schema.sql` e depois `supabase/migration-v2.sql`
5. **Authentication → Providers → Email** → desligar "Confirm email"
6. Criar sua conta no app (ou no painel Authentication → Users)

---

## PARTE 2 — Testar localmente (preview)

No terminal do Cursor, na pasta do projeto:

```bash
npm install
npm run dev
```

Abra **http://localhost:3000**

- Primeira vez: onboarding (peso, meta, água)
- **Treino**: ícone de calendário = agenda da semana (Seg A, Ter B, Qua C, Qui Boxe...)
- **Dieta**: deslize o card para a direita para marcar · botão "Ontem" até 9h
- Simular iPhone: F12 → ícone de celular

Para parar: `Ctrl+C` no terminal.

> O modo `npm run dev` é mais lento que a versão publicada. Na Vercel o app abre bem mais rápido.

---

## PARTE 3 — Deploy na Vercel (passo a passo)

### 3.1 — Subir o código para o GitHub

1. Crie uma conta em [github.com](https://github.com) se não tiver
2. No Cursor, abra o terminal e rode:

```bash
git init
git add .
git commit -m "Forja PWA v1"
```

3. No GitHub, crie um repositório novo (ex: `forja-app`) — **sem** README
4. Conecte e envie:

```bash
git remote add origin https://github.com/SEU-USUARIO/forja-app.git
git branch -M main
git push -u origin main
```

### 3.2 — Publicar na Vercel

1. Acesse [vercel.com](https://vercel.com) e entre com sua conta do **GitHub**
2. Clique em **Add New → Project**
3. Importe o repositório `forja-app`
4. Em **Environment Variables**, adicione (copie do seu `.env.local`):

| Nome | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | sua URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sua anon key |

5. Clique **Deploy** e aguarde ~2 minutos
6. A Vercel te dá uma URL tipo `forja-app.vercel.app` — **esse é seu app online**

### 3.3 — Instalar no iPhone

1. Abra a URL da Vercel no **Safari** (não no Chrome)
2. Toque em **Compartilhar** (ícone de quadrado com seta)
3. **Adicionar à Tela de Início**
4. O app abre em tela cheia, como nativo

### 3.4 — Notificações push (opcional, após deploy)

1. No terminal local, gere chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

2. No painel da **Vercel** → seu projeto → **Settings → Environment Variables**, adicione:

| Nome | Valor |
| --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public Key gerada |
| `VAPID_PRIVATE_KEY` | Private Key gerada |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secreta!) |
| `CRON_SECRET` | invente uma senha longa (ex: 30 caracteres aleatórios) |

3. **Redeploy**: Vercel → Deployments → ⋯ → Redeploy
4. No app instalado no iPhone: **Configurações → Ativar notificações**
5. Os lembretes de água (5× ao dia) e metas (21h) passam a funcionar via cron horário da Vercel

---

## PARTE 4 — MCP do Supabase no Cursor (opcional)

Permite que a IA do Cursor veja e gerencie seu banco.

1. Supabase → avatar → **Account preferences → Access Tokens** → Generate → copie o token
2. Pegue o **project ref** na URL do painel (`supabase.com/dashboard/project/SEU-REF`)
3. Cursor → **Settings → MCP → Add new global MCP server**
4. Cole no `mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=SEU-PROJECT-REF"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "SEU-TOKEN"
      }
    }
  }
}
```

5. Salve. Bolinha verde = conectado.

---

## Funcionalidades

| Aba | O que faz |
| --- | --- |
| **Hoje** | Anel de progresso, streak, próxima ação, peso, diário |
| **Dieta** | Cardápio editável, swipe para marcar, kcal + proteína, água |
| **Treino** | ABC + Boxe, agenda semanal, templates, séries guiadas, timer 90s |
| **Mente** | Insights contextuais, Deep Work 50min |
| **Progresso** | Peso + média 7d, heatmap, volume semanal, CSV *(layout atual — ver roadmap abaixo)* |

---

## Roadmap — próximas partes

| Parte | Foco |
| --- | --- |
| **3 — Layout** | Design moderno em todo o app (cards, tipografia, animações leves) |
| **4 — Dieta** | Água em “águas”, meta em litros, proteína, swipe refinado |
| **5 — Auth** | Esqueci senha |
| **6 — Onboarding** | Configuração inicial multiusuário |
| **7 — Progresso** | Tela gamificada e intuitiva (ver abaixo) |
| **8 — Frases** | Insights contextuais por horário/comportamento |
| **9 — Push + offline** | Notificações e uso sem rede |

### Parte 7 — Progresso (“corrida ao ouro”)

A tela **Progresso** precisa deixar de ser só gráficos técnicos e virar uma **jornada visual** — como uma corrida ao ouro ou corrida de campeão:

- **Metas claras** — peso alvo, volume semanal, adesão dieta/treino, PRs por exercício
- **Resultados em destaque** — o que já foi conquistado vs. o que falta (barra de progresso, marcos)
- **Layout intuitivo** — hierarquia óbvia: “onde estou” → “para onde vou” → “histórico”
- **Sensação de competição consigo mesmo** — streaks, recordes, badges leves, celebração ao bater meta
- **Contexto** — cada número explicado em uma linha (ex.: volume = toneladas levantadas na semana)

Implementação prevista na **parte 7** (conteúdo + gamificação) com polimento visual na **parte 3** (layout).


```bash
npm run dev      # preview local
npm run build    # verificar se compila (rode antes do deploy)
node scripts/generate-icons.mjs   # regenerar ícones azuis
```

---

## PARTE 5 — Versionamento (Git + GitHub)

Fluxo recomendado: **alterar no PC → testar local → commit → push → Vercel redeploya sozinha**.

### Ciclo do dia a dia

```bash
# 1. Testar localmente
npm run dev
# Abra http://localhost:3000 e valide as mudanças

# 2. Ver o que mudou
git status
git diff

# 3. Salvar no Git (commit)
git add .
git commit -m "melhora notificacoes e corrige bug X"

# 4. Enviar para o GitHub
git push
```

A Vercel detecta o push na branch `main` e faz **deploy automático** em ~1–2 min.

### Pelo Cursor (interface visual)

1. Barra lateral → ícone de **ramificação** (Source Control)
2. Arquivos alterados aparecem na lista
3. Escreva a mensagem do commit
4. Clique **Commit**
5. Clique **Sync Changes** ou **Push**

### Regras importantes

| Regra | Motivo |
| --- | --- |
| Nunca commitar `.env.local` | Tem suas chaves secretas |
| Rodar `npm run build` antes do push | Evita deploy quebrado na Vercel |
| Mensagens de commit curtas e claras | Ex: `fix login`, `ajusta agenda treino` |
| Trabalhar na `main` (só você usa) | Simples para app pessoal |

### Se o push pedir login

O remote está em HTTPS. Use seu usuário GitHub e um **Personal Access Token** como senha:
[github.com/settings/tokens](https://github.com/settings/tokens) → Generate → marque `repo`.

### Variáveis locais para testar push

Para testar notificações no `npm run dev`, adicione no `.env.local` (não vai pro GitHub):

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua-public-key
```

As chaves privadas (`VAPID_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) só precisam na **Vercel** — o disparo dos lembretes roda no servidor.
