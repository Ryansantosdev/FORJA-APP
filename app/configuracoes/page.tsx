"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellOff, LogOut, Check } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { UserSettings } from "@/lib/types";

const DEFAULTS: UserSettings = {
  meta_agua_ml: 3000,
  copo_ml: 250,
  meta_peso: null,
  agua_lembrete_horas: [8, 11, 14, 17, 20],
  hora_lembrete_metas: 21,
  lembretes_ativos: true,
  agenda_treino: {},
};

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [s, setS] = useState<UserSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "on" | "unsupported" | "denied">("idle");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setS({
          ...DEFAULTS,
          ...data,
          agua_lembrete_horas: (data.agua_lembrete_horas as number[]) ?? DEFAULTS.agua_lembrete_horas,
        });
      }
    })();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      setPushStatus("on");
    }
  }, []);

  async function salvar() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_settings").upsert({
      user_id: user.id,
      meta_agua_ml: s.meta_agua_ml,
      copo_ml: s.copo_ml,
      meta_peso: s.meta_peso || null,
      agua_lembrete_horas: s.agua_lembrete_horas,
      hora_lembrete_metas: s.hora_lembrete_metas,
      lembretes_ativos: s.lembretes_ativos,
      agenda_treino: s.agenda_treino,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function ativarPush() {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported"); return;
    }
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) { setPushStatus("unsupported"); return; }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setPushStatus("denied"); return; }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapid) });
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("push_subscriptions").upsert({ user_id: user.id, endpoint: sub.endpoint, keys: sub.toJSON().keys }, { onConflict: "endpoint" });
    setPushStatus("on");
  }

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 pt-2">
        <Link href="/" className="p-1 text-muted"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold">Configurações</h1>
      </header>

      <section className="space-y-3 rounded-2xl bg-surface p-4">
        <p className="text-sm font-semibold">Água</p>
        <Row label="Meta diária (ml)"><NumInput value={s.meta_agua_ml} onChange={(v) => setS({ ...s, meta_agua_ml: v })} /></Row>
        <Row label="Tamanho do copo (ml)"><NumInput value={s.copo_ml} onChange={(v) => setS({ ...s, copo_ml: v })} /></Row>
        <p className="text-xs text-muted">Lembretes de água (5× ao dia, horários):</p>
        <div className="flex flex-wrap gap-2">
          {s.agua_lembrete_horas.map((h, i) => (
            <input key={i} type="number" min={0} max={23} value={h}
              onChange={(e) => {
                const arr = [...s.agua_lembrete_horas];
                arr[i] = parseInt(e.target.value) || 0;
                setS({ ...s, agua_lembrete_horas: arr });
              }}
              className="w-14 rounded-lg border border-line bg-elev px-2 py-2 text-center text-sm" />
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-surface p-4">
        <p className="text-sm font-semibold">Peso e metas</p>
        <Row label="Meta de peso (kg)"><NumInput value={s.meta_peso ?? 0} onChange={(v) => setS({ ...s, meta_peso: v || null })} /></Row>
        <Row label="Lembrete de metas (hora)"><NumInput value={s.hora_lembrete_metas} onChange={(v) => setS({ ...s, hora_lembrete_metas: v })} /></Row>
        <Row label="Lembretes ativos">
          <button onClick={() => setS({ ...s, lembretes_ativos: !s.lembretes_ativos })}
            className={`rounded-xl border px-4 py-2 text-sm ${s.lembretes_ativos ? "border-primary/40 bg-primary/10 text-primary" : "border-line text-muted"}`}>
            {s.lembretes_ativos ? "Sim" : "Não"}
          </button>
        </Row>
      </section>

      <button onClick={salvar} className="w-full rounded-2xl bg-primary py-4 font-bold text-black">
        {saved ? <span className="inline-flex items-center gap-2"><Check size={18} /> Salvo</span> : "Salvar"}
      </button>

      <section className="rounded-2xl bg-surface p-4">
        <p className="mb-2 text-sm font-semibold">Notificações push</p>
        <p className="mb-3 text-xs text-muted">No iPhone: instale o app na tela de início (iOS 16.4+). Funciona após deploy na Vercel.</p>
        {pushStatus === "on" ? (
          <p className="flex items-center gap-2 text-sm text-primary"><Bell size={16} /> Ativadas</p>
        ) : pushStatus === "unsupported" ? (
          <p className="flex items-center gap-2 text-sm text-muted"><BellOff size={16} /> Indisponível (configure VAPID ou use após deploy)</p>
        ) : pushStatus === "denied" ? (
          <p className="text-sm text-danger">Permissão negada no navegador</p>
        ) : (
          <button onClick={ativarPush} className="flex items-center gap-2 rounded-xl border border-line bg-elev px-4 py-3 text-sm"><Bell size={16} /> Ativar</button>
        )}
      </section>

      <button onClick={sair} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/40 py-3.5 text-sm text-danger">
        <LogOut size={16} /> Sair
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><span className="text-sm text-muted">{label}</span>{children}</div>;
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <input type="number" value={value || ""} onChange={(e) => onChange(parseInt(e.target.value) || 0)}
    className="w-24 rounded-xl border border-line bg-elev px-3 py-2 text-center text-sm outline-none focus:border-primary" />;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
}
