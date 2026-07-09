"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayStr } from "@/lib/dates";
import { formatLitersFromMl } from "@/lib/format";
import BentoCard, { BentoLabel } from "@/components/BentoCard";
import RangeBar from "@/components/RangeBar";
import ForjaLogo from "@/components/ForjaLogo";

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="flex min-h-[85dvh] flex-col justify-center">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <ForjaLogo size={72} />
        </div>
        <p className="section-label">
          Passo {step + 1} de {STEPS.length}
        </p>
        <RangeBar pct={pct} color="white" />
      </div>

      <BentoCard variant="violet" className="!min-h-0" span={2}>
        <BentoLabel>{s.title}</BentoLabel>
        <p className="mb-4 text-sm text-white/55">{s.desc}</p>

        {s.field === "peso" && (
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            placeholder="ex: 105.0"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="input-field w-full px-5 py-4 text-center text-2xl font-bold"
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
            className="input-field w-full px-5 py-4 text-center text-2xl font-bold"
          />
        )}
        {s.field === "agua" && (
          <>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              value={agua}
              onChange={(e) => setAgua(e.target.value)}
              className="input-field w-full px-5 py-4 text-center text-2xl font-bold"
            />
            <p className="mt-2 text-center text-xs text-white/45">
              = {formatLitersFromMl(parseInt(agua) || 0)}
            </p>
          </>
        )}
      </BentoCard>

      <button
        type="button"
        onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : finish())}
        disabled={loading || (step === 0 && !peso)}
        className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-4 disabled:opacity-50"
      >
        {step < STEPS.length - 1 ? (
          <>
            Continuar <ChevronRight size={18} />
          </>
        ) : loading ? (
          "Salvando..."
        ) : (
          "Começar"
        )}
      </button>
    </div>
  );
}
