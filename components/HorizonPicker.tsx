"use client";

import type { Horizon } from "@/lib/types";
import { HORIZON_LABELS } from "@/lib/baskets";

const HORIZONS: Horizon[] = ["<3mo", "3-12mo", "1-5y", "5y+"];

interface Props {
  value: Horizon;
  onChange: (h: Horizon) => void;
}

export function HorizonPicker({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Investment horizon"
      className="inline-flex rounded-md border border-border bg-surface-2 p-0.5"
    >
      {HORIZONS.map((h) => {
        const active = h === value;
        return (
          <button
            key={h}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(h)}
            className={[
              "rounded-sm px-2.5 sm:px-3 py-1.5 text-[12px] font-medium tabular transition-all",
              active
                ? "bg-surface text-fg shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.45)]"
                : "text-fg-muted hover:text-fg",
            ].join(" ")}
          >
            {HORIZON_LABELS[h]}
          </button>
        );
      })}
    </div>
  );
}

interface ToggleProps {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}

export function InflationToggle({ on, onChange, label, hint }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="group inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[12px] hover:border-border-strong"
      title={hint}
    >
      <span
        aria-hidden
        className={[
          "relative h-3.5 w-7 rounded-full border transition-colors",
          on ? "bg-accent border-accent" : "bg-border border-border-strong",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-px h-2.5 w-2.5 rounded-full bg-surface transition-all",
            on ? "left-[14px]" : "left-px",
          ].join(" ")}
        />
      </span>
      <span className="text-fg-muted group-hover:text-fg">{label}</span>
    </button>
  );
}
