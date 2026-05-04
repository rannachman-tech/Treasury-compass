"use client";

import type { Horizon, Rung } from "@/lib/types";
import { ShieldCheck, Lock, Landmark, Coins } from "lucide-react";

interface YieldLadderProps {
  rungs: Rung[];
  activeHorizon: Horizon;
  inflationAdjusted: boolean;
  cpiYoy: number;
  onRungClick?: (rung: Rung) => void;
}

/**
 * The ladder is the moment-of-identity for this app.
 *
 * Two vertical rails span the full height. Seven rungs are connected to both
 * rails with rivets. Each rung carries: maturity label, winning vehicle, yield
 * (tabular nums), coverage badge, lockup, tax tag, and a yield-relative bar.
 * Active rung gets a 1px brass outline + slightly larger type.
 *
 * Implementation: HTML rungs over an SVG decorative layer for the rails. Pure
 * CSS rivets won't get the bevel right; pure SVG can't auto-flow text. Hybrid.
 */
export function YieldLadder({
  rungs,
  activeHorizon,
  inflationAdjusted,
  cpiYoy,
  onRungClick,
}: YieldLadderProps) {
  // Top of ladder = longest maturity. Reverse for top-down rendering.
  const ordered = [...rungs].sort((a, b) => b.position - a.position);

  // Yield range for the relative bar.
  const max = Math.max(...rungs.map((r) => r.yield));
  const min = Math.min(...rungs.map((r) => r.yield));
  const range = Math.max(0.5, max - min);

  // Find the overall best (highest yield) among rungs in the active horizon —
  // we'll add a tiny "★ best" marker.
  const inHorizon = rungs.filter((r) => r.horizon === activeHorizon);
  const winnerInHorizon =
    inHorizon.length > 0
      ? inHorizon.reduce((a, b) => (a.yield >= b.yield ? a : b))
      : null;

  return (
    <div className="relative w-full">
      {/* Decorative rails layer */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--accent-muted) / 0.35)" />
            <stop offset="50%" stopColor="rgb(var(--accent) / 0.85)" />
            <stop offset="100%" stopColor="rgb(var(--accent-muted) / 0.35)" />
          </linearGradient>
        </defs>
        {/* Left rail */}
        <rect x="3" y="2" width="0.45" height="96" fill="url(#rail)" />
        {/* Right rail */}
        <rect x="96.55" y="2" width="0.45" height="96" fill="url(#rail)" />
      </svg>

      {/* Rungs */}
      <ol
        className="relative flex flex-col gap-2 sm:gap-2.5"
        aria-label="Yield ladder, longest maturity at top"
      >
        {ordered.map((r, idx) => {
          const active = r.horizon === activeHorizon;
          const isWinner = winnerInHorizon?.id === r.id;
          const adjYield = inflationAdjusted ? r.yield - cpiYoy : r.yield;
          const fill =
            range > 0 ? Math.max(0.06, (r.yield - min) / range) : 0.5;

          return (
            <li
              key={r.id}
              className={`relative ${idx === 0 ? "mt-0" : ""}`}
            >
              <button
                type="button"
                onClick={() => onRungClick?.(r)}
                className={[
                  "group relative w-full text-left",
                  "rounded-md border bg-surface paper",
                  "transition-all duration-150",
                  active
                    ? "border-accent/70 ring-1 ring-accent/40 shadow-[0_1px_0_rgb(var(--accent)/0.18)]"
                    : "border-border hover:border-border-strong",
                  "px-3 sm:px-4 py-2.5 sm:py-3",
                ].join(" ")}
                aria-pressed={active}
              >
                {/* Yield-relative bar — subtle horizontal fill behind the row */}
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-md bg-accent/8 dark:bg-accent/10 pointer-events-none"
                  style={{ width: `${fill * 100}%` }}
                />

                {/* Rivets — visible at the rung↔rail intersections */}
                <span
                  aria-hidden
                  className="absolute -left-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_1px_rgb(var(--accent-muted)/0.6)]"
                />
                <span
                  aria-hidden
                  className="absolute -right-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_1px_rgb(var(--accent-muted)/0.6)]"
                />

                {/* Row content */}
                <div className="relative flex items-center gap-2.5 sm:gap-4">
                  {/* Maturity */}
                  <div
                    className={[
                      "shrink-0 font-mono uppercase tracking-[0.16em] text-fg-subtle",
                      active ? "text-[10.5px] sm:text-[11.5px]" : "text-[10px] sm:text-[11px]",
                    ].join(" ")}
                    style={{ width: "62px" }}
                  >
                    {r.label}
                  </div>

                  {/* Vehicle name + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={[
                          "truncate font-medium text-fg",
                          active ? "text-[13.5px] sm:text-[14.5px]" : "text-[12.5px] sm:text-[13px]",
                        ].join(" ")}
                      >
                        {r.winner.name}
                      </span>
                      {isWinner && (
                        <span
                          aria-label="Best in selected horizon"
                          className="hidden sm:inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-1.5 py-px text-[9.5px] font-medium uppercase tracking-wider text-accent"
                        >
                          Best
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] sm:text-[11px] text-fg-muted">
                      <CoverageBadge coverage={r.winner.coverage} />
                      <span className="inline-flex items-center gap-1 text-fg-subtle">
                        <Lock size={10} className="opacity-70" />
                        {r.winner.lockup}
                      </span>
                      <span className="text-fg-subtle truncate">
                        {r.winner.tax}
                      </span>
                    </div>
                  </div>

                  {/* Yield */}
                  <div className="shrink-0 text-right">
                    <div
                      className={[
                        "tabular font-semibold",
                        active ? "text-[18px] sm:text-[20px]" : "text-[15px] sm:text-[16.5px]",
                        adjYield < 0 ? "text-danger" : "text-fg",
                      ].join(" ")}
                    >
                      {adjYield > 0 ? "" : "−"}
                      {Math.abs(adjYield).toFixed(2)}%
                    </div>
                    <div className="text-[9.5px] sm:text-[10px] uppercase tracking-wider text-fg-subtle">
                      {inflationAdjusted ? "Real" : "APY"}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Foot — anchors the ladder visually on the floor */}
      <div className="relative mt-3 flex items-center gap-2 px-3">
        <span aria-hidden className="h-px flex-1 bg-border-strong/60" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-fg-subtle">
          Risk-free curve · {inflationAdjusted ? "real" : "nominal"}
        </span>
        <span aria-hidden className="h-px flex-1 bg-border-strong/60" />
      </div>
    </div>
  );
}

function CoverageBadge({
  coverage,
}: {
  coverage: Rung["winner"]["coverage"];
}) {
  const map: Record<typeof coverage, { icon: React.ReactNode; label: string; cls: string }> =
    {
      Treasury: {
        icon: <Landmark size={10} />,
        label: "Treasury",
        cls: "bg-positive/12 border-positive/30 text-positive",
      },
      Sovereign: {
        icon: <Landmark size={10} />,
        label: "Sovereign",
        cls: "bg-positive/12 border-positive/30 text-positive",
      },
      FDIC: {
        icon: <ShieldCheck size={10} />,
        label: "FDIC",
        cls: "bg-positive/10 border-positive/25 text-positive",
      },
      FSCS: {
        icon: <ShieldCheck size={10} />,
        label: "FSCS",
        cls: "bg-positive/10 border-positive/25 text-positive",
      },
      "Deposit-EU": {
        icon: <ShieldCheck size={10} />,
        label: "EU Deposit",
        cls: "bg-positive/10 border-positive/25 text-positive",
      },
      SIPC: {
        icon: <ShieldCheck size={10} />,
        label: "SIPC",
        cls: "bg-warn/10 border-warn/25 text-warn",
      },
      MMF: {
        icon: <Coins size={10} />,
        label: "MMF",
        cls: "bg-warn/10 border-warn/25 text-warn",
      },
      None: {
        icon: <Coins size={10} />,
        label: "Uninsured",
        cls: "bg-danger/10 border-danger/25 text-danger",
      },
    };
  const m = map[coverage];
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded border px-1 py-px text-[9.5px] uppercase tracking-wider ${m.cls}`}
    >
      {m.icon}
      {m.label}
    </span>
  );
}
