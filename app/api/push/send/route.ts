import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const dynamic = "force-dynamic";

/**
 * Endpoint de disparo de lembretes. Chamado por um agendador externo
 * (Vercel Cron ou cron-job.org) a cada hora, protegido por CRON_SECRET.
 *
 * - Hora do lembrete de metas: avisa se o dia ainda não está 100%.
 * - Janela de água: avisa se a meta de água ainda não foi batida.
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!supabaseUrl || !serviceKey || !vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "faltam variáveis de ambiente (service role / VAPID)" },
      { status: 500 }
    );
  }

  webpush.setVapidDetails("mailto:forja@app.local", vapidPublic, vapidPrivate);

  // Service role: usado APENAS no servidor, nunca exposto ao client.
  const admin = createClient(supabaseUrl, serviceKey);

  // hora atual no fuso de Brasília
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
  }).format(now); // YYYY-MM-DD

  const { data: allSettings } = await admin
    .from("user_settings")
    .select("*")
    .eq("lembretes_ativos", true);

  let enviados = 0;

  for (const s of allSettings ?? []) {
    const mensagens: { title: string; body: string; url: string }[] = [];

    // ---- lembrete de metas ----
    if (hora === s.hora_lembrete_metas) {
      const [meals, mealLogs, workout] = await Promise.all([
        admin.from("meals").select("id").eq("user_id", s.user_id),
        admin
          .from("meal_logs")
          .select("meal_id")
          .eq("user_id", s.user_id)
          .eq("date", hoje),
        admin
          .from("workout_logs")
          .select("concluido")
          .eq("user_id", s.user_id)
          .eq("date", hoje)
          .maybeSingle(),
      ]);
      const total = meals.data?.length ?? 0;
      const done = mealLogs.data?.length ?? 0;
      const treinoOk = workout.data?.concluido === true;
      if (total === 0 || done < total || !treinoOk) {
        const faltas: string[] = [];
        if (done < total) faltas.push(`${total - done} refeições`);
        if (!treinoOk) faltas.push("o treino");
        mensagens.push({
          title: "O dia ainda não acabou.",
          body: `Faltam ${faltas.join(" e ")}. Feche as metas ou o streak zera.`,
          url: "/",
        });
      }
    }

    // ---- lembrete de água (5 horários fixos) ----
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
          title: "Hidratação",
          body: `Faltam ${faltaL}L. Beba um copo e marque no app.`,
          url: "/dieta",
        });
      }
    }

    // ---- marcos de streak ----
    const { data: stats } = await admin
      .from("user_stats")
      .select("current_streak, max_streak")
      .eq("user_id", s.user_id)
      .maybeSingle();
    const marcos = [7, 30, 66, 100];
    const streak = stats?.current_streak ?? 0;
    if (marcos.includes(streak) && hora === 8) {
      const msgs: Record<number, string> = {
        7: "1 semana de ferro. A maioria desiste aqui. Você não.",
        30: "30 dias. Hábito forjado. Não negocie com a preguiça.",
        66: "66 dias. Isso é ciência: o hábito está no seu DNA agora.",
        100: "100 dias. Centurião. Poucos chegam aqui.",
      };
      mensagens.push({
        title: `Streak ${streak} dias`,
        body: msgs[streak],
        url: "/",
      });
    }

    if (mensagens.length === 0) continue;

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, keys")
      .eq("user_id", s.user_id);

    for (const sub of subs ?? []) {
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
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            // subscription morta — limpa do banco
            await admin.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }
    }
  }

  return NextResponse.json({ ok: true, hora, enviados });
}
