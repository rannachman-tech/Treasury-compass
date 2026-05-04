// Standalone catalog spot-check that runs with plain node — no deps.
// Usage: node scripts/spot-check.mjs

const HOLDINGS = [
  { ticker: "BIL", symbolFull: "BIL", id: 4407 },
  { ticker: "SHV", symbolFull: "SHV", id: 4321 },
  { ticker: "IEF", symbolFull: "IEF", id: 3101 },
  { ticker: "TLT", symbolFull: "TLT", id: 3020 },
  { ticker: "TIP", symbolFull: "TIP", id: 4311 },
  { ticker: "IS3M.DE", symbolFull: "IS3M.DE", id: 10565 },
  { ticker: "IBCI.DE", symbolFull: "IBCI.DE", id: 10585 },
  { ticker: "EUNA.DE", symbolFull: "EUNA.DE", id: 10586 },
  { ticker: "XY4P.DE", symbolFull: "XY4P.DE", id: 10614 },
  { ticker: "ERNS.L",  symbolFull: "ERNS.L",  id: 14495 },
  { ticker: "SYBG.DE", symbolFull: "SYBG.DE", id: 10641 },
  { ticker: "AGGU.L",  symbolFull: "AGGU.L",  id: 13553 },
  { ticker: "DTLA.L",  symbolFull: "DTLA.L",  id: 13564 },
  { ticker: "IB01.L",  symbolFull: "IB01.L",  id: 1442 },
];

async function main() {
  const url = "https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments";
  const res = await fetch(url);
  if (!res.ok) {
    console.error("HTTP " + res.status);
    process.exit(1);
  }
  const json = await res.json();
  const cat = new Map(json.InstrumentDisplayDatas.map((it) => [it.InstrumentID, it]));
  console.log("Catalog: " + cat.size + " instruments");
  let ok = 0;
  const fails = [];
  for (const h of HOLDINGS) {
    const e = cat.get(h.id);
    if (!e) { fails.push(h.ticker + " id=" + h.id + " not in catalog"); continue; }
    if ((e.SymbolFull || "").toUpperCase() !== h.symbolFull.toUpperCase()) {
      fails.push(h.ticker + " drift catalog=" + e.SymbolFull + " basket=" + h.symbolFull);
      continue;
    }
    ok++;
    console.log("OK " + h.ticker.padEnd(10) + " id=" + String(e.InstrumentID).padEnd(6) + " " + e.InstrumentDisplayName);
  }
  if (fails.length) {
    fails.forEach((f) => console.log("X " + f));
    process.exit(1);
  }
  console.log("All " + ok + " holdings verified.");
}

main().catch((e) => { console.error(e); process.exit(1); });
