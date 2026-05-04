"use client";

import type { Horizon, Rung, YieldsData } from "@/lib/types";
import { HORIZON_LABELS } from "@/lib/baskets";
import { Sparkles, ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  horizon: Horizon;
  rungs: Rung[];
  data: YieldsData;
  inflationAdjusted: boolean;
}

export function InsightsCard({ horizon, rungs, data, inflationAdjusted }: Props) {
  const inHorizon = rungs.filter((r) => r.horizon === horizon);
  const winner =
    inHorizon.length > 0
      ? inHorizon.reduce((a, b) => (a.yield >= b.yield ? a : b))
      : rungs[0];

  // Curve shape — short vs long
  const m3 = data.curve.find((p) => p.maturity === 0.25)?.yield ?? 0;
  const y2 = data.curve.find((p) => p.maturity === 2)?.yield ?? 0;
  const y10 = data.curve.find((p) => p.maturity === 10)?.yield ?? 0;
  const slope = y10 - m3; // positive = upward, negative = inverted
  const slopeBps = Math.round(slope * 100);

  // Real yield headline
  const realYield = winner.yield - data.cpiYoy;

  // Recent move — using prevYield from the curve.
  const matchPoint =
    data.curve.find((p) => closeToHorizon(p.maturity, horizon)) ?? data.curve[0];
  const move = matchPoint.yield - matchPoint.prevYield;
  const moveBps = Math.round(move * 100);

  const insight = composeInsight({
    horizon,
    winner,
    cpiYoy: data.cpiYoy,
    realYield,
    slopeBps,
    moveBps,
    inflationAdjusted,
  });

  return (
    <section className="flex flex-col rounded-lg border border-border bg-surface paper p-4 sm:p-5 flex-1">
      <div className="flex items-center gap-1.5">
        <Sparkles size={13} className="text-accent" />
        <h2 className="text-[10.5px] font-mono uppercase tracking-[0.2em] text-fg-subtle">
          Worth flagging
        </h2>
      </div>

      <p className="mt-2.5 text-[14px] sm:text-[15px] leading-snug text-fg">
        {insight.headline}
      </p>

      <ul className="mt-3 space-y-2 text-[12.5px] leading-snug text-fg-muted">
        {insight.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      {/* Quick stats strip */}
      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-md border border-border bg-surface-2 p-2">
        <Stat label="Best APY" value={`${winner.yield.toFixed(2)}%`} sub={winner.name} />
        <Stat
          label="Real yield"
          value={`${realYield >= 0 ? "" : "−"}${Math.abs(realYield).toFixed(2)}%`}
          sub={`vs CPI ${data.cpiYoy.toFixed(1)}%`}
          tone={realYield >= 0 ? "positive" : "danger"}
        />
        <Stat
          label="Curve 10y–3m"
          value={`${slopeBps >= 0 ? "+" : ""}${slopeBps} bp`}
          sub={slopeBps < 0 ? "Inverted" : "Upward"}
          tone={slopeBps < 0 ? "warn" : "positive"}
        />
      </dl>

      {/* Recent move */}
      <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-fg-subtle">
        {moveBps <= 0 ? (
          <ArrowDownRight size={12} className="text-positive" />
        ) : (
          <ArrowUpRight size={12} className="text-warn" />
        )}
        <span>
          {Math.abs(moveBps)} bp {moveBps > 0 ? "richer" : "cheaper"} than last
          week at the {HORIZON_LABELS[horizon]} mark
        </span>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "positive" | "warn" | "danger";
}) {
  const toneCls =
    tone === "positive"
      ? "text-positive"
      : tone === "warn"
      ? "text-warn"
      : tone === "danger"
      ? "text-danger"
      : "text-fg";
  return (
    <div>
      <div className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-fg-subtle">
        {label}
      </div>
      <div className={`tabular text-[14px] font-semibold ${toneCls}`}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-fg-subtle truncate" title={sub}>
          {sub}
        </div>
      )}
    </div>
  );
}

function closeToHorizon(maturity: number, horizon: Horizon): boolean {
  switch (horizon) {
    case "<3mo":
      return maturity <= 0.25;
    case "3-12mo":
      return maturity > 0.25 && maturity <= 1;
    case "1-5y":
      return maturity > 1 && maturity <= 5;
    case "5y+":
      return maturity > 5;
  }
}

function composeInsight(args: {
  horizon: Horizon;
  winner: Rung;
  cpiYoy: number;
  realYield: number;
  slopeBps: number;
  moveBps: number;
  inflationAdjusted: boolean;
}): { headline: string; bullets: string[] } {
  const { horizon, winner, cpiYoy, realYield, slopeBps, moveBps } = args;
  const wYield = winner.yield.toFixed(2);

  switch (horizon) {
    case "<3mo":
      return {
        headline: `4-week T-bills are paying ${wYield}% — the cleanest risk-free yield right now, state-tax-free in most states.`,
        bullets: [
          `Real yield after ${cpiYoy.toFixed(1)}% CPI: ${realYield.toFixed(2)}% — ${realYield > 0 ? "above" : "below"} inflation.`,
          slopeBps < 0
            ? `Curve still inverted by ${Math.abs(slopeBps)} bp — short bills out-yield the 10y. Take the short rate and don't chase duration.`
            : `Curve normalised to +${slopeBps} bp — short rates falling, so this window may not last.`,
          `Daily liquid: bills mature, MMFs settle T+1. No lockup penalty if plans change.`,
        ],
      };

    case "3-12mo":
      return {
        headline: `52-week T-bills lock in ${wYield}% for one year — a clean way to park cash you don't need until next year.`,
        bullets: [
          moveBps <= 0
            ? `Yields slipped ${Math.abs(moveBps)} bp this week. The window for this level may be closing.`
            : `Yields ticked up ${Math.abs(moveBps)} bp this week. Don't blink — short-end is volatile.`,
          `State-tax-free interest meaningfully beats a brokered CD of the same maturity once you net taxes.`,
          `Brokered CDs (1y) pay similar headline yield but compound federal+state tax. Treasuries usually win after-tax.`,
        ],
      };

    case "1-5y":
      return {
        headline: `5-year Treasuries pay ${wYield}% — you're being paid term premium, not just compensated for waiting.`,
        bullets: [
          `Term premium: 5y is ~${(winner.yield - 3.55).toFixed(2)}% over the 3m bill. Modest but real.`,
          `Ladder strategy: split 3y / 5y / 7y to smooth reinvestment risk if you'll roll into new bills as each matures.`,
          `Mark-to-market risk if rates rise: ~5y duration ≈ −5% per +100bp move. Hold to maturity to avoid the issue.`,
        ],
      };

    case "5y+":
      return {
        headline: `10-year Treasuries pay ${wYield}% — long bonds are the equity-hedge instrument when recession is the dominant risk.`,
        bullets: [
          slopeBps > 0
            ? `Curve is upward — long end pays the most yield, but also carries the most duration risk.`
            : `Even with the inverted curve, 10y still beats inflation by ${realYield.toFixed(2)}%.`,
          `~9y duration: a 100bp Fed cut historically rallies the 10y by roughly +9%. Convexity cuts both ways.`,
          `Consider TIPS for the long end: same Treasury safety, plus inflation linkage. Insulates against tail-risk CPI surprises.`,
        ],
      };
  }
}
