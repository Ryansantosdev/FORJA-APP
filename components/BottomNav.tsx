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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
