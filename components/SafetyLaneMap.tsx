"use client";

import type { ComparatorRow } from "@/lib/types";
import { lockupDays, lockupToX, vehicleLane, SAFETY_LANE_LABEL, type SafetyLane } from "@/lib/simple";

interface Props {
  rows: ComparatorRow[];
  highlightVehicle: string;
}

const LANES: SafetyLane[] = ["government", "bank", "mmf", "market"];

const LANE_COLOR: Record<SafetyLane, string> = {
  government: "rgb(var(--positive))",
  bank:       "rgb(var(--accent))",
  mmf:        "rgb(var(--warn))",
  market:     "rgb(var(--danger))",
};

const VBOX_W = 620;
const VBOX_H = 200;
const PAD_LEFT = 110;
const PAD_RIGHT = 16;
const PAD_TOP = 18;
const PAD_BOTTOM = 28;
const LANE_H = (VBOX_H - PAD_TOP - PAD_BOTTOM) / LANES.length;

/** A 2D map: safety on Y axis (4 lanes), lockup on X axis. */
export function SafetyLaneMap({ rows, highlightVehicle }: Props) {
  const positions = rows.map((r) => {
    const lane = vehicleLane(r.coverage);
    const laneIdx = LANES.indexOf(lane);
    const xRel = lockupToX(lockupDays(r.lockup));
    const x = PAD_LEFT + xRel * (VBOX_W - PAD_LEFT - PAD_RIGHT);
    const y = PAD_TOP + laneIdx * LANE_H + LANE_H / 2;
    return { ...r, lane, x, y };
  });

  return (
    <div className="rounded-md border border-border bg-surface-2 p-3">
      <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
        <span>Where this sits</span>
        <span className="text-fg-subtle/80">
          ← Liquid · Locked-in →
        </span>
      </div>
      <svg
        viewBox={`0 0 ${VBOX_W} ${VBOX_H}`}
        className="mt-2 block w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Safety vs lockup map"
      >
        {LANES.map((lane, i) => {
          const yMid = PAD_TOP + i * LANE_H + LANE_H / 2;
          const yLine = PAD_TOP + i * LANE_H + LANE_H;
          return (
            <g key={lane}>
              <text
                x="6"
                y={yMid + 4}
                fontSize="11"
                fill="rgb(var(--fg-muted))"
                fontFamily="ui-sans-serif"
              >
                {SAFETY_LANE_LABEL[lane]}
              </text>
              <line
                x1={PAD_LEFT - 8}
                y1={yLine}
                x2={VBOX_W - PAD_RIGHT}
                y2={yLine}
                stroke="rgb(var(--border))"
                strokeWidth="0.5"
                strokeDasharray="3 3"
              />
            </g>
          );
        })}
        <line
          x1={PAD_LEFT - 8}
          y1={PAD_TOP}
          x2={PAD_LEFT - 8}
          y2={VBOX_H - PAD_BOTTOM + LANE_H}
          stroke="rgb(var(--border))"
          strokeWidth="0.5"
        />

        <text x={PAD_LEFT} y={VBOX_H - 8} fontSize="10" fill="rgb(var(--fg-subtle))">
          instant
        </text>
        <text x={(PAD_LEFT + VBOX_W - PAD_RIGHT) / 2 - 16} y={VBOX_H - 8} fontSize="10" fill="rgb(var(--fg-subtle))">
          months · 1y
        </text>
        <text x={VBOX_W - PAD_RIGHT - 26} y={VBOX_H - 8} fontSize="10" fill="rgb(var(--fg-subtle))">
          5y+
        </text>

        {positions.map((p) => {
          const active = p.vehicle === highlightVehicle;
          return (
            <g key={p.vehicle}>
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 8 : 5.5}
                fill={LANE_COLOR[p.lane]}
                stroke={active ? "rgb(var(--fg))" : "transparent"}
                strokeWidth={active ? 1.5 : 0}
              />
              <text
                x={p.x + (active ? 12 : 9)}
                y={p.y + 3.5}
                fontSize={active ? 11 : 10}
                fill="rgb(var(--fg))"
                fontWeight={active ? 600 : 400}
              >
                {p.vehicle}
                {active ? " ★" : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
