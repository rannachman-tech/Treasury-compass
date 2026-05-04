"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { Temperature } from "@/lib/simple";

interface Props {
  state: Temperature;
  label: string;
  hint: string;
  delta: number;
}

export function RateTemperature({ state, label, hint, delta }: Props) {
  const cls =
    state === "high"
      ? "border-positive/40 bg-positive/10 text-positive"
      : state === "low"
      ? "border-warn/40 bg-warn/10 text-warn"
      : "border-fg-subtle/30 bg-surface-2 text-fg-muted";
  const Icon = state === "high" ? TrendingUp : state === "low" ? TrendingDown : Minus;
  const sign = delta >= 0 ? "+" : "−";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11.5px] ${cls}`}
      title={hint}
    >
      <Icon size={13} />
      <span className="font-medium">{label}</span>
      <span className="font-mono tabular text-[10.5px] opacity-80">
        {sign}{Math.abs(delta * 100).toFixed(0)} bp vs median
      </span>
    </div>
  );
}
