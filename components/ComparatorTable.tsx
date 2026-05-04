"use client";

import { useState } from "react";
import type { ComparatorRow, Horizon } from "@/lib/types";
import {
  expenseRatioBps,
  lockupDays,
  rowSourceTier,
  SOURCE_TIER_HINT,
  SOURCE_TIER_LABEL,
} from "@/lib/simple";
import { ArrowUpDown, ExternalLink, ShieldCheck, Landmark, Coins } from "lucide-react";

interface Props {
  rows: ComparatorRow[];
  activeHorizon: Horizon;
}

type SortKey = "vehicle" | "apy" | "lockup" | "coverage";

const matchHorizon = (lockup: string, h: Horizon): boolean => {
  const isDaily =
    /^daily/i.test(lockup) && !/(min|until|avoid)/i.test(lockup);
  const days = lockupDays(lockup);
  switch (h) {
    case "<3mo":   return isDaily || days <= 91;
    case "3-12mo": return !isDaily && days > 91 && days <= 365;
    case "1-5y":   return days > 365 && days <= 1825;
    case "5y+":    return days >= 1825;
  }
};

export function ComparatorTable({ rows, activeHorizon }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("apy");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<"all" | Horizon>("all");
  const [netOfFees, setNetOfFees] = useState(false);

  const enriched = rows.map((r) => {
    const tier = rowSourceTier(r);
    const erBps = expenseRatioBps(r);
    const netApy = r.apy - erBps / 100;
    return { ...r, tier, erBps, netApy };
  });

  let display = [...enriched];
  if (filter !== "all") {
    display = display.filter((r) => matchHorizon(r.lockup, filter));
  }
  display.sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "apy") {
      const va = netOfFees ? a.netApy : a.apy;
      const vb = netOfFees ? b.netApy : b.apy;
      return (va - vb) * dir;
    }
    if (sortKey === "lockup") return a.lockup.localeCompare(b.lockup) * dir;
    if (sortKey === "coverage") return a.coverage.localeCompare(b.coverage) * dir;
    return a.vehicle.localeCompare(b.vehicle) * dir;
  });

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "vehicle" ? "asc" : "desc");
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface paper p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-fg-subtle">
            Full universe
          </h3>
          <p className="mt-0.5 text-[13px] text-fg">
            Every safe-cash vehicle, side by side
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={netOfFees}
            onClick={() => setNetOfFees((v) => !v)}
            title="Subtract per-fund expense ratios from displayed APY. Direct sovereign holdings and bank deposits are unchanged."
            className={[
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px] transition-colors",
              netOfFees
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
            ].join(" ")}
          >
            <span
              aria-hidden
              className={[
                "relative h-3 w-6 rounded-full border transition-colors",
                netOfFees ? "border-accent bg-accent" : "border-border-strong bg-border",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-px h-2 w-2 rounded-full bg-surface transition-all",
                  netOfFees ? "left-[12px]" : "left-px",
                ].join(" ")}
              />
            </span>
            Net of fees
          </button>

          <div className="inline-flex rounded-md border border-border bg-surface-2 p-0.5 text-[11.5px]">
            {(["all", "<3mo", "3-12mo", "1-5y", "5y+"] as const).map((f) => {
              const active = f === filter || (f === "all" && filter === "all");
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f === filter ? "all" : f)}
                  className={[
                    "rounded-sm px-2 py-1 transition-colors",
                    active
                      ? "bg-surface text-fg shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.4)]"
                      : "text-fg-muted hover:text-fg",
                  ].join(" ")}
                >
                  {f === "all" ? "All horizons" : f}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 scroll-x rounded-md border border-border">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left">
              <Th onClick={() => toggleSort("vehicle")} active={sortKey === "vehicle"} dir={sortDir}>
                Vehicle
              </Th>
              <Th onClick={() => toggleSort("apy")} active={sortKey === "apy"} dir={sortDir} align="right">
                {netOfFees ? "Net APY" : "APY"}
              </Th>
              <Th onClick={() => toggleSort("lockup")} active={sortKey === "lockup"} dir={sortDir}>
                Lockup
              </Th>
              <Th onClick={() => toggleSort("coverage")} active={sortKey === "coverage"} dir={sortDir}>
                Coverage
              </Th>
              <Th>Taxes</Th>
              <Th align="right">Min</Th>
              <Th>Issuer</Th>
            </tr>
          </thead>
          <tbody>
            {display.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-fg-subtle">
                  No vehicles match this horizon.
                </td>
              </tr>
            ) : display.map((r) => {
              const inActive = matchHorizon(r.lockup, activeHorizon);
              const shownApy = netOfFees ? r.netApy : r.apy;
              return (
                <tr
                  key={r.vehicle}
                  className={[
                    "border-b border-border last:border-0",
                    inActive ? "bg-accent/5" : "",
                  ].join(" ")}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-fg leading-snug">{r.vehicle}</div>
                    <div
                      className="mt-0.5 inline-flex items-center text-[9.5px] font-mono uppercase tracking-wider text-fg-subtle"
                      title={SOURCE_TIER_HINT[r.tier]}
                    >
                      {SOURCE_TIER_LABEL[r.tier]}
                      {netOfFees && r.erBps > 0 && (
                        <span className="ml-1.5 rounded border border-border bg-surface px-1 py-px tabular text-fg-subtle">
                          −{r.erBps}bp fee
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular font-semibold">
                    {shownApy.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-fg-muted">{r.lockup}</td>
                  <td className="px-3 py-2">
                    <CoverageBadge coverage={r.coverage} />
                  </td>
                  <td className="px-3 py-2 text-fg-muted">{r.taxes}</td>
                  <td className="px-3 py-2 text-right tabular text-fg-muted">{r.minimum}</td>
                  <td className="px-3 py-2 text-fg-muted">
                    {r.issuerLink ? (
                      <a
                        href={r.issuerLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 underline-offset-2 hover:text-accent hover:underline"
                      >
                        {r.issuer}
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      r.issuer
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2.5 text-[11px] leading-snug text-fg-subtle">
        Source-tier labels: <span className="font-medium text-fg-muted">Govt yield</span> = sovereign series (FRED CMT, Bund, Gilt);
        {" "}<span className="font-medium text-fg-muted">Top tier</span> = curated best-in-market (HYSA, brokered CDs, NS&amp;I);
        {" "}<span className="font-medium text-fg-muted">ETF quote</span> = market price; <span className="font-medium text-fg-muted">MMF yield</span> = 7-day fund yield.
        Toggle <span className="font-medium text-fg-muted">Net of fees</span> to subtract per-fund expense ratios — direct holdings and deposits are unaffected.
      </p>
    </section>
  );
}

function Th({
  children,
  align = "left",
  onClick,
  active,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  onClick?: () => void;
  active?: boolean;
  dir?: "asc" | "desc";
}) {
  const cls =
    "px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-subtle";
  if (!onClick) {
    return <th className={`${cls} text-${align}`}>{children}</th>;
  }
  return (
    <th className={`${cls} text-${align}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-fg"
      >
        {children}
        <ArrowUpDown
          size={10}
          className={active ? "text-accent" : "text-fg-subtle/60"}
        />
      </button>
    </th>
  );
}

function CoverageBadge({ coverage }: { coverage: ComparatorRow["coverage"] }) {
  const map: Record<typeof coverage, { icon: React.ReactNode; cls: string; label: string }> = {
    Treasury:    { icon: <Landmark size={10} />,    cls: "bg-positive/12 border-positive/30 text-positive", label: "Treasury" },
    Sovereign:   { icon: <Landmark size={10} />,    cls: "bg-positive/12 border-positive/30 text-positive", label: "Sovereign" },
    FDIC:        { icon: <ShieldCheck size={10} />, cls: "bg-positive/10 border-positive/25 text-positive", label: "FDIC" },
    FSCS:        { icon: <ShieldCheck size={10} />, cls: "bg-positive/10 border-positive/25 text-positive", label: "FSCS" },
    "Deposit-EU":{ icon: <ShieldCheck size={10} />, cls: "bg-positive/10 border-positive/25 text-positive", label: "EU Deposit" },
    SIPC:        { icon: <ShieldCheck size={10} />, cls: "bg-warn/10 border-warn/25 text-warn", label: "SIPC" },
    MMF:         { icon: <Coins size={10} />,       cls: "bg-warn/10 border-warn/25 text-warn", label: "MMF" },
    None:        { icon: <Coins size={10} />,       cls: "bg-danger/10 border-danger/25 text-danger", label: "Uninsured" },
  };
  const m = map[coverage];
  return (
    <span className={`inline-flex items-center gap-0.5 rounded border px-1 py-px text-[9.5px] uppercase tracking-wider ${m.cls}`}>
      {m.icon}
      {m.label}
    </span>
  );
}
