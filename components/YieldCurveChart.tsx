"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import type { CurvePoint, Horizon } from "@/lib/types";

interface Props {
  curve: CurvePoint[];
  activeHorizon: Horizon;
}

const matLabel = (m: number) => {
  if (m < 0.5) return `${Math.round(m * 12)}m`;
  if (m < 1) return `${Math.round(m * 12)}m`;
  return `${m}y`;
};

const inHorizon = (m: number, h: Horizon): boolean => {
  switch (h) {
    case "<3mo":
      return m <= 0.25;
    case "3-12mo":
      return m > 0.25 && m <= 1;
    case "1-5y":
      return m > 1 && m <= 5;
    case "5y+":
      return m > 5;
  }
};

export function YieldCurveChart({ curve, activeHorizon }: Props) {
  const data = curve.map((p) => ({
    label: matLabel(p.maturity),
    maturity: p.maturity,
    today: p.yield,
    prev: p.prevYield,
    delta: ((p.yield - p.prevYield) * 100).toFixed(0),
  }));

  const ymin = Math.floor(
    Math.min(...curve.flatMap((p) => [p.yield, p.prevYield])) * 2
  ) / 2 - 0.5;
  const ymax = Math.ceil(
    Math.max(...curve.flatMap((p) => [p.yield, p.prevYield])) * 2
  ) / 2 + 0.5;

  // Highlight the band that matches activeHorizon — find the average maturity
  // in that horizon and mark the today's curve point.
  const matched = curve.filter((p) => inHorizon(p.maturity, activeHorizon));
  const highlight =
    matched.length > 0
      ? matched.reduce((acc, p) =>
          Math.abs(p.maturity - average(matched.map((m) => m.maturity))) <
          Math.abs(acc.maturity - average(matched.map((m) => m.maturity)))
            ? p
            : acc
        )
      : null;

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 6, right: 8, bottom: 6, left: -16 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fill: "rgb(var(--fg-subtle))", fontSize: 10, fontFamily: "ui-monospace" }}
            tickLine={false}
            axisLine={{ stroke: "rgb(var(--border))" }}
          />
          <YAxis
            domain={[ymin, ymax]}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
            tick={{ fill: "rgb(var(--fg-subtle))", fontSize: 10, fontFamily: "ui-monospace" }}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p: any = payload[0].payload;
              return (
                <div className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11.5px] shadow-md">
                  <div className="font-mono uppercase tracking-wider text-fg-subtle text-[9.5px]">
                    {p.label}
                  </div>
                  <div className="tabular text-fg">
                    Today {(+p.today).toFixed(2)}%
                  </div>
                  <div className="tabular text-fg-subtle">
                    Prev {(+p.prev).toFixed(2)}%
                  </div>
                  <div
                    className={`tabular text-[10.5px] ${
                      Number(p.delta) >= 0 ? "text-warn" : "text-positive"
                    }`}
                  >
                    {Number(p.delta) >= 0 ? "+" : ""}
                    {p.delta} bp w/w
                  </div>
                </div>
              );
            }}
          />
          {/* Previous-week dotted */}
          <Line
            type="monotone"
            dataKey="prev"
            stroke="rgb(var(--fg-subtle))"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive={false}
          />
          {/* Today */}
          <Line
            type="monotone"
            dataKey="today"
            stroke="rgb(var(--accent))"
            strokeWidth={1.75}
            dot={{ r: 2.5, fill: "rgb(var(--accent))", stroke: "rgb(var(--bg))", strokeWidth: 1 }}
            activeDot={{ r: 4.5, fill: "rgb(var(--accent))" }}
            isAnimationActive={false}
          />
          {highlight && (
            <ReferenceDot
              x={matLabel(highlight.maturity)}
              y={highlight.yield}
              r={6}
              fill="transparent"
              stroke="rgb(var(--accent))"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function average(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
