// Core domain types — the language of the app.

export type Horizon = "<3mo" | "3-12mo" | "1-5y" | "5y+";
export type RegionId = "us" | "eu" | "uk" | "global";

/** A yield rung on the ladder — one maturity bucket. */
export interface Rung {
  id:
    | "overnight"
    | "3mo"
    | "6mo"
    | "1y"
    | "2y"
    | "5y"
    | "10y";
  label: string;
  position: number; // 0 = bottom, 6 = top
  yield: number;     // %
  winner: Winner;
  horizon: Horizon;
}

export interface Winner {
  name: string;
  issuer: string;
  yield: number;
  coverage: "Treasury" | "Sovereign" | "FDIC" | "FSCS" | "Deposit-EU" | "SIPC" | "MMF" | "None";
  lockup: string;
  tax: string;
  vehicle:
    | "Treasury"
    | "T-bill"
    | "Bund"
    | "Gilt"
    | "Sovereign-EU"
    | "HYSA"
    | "MMF"
    | "CD"
    | "Note"
    | "TIPS"
    | "Linker"
    | "ETF";
  etoroTicker?: string;
  etoroInstrumentId?: number;
}

export interface CurvePoint {
  maturity: number;
  yield: number;
  prevYield: number;
}

/** A row in the comparator table — describes one safe-cash vehicle. */
export interface ComparatorRow {
  vehicle: string;
  apy: number;
  lockup: string;
  coverage: "Treasury" | "Sovereign" | "FDIC" | "FSCS" | "Deposit-EU" | "SIPC" | "MMF" | "None";
  taxes: string;
  minimum: string;
  issuer: string;
  issuerLink?: string;
  /** Whether this row is exempt from the region's "secondary" tax (state-tax,
   *  CGT, etc.) — drives the after-tax calculator. */
  secondaryTaxFree: boolean;
}

export interface HistoryPoint {
  date: string;
  m3: number;
  y2: number;
  y10: number;
  policyRate: number;
}

export interface SourceHealth {
  name: string;
  status: "live" | "cached" | "stale";
  lastUpdate: string;
  url?: string;
}

/** Region-specific tax model used by the calculator. */
export interface TaxModel {
  primaryLabel: string;          // "Federal tax %", "Income tax %"
  primaryDefault: number;
  secondaryLabel: string | null; // "State tax %", "Cantonal tax %", null = hide field
  secondaryDefault: number;
  exemptBadge: string;           // "State-tax-free", "CGT-exempt", "Sovereign"
  /** Pre-tax interest copy snippet used in tooltips/captions. */
  taxNote: string;
}

/** All data for a single region. */
export interface RegionData {
  currency: "USD" | "EUR" | "GBP" | "Mixed";
  /** Headline central-bank rate for this region. */
  policyRate: number;
  policyRateLabel: string;       // "Fed Funds", "ECB", "BoE Bank Rate"
  cpiYoy: number;
  cpiLabel: string;              // "CPI", "HICP"
  rungs: Rung[];
  curve: CurvePoint[];
  comparator: ComparatorRow[];
  history: HistoryPoint[];
  sources: SourceHealth[];
  taxModel: TaxModel;
  /** A short tag-line shown in TradeCta to localise copy. */
  parkCopy: {
    short: string;
    medium: string;
    long: string;
    ultra: string;
  };
}

export interface YieldsData {
  generatedAt: string;
  regions: Record<RegionId, RegionData>;
}
