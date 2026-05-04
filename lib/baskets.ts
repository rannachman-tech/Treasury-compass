/**
 * Per-region × per-horizon trade baskets.
 *
 * Schema mirrors the standard eToro Compass family. The "phase" axis here is
 * Horizon ('<3mo' | '3-12mo' | '1-5y' | '5y+') instead of zone, because Treasury
 * Yield Compass answers a different question — *where* to park, not *whether* to
 * be defensive.
 *
 * All instrumentIds pre-resolved against the public catalog
 * (https://api.etorostatic.com/sapi/instrumentsmetadata/V1.1/instruments) per
 * the etoro-tickers.md cheatsheet. Run `npm run verify:baskets` after edits.
 */

import type { Horizon, RegionId } from "./types";

export interface BasketHolding {
  ticker: string;          // display
  symbolFull: string;      // eToro internalSymbolFull
  instrumentId: number;    // PRE-RESOLVED at design time
  name: string;
  weight: number;          // 0–100, sum to 100
  shortRationale: string;
  longRationale: string;
}

export interface Basket {
  region: RegionId;
  horizon: Horizon;
  title: string;
  thesis: string;
  holdings: BasketHolding[];
}

// =====================================================================
// US baskets — US-listed bond ETFs in USD
// =====================================================================

const US_SHORT: Basket = {
  region: "us",
  horizon: "<3mo",
  title: "Park it — 0–3 month T-bill ETFs",
  thesis:
    "Daily-liquid exposure to the front of the Treasury curve, with a small TIPS sleeve for inflation insurance. State-tax-free interest treatment on the Treasury portion.",
  holdings: [
    {
      ticker: "BIL",
      symbolFull: "BIL",
      instrumentId: 4407,
      name: "SPDR Bloomberg 1-3 Month T-Bill ETF",
      weight: 55,
      shortRationale: "Pure 1–3 mo T-bill exposure",
      longRationale:
        "Holds U.S. Treasury bills with 1–3 months to maturity. Effectively zero duration, zero credit risk. Distributes monthly. The default for parking cash that you might need in 30–90 days.",
    },
    {
      ticker: "SHV",
      symbolFull: "SHV",
      instrumentId: 4321,
      name: "iShares 0-1 Year Treasury Bond ETF",
      weight: 30,
      shortRationale: "Slightly longer T-bill weighting",
      longRationale:
        "Treasuries with under one year to maturity. Marginally higher yield than BIL when the curve is normalising; same credit profile.",
    },
    {
      ticker: "TIP",
      symbolFull: "TIP",
      instrumentId: 4311,
      name: "iShares TIPS Bond ETF",
      weight: 15,
      shortRationale: "Inflation insurance sleeve",
      longRationale:
        "A small TIPS overlay: real yields tend to rise when CPI surprises higher than the curve expects. Cheap insurance against an inflation re-acceleration scenario.",
    },
  ],
};

const US_MEDIUM: Basket = {
  region: "us",
  horizon: "3-12mo",
  title: "Lock 6–12 months — short Treasury ETFs",
  thesis:
    "Lock in today's short-end yields without giving up much liquidity. ETF wrapper means you can sell any day; cost is ~0–10bps tracking drag vs. owning T-bills directly.",
  holdings: [
    {
      ticker: "SHV",
      symbolFull: "SHV",
      instrumentId: 4321,
      name: "iShares 0-1 Year Treasury Bond ETF",
      weight: 50,
      shortRationale: "Sub-1y Treasuries",
      longRationale:
        "Captures the 6–12 month part of the curve where the cuts have been priced in but yields are still attractive vs. duration risk.",
    },
    {
      ticker: "BIL",
      symbolFull: "BIL",
      instrumentId: 4407,
      name: "SPDR Bloomberg 1-3 Month T-Bill ETF",
      weight: 30,
      shortRationale: "Roll-down yield",
      longRationale:
        "Constantly rolls 1–3 mo bills. Captures whatever the front-end is paying with no duration; useful if you suspect more cuts are coming.",
    },
    {
      ticker: "TIP",
      symbolFull: "TIP",
      instrumentId: 4311,
      name: "iShares TIPS Bond ETF",
      weight: 20,
      shortRationale: "Real-yield sleeve",
      longRationale:
        "Adds a TIPS overlay sized to the lock-in horizon. Insulates the basket against inflation surprises during the holding period.",
    },
  ],
};

