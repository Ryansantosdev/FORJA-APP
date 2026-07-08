export default function ProgressRing({
  pct,
  size = 120,
  stroke = 8,
  atRisk = false,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  atRisk?: boolean;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, pct) / 100) * circ;
  const color = atRisk ? "var(--color-amber)" : "var(--color-primary)";

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-elev)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="rotate-90 fill-ink text-2xl font-black"
        style={{ transformOrigin: "center" }}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}
