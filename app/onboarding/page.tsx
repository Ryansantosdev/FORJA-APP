"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Flame, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr } from "@/lib/dates";

const STEPS = [
  { title: "Peso atual", desc: "De onde você parte.", field: "peso" as const },
  { title: "Meta de peso", desc: "Para onde você vai.", field: "meta" as const },
  { title: "Meta de água", desc: "Litros por dia (padrão 3L).", field: "agua" as const },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [peso, setPeso] = useState("");
  const [meta, setMeta] = useState("");
  const [agua, setAgua] = useState("3000");
  const [loading, setLoading] = useState(false);

  async function finish() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const pesoNum = parseFloat(peso.replace(",", "."));
    const metaNum = parseFloat(meta.replace(",", ".")) || null;
    const aguaNum = parseInt(agua) || 3000;

    if (pesoNum > 0) {
      await supabase.from("weight_logs").upsert(
        { user_id: user.id, date: todayStr(), peso: pesoNum },
        { onConflict: "user_id,date" }
      );
    }
    await supabase.from("user_settings").upsert({
      user_id: user.id,
      meta_peso: metaNum,
      meta_agua_ml: aguaNum,
      onboarding_done: true,
    });
    router.push("/");
    router.refresh();
  }

  const s = STEPS[step];

  return (
    <div className="flex min-h-[85dvh] flex-col justify-center">
      <div className="mb-8 text-center">
        <Flame size={40} className="mx-auto mb-2 text-primary" />
        <p className="text-xs text-muted">
          Passo {step + 1} de {STEPS.length}
        </p>
      </div>

      <h1 className="mb-1 text-2xl font-bold">{s.title}</h1>
      <p className="mb-6 text-sm text-muted">{s.desc}</p>

      {s.field === "peso" && (
        <input
          type="number"
          inputMode="decimal"
          autoFocus
          placeholder="ex: 105.0"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          className="mb-6 w-full rounded-2xl border border-line bg-surface px-5 py-4 text-2xl font-bold text-center outline-none focus:border-primary"
        />
      )}
      {s.field === "meta" && (
        <input
          type="number"
          inputMode="decimal"
          autoFocus
          placeholder="ex: 90.0"
          value={meta}
          onChange={(e) => setMeta(e.target.value)}
          className="mb-6 w-full rounded-2xl border border-line bg-surface px-5 py-4 text-2xl font-bold text-center outline-none focus:border-primary"
        />
      )}
      {s.field === "agua" && (
        <div className="mb-6">
          <input
            type="number"
            inputMode="numeric"
            autoFocus
            value={agua}
            onChange={(e) => setAgua(e.target.value)}
            className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-2xl font-bold text-center outline-none focus:border-primary"
          />
          <p className="mt-2 text-center text-xs text-muted">
            = {((parseInt(agua) || 0) / 1000).toFixed(1)} litros
          </p>
        </div>
      )}

      <button
        onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : finish())}
        disabled={loading || (step === 0 && !peso)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-black disabled:opacity-50"
      >
        {step < STEPS.length - 1 ? (
          <>Continuar <ChevronRight size={18} /></>
        ) : loading ? (
          "Salvando..."
        ) : (
          "Começar"
        )}
      </button>
    </div>
  );
}