const US_LONG: Basket = {
  region: "us",
  horizon: "1-5y",
  title: "Stretch 1–5 years — intermediate Treasuries",
  thesis:
    "Trade some liquidity for term premium. Locks in the curve's belly, where duration risk is moderate but yields are meaningfully higher.",
  holdings: [
    {
      ticker: "IEF",
      symbolFull: "IEF",
      instrumentId: 3101,
      name: "iShares 7-10 Year Treasury Bond ETF",
      weight: 50,
      shortRationale: "Belly of the curve",
      longRationale:
        "Slightly longer than a 5-year ladder, but the most liquid intermediate Treasury wrapper. ~7y duration. Cuts magnify gains.",
    },
    {
      ticker: "SHV",
      symbolFull: "SHV",
      instrumentId: 4321,
      name: "iShares 0-1 Year Treasury Bond ETF",
      weight: 30,
      shortRationale: "Short-end ballast",
      longRationale:
        "Anchors the basket on the short end, reducing total duration to a more conservative ~3–4 years.",
    },
    {
      ticker: "TIP",
      symbolFull: "TIP",
      instrumentId: 4311,
      name: "iShares TIPS Bond ETF",
      weight: 20,
      shortRationale: "Inflation hedge sleeve",
      longRationale:
        "Treasury Inflation-Protected Securities. Adds a real-yield sleeve in case CPI surprises higher than the curve expects.",
    },
  ],
};

const US_ULTRA: Basket = {
  region: "us",
  horizon: "5y+",
  title: "Long bonds — 10y+ Treasuries",
  thesis:
    "Longest duration; highest yield but biggest mark-to-market swings. Wins when the Fed cuts hard; suffers if growth/inflation reaccelerate.",
  holdings: [
    {
      ticker: "TLT",
      symbolFull: "TLT",
      instrumentId: 3020,
      name: "iShares 20+ Year Treasury Bond ETF",
      weight: 45,
      shortRationale: "Long-duration core",
      longRationale:
        "The most liquid long-Treasury ETF. ~17y duration. Used as the equity-hedge instrument when recession is the dominant risk.",
    },
    {
      ticker: "IEF",
      symbolFull: "IEF",
      instrumentId: 3101,
      name: "iShares 7-10 Year Treasury Bond ETF",
      weight: 30,
      shortRationale: "Mid-duration ballast",
      longRationale:
        "Bridges the long end to the belly. Reduces basket-level duration risk vs. pure TLT.",
    },
    {
      ticker: "TIP",
      symbolFull: "TIP",
      instrumentId: 4311,
      name: "iShares TIPS Bond ETF",
      weight: 25,
      shortRationale: "Inflation hedge",
      longRationale:
        "Real-yield sleeve. Important on the long end where decade-out CPI drift can erode nominal Treasuries.",
    },
  ],
};

// =====================================================================
// EU / UK / Global baskets — UCITS substitutes per etoro-tickers.md
// =====================================================================

const EU_SHORT: Basket = {
  region: "eu",
  horizon: "<3mo",
  title: "Park it (EUR) — ultrashort euro bonds",
  thesis:
    "EUR-denominated equivalent of T-bills. Ultrashort core, plus a small inflation sleeve and a global-aggregate ballast — diversified front-end EUR cash.",
  holdings: [
    {
      ticker: "IS3M.DE",
      symbolFull: "IS3M.DE",
      instrumentId: 10565,
      name: "iShares EUR Ultrashort Bond UCITS ETF",
      weight: 55,
      shortRationale: "EUR ultrashort, daily liquid",
      longRationale:
        "Tracks 0–1y euro investment-grade corporate bonds. Closest UCITS analogue to a U.S. Treasury MMF for euro-denominated cash.",
    },
    {
      ticker: "IBCI.DE",
      symbolFull: "IBCI.DE",
      instrumentId: 10585,
      name: "iShares EUR Inflation Linked Govt Bond UCITS ETF",
      weight: 25,
      shortRationale: "EUR linker sleeve",
      longRationale:
        "Eurozone inflation-linked sovereigns. Modest duration but positive carry vs. nominal cash if eurozone CPI re-accelerates.",
    },
    {
      ticker: "EUNA.DE",
      symbolFull: "EUNA.DE",
      instrumentId: 10586,
      name: "iShares Core Global Aggregate Bond UCITS ETF (EUR Hedged)",
      weight: 20,
      shortRationale: "Global agg, EUR-hedged",
      longRationale:
        "EUR-hedged share class of the global aggregate bond index. Small duration + diversification sleeve without taking on FX risk.",
    },
  ],
};

