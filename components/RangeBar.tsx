/** Barra estilo Veri — marcador triangular na posição do valor */

export default function RangeBar({
  pct,
  color = "white",
}: {
  pct: number;
  color?: "white" | "amber" | "mint";
}) {
  const p = Math.min(100, Math.max(0, pct));
  const markerColor = {
    white: "#ffffff",
    amber: "#f0b94b",
    mint: "#5eead4",
  }[color];

  return (
    <div className="range-bar">
      <div className="range-bar-track" />
      <div
        className="range-bar-marker"
        style={{ left: `${p}%`, borderBottomColor: markerColor }}
      />
    </div>
  );
}
