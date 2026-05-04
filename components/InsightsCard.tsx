"use client";

import type { Horizon, RegionData, RegionId, Rung } from "@/lib/types";
import { HORIZON_LABELS } from "@/lib/baskets";
import { Sparkles, ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  region: RegionId;
  horizon: Horizon;
  regionData: RegionData;
  inflationAdjusted: boolean;
}

export function InsightsCard({ region, horizon, regionData, inflationAdjusted }: Props) {
  const inHorizon = regionData.rungs.filter((r) => r.horizon === horizon);
  const bestRung =
    inHorizon.length > 0
      ? inHorizon.reduce((a, b) => (a.yield >= b.yield ? a : b))
      : regionData.rungs[0];

  const m3 = regionData.curve.find((p) => p.maturity === 0.25)?.yield ?? 0;
  const y10 = regionData.curve.find((p) => p.maturity === 10)?.yield ?? 0;
  const slope = y10 - m3;
  const slopeBps = Math.round(slope * 100);

  const realYield = bestRung.yield - regionData.cpiYoy;

  const matchPoint =
    regionData.curve.find((p) => closeToHorizon(p.maturity, horizon)) ??
    regionData.curve[0];
  const move = matchPoint.yield - matchPoint.prevYield;
  const moveBps = Math.round(move * 100);

  const insight = composeInsight({
    region,
    horizon,
    bestRung,
    regionData,
    realYield,
    slopeBps,
    moveBps,
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

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-md border border-border bg-surface-2 p-2">
        <Stat label="Best APY" value={`${bestRung.yield.toFixed(2)}%`} sub={bestRung.winner.name} />
        <Stat
          label="Real yield"
          value={`${realYield >= 0 ? "" : "−"}${Math.abs(realYield).toFixed(2)}%`}
          sub={`vs ${regionData.cpiLabel} ${regionData.cpiYoy.toFixed(1)}%`}
          tone={realYield >= 0 ? "positive" : "danger"}
        />
        <Stat
          label="Curve 10y–3m"
          value={`${slopeBps >= 0 ? "+" : ""}${slopeBps} bp`}
          sub={slopeBps < 0 ? "Inverted" : "Upward"}
          tone={slopeBps < 0 ? "warn" : "positive"}
        />
      </dl>

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
    case "<3mo":   return maturity <= 0.25;
    case "3-12mo": return maturity > 0.25 && maturity <= 1;
    case "1-5y":   return maturity > 1 && maturity <= 5;
    case "5y+":    return maturity > 5;
  }
}

function composeInsight(args: {
  region: RegionId;
  horizon: Horizon;
  bestRung: Rung;
  regionData: RegionData;
  realYield: number;
  slopeBps: number;
  moveBps: number;
}): { headline: string; bullets: string[] } {
  const { region, horizon, bestRung, regionData, realYield, slopeBps, moveBps } = args;
  const wYield = bestRung.yield.toFixed(2);
  const winnerName = bestRung.winner.name;
  const cpiTag = regionData.cpiLabel;
  const cpi = regionData.cpiYoy.toFixed(1);
  const m3 = regionData.curve.find((p) => p.maturity === 0.25)?.yield ?? bestRung.yield;
  const exempt = regionData.taxModel.exemptBadge;

  // Pick a region-tinted base sentence per horizon.
  if (region === "us") {
    switch (horizon) {
      case "<3mo":
        return {
          headline: `${winnerName} pays ${wYield}% — the cleanest risk-free yield right now, state-tax-free in most states.`,
          bullets: [
            `Real yield after ${cpi}% ${cpiTag}: ${realYield.toFixed(2)}% — ${realYield > 0 ? "above" : "below"} inflation.`,
            slopeBps < 0
              ? `Curve still inverted by ${Math.abs(slopeBps)} bp — short bills out-yield the 10y. Take the short rate and don't chase duration.`
              : `Curve normalised to +${slopeBps} bp — short rates falling, so this window may not last.`,
            `Daily liquid: bills mature, MMFs settle T+1. No lockup penalty if plans change.`,
          ],
        };
      case "3-12mo":
        return {
          headline: `${winnerName} locks in ${wYield}% — a clean way to park cash you don't need until next year.`,
          bullets: [
            moveBps <= 0
              ? `Yields slipped ${Math.abs(moveBps)} bp this week. The window for this level may be closing.`
              : `Yields ticked up ${Math.abs(moveBps)} bp this week. Don't blink — short-end is volatile.`,
            `${exempt} interest meaningfully beats a brokered CD of the same maturity once you net taxes.`,
            `Brokered CDs (1y) pay similar headline yield but compound federal+state tax. Treasuries usually win after-tax.`,
          ],
        };
      case "1-5y":
        return {
          headline: `${winnerName} pays ${wYield}% — you're being paid term premium, not just compensated for waiting.`,
          bullets: [
            `Term premium: this rung is ~${(bestRung.yield - m3).toFixed(2)}% over the 3m bill. Modest but real.`,
            `Ladder strategy: split 3y / 5y / 7y to smooth reinvestment risk if you'll roll into new bills as each matures.`,
            `Mark-to-market risk if rates rise: ~5y duration ≈ −5% per +100bp move. Hold to maturity to avoid the issue.`,
          ],
        };
      case "5y+":
        return {
          headline: `${winnerName} pays ${wYield}% — long bonds are the equity-hedge instrument when recession is the dominant risk.`,
          bullets: [
            slopeBps > 0
              ? `Curve is upward — long end pays the most yield, but also carries the most duration risk.`
              : `Even with the inverted curve, the 10y still beats inflation by ${realYield.toFixed(2)}%.`,
            `~9y duration: a 100bp Fed cut historically rallies the 10y by roughly +9%. Convexity cuts both ways.`,
            `Consider TIPS for the long end: same Treasury safety, plus inflation linkage. Insulates against tail-risk CPI surprises.`,
          ],
        };
    }
  }

  if (region === "eu") {
    switch (horizon) {
      case "<3mo":
        return {
          headline: `${winnerName} pays ${wYield}% — daily-liquid EUR exposure to ECB front-end rates.`,
          bullets: [
            `Real yield after ${cpi}% ${cpiTag}: ${realYield.toFixed(2)}%.`,
            slopeBps < 0
              ? `Eurozone curve inverted by ${Math.abs(slopeBps)} bp. Short EUR cash out-yields long Bunds.`
              : `Curve upward by ${slopeBps} bp — front-end ECB cuts have flowed through.`,
            `Eurozone money-market UCITS settle T+2. Effectively no FX risk for euro-based investors.`,
          ],
        };
      case "3-12mo":
        return {
          headline: `${winnerName} locks in ${wYield}% — a defensive parking spot for euro cash through year-end.`,
          bullets: [
            `Bubills and Schatz auctions are open to retail via Finanzagentur with €1 minimums.`,
            `EUR ultrashort UCITS (IS3M.DE) gives you the same exposure with daily liquidity and ETF tax efficiency.`,
            moveBps <= 0
              ? `Yields are drifting lower (${Math.abs(moveBps)} bp w/w). Lock now if you're certain about the duration.`
              : `Yields are ticking up (${Math.abs(moveBps)} bp w/w). Wait a session if you're considering bigger size.`,
          ],
        };
      case "1-5y":
        return {
          headline: `${winnerName} pays ${wYield}% — Bund ladder territory.`,
          bullets: [
            `Term premium: this rung is +${(bestRung.yield - m3).toFixed(2)}% over the 3m bill.`,
            `XY4P.DE (eurozone yield-plus) tilts to higher-yielding sovereigns — captures peripheral spread without taking single-issuer risk.`,
            `Italian BTPs and French OATs pay 30–70bp over Bunds for the same maturity if you're comfortable with redenomination tail risk.`,
          ],
        };
      case "5y+":
        return {
          headline: `${winnerName} pays ${wYield}% — long Bunds are the eurozone deflation hedge.`,
          bullets: [
            slopeBps > 0
              ? `Curve is upward by ${slopeBps} bp — long Bunds price in the term premium.`
              : `Curve flat-to-inverted: long Bunds aren't paying you for duration right now.`,
            `~9y duration on the 10y. ECB cuts historically rally long Bunds disproportionately.`,
            `IBCI.DE (eurozone linkers) is the inflation-hedge sleeve — meaningful at the long end.`,
          ],
        };
    }
  }

  if (region === "uk") {
    switch (horizon) {
      case "<3mo":
        return {
          headline: `${winnerName} pays ${wYield}% — daily-liquid sterling cash at the BoE policy floor.`,
          bullets: [
            `Real yield after ${cpi}% ${cpiTag}: ${realYield.toFixed(2)}%.`,
            slopeBps < 0
              ? `UK curve inverted by ${Math.abs(slopeBps)} bp — short sterling out-yields the 10y gilt.`
              : `Curve upward by ${slopeBps} bp — front-end has eased ahead of the long end.`,
            `Cash ISA at 4.50% is the highest tax-free option for sterling cash if you have allowance left.`,
          ],
        };
      case "3-12mo":
        return {
          headline: `${winnerName} locks in ${wYield}% — front-end gilts plus a CGT exemption.`,
          bullets: [
            `Gilts are CGT-exempt. The coupon is taxable as income, but capital appreciation is not — worth ~25–45bp on after-tax yield.`,
            `Premium Bonds prize-rate ~3.10% is tax-free but variable; consider as a top-up rather than core.`,
            `Fixed-rate bonds (1y, 4.40%) beat gilt yields headline-for-headline — but FSCS-only and fully taxable.`,
          ],
        };
      case "1-5y":
        return {
          headline: `${winnerName} pays ${wYield}% — UK gilt ladder with CGT exemption built in.`,
          bullets: [
            `Term premium: this rung is +${(bestRung.yield - m3).toFixed(2)}% over the 3m bill.`,
            `Low-coupon gilts ("CGT-efficient gilts") have most of their return in capital — particularly tax-efficient for higher-rate payers.`,
            `Cash ISA still wins headline yield (4.50%) — but allowance is capped, so blend.`,
          ],
        };
      case "5y+":
        return {
          headline: `${winnerName} pays ${wYield}% — long gilts are the UK rates trade.`,
          bullets: [
            slopeBps > 0
              ? `Curve upward by ${slopeBps} bp — meaningful term premium on the long end.`
              : `Curve flat or inverted: long gilts aren't paying enough for the duration.`,
            `Index-linked gilts pay 1.40% real — useful if you think UK CPI runs hot for years.`,
            `Long gilts had a 30%+ drawdown in 2022. Convexity cuts both ways; size accordingly.`,
          ],
        };
    }
  }

  // Global
  switch (horizon) {
    case "<3mo":
      return {
        headline: `${winnerName} pays ${wYield}% — diversified front-end exposure across major reserve currencies.`,
        bullets: [
          `Mixed-currency cash basket: USD T-bills + EUR + GBP ultrashorts. No single-currency dependency.`,
          `UCITS wrappers are the most tax-efficient option for non-US/non-UK investors.`,
          `Real yield after ${cpi}% global ${cpiTag}: ${realYield.toFixed(2)}%.`,
        ],
      };
    case "3-12mo":
      return {
        headline: `${winnerName} pays ${wYield}% — global short-bond mix with an inflation overlay.`,
        bullets: [
          moveBps <= 0
            ? `Yields slipped ${Math.abs(moveBps)} bp w/w — global rates trending down.`
            : `Yields ticked up ${Math.abs(moveBps)} bp w/w — short rates re-pricing higher.`,
          `Global Aggregate (AGGU.L) blends sovereigns + IG corporates from G7 issuers.`,
          `Linker sleeve (IBCI.DE) hedges the basket against any region's CPI re-acceleration.`,
        ],
      };
    case "1-5y":
      return {
        headline: `${winnerName} pays ${wYield}% — global IG aggregate at the belly.`,
        bullets: [
          `~7y duration on the global agg — moderate risk, broad credit + currency mix.`,
          `Diversification benefit is real: G7 sovereign correlations fall meaningfully out past 5y.`,
          `Term premium: this rung is +${(bestRung.yield - m3).toFixed(2)}% over the 3m mark.`,
        ],
      };
    case "5y+":
      return {
        headline: `${winnerName} pays ${wYield}% — global haven complex on the long end.`,
        bullets: [
          `Long Treasuries (DTLA.L) are the single-best deflation hedge in the global menu.`,
          `Add a linker sleeve (IBCI.DE) on the other side — covers an inflation tail.`,
          `~17y duration on DTLA: this rallies hardest on Fed cuts; falls hardest if growth + inflation reaccelerate.`,
        ],
      };
  }
}