const EU_MEDIUM: Basket = {
  region: "eu",
  horizon: "3-12mo",
  title: "Lock 6–12 months (EUR)",
  thesis:
    "Slightly longer euro money-market exposure. Higher yield with marginal duration; still daily liquid through the ETF wrapper.",
  holdings: [
    {
      ticker: "IS3M.DE",
      symbolFull: "IS3M.DE",
      instrumentId: 10565,
      name: "iShares EUR Ultrashort Bond UCITS ETF",
      weight: 50,
      shortRationale: "Money-market core",
      longRationale:
        "Anchors the basket on EUR 0–1y bonds. Effectively the EUR cash floor.",
    },
    {
      ticker: "IBCI.DE",
      symbolFull: "IBCI.DE",
      instrumentId: 10585,
      name: "iShares EUR Inflation Linked Govt Bond UCITS ETF",
      weight: 30,
      shortRationale: "Inflation hedge",
      longRationale:
        "Eurozone inflation-linked sovereigns. Adds a real-yield sleeve in case eurozone CPI re-accelerates.",
    },
    {
      ticker: "EUNA.DE",
      symbolFull: "EUNA.DE",
      instrumentId: 10586,
      name: "iShares Core Global Aggregate Bond UCITS ETF (EUR Hedged)",
      weight: 20,
      shortRationale: "Global agg ballast",
      longRationale:
        "EUR-hedged global aggregate. A small duration + credit sleeve without FX exposure.",
    },
  ],
};

const EU_LONG: Basket = {
  region: "eu",
  horizon: "1-5y",
  title: "Stretch 1–5 years (EUR)",
  thesis:
    "Eurozone government-bond yield-plus, intermediate duration. Gets paid for term and a small spread over pure Bunds.",
  holdings: [
    {
      ticker: "XY4P.DE",
      symbolFull: "XY4P.DE",
      instrumentId: 10614,
      name: "Xtrackers Eurozone Government Bond Yield Plus UCITS ETF",
      weight: 50,
      shortRationale: "Yield-plus eurozone govies",
      longRationale:
        "Tilts toward the higher-yielding eurozone sovereigns. More yield than a Bund-only basket; broadly investment-grade.",
    },
    {
      ticker: "IS3M.DE",
      symbolFull: "IS3M.DE",
      instrumentId: 10565,
      name: "iShares EUR Ultrashort Bond UCITS ETF",
      weight: 30,
      shortRationale: "Cash ballast",
      longRationale:
        "Lowers total duration; lets the basket ride curve flattening without taking the full long-duration hit.",
    },
    {
      ticker: "IBCI.DE",
      symbolFull: "IBCI.DE",
      instrumentId: 10585,
      name: "iShares EUR Inflation Linked Govt Bond UCITS ETF",
      weight: 20,
      shortRationale: "Real-yield sleeve",
      longRationale:
        "Eurozone linkers. Hedges the basket against eurozone CPI surprises.",
    },
  ],
};

const EU_ULTRA: Basket = {
  region: "eu",
  horizon: "5y+",
  title: "Long bonds (EUR)",
  thesis:
    "Long-duration eurozone govies — the European equivalent of TLT. Highest convexity to ECB cuts; biggest drawdowns when inflation surprises.",
  holdings: [
    {
      ticker: "XY4P.DE",
      symbolFull: "XY4P.DE",
      instrumentId: 10614,
      name: "Xtrackers Eurozone Government Bond Yield Plus UCITS ETF",
      weight: 55,
      shortRationale: "Eurozone long govies",
      longRationale:
        "Best available long-duration eurozone government bond UCITS on eToro. Captures most of the term premium.",
    },
    {
      ticker: "IBCI.DE",
      symbolFull: "IBCI.DE",
      instrumentId: 10585,
      name: "iShares EUR Inflation Linked Govt Bond UCITS ETF",
      weight: 25,
      shortRationale: "Inflation protection",
      longRationale:
        "Critical at the long end where decade-out CPI can erode nominal Bunds.",
    },
    {
      ticker: "EUNA.DE",
      symbolFull: "EUNA.DE",
      instrumentId: 10586,
      name: "iShares Core Global Aggregate Bond UCITS ETF (EUR Hedged)",
      weight: 20,
      shortRationale: "Global agg sleeve",
      longRationale:
        "Diversifies the long basket across global IG without FX risk.",
    },
  ],
};

