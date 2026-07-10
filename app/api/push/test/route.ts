import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Envia notificação de teste para o usuário logado (diagnóstico). */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login primeiro." }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel." },
      { status: 500 }
    );
  }
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "Chaves VAPID não configuradas na Vercel." },
      { status: 500 }
    );
  }

  webpush.setVapidDetails("mailto:forja@app.local", vapidPublic, vapidPrivate);

  const admin = createAdmin(supabaseUrl, serviceKey);
  const { data: subs, error: subsErr } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys")
    .eq("user_id", user.id);

  if (subsErr) {
    return NextResponse.json({ error: subsErr.message }, { status: 500 });
  }
  if (!subs?.length) {
    return NextResponse.json(
      {
        error:
          "Nenhuma inscrição neste aparelho. Toque em Ativar notificações (PWA instalado na tela de início).",
      },
      { status: 404 }
    );
  }

  let sent = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys as { p256dh: string; auth: string },
        },
        JSON.stringify({
          title: "Forja — Teste",
          body: "Notificações funcionando! Se viu isso, está tudo certo.",
          url: "/",
        })
      );
      sent++;
    } catch (err: unknown) {
      const e = err as { message?: string; statusCode?: number };
      errors.push(e.message ?? String(err));
      if (e.statusCode === 404 || e.statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      { ok: false, sent: 0, errors },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, sent, errors });
}
