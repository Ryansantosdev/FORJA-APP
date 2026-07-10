import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { deveEnviarFrase, insightForPush } from "@/lib/insights-push";

export const dynamic = "force-dynamic";

/**
 * Disparo de lembretes push (Vercel Cron, a cada hora).
 * Tipos: água (horários escolhidos), frases (intervalo 8h–21h).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth =
    req.headers.get("authorization")?.replace("Bearer ", "") ??
    req.nextUrl.searchParams.get("secret");
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_SECRET_KEY?.trim();
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "faltam variáveis de ambiente (service role / VAPID)" },
      { status: 500 }
    );
  }

  webpush.setVapidDetails("mailto:forja@forja.app", vapidPublic, vapidPrivate);

  const admin = createClient(supabaseUrl, serviceKey);

  const now = new Date();
  const hora = parseInt(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Sao_Paulo",
    }).format(now)
  );
  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(now);

  const { data: allSettings } = await admin
    .from("user_settings")
    .select("*")
    .eq("lembretes_ativos", true);

  let enviados = 0;
  let erros = 0;
  let usuariosComSub = 0;

  for (const s of allSettings ?? []) {
    const mensagens: { title: string; body: string; url: string }[] = [];

    const horasAgua = (s.agua_lembrete_horas as number[]) ?? [8, 11, 14, 17, 20];
    if (horasAgua.includes(hora)) {
      const { data: daily } = await admin
        .from("daily_logs")
        .select("agua_ml")
        .eq("user_id", s.user_id)
        .eq("date", hoje)
        .maybeSingle();
      const bebido = daily?.agua_ml ?? 0;
      if (bebido < s.meta_agua_ml) {
        const faltaL = ((s.meta_agua_ml - bebido) / 1000).toFixed(1);
        mensagens.push({
          title: "Hora de beber água",
          body: `Faltam ${faltaL}L para a meta. Abra a Dieta e marque.`,
          url: "/dieta",
        });
      }
    }

    const fraseAtivo = s.frase_lembrete_ativo !== false;
    const fraseInicio = s.frase_lembrete_inicio ?? 8;
    const fraseFim = s.frase_lembrete_fim ?? 21;
    const fraseIntervalo = s.frase_lembrete_intervalo_min ?? 60;

    if (
      fraseAtivo &&
      deveEnviarFrase(hora, fraseInicio, fraseFim, fraseIntervalo)
    ) {
      const slot = Math.floor(((hora - fraseInicio) * 60) / fraseIntervalo);
      const frase = insightForPush(`${s.user_id}-${hoje}-${slot}`);
      mensagens.push({
        title: frase.title,
        body: frase.body,
        url: "/motivacao",
      });
    }

    if (mensagens.length === 0) continue;

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, keys")
      .eq("user_id", s.user_id);

    if (!subs?.length) continue;
    usuariosComSub++;

    for (const sub of subs) {
      for (const msg of mensagens) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys as { p256dh: string; auth: string },
            },
            JSON.stringify(msg)
          );
          enviados++;
        } catch (err: unknown) {
          erros++;
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await admin.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    hora,
    hoje,
    enviados,
    erros,
    usuariosComSub,
    usuariosAtivos: allSettings?.length ?? 0,
  });
}
