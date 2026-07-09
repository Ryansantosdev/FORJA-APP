"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UtensilsCrossed,
  Dumbbell,
  Brain,
  TrendingUp,
} from "lucide-react";

const tabs = [
  { href: "/", label: "Hoje", icon: Home },
  { href: "/dieta", label: "Dieta", icon: UtensilsCrossed },
  { href: "/treino", label: "Treino", icon: Dumbbell },
  { href: "/motivacao", label: "Mente", icon: Brain },
  { href: "/progresso", label: "Progresso", icon: TrendingUp },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/onboarding") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-full border border-white/[0.08] bg-black/60 px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[9px] font-semibold transition-all ${
                active
                  ? "text-white"
                  : "text-white/40"
              }`}
            >
              {active && (
                <span className="absolute inset-0 rounded-full bg-white/[0.08]" />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.25 : 1.75}
                className="relative z-10"
              />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
