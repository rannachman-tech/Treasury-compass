"use client";

import type { RegionId } from "@/lib/types";
import { REGION_LABELS } from "@/lib/baskets";

const REGIONS: RegionId[] = ["us", "eu", "uk", "global"];

interface Props {
  value: RegionId;
  onChange: (r: RegionId) => void;
}

export function RegionTabs({ value, onChange }: Props) {
  return (
    <nav
      role="tablist"
      aria-label="Region"
      className="inline-flex rounded-md border border-border bg-surface-2 p-0.5"
    >
      {REGIONS.map((r) => {
        const active = r === value;
        return (
          <button
            key={r}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r)}
            className={[
              "rounded-sm px-2.5 sm:px-3 py-1.5 text-[12px] font-medium transition-all",
              active
                ? "bg-surface text-fg shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.45)]"
                : "text-fg-muted hover:text-fg",
            ].join(" ")}
          >
            {REGION_LABELS[r]}
          </button>
        );
      })}
    </nav>
  );
}
