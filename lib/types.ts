// Core domain types — the language of the app.

export type Horizon = "<3mo" | "3-12mo" | "1-5y" | "5y+";
export type RegionId = "us" | "eu" | "uk" | "global";

/** A yield rung on the ladder — one maturity bucket. */
export interface Rung {
  /** Stable id used for keys + active state. */
  id:
    | "overnight"
    | "3mo"
    | "6mo"
    | "1y"
    | "2y"
    | "5y"
    | "10y";
  /** Display label, e.g. "Overnight", "3 months". */
  label: string;
  /** Position on ladder, 0 = bottom, 6 = top. */
  position: number;
  /** Annualized yield, percentage points (e.g. 5.30 = 5.30%). */
  yield: number;
  /** The winning vehicle for this rung (best risk-adjusted yield). */
  winner: Winner;
  /** Horizon bucket this rung belongs to. */
  horizon: Horizon;
}

export interface Winner {
  /** Short name shown on the rung (e.g. "4-week T-bill"). */
  name: string;
  /** Issuer / wrapper (e.g. "U.S. Treasury", "Vanguard MMF"). */
  issuer: string;
  /** Yield (% annualized) — duplicates Rung.yield for convenience. */
  yield: number;
  /** Coverage badge. */
  coverage: "Treasury" | "FDIC" | "SIPC" | "MMF" | "None";
  /** Lockup description, e.g. "Daily liquid", "28 days", "12 months". */
  lockup: string;
  /** Tax treatment one-liner. */
  tax: string;
  /** Vehicle category (drives icons + comparator filter). */
  vehicle:
    | "Treasury"
    | "T-bill"
    | "HYSA"
    | "MMF"
    | "CD"
    | "Note"
    | "TIPS";
  /** Optional eToro deep-link symbol if there's a tradeable ETF. */
  etoroTicker?: string;
  /** Optional pre-resolved instrumentId for the ticker. */
  etoroInstrumentId?: number;
}

export interface CurvePoint {
  /** Maturity in years. 0.083 = 1mo, 0.25 = 3mo, etc. */
  maturity: number;
  /** Yield % annualized. */
  yield: number;
  /** Same maturity 1 week ago — for dotted overlay. */
  prevYield: number;
}

export interface ComparatorRow {
  vehicle:
    | "T-bill (4 wk)"
    | "T-bill (3 mo)"
    | "T-bill (6 mo)"
    | "T-Note (1 yr)"
    | "T-Note (2 yr)"
    | "T-Note (5 yr)"
    | "T-Note (10 yr)"
    | "TIPS (5 yr)"
    | "HYSA"
    | "MMF (Treasury)"
    | "MMF (Prime)"
    | "Brokered CD (3 mo)"
    | "Brokered CD (1 yr)"
    | "Brokered CD (5 yr)"
    | "I Bond";
  apy: number;
  lockup: string;
  coverage: "Treasury" | "FDIC" | "SIPC" | "MMF" | "None";
  taxes: string;
  minimum: string;
  issuer: string;
  issuerLink?: string;
  /** State-tax-exempt? Drives the after-tax calculator. */
  stateTaxFree: boolean;
}

export interface YieldsData {
  /** ISO timestamp of last refresh. */
  generatedAt: string;
  /** Inflation YoY % (CPI All Items) for the inflation-adjusted toggle. */
  cpiYoy: number;
  /** Effective Fed Funds rate. */
  fedFunds: number;
  /** Today's curve. */
  curve: CurvePoint[];
  /** Today's 7 ladder rungs. */
  rungs: Rung[];
  /** Comparator table — full universe. */
  comparator: ComparatorRow[];
  /** 5-year history of 3M, 2Y, 10Y yields for the deep chart. */
  history: HistoryPoint[];
  /** Source freshness for the live-sources row. */
  sources: SourceHealth[];
}

export interface HistoryPoint {
  date: string; // YYYY-MM-DD
  m3: number;
  y2: number;
  y10: number;
  fedFunds: number;
}

export interface SourceHealth {
  name: string;
  status: "live" | "cached" | "stale";
  lastUpdate: string;
  url?: string;
}
