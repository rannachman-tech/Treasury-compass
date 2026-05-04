/**
 * lib/simple.ts — Helpers for Simple mode.
 *
 * The retail-facing translation layer: turns the dense data model
 * (basis points, lockup strings, vehicle taxonomy) into plain English,
 * dollar amounts, and a 2D safety map.
 */

import type {
  ComparatorRow,
  Horizon,
  HistoryPoint,
  RegionData,
  Rung,
  Winner,
} from "./types";

export type Bucket = "anytime" | "months" | "years" | "long";

export const BUCKETS: Array<{ id: Bucket; label: string; sub: string; horizon: Horizon }> = [
  { id: "anytime", label: "Anytime", sub: "Days", horizon: "<3mo" },
  { id: "months",  label: "A few months", sub: "3 – 12 mo", horizon: "3-12mo" },
  { id: "years",   label: "A few years", sub: "1 – 5 yr", horizon: "1-5y" },
  { id: "long",    label: "Long-term", sub: "5+ yr", horizon: "5y+" },
];

export const BUCKET_LABEL: Record<Bucket, string> = {
  anytime: "Anytime",
  months: "A few months",
  years: "A few years",
  long: "Long-term",
};

/** Pick the best (highest yield) rung in the bucket. */
export function bestRungForBucket(rungs: Rung[], bucket: Bucket): Rung {
  const horizon = BUCKETS.find((b) => b.id === bucket)!.horizon;
  const matched = rungs.filter((r) => r.horizon === horizon);
  if (matched.length === 0) return rungs[0];
  return matched.reduce((a, b) => (a.yield >= b.yield ? a : b));
}

/** Years value used by the growth-curve illustration + alternatives sort. */
export function bucketYears(bucket: Bucket): number {
  switch (bucket) {
    case "anytime": return 0.25;
    case "months":  return 1;
    case "years":   return 3;
    case "long":    return 7;
  }
}

/** Plain-English description of a Winner — replaces jargon with concrete words. */
export function plainEnglishName(w: Winner): string {
  switch (w.vehicle) {
    case "T-bill":      return "Short-term U.S. government bond";
    case "Note":        return "U.S. government bond — fixed term";
    case "Treasury":    return "U.S. government bond";
    case "TIPS":        return "U.S. inflation-protected bond";
    case "Bund":        return "German government bond";
    case "Gilt":        return "UK government bond";
    case "Sovereign-EU":return "Eurozone government bond";
    case "Linker":      return "Inflation-protected government bond";
    case "MMF":         return "Money-market fund — daily-access cash";
    case "HYSA":        return "High-yield savings account";
    case "CD":          return "Bank certificate of deposit";
    case "ETF":         return "Bond ETF — daily-tradeable basket";
  }
}

/** "What's the catch?" — the trade-off in plain words. */
export function plainEnglishCatch(w: Winner): string {
  switch (w.vehicle) {
    case "T-bill":      return "Hold to maturity for full safety";
    case "Note":        return "Early sale = market-price risk";
    case "Treasury":    return "Early sale = market-price risk";
    case "TIPS":        return "Real-yield can be small";
    case "Bund":        return "Hold to maturity for stated yield";
    case "Gilt":        return "Hold to maturity for stated yield";
    case "Sovereign-EU":return "Issuer credit varies by country";
    case "Linker":      return "Lower yield in calm-inflation regimes";
    case "MMF":         return "Yield resets daily";
    case "HYSA":        return "Bank can change rate anytime";
    case "CD":          return "Early withdrawal penalty";
    case "ETF":         return "Daily price moves with rates";
  }
}

/** Tax line (one phrase). */
export function plainEnglishTax(w: Winner): string {
  if (w.tax.toLowerCase().includes("state-tax-free")) return "No state tax";
  if (w.tax.toLowerCase().includes("cgt-exempt"))     return "CGT-exempt";
  if (w.tax.toLowerCase().includes("isa"))            return "ISA tax-free";
  if (w.tax.toLowerCase().includes("real"))           return "Inflation-linked";
  if (w.tax.toLowerCase().includes("ucits"))          return "UCITS-efficient";
  return w.tax;
}

/** "How fast can I get my money back?" */
export function plainEnglishLockup(w: Winner, bucket: Bucket): string {
  if (/daily/i.test(w.lockup)) return "Same day";
  switch (bucket) {
    case "anytime": return "Within 3 months";
    case "months":  return "Within a year";
    case "years":   return "After 1–5 years";
    case "long":    return "After 5+ years";
  }
}

// ─────────────────────────────────────────────────────────────────
// Growth math — the retail-facing dollar illustration
// ─────────────────────────────────────────────────────────────────

/** Compound growth at the displayed yield over `years`. Simple annualised. */
export function projectValue(amount: number, yieldPct: number, years: number): number {
  const r = yieldPct / 100;
  if (years < 1) return amount * (1 + r * years);
  return amount * Math.pow(1 + r, years);
}

/** Sample points for the growth curve SVG. */
export function growthPoints(amount: number, yieldPct: number, years: number, n = 32): Array<{ t: number; v: number }> {
  const pts: Array<{ t: number; v: number }> = [];
  for (let i = 0; i <= n; i++) {
    const t = (years * i) / n;
    pts.push({ t, v: projectValue(amount, yieldPct, t) });
  }
  return pts;
}

