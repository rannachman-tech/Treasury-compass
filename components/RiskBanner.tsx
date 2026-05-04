"use client";

import { TriangleAlert } from "lucide-react";

export function RiskBanner() {
  return (
    <div className="border-b border-border/60 bg-surface-2/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 sm:px-6 lg:px-8 py-1 text-[10.5px] text-fg-subtle">
        <TriangleAlert size={10} className="text-warn shrink-0 opacity-80" />
        <span>
          Capital at risk · informational only · yields shown are historical or current and don't guarantee future returns
        </span>
      </div>
    </div>
  );
}
