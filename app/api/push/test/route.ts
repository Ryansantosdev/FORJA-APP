import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";
import { formatPushError } from "@/lib/push";
import { pushPreview, type PushKind } from "@/lib/push-payload";

export const dynamic = "force-dynamic";

function parseKeys(raw: unknown): { p256dh: string; auth: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const k = raw as Record<string, unknown>;
  const p256dh = k.p256dh;
  const auth = k.auth;
  if (typeof p256dh !== "string" || typeof auth !== "string") return null;
  if (!p256dh || !auth) return null;
  return { p256dh, auth };
}

function parseKind(body: unknown): PushKind {
  if (!body || typeof body !== "object") return "teste";
  const t = (body as { type?: string }).type;
  if (t === "agua" || t === "frase" || t === "teste") return t;
  return "teste";
}

/** Envia notificação de teste para o usuário logado (diagnóstico). */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Faça login primeiro." }, { status: 401 });
  }

  let kind: PushKind = "teste";
  try {
    const body = await req.json();
    kind = parseKind(body);
  } catch {
    /* body vazio = teste genérico */
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_SECRET_KEY?.trim();
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY?.trim();

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      {
        error:
          "Chave secreta do Supabase não configurada na Vercel (SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY).",
      },
      { status: 500 }
    );
  }
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "Chaves VAPID não configuradas na Vercel." },
      { status: 500 }
    );
  }

  try {
    webpush.setVapidDetails("mailto:forja@forja.app", vapidPublic, vapidPrivate);
  } catch (e) {
    return NextResponse.json(
      { error: `Chaves VAPID inválidas: ${e instanceof Error ? e.message : "erro"}` },
      { status: 500 }
    );
  }

  const admin = createAdmin(supabaseUrl, serviceKey);
  const { data: subs, error: subsErr } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys")
    .eq("user_id", user.id);

  if (subsErr) {
    const msg = subsErr.message ?? "Erro ao ler inscrições";
    if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("jwt")) {
      return NextResponse.json(
        {
          error:
            "Chave secreta do Supabase inválida. Copie de novo em Settings → API Keys (sb_secret_... ou service_role).",
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  if (!subs?.length) {
    return NextResponse.json(
      {
        error:
          "Nenhuma inscrição neste aparelho. Toque em Ativar notificações (PWA na tela de início).",
      },
      { status: 404 }
    );
  }

  const payload = pushPreview(kind);
  let sent = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    const keys = parseKeys(sub.keys);
    if (!keys) {
      errors.push("Inscrição sem chaves válidas. Reative as notificações.");
      await admin.from("push_subscriptions").delete().eq("id", sub.id);
      continue;
    }

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: unknown) {
      const e = err as { message?: string; statusCode?: number; body?: string };
      const raw = e.body || e.message || String(err);
      errors.push(formatPushError(raw));
      if (e.statusCode === 404 || e.statusCode === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  if (sent === 0) {
    return NextResponse.json(
      {
        ok: false,
        sent: 0,
        type: kind,
        error: errors[0] ?? "Falha ao enviar. Reative as notificações.",
        errors,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, sent, type: kind, errors });
}
