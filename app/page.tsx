"use client";

import { useEffect, useMemo, useState } from "react";
import yields from "@/data/yields.json";
import type { Horizon, RegionId, YieldsData } from "@/lib/types";
import { basketFor } from "@/lib/baskets";
import { loadEtoroSession, type EtoroSession } from "@/lib/etoro";

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

const data = yields as unknown as YieldsData;

const STORE_KEY = "tyc-prefs:v1";

interface Prefs {
  horizon: Horizon;
  region: RegionId;
  inflationAdjusted: boolean;
}

const DEFAULTS: Prefs = {
  horizon: "<3mo",
  region: "us",
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

export default function Home() {
  const [horizon, setHorizon] = useState<Horizon>(DEFAULTS.horizon);
  const [region, setRegion] = useState<RegionId>(DEFAULTS.region);
  const [inflationAdjusted, setInflationAdjusted] = useState(DEFAULTS.inflationAdjusted);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [session, setSession] = useState<EtoroSession | null>(null);

  // Restore prefs on mount.
  useEffect(() => {
    const p = loadPrefs();
    setHorizon(p.horizon);
    setRegion(p.region);
    setInflationAdjusted(p.inflationAdjusted);
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({ horizon, region, inflationAdjusted } as Prefs)
      );
    } catch {}
  }, [horizon, region, inflationAdjusted]);

  // Sync session with cross-component custom event.
  useEffect(() => {
    setSession(loadEtoroSession());
    const h = () => setSession(loadEtoroSession());
    window.addEventListener("tyc-etoro-changed", h);
    return () => window.removeEventListener("tyc-etoro-changed", h);
  }, []);

  const basket = useMemo(() => basketFor(horizon, region), [horizon, region]);

  return (
    <>
      <RiskBanner />
      <Header />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
        {/* Top row — region tabs + sources */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <RegionTabs value={region} onChange={setRegion} />
          <LiveSourcesRow generatedAt={data.generatedAt} sources={data.sources} />
        </div>

        {/* Horizon picker + inflation toggle */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
              Horizon
            </span>
            <HorizonPicker value={horizon} onChange={setHorizon} />
          </div>
          <InflationToggle
            on={inflationAdjusted}
            onChange={setInflationAdjusted}
            label={`Inflation-adjusted · CPI ${data.cpiYoy.toFixed(1)}%`}
            hint="Subtract CPI year-over-year from displayed yields"
          />
        </div>

        {/* The folded 55/45 hero */}
        <section className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-4 lg:gap-6 items-stretch">
          {/* LEFT — yield ladder centerpiece */}
          <div className="rounded-lg border border-border bg-surface paper p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-fg-subtle">
                Yield ladder · {region.toUpperCase()}
              </h2>
              <span className="text-[11px] tabular text-fg-subtle">
                Fed Funds {data.fedFunds.toFixed(2)}%
              </span>
            </div>
            <div className="mt-4">
              <YieldLadder
                rungs={data.rungs}
                activeHorizon={horizon}
                inflationAdjusted={inflationAdjusted}
                cpiYoy={data.cpiYoy}
                onRungClick={(r) => setHorizon(r.horizon)}
              />
            </div>
            {/* Sub-vis: live yield curve under the ladder */}
            <div className="mt-5 rounded-md border border-border bg-surface-2 p-3">
              <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-[0.18em] text-fg-subtle">
                <span>Yield curve · today vs last week</span>
                <span className="not-italic text-fg-subtle/80">— prev — today</span>
              </div>
              <YieldCurveChart curve={data.curve} activeHorizon={horizon} />
            </div>
          </div>

          {/* RIGHT — insights + trade CTA */}
          <div className="flex flex-col gap-4">
            <InsightsCard
              horizon={horizon}
              rungs={data.rungs}
              data={data}
              inflationAdjusted={inflationAdjusted}
            />
            <TradeCta
              basket={basket}
              horizon={horizon}
              onTrade={() => setTradeOpen(true)}
            />
          </div>
        </section>

        {/* Comparator table */}
        <div className="mt-6">
          <ComparatorTable rows={data.comparator} activeHorizon={horizon} />
        </div>

        {/* Calculator */}
        <div className="mt-6">
          <Calculator
            rows={data.comparator}
            defaultHorizon={horizon}
            cpiYoy={data.cpiYoy}
          />
        </div>

        {/* Deep history */}
        <div className="mt-6">
          <DeepHistoryChart history={data.history} />
        </div>
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