const UK_SHORT: Basket = {
  region: "uk",
  horizon: "<3mo",
  title: "Park it (GBP) — ultrashort sterling bonds",
  thesis:
    "Sterling front-end. Ultrashort core, plus a small short-gilt sleeve and a global-aggregate ballast — diversified front-end GBP cash.",
  holdings: [
    {
      ticker: "ERNS.L",
      symbolFull: "ERNS.L",
      instrumentId: 14495,
      name: "iShares GBP Ultrashort Bond UCITS ETF",
      weight: 55,
      shortRationale: "GBP ultrashort, daily liquid",
      longRationale:
        "Sterling investment-grade bonds with under 1y duration. The closest analogue to a U.S. Treasury MMF for sterling cash.",
    },
    {
      ticker: "SYBG.DE",
      symbolFull: "SYBG.DE",
      instrumentId: 10641,
      name: "SPDR Bloomberg UK Gilt UCITS ETF",
      weight: 25,
      shortRationale: "UK gilts sleeve (GBP)",
      longRationale:
        "100% UK gilt holdings — same index as IGLT.L. Listed on Xetra (.DE) because it's the only UK gilt UCITS available on eToro; the share class is still GBP-denominated, so no FX risk for sterling investors.",
    },
    {
      ticker: "AGGU.L",
      symbolFull: "AGGU.L",
      instrumentId: 13553,
      name: "iShares Core Global Aggregate Bond UCITS ETF (USD)",
      weight: 20,
      shortRationale: "Global agg ballast",
      longRationale:
        "USD-denominated global aggregate. Adds a diversifying sleeve; introduces small FX exposure that can hedge sterling risk.",
    },
  ],
};

const UK_MEDIUM: Basket = {
  region: "uk",
  horizon: "3-12mo",
  title: "Lock 6–12 months (GBP)",
  thesis:
    "Sterling short-end with a tilt toward UK gilts. Captures front-of-curve gilt yields with marginal duration.",
  holdings: [
    {
      ticker: "ERNS.L",
      symbolFull: "ERNS.L",
      instrumentId: 14495,
      name: "iShares GBP Ultrashort Bond UCITS ETF",
      weight: 50,
      shortRationale: "Sterling money-market",
      longRationale:
        "Anchors the basket in sterling 0–1y bonds. Effectively the GBP cash floor.",
    },
    {
      ticker: "SYBG.DE",
      symbolFull: "SYBG.DE",
      instrumentId: 10641,
      name: "SPDR Bloomberg UK Gilt UCITS ETF",
      weight: 30,
      shortRationale: "UK gilts core (GBP)",
      longRationale:
        "Broad UK gilt exposure across maturities. Listed on Xetra (.DE) as the only UK gilt UCITS on eToro, but the share class is GBP-denominated — same Bloomberg UK Gilt index as IGLT.L would track.",
    },
    {
      ticker: "AGGU.L",
      symbolFull: "AGGU.L",
      instrumentId: 13553,
      name: "iShares Core Global Aggregate Bond UCITS ETF (USD)",
      weight: 20,
      shortRationale: "Global agg sleeve",
      longRationale:
        "Diversifies sterling exposure across global IG bonds. Small FX risk via USD-denominated wrapper.",
    },
  ],
};

const UK_LONG: Basket = {
  region: "uk",
  horizon: "1-5y",
  title: "Stretch 1–5 years (GBP)",
  thesis:
    "Intermediate-duration sterling govies. The UK gilt curve has been steeper than peers — historically pays for term.",
  holdings: [
    {
      ticker: "SYBG.DE",
      symbolFull: "SYBG.DE",
      instrumentId: 10641,
      name: "SPDR Bloomberg UK Gilt UCITS ETF",
      weight: 50,
      shortRationale: "UK gilts core (GBP)",
      longRationale:
        "Broad gilt exposure. Carries the term premium that UK rates currently offer. Xetra-listed (.DE) because it's the only UK gilt UCITS on eToro; share class is GBP-denominated so there's no FX risk vs. an LSE listing.",
    },
    {
      ticker: "ERNS.L",
      symbolFull: "ERNS.L",
      instrumentId: 14495,
      name: "iShares GBP Ultrashort Bond UCITS ETF",
      weight: 30,
      shortRationale: "Sterling cash ballast",
      longRationale:
        "Pulls duration down; lets the basket ride a parallel curve shift with less drawdown.",
    },
    {
      ticker: "AGGU.L",
      symbolFull: "AGGU.L",
      instrumentId: 13553,
      name: "iShares Core Global Aggregate Bond UCITS ETF (USD)",
      weight: 20,
      shortRationale: "Global agg sleeve",
      longRationale:
        "Adds a global IG sleeve. Diversifies away from pure UK exposure.",
    },
  ],
};

