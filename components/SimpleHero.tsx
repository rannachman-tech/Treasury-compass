"use client";

import { useEffect, useMemo } from "react";
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
import { AnimatedCounter } from "@/components/AnimatedCounter";
import {
  Calendar, Clock, Layers, MountainSnow, ShieldCheck, ExternalLink,
  type LucideIcon,
} from "lucide-react";

interface Props {
  region: RegionId;
  regionData: RegionData;
  bucket: Bucket;
  amount: number;
  onBucketChange: (b: Bucket) => void;
  onAmountChange: (a: number) => void;
  onHorizonSync: (h: Horizon) => void;
  onTrade: () => void;
}

const BUCKET_ICONS: Record<Bucket, LucideIcon> = {
  anytime: Clock,
  months:  Calendar,
  years:   Layers,
  long:    MountainSnow,
};

const QUICK_AMOUNTS = [1000, 10000, 50000];

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

  // Sync horizon back to the parent so Pro mode stays consistent.
  useEffect(() => {
    onHorizonSync(horizon);
  }, [horizon, onHorizonSync]);

  return (
    <div className="space-y-8">
      {/* ─── HERO — split: inputs ⬌ live answer ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-5 lg:gap-7 items-stretch">
        {/* LEFT — inputs */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="eyebrow">When will you need this money?</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {BUCKETS.map((b) => {
                const Icon = BUCKET_ICONS[b.id];
                const active = b.id === bucket;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onBucketChange(b.id)}
                    aria-pressed={active}
                    className={[
                      "card card-lift text-left p-3.5 transition-all",
                      active ? "card-active" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={18}
                        className={active ? "text-accent" : "text-fg-subtle"}
                      />
                      <div className="min-w-0">
                        <div className={`text-[13.5px] font-semibold ${active ? "text-accent" : "text-fg"}`}>
                          {b.label}
                        </div>
                        <div className="text-[11px] text-fg-subtle">
                          {b.sub}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="eyebrow">How much?</p>
            <div className="mt-2.5 card p-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[20px] sm:text-[22px] text-fg-subtle">{sym}</span>
                <input
                  type="number"
                  min={500}
                  step={500}
                  value={amount}
                  onChange={(e) => onAmountChange(Math.max(500, Number(e.target.value) || 0))}
                  className="w-full bg-transparent tabular text-[26px] sm:text-[32px] font-semibold text-fg outline-none"
                  aria-label="Amount"
                />
              </div>
              <input
                type="range"
                min={500}
                max={250000}
                step={500}
                value={Math.min(250000, amount)}
                onChange={(e) => onAmountChange(Number(e.target.value))}
                className="mt-3 h-1 w-full accent-accent"
              />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {QUICK_AMOUNTS.map((v) => {
                  const active = v === amount;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onAmountChange(v)}
                      className={[
                        "rounded-full border px-2.5 py-1 text-[11.5px] tabular transition-colors",
                        active
                          ? "border-accent/60 bg-accent/12 text-accent"
                          : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
                      ].join(" ")}
                    >
                      {sym}{v.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — live answer */}
        <RecommendationCard
          key={`${region}-${bucket}-${amount}`}
          regionData={regionData}
          bestRungName={bestRung.winner.name}
          coverage={bestRung.winner.coverage}
          yieldPct={bestRung.yield}
          amount={amount}
          futureValue={futureValue}
          gain={gain}
          years={years}
          temperature={temp}
          plainName={plainEnglishName(bestRung.winner)}
          lockupLine={plainEnglishLockup(bestRung.winner, bucket)}
          taxLine={plainEnglishTax(bestRung.winner)}
          catchLine={plainEnglishCatch(bestRung.winner)}
          basket={basketFor(horizon, region)}
          onTrade={onTrade}
        />
      </section>

      {/* ─── ALTERNATIVES — horizontal cards ─── */}
      {alternatives.length > 0 && (
        <section className="fade-up" style={{ animationDelay: "120ms" }}>
          <p className="eyebrow">Other picks at the same horizon</p>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {alternatives.map((alt) => {
              const altValue = projectValue(amount, alt.apy, years);
              const delta = altValue - futureValue;
              return (
                <div key={alt.vehicle} className="card card-lift p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-fg truncate" title={alt.vehicle}>
                      {alt.vehicle}
                    </span>
                    <span className="tabular text-[11px] text-fg-subtle">{alt.apy.toFixed(2)}%</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-fg-subtle">
                    {alt.coverage === "Treasury" || alt.coverage === "Sovereign"
                      ? "Government-backed"
                      : alt.coverage === "FDIC" || alt.coverage === "FSCS" || alt.coverage === "Deposit-EU"
                      ? "Bank-backed"
                      : alt.coverage === "MMF"
                      ? "Money-market"
                      : "Market-priced"}
                    {" · "}
                    {alt.lockup}
                  </p>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="tabular text-[18px] font-semibold text-fg">
                      {sym}{Math.round(altValue).toLocaleString()}
                    </span>
                    <span
                      className={[
                        "tabular text-[10.5px] font-medium",
                        delta >= 0 ? "text-positive" : "text-fg-subtle",
                      ].join(" ")}
                    >
                      {delta >= 0 ? "+" : "−"}{sym}{Math.abs(Math.round(delta)).toLocaleString()} vs best
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── SAFETY LANE MAP ─── */}
      <section className="fade-up" style={{ animationDelay: "200ms" }}>
        <SafetyLaneMap
          rows={regionData.comparator}
          highlightVehicle={bestRung.winner.name}
        />
      </section>

      {/* Pro hint */}
      <p className="text-center text-[11.5px] text-fg-subtle">
        Want every detail — full curve, comparator table, tax-adjusted calculator?
        Switch to <span className="font-semibold text-fg-muted">Pro mode</span> in the header.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Recommendation card — the always-visible answer
// ─────────────────────────────────────────────────────────────────────

interface RecommendationCardProps {
  regionData: RegionData;
  bestRungName: string;
  coverage: string;
  yieldPct: number;
  amount: number;
  futureValue: number;
  gain: number;
  years: number;
  temperature: ReturnType<typeof rateTemperature>;
  plainName: string;
  lockupLine: string;
  taxLine: string;
  catchLine: string;
  basket: Basket;
  onTrade: () => void;
}

function RecommendationCard({
  regionData,
  bestRungName,
  coverage,
  yieldPct,
  amount,
  futureValue,
  gain,
  years,
  temperature,
  plainName,
  lockupLine,
  taxLine,
  catchLine,
  basket,
  onTrade,
}: RecommendationCardProps) {
  const sym = currencySymbol(regionData.currency);

  return (
    <div className="card card-active p-5 sm:p-6 flex flex-col gap-4 fade-up">
      {/* Top badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/12 border border-accent/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
          ★ Best pick
        </span>
        <SafetyBadge coverage={coverage} />
        <RateTemperature {...temperature} />
      </div>

      {/* Title */}
      <div>
        <h2 className="display text-[26px] sm:text-[32px] font-semibold leading-tight text-fg">
          {bestRungName}
        </h2>
        <p className="mt-1 text-[13px] text-fg-muted">
          {plainName} · paying <span className="tabular font-medium text-fg">{yieldPct.toFixed(2)}%</span>
        </p>
      </div>

      {/* Hero number */}
      <div>
        <p className="text-[12px] text-fg-subtle">
          {sym}{amount.toLocaleString()} grows to
        </p>
        <div className="mt-1 flex items-baseline gap-3 flex-wrap">
          <AnimatedCounter
            value={futureValue}
            prefix={sym}
            className="display text-[40px] sm:text-[52px] font-semibold leading-none text-positive"
          />
          <span className="text-[13px] text-fg-subtle">
            over {humanYears(years)} ·{" "}
            <span className="tabular text-positive font-medium">+{sym}{Math.round(gain).toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Growth curve */}
      <GrowthCurve
        amount={amount}
        yield={yieldPct}
        years={years}
        currency={regionData.currency}
      />

      {/* Plain-English summary line */}
      <p className="text-[13px] text-fg-muted leading-snug">
        Get money back <span className="font-medium text-fg">{lockupLine.toLowerCase()}</span>.
        {" "}
        <span className="font-medium text-fg">{taxLine}</span>.
        {" "}
        Catch: <span className="text-fg">{catchLine.toLowerCase()}</span>.
      </p>

      {/* CTA */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onTrade}
          className="btn-primary inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-[13.5px]"
        >
          Buy on eToro <ExternalLink size={14} />
        </button>
        <span className="text-[11px] text-fg-subtle">
          via <span className="font-medium text-fg-muted">{basket.holdings.map((h) => h.ticker).join(" · ")}</span>
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

function SafetyBadge({ coverage }: { coverage: string }) {
  const isGov = coverage === "Treasury" || coverage === "Sovereign";
  const isBank = coverage === "FDIC" || coverage === "FSCS" || coverage === "Deposit-EU";
  const cls = isGov || isBank
    ? "border-positive/35 bg-positive/12 text-positive"
    : coverage === "None"
    ? "border-danger/30 bg-danger/12 text-danger"
    : "border-warn/35 bg-warn/12 text-warn";
  const label = isGov ? "Government-backed" : isBank ? "Bank-backed"
    : coverage === "MMF" ? "Money-market"
    : coverage === "None" ? "Uninsured"
    : coverage;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cls}`}>
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
  const H = 110;
  const PAD = { l: 6, r: 6, t: 6, b: 22 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const xAt = (t: number) => PAD.l + (t / years) * innerW;
  const yAt = (v: number) =>
    PAD.t + innerH - ((v - min) / Math.max(0.01, max - min)) * innerH;

  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(p.t).toFixed(2)} ${yAt(p.v).toFixed(2)}`).join(" ");
  const areaD = `${d} L ${xAt(years).toFixed(2)} ${(PAD.t + innerH).toFixed(2)} L ${xAt(0).toFixed(2)} ${(PAD.t + innerH).toFixed(2)} Z`;

  // Mark a few intermediate dates
  const ticks = years <= 1 ? [0, years] : years <= 3 ? [0, 1, years] : [0, Math.floor(years / 2), years];
  const lblYear = (t: number) => (t === 0 ? "today" : t < 1 ? `${Math.round(t * 12)}m` : `${t}y`);

  // Approximate path length (used for draw-line keyframe).
  const drawLen = useMemo(() => {
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = xAt(pts[i].t) - xAt(pts[i - 1].t);
      const dy = yAt(pts[i].v) - yAt(pts[i - 1].v);
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return Math.ceil(len) + 20;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, yieldPct, years]);

  // Re-key so the line redraws when inputs change
  const animKey = `${amount}-${yieldPct}-${years}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="block w-full h-[110px]"
      role="img"
      aria-label={`Growth curve to ${currency} ${Math.round(max).toLocaleString()}`}
    >
      <defs>
        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgb(var(--positive))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(var(--positive))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Subtle horizontal baseline */}
      <line
        x1={PAD.l} y1={PAD.t + innerH}
        x2={W - PAD.r} y2={PAD.t + innerH}
        stroke="rgb(var(--border))" strokeWidth="0.5"
      />

      <path d={areaD} fill="url(#growthFill)" />
      <path
        key={animKey}
        d={d}
        stroke="rgb(var(--positive))"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        className="draw-line"
        style={{ "--draw-len": `${drawLen}` } as React.CSSProperties}
      />
      <circle cx={xAt(years)} cy={yAt(max)} r="3.5" fill="rgb(var(--positive))" />

      {ticks.map((t, i) => (
        <text
          key={i}
          x={xAt(t)}
          y={H - 4}
          fontSize="9.5"
          fill="rgb(var(--fg-subtle))"
          textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
        >
          {lblYear(t)}
        </text>
      ))}
    </svg>
  );
}

function humanYears(years: number): string {
  if (years < 1) return `${Math.round(years * 12)} months`;
  if (years === 1) return "1 year";
  return `${years} years`;
}
