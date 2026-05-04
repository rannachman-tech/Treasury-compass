"use client";

import { useEffect, useMemo, useState } from "react";
import yields from "@/data/yields.json";
import type { Horizon, RegionId, YieldsData } from "@/lib/types";
import { basketFor } from "@/lib/baskets";
import { loadEtoroSession, type EtoroSession } from "@/lib/etoro";
import { BUCKETS, type Bucket } from "@/lib/simple";

import { Header } from "@/components/Header";
import { RiskBanner } from "@/components/RiskBanner";
import { Footer } from "@/components/Footer";
import { RegionTabs } from "@/components/RegionTabs";
import { LiveSourcesRow } from "@/components/LiveSourcesRow";
import { HorizonPicker, InflationToggle } from "@/components/HorizonPicker";
import { YieldLadder } from "@/components/YieldLadder";
import { InsightsCard } from "@/components/InsightsCard";
import { TradeCta } from "@/components/TradeCta";
import { TradeModal } from "@/components/TradeModal";
import { ConnectEtoroModal } from "@/components/ConnectEtoroModal";
import { YieldCurveChart } from "@/components/YieldCurveChart";
import { DeepHistoryChart } from "@/components/DeepHistoryChart";
import { ComparatorTable } from "@/components/ComparatorTable";
import { Calculator } from "@/components/Calculator";
import { SimpleHero } from "@/components/SimpleHero";
import type { Mode } from "@/components/ModeToggle";

const data = yields as unknown as YieldsData;

const STORE_KEY = "tyc-prefs:v2";

interface Prefs {
  mode: Mode;
  horizon: Horizon;
  region: RegionId;
  bucket: Bucket;
  amount: number;
  inflationAdjusted: boolean;
}

const DEFAULTS: Prefs = {
  mode: "simple",
  horizon: "<3mo",
  region: "us",
  bucket: "anytime",
  amount: 10000,
  inflationAdjusted: false,
};

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULTS;
  }
}

const HORIZON_TO_BUCKET: Record<Horizon, Bucket> = {
  "<3mo": "anytime",
  "3-12mo": "months",
  "1-5y": "years",
  "5y+": "long",
};