const UK_ULTRA: Basket = {
  region: "uk",
  horizon: "5y+",
  title: "Long bonds (GBP)",
  thesis:
    "Long gilts. Very high convexity to BoE cuts; brutal drawdowns under inflation shocks (see 2022). Use sparingly.",
  holdings: [
    {
      ticker: "SYBG.DE",
      symbolFull: "SYBG.DE",
      instrumentId: 10641,
      name: "SPDR Bloomberg UK Gilt UCITS ETF",
      weight: 55,
      shortRationale: "UK gilts core (GBP)",
      longRationale:
        "All-maturity gilt index — closest available UCITS to long-only gilts on eToro. Listed on Xetra (.DE) as the sole eToro option, but the GBP share class means UK investors take no FX exposure vs. an LSE listing.",
    },
    {
      ticker: "AGGU.L",
      symbolFull: "AGGU.L",
      instrumentId: 13553,
      name: "iShares Core Global Aggregate Bond UCITS ETF (USD)",
      weight: 25,
      shortRationale: "Global agg sleeve",
      longRationale:
        "Diversifies the long basket across global IG bonds. Reduces single-country gilt risk.",
    },
    {
      ticker: "IBCI.DE",
      symbolFull: "IBCI.DE",
      instrumentId: 10585,
      name: "iShares EUR Inflation Linked Govt Bond UCITS ETF",
      weight: 20,
      shortRationale: "Linker sleeve (compromise)",
      longRationale:
        "No UK linker UCITS is on eToro; eurozone linkers are the closest analogue. Documented compromise per the skill substitution table.",
    },
  ],
};

const GLOBAL_SHORT: Basket = {
  region: "global",
  horizon: "<3mo",
  title: "Park it — global cash basket",
  thesis:
    "Diversifies parking across USD T-bills, EUR ultrashorts, and GBP ultrashorts. Useful when you don't want a single-currency exposure.",
  holdings: [
    {
      ticker: "IB01.L",
      symbolFull: "IB01.L",
      instrumentId: 1442,
      name: "iShares $ Treasury Bond 0-1yr UCITS ETF",
      weight: 50,
      shortRationale: "USD T-bills",
      longRationale:
        "USD-denominated T-bill UCITS — front of the U.S. Treasury curve.",
    },
    {
      ticker: "IS3M.DE",
      symbolFull: "IS3M.DE",
      instrumentId: 10565,
      name: "iShares EUR Ultrashort Bond UCITS ETF",
      weight: 30,
      shortRationale: "EUR ultrashort",
      longRationale:
        "EUR money-market exposure. Diversifies away from pure USD risk.",
    },
    {
      ticker: "ERNS.L",
      symbolFull: "ERNS.L",
      instrumentId: 14495,
      name: "iShares GBP Ultrashort Bond UCITS ETF",
      weight: 20,
      shortRationale: "GBP ultrashort",
      longRationale:
        "Adds sterling money-market to round out the cash basket.",
    },
  ],
};

const GLOBAL_MEDIUM: Basket = {
  region: "global",
  horizon: "3-12mo",
  title: "Lock 6–12 months — global short bonds",
  thesis:
    "Adds an inflation-protection sleeve to the global cash basket. Slightly more duration; still mostly defensive.",
  holdings: [
    {
      ticker: "IB01.L",
      symbolFull: "IB01.L",
      instrumentId: 1442,
      name: "iShares $ Treasury Bond 0-1yr UCITS ETF",
      weight: 40,
      shortRationale: "USD T-bills",
      longRationale: "Front of the U.S. curve, USD.",
    },
    {
      ticker: "IS3M.DE",
      symbolFull: "IS3M.DE",
      instrumentId: 10565,
      name: "iShares EUR Ultrashort Bond UCITS ETF",
      weight: 30,
      shortRationale: "EUR ultrashort",
      longRationale: "EUR money-market.",
    },
    {
      ticker: "AGGU.L",
      symbolFull: "AGGU.L",
      instrumentId: 13553,
      name: "iShares Core Global Aggregate Bond UCITS ETF (USD)",
      weight: 30,
      shortRationale: "Global agg ballast",
      longRationale:
        "Investment-grade global bond aggregate. Adds a small duration + credit sleeve.",
    },
  ],
};

