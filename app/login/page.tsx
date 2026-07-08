"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, AlertTriangle } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const configured = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(traduzErro(error.message));
      } else {
        setInfo(
          "Conta criada! Se o e-mail de confirmação estiver ativado no Supabase, confirme antes de entrar."
        );
        setMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(traduzErro(error.message));
      } else {
        router.push("/");
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-[80dvh] flex-col justify-center">
      <div className="mb-10 text-center">
        <Flame size={48} className="mx-auto mb-3 text-neon" />
        <h1 className="text-3xl font-bold tracking-tight">FORJA</h1>
        <p className="mt-1 text-sm text-muted">
          Disciplina não se encontra. Se constrói.
        </p>
      </div>

      {!configured ? (
        <div className="rounded-2xl border border-gold/40 bg-surface p-5 text-sm leading-relaxed">
          <div className="mb-2 flex items-center gap-2 font-semibold text-gold">
            <AlertTriangle size={18} /> Supabase não configurado
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-muted">
            <li>
              Crie um projeto gratuito em{" "}
              <span className="text-ink">supabase.com</span>
            </li>
            <li>
              Copie a <span className="text-ink">URL</span> e a{" "}
              <span className="text-ink">anon key</span> (Settings → API Keys)
            </li>
            <li>
              Cole no arquivo <span className="text-ink">.env.local</span> na
              raiz do projeto
            </li>
            <li>
              Rode o <span className="text-ink">supabase/schema.sql</span> no
              SQL Editor
            </li>
            <li>Reinicie o servidor (npm run dev)</li>
          </ol>
          <p className="mt-3 text-xs text-muted">
            O passo a passo completo está no README.md.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base outline-none focus:border-neon"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base outline-none focus:border-neon"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-neon">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neon py-3.5 font-bold text-black transition-opacity disabled:opacity-50"
          >
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : "Criar conta"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="w-full py-2 text-sm text-muted"
          >
            {mode === "login"
              ? "Primeira vez? Criar conta"
              : "Já tenho conta — entrar"}
          </button>
        </form>
      )}
    </div>
  );
}

function traduzErro(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed"))
    return "Confirme seu e-mail antes de entrar (verifique a caixa de entrada).";
  if (msg.includes("User already registered"))
    return "Este e-mail já tem conta. Use 'Entrar'.";
  return msg;
}
