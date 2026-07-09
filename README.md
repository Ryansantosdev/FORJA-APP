# FORJA — Dieta, Treino e Disciplina

PWA pessoal: dieta, treino ABC + Boxe, peso, foco e motivação. Next.js + Supabase.

---

## ANTES DE TUDO — Migrações no Supabase

Se você já rodou o `schema.sql` antes, rode também no **SQL Editor** (pode rodar mais de uma vez):

| Arquivo | O que adiciona |
| --- | --- |
| `supabase/migration-v2.sql` | Treinos editáveis, agenda semanal, lembretes de água |
| `supabase/migration-v3.sql` | Meta de proteína (g/dia) |
| `supabase/migration-v4.sql` | Lembretes de **frases** (intervalo, horário 8h–21h) |

---

## Ícone e logo FORJA

O ícone oficial fica em `assets/forja-icon-source.png`. Para regenerar os PNGs do PWA:

```bash
node scripts/generate-icons.mjs
```

Isso atualiza `public/icons/` (192, 512, apple-touch) e `app/icon.png`.

---

## PARTE 1 — Configurar o Supabase (se ainda não fez)

1. [supabase.com](https://supabase.com) → criar projeto
2. **Settings → API Keys** → copiar URL e anon key
3. Criar `.env.local` na raiz (copie de `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

4. **SQL Editor** → rodar `supabase/schema.sql` e as migrações v2, v3 e **v4**
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

### 3.4 — Notificações push (água + frases)

**Tipos de lembrete:**

| Tipo | Como funciona |
| --- | --- |
| **Água** | Você escolhe os horários (8h–21h) em Configurações. Só dispara se a meta do dia ainda não foi batida. |
| **Frases** | Intervalo configurável (30 min a 3 h), só entre **8h e 21h** — sem notificação de madrugada. |

**Passo a passo:**

1. Rode `supabase/migration-v4.sql` no Supabase (se ainda não rodou)
2. No terminal local, gere chaves VAPID:

```bash
npx web-push generate-vapid-keys
```

3. No painel da **Vercel** → seu projeto → **Settings → Environment Variables**, adicione:

| Nome | Valor |
| --- | --- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public Key gerada |
| `VAPID_PRIVATE_KEY` | Private Key gerada |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secreta!) |
| `CRON_SECRET` | invente uma senha longa (ex: 30 caracteres aleatórios) |

4. **Redeploy**: Vercel → Deployments → ⋯ → Redeploy
5. No iPhone: instale o PWA na tela de início (Safari → Compartilhar → Adicionar)
6. Abra pelo ícone FORJA → **Configurações → Ativar notificações** → **Salvar** (horários de água + intervalo de frases)

**Testar manualmente o cron** (substitua `SEU_CRON_SECRET`):

```
https://forja-app-weld.vercel.app/api/push/send?secret=SEU_CRON_SECRET
```

Resposta esperada: `{"ok":true,"hora":14,"enviados":1}` (números variam).

> O cron da Vercel roda **a cada hora** (`0 * * * *`). Frases só saem quando a hora atual cai no intervalo (ex.: a cada 1 h = 8h, 9h, 10h… até 21h).

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
| **Hoje** | Anel de progresso, streak, próxima ação, frase ao abrir |
| **Dieta** | Cardápio editável (modal), tap/swipe para marcar, kcal + proteína, água |
| **Treino** | ABC + Boxe, agenda semanal, templates, séries guiadas, timer 90s |
| **Mente** | Insights contextuais, Deep Work 50min |
| **Progresso** | Peso, diário, heatmap, volume semanal, CSV |
| **Configurações** | Metas, horários de água, intervalo de frases, push, sair |

**Login:** criar conta, entrar e **esqueci minha senha** (link por e-mail).

**Onboarding:** peso atual, meta de peso e meta de água (layout bento).

---

## Roadmap — próximas partes

| Parte | Foco | Status |
| --- | --- | --- |
| **3 — Layout** | Design bento, animações, nav | ✅ |
| **4 — Dieta** | Águas, meta em litros, proteína, swipe | ✅ |
| **5 — Auth** | Esqueci senha | ✅ |
| **6 — Multiusuário** | Contas separadas / equipe | ⏸️ depois |
| **7 — Progresso** | Jornada gamificada (“corrida ao ouro”) | ✅ parcial |
| **8 — Frases** | Insights por horário/comportamento | ✅ no app + push |
| **9 — Push** | Água (horários) + frases (intervalo 8–21h) | ✅ implementado — testar no iPhone |

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
node scripts/generate-icons.mjs   # regenerar ícones a partir de assets/forja-icon-source.png
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

**Migrações Supabase** (rode no SQL Editor quando indicado):
- `supabase/migration-v2.sql` — treinos editáveis
- `supabase/migration-v3.sql` — meta de proteína (g/dia)
- `supabase/migration-v4.sql` — lembretes de frases (push)

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