// ─────────────────────────────────────────────────────────────────
// Rate temperature — vs 5-year median
// ─────────────────────────────────────────────────────────────────

export type Temperature = "high" | "average" | "low";

/** Compare today's `currentYield` to the 5y median of the relevant series. */
export function rateTemperature(
  history: HistoryPoint[],
  bucket: Bucket,
  currentYield: number
): { state: Temperature; label: string; hint: string; delta: number } {
  const series =
    bucket === "anytime" || bucket === "months"
      ? history.map((p) => p.m3)
      : bucket === "years"
      ? history.map((p) => p.y2)
      : history.map((p) => p.y10);

  const sorted = [...series].sort((a, b) => a - b);
  const median = sorted.length
    ? sorted.length % 2
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : currentYield;

  const delta = currentYield - median;
  if (delta > 0.5) {
    return {
      state: "high",
      label: "Above 5-year average",
      hint: "Rates are elevated — locking in now is favourable historically.",
      delta,
    };
  }
  if (delta < -0.5) {
    return {
      state: "low",
      label: "Below 5-year average",
      hint: "Rates have dropped — consider shorter maturities or wait.",
      delta,
    };
  }
  return {
    state: "average",
    label: "Around 5-year average",
    hint: "Rates are near the typical 5-year level.",
    delta,
  };
}

// ─────────────────────────────────────────────────────────────────
// Safety lane map — 2D position
// ─────────────────────────────────────────────────────────────────

export type SafetyLane = "government" | "bank" | "mmf" | "market";

export const SAFETY_LANE_LABEL: Record<SafetyLane, string> = {
  government: "Government-backed",
  bank: "Bank-backed",
  mmf: "Money-market",
  market: "Market-priced",
};

export function vehicleLane(coverage: ComparatorRow["coverage"]): SafetyLane {
  switch (coverage) {
    case "Treasury":
    case "Sovereign":      return "government";
    case "FDIC":
    case "FSCS":
    case "Deposit-EU":     return "bank";
    case "MMF":            return "mmf";
    case "SIPC":
    case "None":           return "market";
  }
}

/** Days until earliest sensible exit. Used to position chips on the X axis. */
export function lockupDays(lockup: string): number {
  const l = lockup.toLowerCase();
  if (/daily|same.day/.test(l)) return 1;
  const dMatch = l.match(/(\d+)\s*day/);
  if (dMatch) return Number(dMatch[1]);
  const mMatch = l.match(/(\d+)\s*month/);
  if (mMatch) return Number(mMatch[1]) * 30;
  const yMatch = l.match(/(\d+)\s*(year|yr)/);
  if (yMatch) return Number(yMatch[1]) * 365;
  return 365;
}

/** Map lockup days to an X position 0–1 on a log-ish scale. */
export function lockupToX(days: number): number {
  if (days <= 1)     return 0.04;
  if (days <= 30)    return 0.10 + ((days - 1) / 29)   * 0.10;
  if (days <= 365)   return 0.20 + ((days - 30) / 335) * 0.30;
  if (days <= 1825)  return 0.50 + ((days - 365) / 1460)* 0.30;
  return 0.80 + Math.min(0.18, ((days - 1825) / 3650) * 0.18);
}

// ─────────────────────────────────────────────────────────────────
// Alternatives — pick 2-3 secondary picks for the bucket
// ─────────────────────────────────────────────────────────────────

export function alternativesFor(
  bucket: Bucket,
  rd: RegionData,
  topVehicleName: string
): ComparatorRow[] {
  const horizonRows = rd.comparator.filter((r) => matchHorizon(r.lockup, bucket));
  // Sort by APY descending, drop the top match (it's the recommended one).
  return horizonRows
    .filter((r) => !sameVehicleFamily(r.vehicle, topVehicleName))
    .sort((a, b) => b.apy - a.apy)
    .slice(0, 3);
}

function sameVehicleFamily(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return norm(a).startsWith(norm(b).slice(0, 8)) ||
         norm(b).startsWith(norm(a).slice(0, 8));
}

function matchHorizon(lockup: string, bucket: Bucket): boolean {
  const l = lockup.toLowerCase();
  switch (bucket) {
    case "anytime":
      return l.includes("daily") || /28|91|3 month|^[1-2] month/.test(l);
    case "months":
      return /182|364|6 month|12 month|3 month/.test(l) || /^1 yr/.test(l);
    case "years":
      return /^[1-5] /.test(l) && (l.includes("year") || l.includes("yr"));
    case "long":
      return /^([5-9]|1[0-9]) /.test(l) && (l.includes("year") || l.includes("yr"));
  }
}

// ─────────────────────────────────────────────────────────────────
// Currency formatting
// ─────────────────────────────────────────────────────────────────

export function fmtMoney(amount: number, currency: RegionData["currency"]): string {
  const sym = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  return `${sym}${Math.round(amount).toLocaleString()}`;
}

export function currencySymbol(currency: RegionData["currency"]): string {
  return currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
}
