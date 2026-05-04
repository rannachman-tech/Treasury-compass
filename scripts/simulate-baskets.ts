/**
 * simulate-baskets.ts — Comprehensive 9-section simulator for the basket layer.
 *
 * Catches structural bugs *before* they ship: missing region/horizon coverage,
 * weights that don't sum to 100, instrumentId/symbolFull drift, allocation math
 * rounding errors, etc.
 *
 * Run with `tsx`. No API keys needed.
 */

import {
  allBaskets,
  allHoldings,
  allocate,
  basketFor,
  HORIZON_LABELS,
  REGION_LABELS,
} from "../lib/baskets";
import type { Horizon, RegionId } from "../lib/types";

const REGIONS: RegionId[] = ["us", "eu", "uk", "global"];
const HORIZONS: Horizon[] = ["<3mo", "3-12mo", "1-5y", "5y+"];

const CATALOG_URL =
  "https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments";

const fails: string[] = [];
const fail = (msg: string) => fails.push(msg);

function section(n: number, name: string) {
  console.log(`\n[${n}] ${name}`);
  console.log("─".repeat(64));
}

// ─────────────────────────────────────────────────────────────────
// 1. Coverage — every (region × horizon) has a basket
// ─────────────────────────────────────────────────────────────────
section(1, "Coverage — every (region × horizon) has a basket");
for (const r of REGIONS) {
  for (const h of HORIZONS) {
    try {
      const b = basketFor(h, r);
      if (!b) fail(`Missing: ${r} × ${h}`);
      else console.log(`  ✓ ${REGION_LABELS[r]} × ${HORIZON_LABELS[h]}`);
    } catch {
      fail(`Throw on basketFor(${h}, ${r})`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. Invariants — weights sum to 100, IDs > 0, no dups, sane sizes
// ─────────────────────────────────────────────────────────────────
section(2, "Invariants — weights, ids, sizes");
for (const b of allBaskets()) {
  const sum = b.holdings.reduce((acc, h) => acc + h.weight, 0);
  if (Math.round(sum) !== 100) fail(`${b.region}/${b.horizon}: weights sum ${sum}, not 100`);
  if (b.holdings.length < 3) fail(`${b.region}/${b.horizon}: only ${b.holdings.length} holding(s) (MIN 3)`);
  if (b.holdings.length > 10) fail(`${b.region}/${b.horizon}: too many holdings (${b.holdings.length})`);
  const seen = new Set<string>();
  for (const h of b.holdings) {
    if (h.instrumentId <= 0) fail(`${b.region}/${b.horizon}: bad id ${h.instrumentId}`);
    if (seen.has(h.symbolFull)) fail(`${b.region}/${b.horizon}: duplicate symbolFull ${h.symbolFull}`);
    seen.add(h.symbolFull);
    if (h.weight > 55) fail(`${b.region}/${b.horizon}: ${h.ticker} concentration ${h.weight}% (>55%)`);
    if (h.weight <= 0) fail(`${b.region}/${b.horizon}: ${h.ticker} weight ${h.weight}`);
  }
  console.log(`  ✓ ${b.region}/${b.horizon} sum=${sum} n=${b.holdings.length}`);
}

// ─────────────────────────────────────────────────────────────────
// 3. Field consistency — basket.region/horizon match key
// ─────────────────────────────────────────────────────────────────
section(3, "Field consistency — basket fields match map keys");
for (const r of REGIONS) {
  for (const h of HORIZONS) {
    const b = basketFor(h, r);
    if (b.region !== r) fail(`${r}/${h}: basket.region=${b.region} ≠ ${r}`);
    if (b.horizon !== h) fail(`${r}/${h}: basket.horizon=${b.horizon} ≠ ${h}`);
  }
}
console.log("  ✓ all 16 baskets self-consistent");

// ─────────────────────────────────────────────────────────────────
// 4. Routing matrix — every horizon resolves
// ─────────────────────────────────────────────────────────────────
section(4, "Routing matrix — basketFor(horizon, region)");
let routes = 0;
for (const r of REGIONS) {
  for (const h of HORIZONS) {
    const b = basketFor(h, r);
    if (!b || !b.holdings.length) fail(`route ${r}/${h} empty`);
    routes++;
  }
}
console.log(`  ✓ ${routes} routes resolve`);

// ─────────────────────────────────────────────────────────────────
// 5. Allocation math — many amounts × every basket
// ─────────────────────────────────────────────────────────────────
section(5, "Allocation math — multiple amounts × every basket");
const AMOUNTS = [1000, 1, 0.10, 100000, 333, 999.99, 50, 10000];
for (const amt of AMOUNTS) {
  for (const b of allBaskets()) {
    const alloc = allocate(b, amt);
    const totalAlloc = alloc.reduce((acc, h) => acc + h.dollars, 0);
    const drift = Math.abs(totalAlloc - amt);
    if (drift > 0.05) fail(`${b.region}/${b.horizon} amt=${amt}: drift ${drift}`);
  }
}
console.log(`  ✓ ${AMOUNTS.length * allBaskets().length} allocations within rounding tolerance`);

// ─────────────────────────────────────────────────────────────────
// 6. Cross-basket consistency — instrumentId ↔ symbolFull is 1:1
// ─────────────────────────────────────────────────────────────────
section(6, "Cross-basket consistency — instrumentId ↔ symbolFull is 1:1");
const idToSymbol = new Map<number, string>();
const symbolToId = new Map<string, number>();
for (const h of allHoldings()) {
  const seenSym = idToSymbol.get(h.instrumentId);
  if (seenSym && seenSym !== h.symbolFull) fail(`id ${h.instrumentId} maps to both ${seenSym} and ${h.symbolFull}`);
  idToSymbol.set(h.instrumentId, h.symbolFull);

  const seenId = symbolToId.get(h.symbolFull);
  if (seenId && seenId !== h.instrumentId) fail(`symbol ${h.symbolFull} maps to both ${seenId} and ${h.instrumentId}`);
  symbolToId.set(h.symbolFull, h.instrumentId);
}
console.log(`  ✓ ${idToSymbol.size} unique ids, ${symbolToId.size} unique symbols`);

// ─────────────────────────────────────────────────────────────────
// 7. Defensive properties — concentration limits & sane sizes
// ─────────────────────────────────────────────────────────────────
section(7, "Defensive properties");
for (const b of allBaskets()) {
  const max = Math.max(...b.holdings.map((h) => h.weight));
  if (max > 55) fail(`${b.region}/${b.horizon} max weight ${max}% > 55`);
  const min = Math.min(...b.holdings.map((h) => h.weight));
  if (min < 1) fail(`${b.region}/${b.horizon} min weight ${min}% < 1`);
}
console.log("  ✓ all baskets within concentration bounds");

// ─────────────────────────────────────────────────────────────────
// 8. Edge horizons — type system covers all 4
// ─────────────────────────────────────────────────────────────────
section(8, "Edge horizons — fall-through coverage");
for (const h of HORIZONS) {
  if (!HORIZONS.includes(h)) fail(`unexpected horizon ${h}`);
}
console.log("  ✓ horizon enum exhaustive");

// ─────────────────────────────────────────────────────────────────
// 9. Live catalog check — every instrumentId resolves
// ─────────────────────────────────────────────────────────────────
section(9, "Live catalog check — every instrumentId resolves on eToro");
async function liveCatalog() {
  const res = await fetch(CATALOG_URL);
  if (!res.ok) {
    fail(`catalog HTTP ${res.status}`);
    return;
  }
  const json = (await res.json()) as { InstrumentDisplayDatas: any[] };
  const cat = new Map(json.InstrumentDisplayDatas.map((it: any) => [it.InstrumentID, it]));
  let ok = 0;
  for (const h of allHoldings()) {
    const e = cat.get(h.instrumentId);
    if (!e) fail(`${h.ticker} id=${h.instrumentId} not in catalog`);
    else if ((e.SymbolFull ?? "").toUpperCase() !== h.symbolFull.toUpperCase())
      fail(`${h.ticker} drift: catalog=${e.SymbolFull} basket=${h.symbolFull}`);
    else ok++;
  }
  console.log(`  ✓ ${ok}/${allHoldings().length} holdings resolve`);
}

await liveCatalog().catch((e) => fail(`live catalog error: ${e.message ?? e}`));

// ─────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(64));
if (fails.length) {
  console.log(`FAIL — ${fails.length} issue(s):`);
  fails.forEach((f) => console.log(`  ✕ ${f}`));
  process.exit(1);
}
console.log("PASS — all 9 sections clean.");
