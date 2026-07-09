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
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
        >
          <CartesianGrid
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatShort}
            stroke="rgba(255,255,255,0.35)"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
            stroke="rgba(255,255,255,0.35)"
            fontSize={10}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(0,0,0,0.85)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              fontSize: 12,
            }}
            labelFormatter={formatShort}
            formatter={(v, name) => [
              `${v} kg`,
              name === "media7" ? "Média 7d" : "Peso",
            ]}
          />
          {metaPeso && (
            <ReferenceLine
              y={metaPeso}
              stroke="#f5a623"
              strokeDasharray="4 4"
              label={{
                value: "Meta",
                fill: "#f5a623",
                fontSize: 10,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="peso"
            stroke="#6b8cff"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#6b8cff" }}
          />
          <Line
            type="monotone"
            dataKey="media7"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
