/**
 * verify-baskets.ts — Confirms every basket holding's instrumentId resolves to
 * the same SymbolFull in the live eToro public catalog.
 *
 * Run with `tsx`. No API keys needed. CI gate.
 */

import { allHoldings } from "../lib/baskets";

const CATALOG_URL =
  "https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments";

interface CatalogEntry {
  InstrumentID: number;
  SymbolFull: string;
  InstrumentDisplayName: string;
  InstrumentTypeID: number;
}

async function main() {
  console.log(`Fetching catalog: ${CATALOG_URL}`);
  const res = await fetch(CATALOG_URL);
  if (!res.ok) {
    console.error(`HTTP ${res.status}`);
    process.exit(1);
  }
  const json = (await res.json()) as { InstrumentDisplayDatas: CatalogEntry[] };
  const cat = new Map(
    json.InstrumentDisplayDatas.map((it) => [it.InstrumentID, it])
  );
  console.log(`Catalog loaded: ${cat.size} instruments`);

  const fails: string[] = [];
  let ok = 0;
  for (const h of allHoldings()) {
    const e = cat.get(h.instrumentId);
    if (!e) {
      fails.push(`${h.ticker} id=${h.instrumentId} not in catalog`);
      continue;
    }
    if ((e.SymbolFull ?? "").toUpperCase() !== h.symbolFull.toUpperCase()) {
      fails.push(`${h.ticker} drift: catalog=${e.SymbolFull} basket=${h.symbolFull}`);
      continue;
    }
    ok += 1;
    console.log(`✓ ${h.ticker.padEnd(10)} id=${e.InstrumentID.toString().padEnd(6)} ${e.InstrumentDisplayName}`);
  }

  if (fails.length) {
    console.log("");
    fails.forEach((f) => console.log(`✕ ${f}`));
    console.log(`\n${fails.length} failure(s); ${ok} ok`);
    process.exit(1);
  }

  console.log(`\nAll ${ok} holdings verified against the eToro public catalog.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
