export default function MacroBar({
  label,
  done,
  total,
  unit,
  color = "primary",
}: {
  label: string;
  done: number;
  total: number;
  unit: string;
  color?: "primary" | "amber" | "water" | "success";
}) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const barColor = {
    primary: "bg-primary",
    amber: "bg-amber",
    water: "bg-water",
    success: "bg-success",
  }[color];

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-ink">{label}</span>
        <span className="tabular-nums text-muted">
          {done}/{total}
          {unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-elev">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
