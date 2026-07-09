import type { ReactNode } from "react";

export type BentoVariant =
  | "rose"
  | "mint"
  | "blue"
  | "amber"
  | "violet"
  | "glass"
  | "slate";

export default function BentoCard({
  variant = "glass",
  className = "",
  children,
  span = 1,
  onClick,
  id,
}: {
  variant?: BentoVariant;
  className?: string;
  children: ReactNode;
  span?: 1 | 2;
  onClick?: () => void;
  id?: string;
}) {
  return (
    <div
      id={id}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      className={`bento bento-${variant} ${span === 2 ? "col-span-2" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function BentoLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`bento-label ${className}`}>{children}</p>;
}

export function BentoValue({
  children,
  sub,
  compact,
}: {
  children: ReactNode;
  sub?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className={compact ? "bento-value-compact" : "bento-value"}>
        {children}
      </p>
      {sub && <p className="bento-sub">{sub}</p>}
    </div>
  );
}
