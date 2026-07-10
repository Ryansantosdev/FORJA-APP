export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3 p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-10 w-2/3" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-5 p-5">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="bento-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card min-h-[88px] p-4">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDieta() {
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <Skeleton className="mb-2 h-3 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card p-4">
          <Skeleton className="mb-2 h-4 w-28" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTreino() {
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <Skeleton className="mb-2 h-3 w-20" />
        <Skeleton className="h-8 w-40" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card flex items-center gap-3 p-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProgresso() {
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <Skeleton className="mb-2 h-3 w-28" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-44 w-full rounded-2xl" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonMente() {
  return (
    <div className="space-y-3">
      <div className="card space-y-2 p-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="card p-5">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

export function SkeletonConfig() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card space-y-3 p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
