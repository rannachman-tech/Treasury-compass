"use client";

import { TriangleAlert } from "lucide-react";

export function RiskBanner() {
  return (
    <div className="border-b border-border bg-surface-2/60">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8 py-1.5 text-[11px] text-fg-subtle">
        <TriangleAlert size={11} className="text-warn shrink-0" />
        <span>
          Risk warning: Your capital is at risk. This is information, not financial advice.
          Yields shown are historical or current and don't guarantee future returns.
        </span>
      </div>
    </div>
  );
}
