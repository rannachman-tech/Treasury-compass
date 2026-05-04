"use client";

import { ExternalLink, Wallet } from "lucide-react";
import type { Basket } from "@/lib/baskets";
import type { Horizon } from "@/lib/types";
import { HORIZON_LABELS } from "@/lib/baskets";

interface Props {
  basket: Basket;
  horizon: Horizon;
  onTrade: () => void;
}

const COPY_BY_HORIZON: Record<Horizon, { lead: string; sub: string }> = {
  "<3mo": {
    lead: "Park it on eToro",
    sub: "Buy the short-duration T-bill basket — daily liquid, state-tax-free.",
  },
  "3-12mo": {
    lead: "Lock 6–12 months on eToro",
    sub: "Capture the front-end yield with daily-liquid ETFs.",
  },
  "1-5y": {
    lead: "Stretch to 5y on eToro",
    sub: "Term premium without giving up ETF liquidity.",
  },
  "5y+": {
    lead: "Buy long bonds on eToro",
    sub: "Long-duration Treasuries — convexity to Fed cuts.",
  },
};

export function TradeCta({ basket, horizon, onTrade }: Props) {
  const copy = COPY_BY_HORIZON[horizon];

  return (
    <div className="rounded-lg border border-accent/30 bg-gradient-to-br from-accent/12 to-transparent p-4 sm:p-5">
      <div className="flex items-start gap-2">
        <Wallet size={14} className="mt-0.5 text-accent shrink-0" />
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold text-fg">{copy.lead}</h3>
          <p className="mt-1 text-[12.5px] leading-snug text-fg-muted">
            {copy.sub}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border bg-surface-2 p-2.5">
        <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-[0.16em] text-fg-subtle">
          <span>{HORIZON_LABELS[horizon]} basket</span>
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
