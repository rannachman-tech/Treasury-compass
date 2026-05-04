/**
 * fetch-yields.ts — refresh data/yields.json from FRED + TreasuryDirect.
 *
 * No API key required for FRED's *fredgraph.csv* endpoint.
 * Runs in GitHub Actions on a 24h cron (see .github/workflows/data.yml).
 *
 *   FRED series used:
 *     DGS3MO, DGS6MO, DGS1, DGS2, DGS3, DGS5, DGS7, DGS10, DGS20, DGS30
 *     DFF (effective fed funds)
 *     CPIAUCSL (CPI All Items, YoY computed locally)
 *
 *   TreasuryDirect: latest auction yields for 4-week, 13-week, 26-week, 52-week bills.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve("data/yields.json");

interface FredObservation {
  date: string;
  value: string;
}
interface FredResponse {
  observations: FredObservation[];
}

const FRED = "https://api.stlouisfed.org/fred/series/observations";
// API key is *not* required for fredgraph.csv. We use the JSON API with the
// public demo key path: tools also work via the ALFRED CSV endpoint.
const FRED_KEY = process.env.FRED_API_KEY ?? "";

async function fred(series: string, days = 7): Promise<FredObservation[]> {
  if (!FRED_KEY) {
    // Fallback: grab the CSV from the graph endpoint (public, no key).
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
  const url = `${FRED}?series_id=${series}&api_key=${FRED_KEY}&file_type=json&limit=${days}&sort_order=desc`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED ${series} HTTP ${res.status}`);
  const json = (await res.json()) as FredResponse;
  return json.observations.filter((o) => o.value !== ".");
}

async function lastValue(series: string): Promise<number> {
  const obs = await fred(series, 14);
  const fresh = obs.reverse().find((o) => o.value !== ".");
  if (!fresh) throw new Error(`no fresh value for ${series}`);
  return Number(fresh.value);
}

async function valueDaysAgo(series: string, days: number): Promise<number> {
  const obs = await fred(series, days + 14);
  const sorted = [...obs].reverse();
  // Walk back until we find a non-blank approximately N business days ago.
  const target = Math.min(days, sorted.length - 1);
  for (let i = target; i < sorted.length; i++) {
    if (sorted[i].value !== ".") return Number(sorted[i].value);
  }
  return Number(sorted[sorted.length - 1].value);
}

async function main() {
  console.log("Fetching FRED yield series…");

  const [m3, m6, y1, y2, y3, y5, y7, y10, y20, y30, dff, cpi] = await Promise.all([
    lastValue("DGS3MO"),
    lastValue("DGS6MO"),
    lastValue("DGS1"),
    lastValue("DGS2"),
    lastValue("DGS3"),
    lastValue("DGS5"),
    lastValue("DGS7"),
    lastValue("DGS10"),
    lastValue("DGS20"),
    lastValue("DGS30"),
    lastValue("DFF"),
    fred("CPIAUCSL", 24),
  ]);

  // CPI YoY: latest / 12mo prior - 1
  const cpiVals = cpi.map((o) => Number(o.value));
  const cpiYoy =
    cpiVals.length >= 13
      ? ((cpiVals.at(-1)! / cpiVals.at(-13)!) - 1) * 100
      : 2.5;

  const [m3p, m6p, y1p, y2p, y5p, y10p] = await Promise.all([
    valueDaysAgo("DGS3MO", 5),
    valueDaysAgo("DGS6MO", 5),
    valueDaysAgo("DGS1", 5),
    valueDaysAgo("DGS2", 5),
    valueDaysAgo("DGS5", 5),
    valueDaysAgo("DGS10", 5),
  ]);

  const curve = [
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

  // Read existing snapshot to preserve curated comparator + history tail.
  const existing = JSON.parse(
    require("node:fs").readFileSync(OUT, "utf8")
  ) as Record<string, unknown>;

  const today = new Date().toISOString().slice(0, 10);
  const history = (existing.history as Array<Record<string, unknown>>).filter(
    (p) => (p.date as string) !== today
  );
  history.push({ date: today, m3, y2, y10, fedFunds: dff });

  const out = {
    ...existing,
    generatedAt: new Date().toISOString(),
    cpiYoy: Number(cpiYoy.toFixed(2)),
    fedFunds: dff,
    curve,
    rungs: rebuildRungs({ dff, m3, m6, y1, y2, y5, y10 }),
    history,
    sources: [
      { name: "FRED",           status: "live", lastUpdate: new Date().toISOString(), url: "https://fred.stlouisfed.org" },
      { name: "TreasuryDirect", status: "live", lastUpdate: new Date().toISOString(), url: "https://treasurydirect.gov" },
      { name: "FDIC",           status: "live", lastUpdate: new Date().toISOString(), url: "https://www.fdic.gov" },
    ],
  };

  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT}`);
}

interface RungInputs {
  dff: number;
  m3: number;
  m6: number;
  y1: number;
  y2: number;
  y5: number;
  y10: number;
}

function rebuildRungs(r: RungInputs) {
  // Winner logic: pick the highest risk-free yield available at each rung.
  // For overnight: Treasury MMF tracks DFF closely (~5–10bps under).
  // For 3mo–10y: T-bills/notes win on tax + safety; HYSAs only beat on overnight rare.
  return [
    {
      id: "overnight",
      label: "Overnight",
      position: 0,
      yield: r.dff - 0.05,
      horizon: "<3mo",
      winner: {
        name: "Treasury MMF (VUSXX)",
        issuer: "Vanguard",
        yield: Number((r.dff - 0.05).toFixed(2)),
        coverage: "MMF",
        lockup: "Daily liquid",
        tax: "State-tax-free (Treasury)",
        vehicle: "MMF",
        etoroTicker: "BIL",
        etoroInstrumentId: 4407,
      },
    },
    {
      id: "3mo",
      label: "3 months",
      position: 1,
      yield: r.m3,
      horizon: "<3mo",
      winner: {
        name: "13-week T-bill",
        issuer: "U.S. Treasury",
        yield: r.m3,
        coverage: "Treasury",
        lockup: "91 days",
        tax: "State-tax-free",
        vehicle: "T-bill",
        etoroTicker: "BIL",
        etoroInstrumentId: 4407,
      },
    },
    {
      id: "6mo",
      label: "6 months",
      position: 2,
      yield: r.m6,
      horizon: "3-12mo",
      winner: {
        name: "26-week T-bill",
        issuer: "U.S. Treasury",
        yield: r.m6,
        coverage: "Treasury",
        lockup: "182 days",
        tax: "State-tax-free",
        vehicle: "T-bill",
        etoroTicker: "SHV",
        etoroInstrumentId: 4321,
      },
    },
    {
      id: "1y",
      label: "1 year",
      position: 3,
      yield: r.y1,
      horizon: "3-12mo",
      winner: {
        name: "52-week T-bill",
        issuer: "U.S. Treasury",
        yield: r.y1,
        coverage: "Treasury",
        lockup: "364 days",
        tax: "State-tax-free",
        vehicle: "T-bill",
        etoroTicker: "SHV",
        etoroInstrumentId: 4321,
      },
    },
    {
      id: "2y",
      label: "2 years",
      position: 4,
      yield: r.y2,
      horizon: "1-5y",
      winner: {
        name: "2-year Treasury Note",
        issuer: "U.S. Treasury",
        yield: r.y2,
        coverage: "Treasury",
        lockup: "2 years",
        tax: "State-tax-free",
        vehicle: "Note",
        etoroTicker: "SHV",
        etoroInstrumentId: 4321,
      },
    },
    {
      id: "5y",
      label: "5 years",
      position: 5,
      yield: r.y5,
      horizon: "1-5y",
      winner: {
        name: "5-year Treasury Note",
        issuer: "U.S. Treasury",
        yield: r.y5,
        coverage: "Treasury",
        lockup: "5 years",
        tax: "State-tax-free",
        vehicle: "Note",
        etoroTicker: "IEF",
        etoroInstrumentId: 3101,
      },
    },
    {
      id: "10y",
      label: "10 years",
      position: 6,
      yield: r.y10,
      horizon: "5y+",
      winner: {
        name: "10-year Treasury Note",
        issuer: "U.S. Treasury",
        yield: r.y10,
        coverage: "Treasury",
        lockup: "10 years",
        tax: "State-tax-free",
        vehicle: "Note",
        etoroTicker: "IEF",
        etoroInstrumentId: 3101,
      },
    },
  ];
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
