"use client";

import { ExternalLink, Wallet } from "lucide-react";
import type { Basket } from "@/lib/baskets";
import type { Horizon, RegionData } from "@/lib/types";
import { HORIZON_LABELS } from "@/lib/baskets";

interface Props {
  basket: Basket;
  horizon: Horizon;
  regionData: RegionData;
  onTrade: () => void;
}

const LEAD_BY_HORIZON: Record<Horizon, string> = {
  "<3mo": "Park it on eToro",
  "3-12mo": "Lock 6–12 months on eToro",
  "1-5y": "Stretch to 5y on eToro",
  "5y+": "Buy long bonds on eToro",
};

export function TradeCta({ basket, horizon, regionData, onTrade }: Props) {
  const lead = LEAD_BY_HORIZON[horizon];
  const sub =
    horizon === "<3mo"
      ? regionData.parkCopy.short
      : horizon === "3-12mo"
      ? regionData.parkCopy.medium
      : horizon === "1-5y"
      ? regionData.parkCopy.long
      : regionData.parkCopy.ultra;

  return (
    <div className="rounded-lg border border-accent/30 bg-gradient-to-br from-accent/12 to-transparent p-4 sm:p-5">
      <div className="flex items-start gap-2">
        <Wallet size={14} className="mt-0.5 text-accent shrink-0" />
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-fg">{lead}</h3>
          <p className="mt-1 text-[12.5px] leading-snug text-fg-muted">
            {sub}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border bg-surface-2 p-2.5">
        <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-[0.16em] text-fg-subtle">
          <span>{HORIZON_LABELS[horizon]} basket · {basket.region.toUpperCase()}</span>
          <span>{basket.holdings.length} holdings</span>
        </div>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {basket.holdings.map((h) => (
            <li
              key={h.ticker}
              className="inline-flex items-center gap-1 rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] tabular"
            >
              <span className="font-medium">{h.ticker}</span>
              <span className="text-fg-subtle">{h.weight}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onTrade}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-semibold text-bg hover:brightness-110 active:scale-[0.99]"
        >
          Trade on eToro <ExternalLink size={12} />
        </button>
        <span className="text-[10.5px] text-fg-subtle">
          Markets open · execution at NAV close
        </span>
      </div>
    </div>
  );
}