const GLOBAL_LONG: Basket = {
  region: "global",
  horizon: "1-5y",
  title: "Stretch 1–5 years — global investment-grade",
  thesis:
    "Global investment-grade aggregate dominates here. Diversified across currencies, sovereigns, and IG corporates.",
  holdings: [
    {
      ticker: "AGGU.L",
      symbolFull: "AGGU.L",
      instrumentId: 13553,
      name: "iShares Core Global Aggregate Bond UCITS ETF (USD)",
      weight: 55,
      shortRationale: "Global agg core",
      longRationale:
        "Bloomberg Global Aggregate. ~7–8y duration, broad currency mix, mostly investment-grade.",
    },
    {
      ticker: "IB01.L",
      symbolFull: "IB01.L",
      instrumentId: 1442,
      name: "iShares $ Treasury Bond 0-1yr UCITS ETF",
      weight: 25,
      shortRationale: "USD short ballast",
      longRationale: "Anchors basket duration on the short end of the U.S. curve.",
    },
    {
      ticker: "IBCI.DE",
      symbolFull: "IBCI.DE",
      instrumentId: 10585,
      name: "iShares EUR Inflation Linked Govt Bond UCITS ETF",
      weight: 20,
      shortRationale: "Linker sleeve",
      longRationale: "Eurozone linkers. Inflation hedge across the basket.",
    },
  ],
};

const GLOBAL_ULTRA: Basket = {
  region: "global",
  horizon: "5y+",
  title: "Long bonds — global haven complex",
  thesis:
    "Long-duration sovereigns: long Treasuries, long gilts, real-yield linkers. The classic 'rates-are-the-story' basket.",
  holdings: [
    {
      ticker: "DTLA.L",
      symbolFull: "DTLA.L",
      instrumentId: 13564,
      name: "iShares USD Treasury Bond 20+yr UCITS ETF",
      weight: 50,
      shortRationale: "USD long Treasuries",
      longRationale:
        "UCITS equivalent of TLT — 20+ year U.S. Treasuries in USD.",
    },
    {
      ticker: "AGGU.L",
      symbolFull: "AGGU.L",
      instrumentId: 13553,
      name: "iShares Core Global Aggregate Bond UCITS ETF (USD)",
      weight: 30,
      shortRationale: "Global agg",
      longRationale: "Diversifies the basket across global IG.",
    },
    {
      ticker: "IBCI.DE",
      symbolFull: "IBCI.DE",
      instrumentId: 10585,
      name: "iShares EUR Inflation Linked Govt Bond UCITS ETF",
      weight: 20,
      shortRationale: "Linkers",
      longRationale: "Inflation hedge for the long end.",
    },
  ],
};

const BASKETS: Record<RegionId, Record<Horizon, Basket>> = {
  us:     { "<3mo": US_SHORT,     "3-12mo": US_MEDIUM,     "1-5y": US_LONG,     "5y+": US_ULTRA },
  eu:     { "<3mo": EU_SHORT,     "3-12mo": EU_MEDIUM,     "1-5y": EU_LONG,     "5y+": EU_ULTRA },
  uk:     { "<3mo": UK_SHORT,     "3-12mo": UK_MEDIUM,     "1-5y": UK_LONG,     "5y+": UK_ULTRA },
  global: { "<3mo": GLOBAL_SHORT, "3-12mo": GLOBAL_MEDIUM, "1-5y": GLOBAL_LONG, "5y+": GLOBAL_ULTRA },
};

export function basketFor(horizon: Horizon, region: RegionId = "us"): Basket {
  return BASKETS[region][horizon];
}

export function allBaskets(): Basket[] {
  const out: Basket[] = [];
  for (const r of Object.keys(BASKETS) as RegionId[]) {
    for (const h of Object.keys(BASKETS[r]) as Horizon[]) {
      out.push(BASKETS[r][h]);
    }
  }
  return out;
}

export function allHoldings(): BasketHolding[] {
  return allBaskets().flatMap((b) => b.holdings);
}

export function allocate(basket: Basket, amount: number) {
  return basket.holdings.map((h) => ({
    ...h,
    dollars: Math.round((h.weight / 100) * amount * 100) / 100,
  }));
}

export const REGION_LABELS: Record<RegionId, string> = {
  us: "US (USD)",
  eu: "Europe (EUR)",
  uk: "UK (GBP)",
  global: "Global",
};

export const HORIZON_LABELS: Record<Horizon, string> = {
  "<3mo": "<3 mo",
  "3-12mo": "3–12 mo",
  "1-5y": "1–5 y",
  "5y+": "5 y+",
};
