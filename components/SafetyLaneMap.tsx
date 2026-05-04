"use client";

import type { ComparatorRow } from "@/lib/types";
import {
  abbreviateVehicle,
  lockupToBucket,
  vehicleLane,
  LOCKUP_BUCKETS,
  LOCKUP_BUCKET_LABEL,
  SAFETY_LANE_LABEL,
  type LockupBucket,
  type SafetyLane,
} from "@/lib/simple";

interface Props {
  rows: ComparatorRow[];
  highlightVehicle: string;
}

const LANES: SafetyLane[] = ["government", "bank", "mmf", "market"];

const LANE_TINT: Record<SafetyLane, { dot: string; pill: string; pillActive: string }> = {
  government: {
    dot: "bg-positive",
    pill: "border-positive/30 bg-positive/8 text-positive",
    pillActive: "border-accent bg-accent/15 text-accent ring-1 ring-accent/40",
  },
  bank: {
    dot: "bg-positive/70",
    pill: "border-positive/25 bg-positive/6 text-positive",
    pillActive: "border-accent bg-accent/15 text-accent ring-1 ring-accent/40",
  },
  mmf: {
    dot: "bg-warn",
    pill: "border-warn/30 bg-warn/8 text-warn",
    pillActive: "border-accent bg-accent/15 text-accent ring-1 ring-accent/40",
  },
  market: {
    dot: "bg-danger",
    pill: "border-danger/30 bg-danger/8 text-danger",
    pillActive: "border-accent bg-accent/15 text-accent ring-1 ring-accent/40",
  },
};

interface PositionedChip extends ComparatorRow {
  abbrev: string;
  lane: SafetyLane;
  bucket: LockupBucket;
  active: boolean;
}

export function SafetyLaneMap({ rows, highlightVehicle }: Props) {
  const positioned: PositionedChip[] = rows.map((r) => ({
    ...r,
    abbrev: abbreviateVehicle(r.vehicle) || r.vehicle,
    lane: vehicleLane(r.coverage),
    bucket: lockupToBucket(r.lockup),
    active: r.vehicle === highlightVehicle,
  }));

  // Index for O(1) cell lookup
  function chipsIn(lane: SafetyLane, bucket: LockupBucket): PositionedChip[] {
    return positioned
      .filter((c) => c.lane === lane && c.bucket === bucket)
      .sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0) || b.apy - a.apy);
  }

  return (
    <div className="rounded-md border border-border bg-surface-2 p-3 sm:p-4">
      <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
        <span>Where this sits</span>
        <span className="text-fg-subtle/80">← liquid · locked-in →</span>
      </div>

      <div className="scroll-x mt-3">
        <div
          className="grid gap-1 sm:gap-1.5"
          style={{
            gridTemplateColumns:
              "minmax(120px, 140px) repeat(5, minmax(96px, 1fr))",
            minWidth: "600px",
          }}
        >
          {/* Header row */}
          <div />
          {LOCKUP_BUCKETS.map((b) => (
            <div
              key={`h-${b}`}
              className="px-1.5 pb-1 text-center text-[9.5px] font-mono uppercase tracking-wider text-fg-subtle border-b border-dashed border-border"
            >
              {LOCKUP_BUCKET_LABEL[b]}
            </div>
          ))}

          {/* Lane rows */}
          {LANES.map((lane) => (
            <div key={lane} className="contents">
              <div className="flex items-center gap-1.5 pr-2 py-1.5 text-[12px] text-fg-muted">
                <span aria-hidden className={`h-2 w-2 rounded-full ${LANE_TINT[lane].dot}`} />
                <span className="truncate" title={SAFETY_LANE_LABEL[lane]}>
                  {SAFETY_LANE_LABEL[lane]}
                </span>
              </div>
              {LOCKUP_BUCKETS.map((bucket) => {
                const chips = chipsIn(lane, bucket);
                return (
                  <div
                    key={`${lane}-${bucket}`}
                    className="flex flex-wrap content-start gap-1 rounded-sm border border-dashed border-border/60 bg-surface/40 p-1 min-h-[40px]"
                  >
                    {chips.length === 0 ? (
                      <span className="m-auto text-[10px] text-fg-subtle/50">—</span>
                    ) : (
                      chips.map((c) => (
                        <span
                          key={c.vehicle}
                          title={`${c.vehicle} · ${c.lockup} · ${c.apy.toFixed(2)}%`}
                          className={[
                            "inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-px text-[10.5px] tabular",
                            c.active
                              ? `font-semibold ${LANE_TINT[c.lane].pillActive}`
                              : LANE_TINT[c.lane].pill,
                          ].join(" ")}
                        >
                          {c.active && <span aria-hidden>★</span>}
                          <span className="truncate max-w-[140px]">{c.abbrev}</span>
                          <span className="opacity-60 hidden md:inline">{c.apy.toFixed(1)}%</span>
                        </span>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-2 text-[10.5px] text-fg-subtle leading-snug">
        Rows = how safe the money is. Columns = how long until you can get it back.
        Star marks the recommendation.
      </p>
    </div>
  );
}
