"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellOff, LogOut, Check, Droplets, Quote } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ensureServiceWorker,
  getPushBlockReason,
  isPushApiAvailable,
  urlBase64ToUint8Array,
} from "@/lib/push";
import type { UserSettings } from "@/lib/types";
import { mlDeLitros } from "@/lib/agua";
import { formatLitersFromMl } from "@/lib/format";
import BentoCard, { BentoLabel } from "@/components/BentoCard";

const HORAS_UTIL = Array.from({ length: 14 }, (_, i) => i + 8);

const INTERVALOS_FRASE = [
  { min: 30, label: "30 min" },
  { min: 60, label: "1 h" },
  { min: 90, label: "1h30" },
  { min: 120, label: "2 h" },
  { min: 180, label: "3 h" },
];

const DEFAULTS: UserSettings = {
  meta_agua_ml: 3000,
  copo_ml: 250,
  meta_proteina_g: 150,
  meta_peso: null,
  agua_lembrete_horas: [8, 11, 14, 17, 20],
  hora_lembrete_metas: 21,
  lembretes_ativos: true,
  frase_lembrete_ativo: true,
  frase_lembrete_intervalo_min: 60,
  frase_lembrete_inicio: 8,
  frase_lembrete_fim: 21,
  agenda_treino: {},
};

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [s, setS] = useState<UserSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [pushStatus, setPushStatus] = useState<
    "idle" | "on" | "unsupported" | "denied" | "needs_install" | "no_vapid" | "loading"
  >("idle");
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setS({
          ...DEFAULTS,
          ...data,
          agua_lembrete_horas:
            (data.agua_lembrete_horas as number[]) ?? DEFAULTS.agua_lembrete_horas,
        });
      }
      const { count } = await supabase
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (count && count > 0) setPushStatus("on");
    })();
    const block = getPushBlockReason();
    if (block === "no_vapid") setPushStatus("no_vapid");
    else if (block === "needs_install") setPushStatus("needs_install");
    else if (block === "denied") setPushStatus("denied");
    else if (block === "no_browser") setPushStatus("unsupported");
  }, []);

  function toggleHoraAgua(h: number) {
    const set = new Set(s.agua_lembrete_horas);
    if (set.has(h)) set.delete(h);
    else set.add(h);
    setS({ ...s, agua_lembrete_horas: [...set].sort((a, b) => a - b) });
  }

  async function salvar() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_settings").upsert({
      user_id: user.id,
      meta_agua_ml: s.meta_agua_ml,
      copo_ml: s.copo_ml,
      meta_proteina_g: s.meta_proteina_g,
      meta_peso: s.meta_peso || null,
      agua_lembrete_horas: s.agua_lembrete_horas,
      hora_lembrete_metas: s.hora_lembrete_metas,
      lembretes_ativos: s.lembretes_ativos,
      frase_lembrete_ativo: s.frase_lembrete_ativo,
      frase_lembrete_intervalo_min: s.frase_lembrete_intervalo_min,
      frase_lembrete_inicio: s.frase_lembrete_inicio,
      frase_lembrete_fim: s.frase_lembrete_fim,
      agenda_treino: s.agenda_treino,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function ativarPush() {
    setPushError(null);
    const block = getPushBlockReason();
    if (block === "no_browser") {
      setPushStatus("unsupported");
      return;
    }
    if (block === "no_vapid") {
      setPushStatus("no_vapid");
      return;
    }
    if (block === "needs_install") {
      setPushStatus("needs_install");
      return;
    }
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) {
      setPushStatus("no_vapid");
      return;
    }

    setPushStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("denied");
        return;
      }
      await ensureServiceWorker();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("push_subscriptions").upsert(
        { user_id: user.id, endpoint: sub.endpoint, keys: sub.toJSON().keys },
        { onConflict: "endpoint" }
      );
      if (error) throw error;
      setPushStatus("on");
    } catch (e) {
      setPushStatus("idle");
      setPushError(e instanceof Error ? e.message : "Erro ao ativar notificações");
    }
  }

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-4 pb-2">
      <header className="animate-fade-up flex items-center gap-3 pt-2">
        <Link href="/" className="btn-ghost p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
      </header>

      <BentoCard variant="blue" className="!min-h-0" span={2}>
        <BentoLabel>Água</BentoLabel>
        <div className="mt-3 space-y-3">
          <Row label="Meta diária (litros)">
            <LitrosInput
              ml={s.meta_agua_ml}
              onChange={(ml) => setS({ ...s, meta_agua_ml: ml })}
            />
          </Row>
          <Row label="Tamanho do copo (ml)">
            <NumInput
              value={s.copo_ml}
              onChange={(v) => setS({ ...s, copo_ml: v })}
            />
          </Row>
          <p className="text-xs text-white/45">
            ≈ {Math.ceil(s.meta_agua_ml / (s.copo_ml || 250))} águas ·{" "}
            {formatLitersFromMl(s.meta_agua_ml)}
          </p>
        </div>
      </BentoCard>

      <BentoCard variant="glass" className="!min-h-0" span={2}>
        <div className="mb-3 flex items-center gap-2">
          <Droplets size={14} className="text-primary" />
          <BentoLabel>Lembretes de água</BentoLabel>
        </div>
        <p className="mb-3 text-xs text-white/45">
          Toque nos horários em que quer receber o lembrete (só se a meta não
          estiver batida).
        </p>
        <div className="flex flex-wrap gap-2">
          {HORAS_UTIL.map((h) => {
            const on = s.agua_lembrete_horas.includes(h);
            return (
              <button
                key={h}
                type="button"
                onClick={() => toggleHoraAgua(h)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  on
                    ? "bg-primary/25 text-primary"
                    : "bg-white/[0.06] text-white/40"
                }`}
              >
                {String(h).padStart(2, "0")}h
              </button>
            );
          })}
        </div>
      </BentoCard>

      <BentoCard variant="violet" className="!min-h-0" span={2}>
        <div className="mb-3 flex items-center gap-2">
          <Quote size={14} className="text-violet" />
          <BentoLabel>Lembretes de frases</BentoLabel>
        </div>
        <Row label="Ativo">
          <button
            type="button"
            onClick={() =>
              setS({ ...s, frase_lembrete_ativo: !s.frase_lembrete_ativo })
            }
            className={`btn-ghost px-4 py-2 text-sm ${
              s.frase_lembrete_ativo ? "text-primary" : ""
            }`}
          >
            {s.frase_lembrete_ativo ? "Sim" : "Não"}
          </button>
        </Row>
        <p className="mb-2 mt-3 text-xs text-white/45">
          Intervalo entre frases (horário útil 08h–21h):
        </p>
        <div className="flex flex-wrap gap-2">
          {INTERVALOS_FRASE.map(({ min, label }) => (
            <button
              key={min}
              type="button"
              onClick={() =>
                setS({ ...s, frase_lembrete_intervalo_min: min })
              }
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                s.frase_lembrete_intervalo_min === min
                  ? "bg-primary/25 text-primary"
                  : "bg-white/[0.06] text-white/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </BentoCard>

      <BentoCard variant="slate" className="!min-h-0" span={2}>
        <BentoLabel>Metas</BentoLabel>
        <div className="mt-3 space-y-3">
          <Row label="Meta de peso (kg)">
            <NumInput
              value={s.meta_peso ?? 0}
              onChange={(v) => setS({ ...s, meta_peso: v || null })}
            />
          </Row>
          <Row label="Meta de proteína (g/dia)">
            <NumInput
              value={s.meta_proteina_g}
              onChange={(v) => setS({ ...s, meta_proteina_g: v })}
            />
          </Row>
          <Row label="Notificações">
            <button
              type="button"
              onClick={() =>
                setS({ ...s, lembretes_ativos: !s.lembretes_ativos })
              }
              className={`btn-ghost px-4 py-2 text-sm ${
                s.lembretes_ativos ? "text-primary" : ""
              }`}
            >
              {s.lembretes_ativos ? "Ativas" : "Desligadas"}
            </button>
          </Row>
        </div>
      </BentoCard>

      <button onClick={salvar} className="btn-primary w-full py-4">
        {saved ? (
          <span className="inline-flex items-center gap-2">
            <Check size={18} /> Salvo
          </span>
        ) : (
          "Salvar"
        )}
      </button>

      <BentoCard variant="glass" className="!min-h-0" span={2}>
        <p className="mb-2 text-sm font-semibold">Notificações push</p>
        <p className="mb-3 text-xs text-white/45">
          Água nos horários escolhidos + frases no intervalo definido (8h–21h).
          iPhone: instale na tela de início (iOS 16.4+).
        </p>
        {pushStatus === "on" ? (
          <p className="flex items-center gap-2 text-sm text-mint">
            <Bell size={16} /> Ativadas neste aparelho
          </p>
        ) : pushStatus === "needs_install" ? (
          <div className="space-y-2 text-sm text-white/55">
            <p className="flex items-center gap-2">
              <BellOff size={16} /> Instale o app na tela de início primeiro.
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-xs">
              <li>Safari → Compartilhar → Adicionar à Tela de Início</li>
              <li>Abra pelo ícone FORJA (não pelo Safari)</li>
              <li>Volte aqui e toque em Ativar</li>
            </ol>
            {isPushApiAvailable() && (
              <button
                type="button"
                onClick={ativarPush}
                className="btn-primary mt-2 px-4 py-3 text-sm"
              >
                <Bell size={16} className="inline" /> Tentar ativar
              </button>
            )}
          </div>
        ) : pushStatus === "no_vapid" ? (
          <p className="flex items-center gap-2 text-sm text-white/45">
            <BellOff size={16} /> Configure VAPID na Vercel (veja README).
          </p>
        ) : pushStatus === "unsupported" ? (
          <p className="flex items-center gap-2 text-sm text-white/45">
            <BellOff size={16} /> Navegador sem suporte a push.
          </p>
        ) : pushStatus === "denied" ? (
          <p className="text-sm text-danger">
            Permissão negada. Ajustes → Forja → Notificações → Permitir.
          </p>
        ) : (
          <button
            type="button"
            onClick={ativarPush}
            disabled={pushStatus === "loading"}
            className="btn-primary px-4 py-3 text-sm disabled:opacity-50"
          >
            <Bell size={16} className="mr-2 inline" />
            {pushStatus === "loading" ? "Ativando..." : "Ativar notificações"}
          </button>
        )}
        {pushError && <p className="mt-2 text-xs text-danger">{pushError}</p>}
      </BentoCard>

      <button
        type="button"
        onClick={sair}
        className="btn-ghost flex w-full items-center justify-center gap-2 border border-danger/40 py-3.5 text-sm text-danger"
      >
        <LogOut size={16} /> Sair
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/55">{label}</span>
      {children}
    </div>
  );
}

function LitrosInput({
  ml,
  onChange,
}: {
  ml: number;
  onChange: (ml: number) => void;
}) {
  const litros = (ml / 1000).toFixed(1);
  return (
    <input
      type="number"
      step="0.1"
      min="0.5"
      max="10"
      value={litros}
      onChange={(e) => {
        const l = parseFloat(e.target.value.replace(",", ".")) || 0;
        onChange(mlDeLitros(l));
      }}
      className="input-field w-20 px-3 py-2 text-center text-sm"
    />
  );
}

function NumInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      value={value || ""}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      className="input-field w-24 px-3 py-2 text-center text-sm"
    />
  );
}
