"use client";

import { useEffect, useMemo, useState } from "react";
import type { Basket } from "@/lib/baskets";
import { basketFor } from "@/lib/baskets";
import type { Horizon, RegionData, RegionId } from "@/lib/types";
import {
  alternativesFor,
  bestRungForBucket,
  BUCKETS,
  bucketYears,
  currencySymbol,
  fmtMoney,
  growthPoints,
  plainEnglishCatch,
  plainEnglishLockup,
  plainEnglishName,
  plainEnglishTax,
  projectValue,
  rateTemperature,
  type Bucket,
} from "@/lib/simple";

import { SafetyLaneMap } from "@/components/SafetyLaneMap";
import { RateTemperature } from "@/components/RateTemperature";
import { Calendar, Clock, Layers, MountainSnow, ShieldCheck, ChevronRight, ExternalLink } from "lucide-react";

interface Props {
  region: RegionId;
  regionData: RegionData;
  bucket: Bucket;
  amount: number;
  onBucketChange: (b: Bucket) => void;
  onAmountChange: (a: number) => void;
  /** When the user picks a horizon here, sync it back to the page state
   *  so Pro mode (and the basket) stays consistent. */
  onHorizonSync: (h: Horizon) => void;
  onTrade: () => void;
}

const BUCKET_ICONS: Record<Bucket, React.ComponentType<{ size?: number; className?: string }>> = {
  anytime: Clock,
  months:  Calendar,
  years:   Layers,
  long:    MountainSnow,
};

