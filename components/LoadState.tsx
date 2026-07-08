"use client";

import { RefreshCw, AlertTriangle } from "lucide-react";
import { SkeletonCard } from "./Skeleton";

type Props = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
  empty?: boolean;
  emptyTitle?: string;
  emptyDesc?: string;
  emptyAction?: React.ReactNode;
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
}: Props) {
  if (loading && !error) {
    return <SkeletonCard />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-surface p-5 text-center">
        <AlertTriangle size={28} className="mx-auto mb-2 text-danger" />
        <p className="text-sm font-semibold">Não foi possível carregar</p>
        <p className="mt-1 text-xs text-muted">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-black"
        >
          <RefreshCw size={16} /> Tentar de novo
        </button>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-6 text-center">
        <p className="font-semibold">{emptyTitle ?? "Nada aqui ainda"}</p>
        {emptyDesc && <p className="mt-2 text-sm text-muted">{emptyDesc}</p>}
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return <>{children}</>;
}
