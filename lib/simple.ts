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

/**
 * Maturity in years derived from a Rung's maturity id. Used as the projection
 * horizon so the displayed dollar value matches the *actual* product the user
 * would buy (e.g. a 5-year Treasury projects over 5 years, not the bucket
 * midpoint of 3 years).
 */
export function rungYears(rung: Rung): number {
  switch (rung.id) {
    case "overnight": return 0.083;
    case "3mo":       return 0.25;
    case "6mo":       return 0.5;
    case "1y":        return 1;
    case "2y":        return 2;
    case "5y":        return 5;
    case "10y":       return 10;
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
    case "T-bill":      return "Hold to maturity for the stated yield";
    case "Note":        return "You can sell early, but the price may be higher or lower than what you paid";
    case "Treasury":    return "You can sell early, but the price may be higher or lower than what you paid";
    case "TIPS":        return "Real-yield can be small in calm inflation";
    case "Bund":        return "Hold to maturity for the stated yield";
    case "Gilt":        return "Hold to maturity for the stated yield";
    case "Sovereign-EU":return "Issuer credit varies by country";
    case "Linker":      return "Lower yield when inflation is calm";
    case "MMF":         return "Yield resets daily; not federally insured";
    case "HYSA":        return "Bank can change the rate anytime";
    case "CD":          return "Early withdrawal triggers a penalty";
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
      label: "Higher than usual",
      hint: `Rates are elevated vs. the 5-year median (${(currentYield * 100).toFixed(0)} bp vs ${(median * 100).toFixed(0)} bp). Historically a favourable moment to lock in.`,
      delta,
    };
  }
  if (delta < -0.5) {
    return {
      state: "low",
      label: "Lower than usual",
      hint: `Rates have dropped vs. the 5-year median. Consider shorter maturities or wait.`,
      delta,
    };
  }
  return {
    state: "average",
    label: "Typical for the past 5 years",
    hint: `Rates are near the 5-year median — neither cheap nor rich.`,
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

/**
 * Days until earliest *full-benefit* exit. Scans for ALL time references and
 * takes the max — handles strings like "12 months min, 5y to avoid penalty"
 * where the headline lock is shorter than the effective hold.
 */
export function lockupDays(lockup: string): number {
  const l = lockup.toLowerCase();
  if (/^daily/.test(l) && !/(min|until|avoid)/.test(l)) return 1;

  let max = 0;
  // Plurals require an optional `s?` BEFORE \b — otherwise "5 years" never
  // matches because \b sees both "r" and "s" as word chars.
  for (const m of l.matchAll(/(\d+)\s*days?\b/g))           max = Math.max(max, Number(m[1]));
  for (const m of l.matchAll(/(\d+)\s*months?\b/g))         max = Math.max(max, Number(m[1]) * 30);
  for (const m of l.matchAll(/(\d+)\s*(year|yr)s?\b/g))     max = Math.max(max, Number(m[1]) * 365);
  for (const m of l.matchAll(/(\d+)y\b/g))                  max = Math.max(max, Number(m[1]) * 365);

  return max || 365;
}

/** Map lockup days to an X position 0–1 on a log-ish scale. */
export function lockupToX(days: number): number {
  if (days <= 1)     return 0.04;
  if (days <= 30)    return 0.10 + ((days - 1) / 29)   * 0.10;
  if (days <= 365)   return 0.20 + ((days - 30) / 335) * 0.30;
  if (days <= 1825)  return 0.50 + ((days - 365) / 1460)* 0.30;
  return 0.80 + Math.min(0.18, ((days - 1825) / 3650) * 0.18);
}

/** Discrete buckets used by the Safety map grid. */
export type LockupBucket = "instant" | "weeks" | "year" | "mid" | "long";

export const LOCKUP_BUCKETS: LockupBucket[] = ["instant", "weeks", "year", "mid", "long"];

export const LOCKUP_BUCKET_LABEL: Record<LockupBucket, string> = {
  instant: "Instant",
  weeks: "Weeks",
  year: "≤ 1 yr",
  mid: "1 – 5 yr",
  long: "5 yr +",
};

export function lockupToBucket(lockup: string): LockupBucket {
  const l = lockup.toLowerCase();
  if (/daily|same.day/.test(l)) return "instant";
  const days = lockupDays(lockup);
  if (days <= 91)   return "weeks";
  if (days <= 365)  return "year";
  if (days <= 1825) return "mid";
  return "long";
}

/**
 * Compact chip labels for the Safety map grid.
 *
 * Behaviour: parens that contain a time signal (e.g. "(4 wk)") become a tiny
 * trailing tag ("T-bill 4w"). Parens with non-time content (e.g. "(AGGU)",
 * "(top)") are preserved — they differentiate otherwise-identical base names.
 */
export function abbreviateVehicle(name: string): string {
  let timeTag = "";
  const kept: string[] = [];
  for (const m of name.matchAll(/\(([^)]*)\)/g)) {
    const inner = m[1].trim();
    const wk = inner.match(/(\d+)\s*(wk|week)s?/i);
    const mo = inner.match(/(\d+)\s*(mo|month)s?/i);
    const yr = inner.match(/(\d+)\s*(yr|year)s?\b/i);
    if (wk)       timeTag = `${wk[1]}w`;
    else if (mo)  timeTag = `${mo[1]}m`;
    else if (yr)  timeTag = `${yr[1]}y`;
    else if (inner.length > 0) kept.push(inner.split(/\s+/)[0]);
  }

  let stripped = name.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  if (kept.length > 0) stripped += " (" + kept.join(", ") + ")";

  return timeTag ? `${stripped} ${timeTag}` : stripped;
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
  const recKey = canonicalKey(topVehicleName);
  return horizonRows
    .filter((r) => canonicalKey(r.vehicle) !== recKey)
    .sort((a, b) => b.apy - a.apy)
    .slice(0, 3);
}

