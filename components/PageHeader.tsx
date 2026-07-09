import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="animate-fade-up flex items-end justify-between pt-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-3 shrink-0">{action}</div>}
    </header>
  );
}
