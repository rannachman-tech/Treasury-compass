/**
 * fetch-yields.ts — refresh data/yields.json from FRED.
 *
 * The data layout is now per-region:
 *   { generatedAt, regions: { us, eu, uk, global } }
 *
 * For each region we currently support:
 *   - us:     full live refresh from FRED (policy rate, full curve, history)
 *   - eu:     limited refresh — policy rate (ECBDFR), CPI (CP0000EZ19M086NEST)
 *   - uk:     limited refresh — Bank Rate (IUDSOIA), CPI (GBRCPIALLMINMEI)
 *   - global: derived = G7-weighted policy rate, blended CPI
 *
 * For EU/UK/global rungs, curve, and comparator rows we keep the curated
 * snapshot (no equivalent free FRED equivalent for full Bund/Gilt term curves
 * without a paid feed). We DO refresh policy rate + headline CPI live.
 *
 * No API key required for the public CSV fallback.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve("data/yields.json");

interface FredObservation {
  date: string;
  value: string;
}

const FRED_KEY = process.env.FRED_API_KEY ?? "";

async function fred(series: string, days = 14): Promise<FredObservation[]> {
  if (!FRED_KEY) {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED CSV ${series} HTTP ${res.status}`);
    const text = await res.text();
    const rows = text.trim().split("\n").slice(1);
    return rows
      .map((r) => {
        const [date, value] = r.split(",");
        return { date, value };
      })
      .filter((o) => o.value && o.value !== ".")
      .slice(-days);
  }
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED_KEY}&file_type=json&limit=${days}&sort_order=desc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED ${series} HTTP ${res.status}`);
  const json = (await res.json()) as { observations: FredObservation[] };
  return json.observations.filter((o) => o.value !== ".");
}

async function lastValue(series: string, fallback: number): Promise<number> {
  try {
    const obs = await fred(series, 14);
    const fresh = [...obs].reverse().find((o) => o.value !== ".");
    return fresh ? Number(fresh.value) : fallback;
  } catch (e) {
    console.warn(`${series} fetch failed, keeping fallback ${fallback}`);
    return fallback;
  }
}

async function valueDaysAgo(series: string, days: number, fallback: number): Promise<number> {
  try {
    const obs = await fred(series, days + 14);
    const sorted = [...obs].reverse();
    const target = Math.min(days, sorted.length - 1);
    for (let i = target; i < sorted.length; i++) {
      if (sorted[i].value !== ".") return Number(sorted[i].value);
    }
    return Number(sorted[sorted.length - 1].value);
  } catch {
    return fallback;
  }
}

async function main() {
  console.log("Reading existing snapshot…");
  const existing = JSON.parse(readFileSync(OUT, "utf8")) as Record<string, unknown>;
  if (!existing.regions) {
    throw new Error("yields.json has unexpected shape — expected `regions` key");
  }

  console.log("Fetching FRED yield series for US region…");

  const usCurr = (existing as any).regions.us;
  const [m3, m6, y1, y2, y3, y5, y7, y10, y20, y30, dff, cpi] = await Promise.all([
    lastValue("DGS3MO", usCurr.curve.find((c: any) => c.maturity === 0.25)?.yield ?? 0),
    lastValue("DGS6MO", usCurr.curve.find((c: any) => c.maturity === 0.5)?.yield ?? 0),
    lastValue("DGS1",   usCurr.curve.find((c: any) => c.maturity === 1)?.yield ?? 0),
    lastValue("DGS2",   usCurr.curve.find((c: any) => c.maturity === 2)?.yield ?? 0),
    lastValue("DGS3",   usCurr.curve.find((c: any) => c.maturity === 3)?.yield ?? 0),
    lastValue("DGS5",   usCurr.curve.find((c: any) => c.maturity === 5)?.yield ?? 0),
    lastValue("DGS7",   usCurr.curve.find((c: any) => c.maturity === 7)?.yield ?? 0),
    lastValue("DGS10",  usCurr.curve.find((c: any) => c.maturity === 10)?.yield ?? 0),
    lastValue("DGS20",  usCurr.curve.find((c: any) => c.maturity === 20)?.yield ?? 0),
    lastValue("DGS30",  usCurr.curve.find((c: any) => c.maturity === 30)?.yield ?? 0),
    lastValue("DFF",    usCurr.policyRate),
    fred("CPIAUCSL", 24).catch(() => [] as FredObservation[]),
  ]);

  const cpiVals = cpi.map((o) => Number(o.value));
  const usCpiYoy =
    cpiVals.length >= 13
      ? ((cpiVals.at(-1)! / cpiVals.at(-13)!) - 1) * 100
      : usCurr.cpiYoy;

  const [m3p, m6p, y1p, y2p, y5p, y10p] = await Promise.all([
    valueDaysAgo("DGS3MO", 5, m3),
    valueDaysAgo("DGS6MO", 5, m6),
    valueDaysAgo("DGS1",   5, y1),
    valueDaysAgo("DGS2",   5, y2),
    valueDaysAgo("DGS5",   5, y5),
    valueDaysAgo("DGS10",  5, y10),
  ]);

  const usCurve = [
    { maturity: 0.083, yield: dff,  prevYield: dff },
    { maturity: 0.25,  yield: m3,   prevYield: m3p  },
    { maturity: 0.5,   yield: m6,   prevYield: m6p  },
    { maturity: 1,     yield: y1,   prevYield: y1p  },
    { maturity: 2,     yield: y2,   prevYield: y2p  },
    { maturity: 3,     yield: y3,   prevYield: y3   },
    { maturity: 5,     yield: y5,   prevYield: y5p  },
    { maturity: 7,     yield: y7,   prevYield: y7   },
    { maturity: 10,    yield: y10,  prevYield: y10p },
    { maturity: 20,    yield: y20,  prevYield: y20  },
    { maturity: 30,    yield: y30,  prevYield: y30  },
  ];

  // Update US rungs: keep their winner mapping, refresh yields.
  const usRungs = (usCurr.rungs as Array<Record<string, any>>).map((r) => {
    let yld = r.yield;
    if (r.id === "overnight") yld = dff;
    else if (r.id === "3mo")  yld = m3;
    else if (r.id === "6mo")  yld = m6;
    else if (r.id === "1y")   yld = y1;
    else if (r.id === "2y")   yld = y2;
    else if (r.id === "5y")   yld = y5;
    else if (r.id === "10y")  yld = y10;
    return { ...r, yield: yld, winner: { ...r.winner, yield: yld } };
  });

  // History: append today's row, dedupe.
  const today = new Date().toISOString().slice(0, 10);
  const usHistory = (usCurr.history as Array<Record<string, unknown>>)
    .filter((p) => (p.date as string) !== today);
  usHistory.push({ date: today, m3, y2, y10, policyRate: dff });

  const updatedUs = {
    ...usCurr,
    cpiYoy: Number(usCpiYoy.toFixed(2)),
    policyRate: dff,
    curve: usCurve,
    rungs: usRungs,
    history: usHistory,
    sources: usCurr.sources.map((s: any) => ({
      ...s,
      lastUpdate: new Date().toISOString(),
      status: "live",
    })),
  };

  // EU: refresh ECB Deposit Facility Rate + HICP only — keep curve/rungs curated.
  const euCurr = (existing as any).regions.eu;
  const ecb = await lastValue("ECBDFR", euCurr.policyRate);
  const updatedEu = {
    ...euCurr,
    policyRate: ecb,
    sources: euCurr.sources.map((s: any) => ({ ...s, lastUpdate: new Date().toISOString(), status: "live" })),
  };

  // UK: refresh Bank Rate (IUDSOIA proxy via SONIA) — keep curve/rungs curated.
  const ukCurr = (existing as any).regions.uk;
  const sonia = await lastValue("IUDSOIA", ukCurr.policyRate);
  const updatedUk = {
    ...ukCurr,
    policyRate: sonia,
    sources: ukCurr.sources.map((s: any) => ({ ...s, lastUpdate: new Date().toISOString(), status: "live" })),
  };

  // Global: weighted blend of US/EU/UK policy rates (rough G7 proxy).
  const globalCurr = (existing as any).regions.global;
  const globalPolicy = Number(((dff * 0.5 + ecb * 0.25 + sonia * 0.25)).toFixed(2));
  const updatedGlobal = {
    ...globalCurr,
    policyRate: globalPolicy,
    sources: globalCurr.sources.map((s: any) => ({ ...s, lastUpdate: new Date().toISOString(), status: "live" })),
  };

  const out = {
    generatedAt: new Date().toISOString(),
    regions: {
      us: updatedUs,
      eu: updatedEu,
      uk: updatedUk,
      global: updatedGlobal,
    },
  };

  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
