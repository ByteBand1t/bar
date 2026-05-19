"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const AXIS = { stroke: "#7060a0", fontSize: 11 };
const GRID = "#2d2050";

export interface TimePoint {
  bucketStart: string;
  count: number;
  drinkCount: number;
}

export function OrdersOverTimeChart({ data }: { data: TimePoint[] }) {
  const points = data.map((d) => ({
    time: new Date(d.bucketStart).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    Bestellungen: d.count,
    Drinks: d.drinkCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="time" {...AXIS} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip
          contentStyle={{
            background: "#1a1030",
            border: "1px solid #2d2050",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="Bestellungen"
          stroke="#d4af37"
          fill="url(#g1)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Drinks"
          stroke="#8b5cf6"
          fill="url(#g2)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopCocktailsChart({
  data,
}: {
  data: Array<{ name: string; totalQty: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} {...AXIS} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          {...AXIS}
          tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 15) + "…" : v)}
        />
        <Tooltip
          cursor={{ fill: "#2d205066" }}
          contentStyle={{
            background: "#1a1030",
            border: "1px solid #2d2050",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="totalQty" name="Drinks" fill="#d4af37" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WaitDistChart({
  data,
}: {
  data: Array<{ bucket: string; count: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bucket" {...AXIS} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip
          cursor={{ fill: "#2d205066" }}
          contentStyle={{
            background: "#1a1030",
            border: "1px solid #2d2050",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" name="Bestellungen" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