/**
 * Canonical comparison key: lowercase + parens stripped + time tokens normalised
 * ("10 yr" → "10y") + non-word chars dropped + tokens sorted. Lets us recognise
 * that "10y Gilt" and "Gilt (10 yr)" are the same vehicle.
 */
function canonicalKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, " ")
    .replace(/(\d+)\s*(year|yr)s?\b/g, "$1y")
    .replace(/(\d+)\s*months?\b/g, "$1m")
    .replace(/(\d+)\s*(week|wk)s?\b/g, "$1w")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

/**
 * Bucket-membership for the comparator/alternatives filter — derived from
 * `lockupDays` so it never disagrees with `lockupToBucket`. Boundaries:
 *   anytime: daily or ≤ 91 days
 *   months:  92 – 365 days
 *   years:   366 – 1825 days  (5y inclusive)
 *   long:    > 1825 days
 */
function matchHorizon(lockup: string, bucket: Bucket): boolean {
  const isDaily =
    /^daily/i.test(lockup) && !/(min|until|avoid)/i.test(lockup);
  const days = lockupDays(lockup);
  switch (bucket) {
    case "anytime": return isDaily || days <= 91;
    case "months":  return !isDaily && days > 91 && days <= 365;
    case "years":   return days > 365 && days <= 1825;
    case "long":    return days >= 1825;
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

// ─────────────────────────────────────────────────────────────────
// Source tier — explicit per-row labels for the comparator/alts
// ─────────────────────────────────────────────────────────────────

export type SourceTier =
  | "govt"     // Constant-maturity / sovereign yield (FRED DGS, Bunds, Gilts)
  | "topTier"  // Curated best-in-market (HYSA, brokered CDs, NS&I, ISA, etc.)
  | "etf"      // ETF wrapper market quote (UCITS rows)
  | "mmf";     // Money-market fund 7-day yield

export const SOURCE_TIER_LABEL: Record<SourceTier, string> = {
  govt:    "Govt yield",
  topTier: "Top tier",
  etf:     "ETF quote",
  mmf:     "MMF yield",
};

export const SOURCE_TIER_HINT: Record<SourceTier, string> = {
  govt:    "Sovereign yield (FRED constant-maturity / Bund / Gilt). Auction-truth at issue, secondary-market thereafter.",
  topTier: "Curated best-in-market rate from leading providers. Verified periodically — not the FDIC national average.",
  etf:     "ETF market quote (UCITS). Trades intraday; price moves with rates and FX.",
  mmf:     "Money-market fund 7-day yield, daily-liquid. Resets daily.",
};

export function rowSourceTier(row: ComparatorRow): SourceTier {
  // Coverage carries most of the signal.
  if (row.coverage === "MMF") return "mmf";
  if (row.coverage === "Treasury" || row.coverage === "Sovereign") {
    // ETF wrappers tracking sovereigns (Global region's UCITS rows)
    if (/UCITS|ETF|\(IB01|\(AGGU|\(EUNA|\(DTLA|\(IS3M|\(IBCI|\(XY4P|\(ERNS|\(SYBG/i.test(row.vehicle))
      return "etf";
    return "govt";
  }
  // Bank deposits — curated top tier
  if (row.coverage === "FDIC" || row.coverage === "FSCS" || row.coverage === "Deposit-EU")
    return "topTier";
  return "topTier";
}

// ─────────────────────────────────────────────────────────────────
// Expense-ratio map — bps deducted in "Net of fees" mode
// ─────────────────────────────────────────────────────────────────

/** Per-symbol expense ratios in basis points. Matched against ComparatorRow.vehicle text. */
const EXPENSE_RATIOS_BPS: Array<[RegExp, number]> = [
  [/\bBIL\b/, 14],
  [/\bSHV\b/, 15],
  [/\bIEF\b/, 15],
  [/\bTLT\b/, 15],
  [/\bTIP\b/, 19],
  [/\bIS3M\b/, 9],
  [/\bIBCI\b/, 9],
  [/\bEUNA\b/, 10],
  [/\bXY4P\b/, 15],
  [/\bERNS\b/, 9],
  [/\bSYBG\b/, 15],
  [/\bAGGU\b/, 10],
  [/\bDTLA\b/, 7],
  [/\bIB01\b/, 7],
  [/\bIGLN\b/, 12],
  [/Ultrashort ETF|UCITS\)?$/i, 10],
  [/Treasury MMF|MMF \(Treasury\)/i, 10],
  [/MMF \(Prime\)|EUR MMF|GBP MMF/i, 11],
  [/Money-market|MMF/i, 10],
];

/**
 * Always-visible rationale for the recommendation card. Two modes:
 * - When an alternative beats the rec on headline rate, defend with the trade-off.
 * - When the rec is also the highest-yielding option, frame the match positively.
 *
 * Keeping this slot always populated stabilises the card's vertical height
 * across bucket changes (the box no longer appears/disappears).
 */
export function whyMatch(
  rec: Rung,
  topAlt: ComparatorRow | undefined
): { eyebrow: string; body: string } {
  const recIsTreasury =
    rec.winner.coverage === "Treasury" || rec.winner.coverage === "Sovereign";
  const stateTaxFree = /state.?tax.?free/i.test(rec.winner.tax);

  if (!topAlt || topAlt.apy <= rec.yield) {
    return {
      eyebrow: "Why this match",
      body: recIsTreasury
        ? `Highest headline yield at this horizon, fully government-backed${stateTaxFree ? " and state-tax-free" : ""}. No compromise on safety to get the rate.`
        : `Highest headline yield available at this horizon with the cleanest credit profile in the bucket.`,
    };
  }

  const altIsCd = /\bCD\b|fixed.?rate bond|term deposit/i.test(topAlt.vehicle);
  const altIsHysa = /HYSA|easy.?access|savings|cash ISA|premium bonds?/i.test(topAlt.vehicle);
  const altIsPrimeMmf = /\bPrime\b/i.test(topAlt.vehicle);

  if (recIsTreasury && altIsCd) {
    return {
      eyebrow: "Why this still wins",
      body: `Higher headline rate, but ${topAlt.vehicle} is fully taxable and locks you in with an early-withdrawal penalty.${
        stateTaxFree ? " State-tax-free government bonds usually win after-tax." : ""
      }`,
    };
  }
  if (recIsTreasury && altIsHysa) {
    return {
      eyebrow: "Why this still wins",
      body: `Higher headline rate, but ${topAlt.vehicle} is fully taxable and the rate can change anytime.${
        stateTaxFree ? " State-tax-free government bonds usually win after-tax." : ""
      }`,
    };
  }
  if (recIsTreasury && altIsPrimeMmf) {
    return {
      eyebrow: "Why this still wins",
      body: `${topAlt.vehicle} pays more by holding commercial paper — slight credit risk vs. pure Treasury.`,
    };
  }
  return {
    eyebrow: "Why this still wins",
    body: `Higher headline rate, but trade-offs in tax, lockup, or credit profile usually swing the after-tax outcome.`,
  };
}

/** Look up expense ratio in bps. 0 if no wrapper (direct Treasury, deposit). */
export function expenseRatioBps(row: ComparatorRow): number {
  const tier = rowSourceTier(row);
  // Direct sovereign holdings + deposits have no wrapper fee that the saver pays.
  if (tier === "govt" || tier === "topTier") {
    // ...except top-tier rows that are clearly funds.
    if (!/MMF|UCITS|ETF/i.test(row.vehicle)) return 0;
  }
  for (const [re, bps] of EXPENSE_RATIOS_BPS) {
    if (re.test(row.vehicle)) return bps;
  }
  return 0;
}