export function SimpleHero({
  region,
  regionData,
  bucket,
  amount,
  onBucketChange,
  onAmountChange,
  onHorizonSync,
  onTrade,
}: Props) {
  const horizon = BUCKETS.find((b) => b.id === bucket)!.horizon;
  const bestRung = bestRungForBucket(regionData.rungs, bucket);
  const years = bucketYears(bucket);
  const futureValue = projectValue(amount, bestRung.yield, years);
  const gain = futureValue - amount;
  const sym = currencySymbol(regionData.currency);
  const temp = rateTemperature(regionData.history, bucket, bestRung.yield);
  const alternatives = alternativesFor(bucket, regionData, bestRung.winner.name);

  // Sync horizon back to parent so Pro mode + basket pickup match.
  useEffect(() => {
    onHorizonSync(horizon);
  }, [horizon, onHorizonSync]);

  return (
    <div className="space-y-5">
      {/* Step 1 — bucket picker */}
      <section>
        <StepLabel n={1} text="When will you need this money?" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BUCKETS.map((b) => {
            const Icon = BUCKET_ICONS[b.id];
            const active = b.id === bucket;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onBucketChange(b.id)}
                className={[
                  "group rounded-lg border p-3 sm:p-4 text-center transition-all",
                  active
                    ? "border-accent bg-accent/10 ring-1 ring-accent/40"
                    : "border-border bg-surface hover:border-border-strong",
                ].join(" ")}
                aria-pressed={active}
              >
                <Icon
                  size={22}
                  className={`mx-auto ${active ? "text-accent" : "text-fg-muted group-hover:text-fg"}`}
                />
                <div
                  className={`mt-1.5 text-[13px] font-medium ${active ? "text-accent" : "text-fg"}`}
                >
                  {b.label}
                </div>
                <div
                  className={`text-[11px] ${active ? "text-accent/80" : "text-fg-subtle"}`}
                >
                  {b.sub}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2 — amount */}
      <section>
        <StepLabel n={2} text="How much?" />
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3 sm:p-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[20px] sm:text-[22px] text-fg-muted">{sym}</span>
            <input
              type="number"
              min={500}
              step={500}
              value={amount}
              onChange={(e) =>
                onAmountChange(Math.max(500, Number(e.target.value) || 0))
              }
              className="w-32 sm:w-40 bg-transparent tabular text-[22px] sm:text-[28px] font-semibold text-fg outline-none"
            />
          </div>
          <input
            type="range"
            min={500}
            max={250000}
            step={500}
            value={Math.min(250000, amount)}
            onChange={(e) => onAmountChange(Number(e.target.value))}
            className="h-1 flex-1 accent-accent"
            style={{ minWidth: "180px" }}
          />
          <div className="flex flex-wrap gap-1.5">
            {[1000, 10000, 50000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onAmountChange(v)}
                className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-surface-2"
              >
                {sym}
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendation card */}
      <section className="rounded-lg border-2 border-accent/40 bg-gradient-to-br from-accent/8 to-transparent p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-px text-[10px] font-medium uppercase tracking-wider text-accent">
            Best pick
          </span>
          <SafetyBadge coverage={bestRung.winner.coverage} />
          <RateTemperature {...temp} />
        </div>

        <h2 className="mt-3 text-[18px] sm:text-[20px] font-semibold text-fg">
          {bestRung.winner.name}
        </h2>
        <p className="mt-0.5 text-[12.5px] text-fg-muted">
          {plainEnglishName(bestRung.winner)}
        </p>

        {/* The hero number */}
        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          <span className="text-[12.5px] text-fg-muted">
            {fmtMoney(amount, regionData.currency)} grows to
          </span>
          <span className="tabular text-[28px] sm:text-[34px] font-semibold text-positive">
            {fmtMoney(futureValue, regionData.currency)}
          </span>
          <span className="text-[12.5px] text-fg-subtle">
            over {humanYears(years)} ·{" "}
            <span className="tabular text-positive">+{fmtMoney(gain, regionData.currency)}</span>
          </span>
        </div>

        {/* Growth curve */}
        <div className="mt-3">
          <GrowthCurve amount={amount} yield={bestRung.yield} years={years} currency={regionData.currency} />
        </div>

        {/* 3 facts */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Fact label="Get money back" value={plainEnglishLockup(bestRung.winner, bucket)} />
          <Fact label="Tax" value={plainEnglishTax(bestRung.winner)} />
          <Fact label="Catch" value={plainEnglishCatch(bestRung.winner)} />
        </div>

        {/* CTA */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTrade}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-[13px] font-semibold text-bg hover:brightness-110 active:scale-[0.99]"
          >
            Buy on eToro <ExternalLink size={13} />
          </button>
          <span className="text-[11px] text-fg-subtle">
            via{" "}
            <span className="font-medium text-fg-muted">
              {basketSummary(basketFor(horizon, region))}
            </span>
          </span>
        </div>
      </section>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <section>
          <StepLabel n={3} text="Alternatives at the same horizon" />
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {alternatives.map((alt) => {
              const altValue = projectValue(amount, alt.apy, years);
              return (
                <div
                  key={alt.vehicle}
                  className="rounded-md border border-border bg-surface p-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[13px] font-medium text-fg">{alt.vehicle}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-fg-subtle truncate" title={alt.taxes}>
                    {alt.coverage === "Treasury" || alt.coverage === "Sovereign"
                      ? "Government-backed"
                      : alt.coverage === "FDIC" || alt.coverage === "FSCS" || alt.coverage === "Deposit-EU"
                      ? "Bank-backed"
                      : alt.coverage === "MMF"
                      ? "Money-market"
                      : "Market-priced"}
                  </p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-[10.5px] font-mono uppercase tracking-wider text-fg-subtle">
                      Grows to
                    </span>
                    <span className="tabular text-[15px] font-semibold text-fg">
                      {fmtMoney(altValue, regionData.currency)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between text-[10.5px]">
                    <span className="text-fg-subtle">{alt.lockup}</span>
                    <span className="tabular text-fg-muted">{alt.apy.toFixed(2)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Safety map */}
      <section>
        <SafetyLaneMap rows={regionData.comparator} highlightVehicle={bestRung.winner.name} />
      </section>

      {/* Pro hint */}
      <p className="text-[11px] text-fg-subtle text-center">
        Want every detail — full curve, comparator table, tax-adjusted calculator?
        Switch to <span className="font-medium text-fg-muted">Pro mode</span> in the header.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function StepLabel({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-surface-2 text-[10px] font-mono text-fg-subtle">
        {n}
      </span>
      <h3 className="text-[14px] sm:text-[15px] font-semibold text-fg">{text}</h3>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-2.5">
      <div className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-fg-subtle">
        {label}
      </div>
      <div className="mt-0.5 text-[12.5px] font-medium text-fg leading-snug">{value}</div>
    </div>
  );
}

function SafetyBadge({ coverage }: { coverage: string }) {
  const isGov =
    coverage === "Treasury" || coverage === "Sovereign";
  const isBank =
    coverage === "FDIC" || coverage === "FSCS" || coverage === "Deposit-EU";
  const cls = isGov
    ? "border-positive/40 bg-positive/15 text-positive"
    : isBank
    ? "border-positive/30 bg-positive/10 text-positive"
    : coverage === "None"
    ? "border-danger/30 bg-danger/10 text-danger"
    : "border-warn/30 bg-warn/10 text-warn";
  const label = isGov
    ? "Government-backed"
    : isBank
    ? "Bank-backed"
    : coverage === "MMF"
    ? "Money-market"
    : coverage === "None"
    ? "Uninsured"
    : coverage;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-px text-[10px] font-medium uppercase tracking-wider ${cls}`}
    >
      <ShieldCheck size={11} />
      {label}
    </span>
  );
}

function GrowthCurve({
  amount,
  yield: yieldPct,
  years,
  currency,
}: {
  amount: number;
  yield: number;
  years: number;
  currency: RegionData["currency"];
}) {
  const pts = useMemo(() => growthPoints(amount, yieldPct, years), [amount, yieldPct, years]);
  const min = amount;
  const max = pts[pts.length - 1].v;
  const W = 600;
  const H = 90;
  const PAD = { l: 0, r: 4, t: 4, b: 18 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const x = (t: number) => PAD.l + (t / years) * innerW;
  const y = (v: number) => PAD.t + innerH - ((v - min) / Math.max(0.01, max - min)) * innerH;

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t).toFixed(2)} ${y(p.v).toFixed(2)}`).join(" ");
  const areaD = `${d} L ${x(years).toFixed(2)} ${(PAD.t + innerH).toFixed(2)} L ${x(0).toFixed(2)} ${(PAD.t + innerH).toFixed(2)} Z`;

  const ticks = years <= 1
    ? [0, years / 2, years]
    : years <= 3
    ? [0, 1, years / 2, years]
    : [0, 1, Math.round(years / 2), years];

  const lblYear = (t: number) => (t === 0 ? "today" : t < 1 ? `${Math.round(t * 12)}m` : `${t}y`);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Projected growth"
    >
      <defs>
        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--positive))" stopOpacity="0.18" />
          <stop offset="100%" stopColor="rgb(var(--positive))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#growthFill)" />
      <path d={d} stroke="rgb(var(--positive))" strokeWidth="1.5" fill="none" />
      <circle cx={x(years)} cy={y(max)} r="3" fill="rgb(var(--positive))" />
      {ticks.map((t, i) => (
        <text
          key={i}
          x={x(t)}
          y={H - 4}
          fontSize="9"
          fill="rgb(var(--fg-subtle))"
          textAnchor={t === 0 ? "start" : t === years ? "end" : "middle"}
        >
          {lblYear(t)}
        </text>
      ))}
    </svg>
  );
}

function basketSummary(b: Basket): string {
  return b.holdings.map((h) => `${h.ticker} ${h.weight}%`).join(" + ");
}

function humanYears(years: number): string {
  if (years < 1) return `${Math.round(years * 12)} months`;
  if (years === 1) return "1 year";
  return `${years} years`;
}
