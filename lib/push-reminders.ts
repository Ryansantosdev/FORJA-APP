/** Textos de lembrete push — tom moderno, não planilha de meta. */

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick<T>(items: T[], seed: string, salt = ""): T {
  const h = hashSeed(seed + salt);
  return items[h % items.length];
}

type Periodo = "manha" | "tarde" | "noite";

function periodoDoDia(hora: number): Periodo {
  if (hora >= 5 && hora < 12) return "manha";
  if (hora >= 12 && hora < 18) return "tarde";
  return "noite";
}

const TITULOS_AGUA = [
  "FORJA · Água",
  "FORJA · Hidratação",
  "FORJA · Pausa",
];

const MANHA = [
  "Bom dia — comece com um copo de água.",
  "Antes da correria: hidrate. É rápido.",
  "Seu corpo acordou seco. Beba água agora.",
  "Primeiro copo do dia? Toque para marcar.",
  "Energia começa com água. Vai lá.",
];

const TARDE = [
  "Pausa de 30 segundos. Beba água.",
  "Meio do dia: recarregue com um copo.",
  "Levante, respire, hidrate.",
  "Hora de beber água — sem desculpas.",
  "Seu foco melhora quando você hidrata.",
];

const NOITE = [
  "Desacelere com um copo de água.",
  "Feche o dia bem hidratado.",
  "Último copo? Ainda dá tempo.",
  "Noite chegando — cuide do corpo.",
  "Antes de relaxar: água.",
];

const QUASE_META = [
  "Quase lá. Mais um copo e você fecha o dia.",
  "Último empurrão — mantenha o ritmo.",
  "Falta pouco. Beba agora e celebre.",
  "Reta final: um copo e pronto.",
];

const COM_COPO = [
  "Copo {n} do dia — toque para marcar.",
  "{n}º copo. Mantenha o hábito.",
  "Hora do {n}º copo. Vai na Dieta.",
];

export type AguaPushContext = {
  hora: number;
  bebidoMl: number;
  metaMl: number;
  copoMl: number;
  seed: string;
};

export function lembreteAguaPush(ctx: AguaPushContext): { title: string; body: string } {
  const copo = ctx.copoMl > 0 ? ctx.copoMl : 250;
  const pct = ctx.metaMl > 0 ? ctx.bebidoMl / ctx.metaMl : 0;
  const coposFeitos = Math.floor(ctx.bebidoMl / copo);
  const proximoCopo = coposFeitos + 1;
  const periodo = periodoDoDia(ctx.hora);

  let body: string;

  if (pct >= 0.85) {
    body = pick(QUASE_META, ctx.seed, "near");
  } else if (pct >= 0.35 && hashSeed(ctx.seed + "copo") % 3 === 0) {
    const tpl = pick(COM_COPO, ctx.seed, "copo");
    body = tpl.replace(/\{n\}/g, String(proximoCopo));
  } else if (periodo === "manha") {
    body = pick(MANHA, ctx.seed, "am");
  } else if (periodo === "tarde") {
    body = pick(TARDE, ctx.seed, "pm");
  } else {
    body = pick(NOITE, ctx.seed, "eve");
  }

  return {
    title: pick(TITULOS_AGUA, ctx.seed, "title"),
    body,
  };
}

const INTROS_FRASE = [
  "",
  "Para hoje:",
  "Pausa mental:",
  "Reflita:",
  "Um minuto FORJA:",
];

/** Frase motivacional — corpo com texto + autora em linha separada. */
export function fraseLembretePush(
  seed: string,
  insight: { t: string; a: string }
): { title: string; body: string } {
  const intro = pick(INTROS_FRASE, seed, "intro");
  const body = intro
    ? `${intro}\n${insight.t}\n— ${insight.a}`
    : `${insight.t}\n— ${insight.a}`;

  return {
    title: "FORJA · Mente",
    body,
  };
}

/** Preview para testes (valores de exemplo). */
export function previewAguaPush(seed = "preview"): { title: string; body: string } {
  return lembreteAguaPush({
    hora: 14,
    bebidoMl: 1200,
    metaMl: 3000,
    copoMl: 250,
    seed,
  });
}

export function previewFrasePush(seed = "preview"): { title: string; body: string } {
  return fraseLembretePush(seed, {
    t: "Disciplina vence motivação.",
    a: "Provérbios 12:24",
  });
}
