"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryPoint } from "@/lib/types";

interface Props {
  history: HistoryPoint[];
  policyRateLabel: string;
}

export function DeepHistoryChart({ history, policyRateLabel }: Props) {
  return (
    <section className="rounded-lg border border-border bg-surface paper p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-fg-subtle">
            5-year history
          </h3>
          <p className="mt-0.5 text-[13px] text-fg">
            {policyRateLabel}, 3-month, 2-year, 10-year
          </p>
        </div>
      </div>
      <div className="mt-4 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 6, right: 12, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="ff" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.18} />
                <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgb(var(--border) / 0.6)" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => d.slice(0, 7)}
              tick={{ fill: "rgb(var(--fg-subtle))", fontSize: 10, fontFamily: "ui-monospace" }}
              tickLine={false}
              axisLine={{ stroke: "rgb(var(--border))" }}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fill: "rgb(var(--fg-subtle))", fontSize: 10, fontFamily: "ui-monospace" }}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const map: Record<string, string> = {
                  policyRate: policyRateLabel,
                  m3: "3-month",
                  y2: "2-year",
                  y10: "10-year",
                };
                return (
                  <div className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11.5px] shadow-md">
                    <div className="font-mono uppercase tracking-wider text-fg-subtle text-[9.5px]">
                      {label}
                    </div>
                    {payload.map((p) => (
                      <div key={p.dataKey as string} className="flex items-center justify-between gap-3 tabular">
                        <span style={{ color: p.color }}>● {map[p.dataKey as string]}</span>
                        <span className="text-fg">{Number(p.value).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              height={24}
              iconSize={8}
              wrapperStyle={{ fontSize: 11, fontFamily: "ui-monospace", color: "rgb(var(--fg-subtle))" }}
              formatter={(v: string) => {
                const map: Record<string, string> = {
                  policyRate: policyRateLabel,
                  m3: "3m",
                  y2: "2y",
                  y10: "10y",
                };
                return <span className="text-fg-muted">{map[v] ?? v}</span>;
              }}
            />
            <Area
              type="monotone"
              dataKey="policyRate"
              stroke="rgb(var(--accent))"
              strokeWidth={1.5}
              fill="url(#ff)"
              isAnimationActive={false}
            />
            <Line type="monotone" dataKey="m3"  stroke="rgb(var(--positive))" strokeWidth={1.25} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="y2"  stroke="rgb(var(--warn))"     strokeWidth={1.25} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="y10" stroke="rgb(var(--danger))"   strokeWidth={1.25} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
