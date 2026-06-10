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

const AXIS = { stroke: "#9aa4b2", fontSize: 11 };
const GRID = "#2b3038";
const TOOLTIP = {
  background: "#17191f",
  border: "1px solid #2b3038",
  borderRadius: 12,
  color: "#f4f6f8",
  fontSize: 12,
};

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
            <stop offset="0%" stopColor="#f5523c" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#f5523c" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
        <XAxis dataKey="time" {...AXIS} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip
          contentStyle={{
            ...TOOLTIP,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="Bestellungen"
          stroke="#f5523c"
          fill="url(#g1)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Drinks"
          stroke="#60a5fa"
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
          cursor={{ fill: "#222832" }}
          contentStyle={{
            ...TOOLTIP,
          }}
        />
        <Bar dataKey="totalQty" name="Drinks" fill="#f5523c" radius={[0, 4, 4, 0]} />
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
          cursor={{ fill: "#222832" }}
          contentStyle={{
            ...TOOLTIP,
          }}
        />
        <Bar dataKey="count" name="Bestellungen" fill="#60a5fa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
