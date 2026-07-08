"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatShort } from "@/lib/dates";

export type WeightPoint = {
  date: string;
  peso: number;
  media7?: number;
};

export default function ProgressoChart({
  data,
  metaPeso,
}: {
  data: WeightPoint[];
  metaPeso: number | null;
}) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="#1e2839" strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatShort} stroke="#8a94a7" fontSize={11} tickLine={false} />
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="#8a94a7" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#161f30", border: "1px solid #1e2839", borderRadius: 12, fontSize: 12 }}
            labelFormatter={formatShort}
            formatter={(v, name) => [`${v} kg`, name === "media7" ? "Média 7d" : "Peso"]}
          />
          {metaPeso && (
            <ReferenceLine y={metaPeso} stroke="#f0b94b" strokeDasharray="4 4" label={{ value: "Meta", fill: "#f0b94b", fontSize: 10 }} />
          )}
          <Line type="monotone" dataKey="peso" stroke="#4f7cff" strokeWidth={2.5} dot={{ r: 3, fill: "#4f7cff" }} />
          <Line type="monotone" dataKey="media7" stroke="#8a94a7" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
