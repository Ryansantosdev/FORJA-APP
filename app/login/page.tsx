"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import BentoCard from "@/components/BentoCard";
import ForjaLogo from "@/components/ForjaLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
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

    if (mode === "reset") {
      if (!email.trim()) {
        setError("Informe seu e-mail.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) setError(traduzErro(error.message));
      else
        setInfo(
          "Enviamos um link para redefinir sua senha. Verifique o e-mail (e o spam)."
        );
      setLoading(false);
      return;
    }

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
      <div className="mb-10 animate-fade-up text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <ForjaLogo size={80} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">FORJA</h1>
        <p className="mt-2 text-sm text-white/45">
          Disciplina não se encontra. Se constrói.
        </p>
      </div>

      {!configured ? (
        <BentoCard variant="amber" className="text-sm leading-relaxed">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle size={18} /> Supabase não configurado
          </div>
          <ol className="list-decimal space-y-2 pl-5 text-white/55">
            <li>
              Crie um projeto gratuito em{" "}
              <span className="text-white">supabase.com</span>
            </li>
            <li>
              Copie a <span className="text-white">URL</span> e a{" "}
              <span className="text-white">anon key</span>
            </li>
            <li>
              Cole no <span className="text-white">.env.local</span>
            </li>
            <li>
              Rode o <span className="text-white">supabase/schema.sql</span>
            </li>
            <li>Reinicie o servidor (npm run dev)</li>
          </ol>
        </BentoCard>
      ) : (
        <form onSubmit={handleSubmit} className="animate-fade-up space-y-3">
          <p className="section-label">
            {mode === "reset" ? "Recuperar senha" : "Acesso"}
          </p>
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full px-4 py-3.5 text-base"
          />
          {mode !== "reset" && (
            <input
              type="password"
              required
              minLength={6}
              placeholder="Senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full px-4 py-3.5 text-base"
            />
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-mint">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 disabled:opacity-50"
          >
            {loading
              ? "Aguarde..."
              : mode === "login"
                ? "Entrar"
                : mode === "signup"
                  ? "Criar conta"
                  : "Enviar link"}
          </button>
          {mode === "login" && (
            <button
              type="button"
              onClick={() => {
                setMode("reset");
                setError(null);
                setInfo(null);
              }}
              className="w-full py-2 text-sm text-white/45"
            >
              Esqueci minha senha
            </button>
          )}
          {mode === "reset" && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setInfo(null);
              }}
              className="w-full py-2 text-sm text-white/45"
            >
              Voltar ao login
            </button>
          )}
          {mode !== "reset" && (
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="w-full py-2 text-sm text-white/45"
            >
              {mode === "login"
                ? "Primeira vez? Criar conta"
                : "Já tenho conta — entrar"}
            </button>
          )}
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