export default function Home() {
  const [mode, setMode] = useState<Mode>(DEFAULTS.mode);
  const [horizon, setHorizon] = useState<Horizon>(DEFAULTS.horizon);
  const [region, setRegion] = useState<RegionId>(DEFAULTS.region);
  const [bucket, setBucket] = useState<Bucket>(DEFAULTS.bucket);
  const [amount, setAmount] = useState<number>(DEFAULTS.amount);
  const [inflationAdjusted, setInflationAdjusted] = useState(DEFAULTS.inflationAdjusted);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [session, setSession] = useState<EtoroSession | null>(null);

  // Restore prefs.
  useEffect(() => {
    const p = loadPrefs();
    setMode(p.mode);
    setHorizon(p.horizon);
    setRegion(p.region);
    setBucket(p.bucket);
    setAmount(p.amount);
    setInflationAdjusted(p.inflationAdjusted);
  }, []);

  // Persist.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({ mode, horizon, region, bucket, amount, inflationAdjusted } as Prefs)
      );
    } catch {}
  }, [mode, horizon, region, bucket, amount, inflationAdjusted]);

  // eToro session sync.
  useEffect(() => {
    setSession(loadEtoroSession());
    const h = () => setSession(loadEtoroSession());
    window.addEventListener("tyc-etoro-changed", h);
    return () => window.removeEventListener("tyc-etoro-changed", h);
  }, []);

  const regionData = data.regions[region];
  const basket = useMemo(() => basketFor(horizon, region), [horizon, region]);

  // Keep horizon and bucket in sync when toggling modes.
  function changeBucket(b: Bucket) {
    setBucket(b);
    setHorizon(BUCKETS.find((x) => x.id === b)!.horizon);
  }
  function changeHorizon(h: Horizon) {
    setHorizon(h);
    setBucket(HORIZON_TO_BUCKET[h]);
  }

  return (
    <>
      <RiskBanner />
      <Header mode={mode} onModeChange={setMode} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
        {/* Top row — region tabs + sources (both modes) */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <RegionTabs value={region} onChange={setRegion} />
          <LiveSourcesRow generatedAt={data.generatedAt} sources={regionData.sources} />
        </div>

        {mode === "simple" ? (
          <div className="mt-5">
            <SimpleHero
              region={region}
              regionData={regionData}
              bucket={bucket}
              amount={amount}
              onBucketChange={changeBucket}
              onAmountChange={setAmount}
              onHorizonSync={(h) => setHorizon(h)}
              onTrade={() => setTradeOpen(true)}
            />
          </div>
        ) : (
          <ProView
            region={region}
            regionData={regionData}
            horizon={horizon}
            inflationAdjusted={inflationAdjusted}
            onHorizonChange={changeHorizon}
            onInflationChange={setInflationAdjusted}
            onTrade={() => setTradeOpen(true)}
          />
        )}
      </main>

      <Footer />

      <TradeModal
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        basket={basket}
        session={session}
        onAskConnect={() => {
          setTradeOpen(false);
          setConnectOpen(true);
        }}
      />
      <ConnectEtoroModal open={connectOpen} onClose={() => setConnectOpen(false)} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pro view — the original dense composition
// ─────────────────────────────────────────────────────────────────────

interface ProProps {
  region: RegionId;
  regionData: YieldsData["regions"][RegionId];
  horizon: Horizon;
  inflationAdjusted: boolean;
  onHorizonChange: (h: Horizon) => void;
  onInflationChange: (v: boolean) => void;
  onTrade: () => void;
}

function ProView({
  region,
  regionData,
  horizon,
  inflationAdjusted,
  onHorizonChange,
  onInflationChange,
  onTrade,
}: ProProps) {
  const basket = useMemo(() => basketFor(horizon, region), [horizon, region]);

  return (
    <>
      {/* Horizon picker + inflation toggle */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
            Horizon
          </span>
          <HorizonPicker value={horizon} onChange={onHorizonChange} />
        </div>
        <InflationToggle
          on={inflationAdjusted}
          onChange={onInflationChange}
          label={`Inflation-adjusted · ${regionData.cpiLabel} ${regionData.cpiYoy.toFixed(1)}%`}
          hint={`Subtract ${regionData.cpiLabel} year-over-year from displayed yields`}
        />
      </div>

      {/* The folded 55/45 hero */}
      <section className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-4 lg:gap-6 items-stretch">
        <div className="rounded-lg border border-border bg-surface paper p-4 sm:p-5 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-fg-subtle">
              Yield ladder · {region.toUpperCase()} · {regionData.currency}
            </h2>
            <span className="text-[11px] tabular text-fg-subtle">
              {regionData.policyRateLabel} {regionData.policyRate.toFixed(2)}%
            </span>
          </div>
          <div className="mt-4">
            <YieldLadder
              rungs={regionData.rungs}
              activeHorizon={horizon}
              inflationAdjusted={inflationAdjusted}
              cpiYoy={regionData.cpiYoy}
              onRungClick={(r) => onHorizonChange(r.horizon)}
            />
          </div>
          <div className="mt-5 rounded-md border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
              <span>Yield curve · today vs last week</span>
              <span className="not-italic text-fg-subtle/80">— prev — today</span>
            </div>
            <YieldCurveChart curve={regionData.curve} activeHorizon={horizon} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <InsightsCard
            region={region}
            horizon={horizon}
            regionData={regionData}
            inflationAdjusted={inflationAdjusted}
          />
          <TradeCta
            basket={basket}
            horizon={horizon}
            regionData={regionData}
            onTrade={onTrade}
          />
        </div>
      </section>

      <div className="mt-6">
        <ComparatorTable rows={regionData.comparator} activeHorizon={horizon} />
      </div>

      <div className="mt-6">
        <Calculator
          rows={regionData.comparator}
          defaultHorizon={horizon}
          regionData={regionData}
        />
      </div>

      <div className="mt-6">
        <DeepHistoryChart history={regionData.history} policyRateLabel={regionData.policyRateLabel} />
      </div>
    </>
  );
}
