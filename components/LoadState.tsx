"use client";

import { RefreshCw, AlertTriangle, Inbox } from "lucide-react";
import {
  SkeletonCard,
  SkeletonDashboard,
  SkeletonDieta,
  SkeletonTreino,
  SkeletonProgresso,
  SkeletonMente,
  SkeletonConfig,
} from "./Skeleton";

export type SkeletonVariant =
  | "default"
  | "dashboard"
  | "dieta"
  | "treino"
  | "progresso"
  | "mente"
  | "config";

function PageSkeleton({ variant }: { variant: SkeletonVariant }) {
  switch (variant) {
    case "dashboard":
      return <SkeletonDashboard />;
    case "dieta":
      return <SkeletonDieta />;
    case "treino":
      return <SkeletonTreino />;
    case "progresso":
      return <SkeletonProgresso />;
    case "mente":
      return <SkeletonMente />;
    case "config":
      return <SkeletonConfig />;
    default:
      return <SkeletonCard />;
  }
}

type Props = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
  empty?: boolean;
  emptyTitle?: string;
  emptyDesc?: string;
  emptyAction?: React.ReactNode;
  skeleton?: SkeletonVariant;
};

export default function LoadState({
  loading,
  error,
  onRetry,
  children,
  empty,
  emptyTitle,
  emptyDesc,
  emptyAction,
  skeleton = "default",
}: Props) {
  if (loading && !error) {
    return <PageSkeleton variant={skeleton} />;
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10">
          <AlertTriangle size={24} className="text-danger" />
        </div>
        <p className="font-semibold">Não foi possível carregar</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{error}</p>
        <button
          onClick={onRetry}
          className="btn-primary mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          <RefreshCw size={16} /> Tentar de novo
        </button>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="card border-dashed p-8 text-center">
        <Inbox size={28} className="mx-auto mb-2 text-muted/50" />
        <p className="font-semibold">{emptyTitle ?? "Nada aqui ainda"}</p>
        {emptyDesc && (
          <p className="mt-2 text-sm leading-relaxed text-muted">{emptyDesc}</p>
        )}
        {emptyAction && <div className="mt-5">{emptyAction}</div>}
      </div>
    );
  }

  return <div className="space-y-3">{children}</div>;
}
