"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComparatorRow, Horizon, RegionData } from "@/lib/types";
import { lockupDays } from "@/lib/simple";
import { Calculator as CalcIcon, Info } from "lucide-react";

interface Props {
  rows: ComparatorRow[];
  defaultHorizon: Horizon;
  regionData: RegionData;
}

const HORIZON_TO_YEARS: Record<Horizon, number> = {
  "<3mo": 0.25,
  "3-12mo": 1,
  "1-5y": 3,
  "5y+": 7,
};

const HORIZON_LABEL: Record<Horizon, string> = {
  "<3mo": "3 months",
  "3-12mo": "1 year",
  "1-5y": "3 years",
  "5y+": "7 years",
};

const matchHorizon = (lockup: string, h: Horizon): boolean => {
  const isDaily =
    /^daily/i.test(lockup) && !/(min|until|avoid)/i.test(lockup);
  const days = lockupDays(lockup);
  switch (h) {
    case "<3mo":   return isDaily || days <= 91;
    case "3-12mo": return !isDaily && days > 91 && days <= 365;
    case "1-5y":   return days > 365 && days <= 1825;
    case "5y+":    return days >= 1825;
  }
};

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  Mixed: "$",
};

export function Calculator({ rows, defaultHorizon, regionData }: Props) {
  const sym = CURRENCY_SYMBOL[regionData.currency] ?? "$";
  const tax = regionData.taxModel;

  const [amount, setAmount] = useState(10000);
  const [horizon, setHorizon] = useState<Horizon>(defaultHorizon);
  const [taxAdjusted, setTaxAdjusted] = useState(true);
  const [primaryRate, setPrimaryRate] = useState(tax.primaryDefault);
  const [secondaryRate, setSecondaryRate] = useState(tax.secondaryDefault);
  const [realAdjusted, setRealAdjusted] = useState(false);

  // Reset tax defaults when region changes.
  useEffect(() => {
    setPrimaryRate(tax.primaryDefault);
    setSecondaryRate(tax.secondaryDefault);
  }, [regionData.currency, tax.primaryDefault, tax.secondaryDefault]);

  // Sync horizon with the picker above.
  useEffect(() => {
    setHorizon(defaultHorizon);
  }, [defaultHorizon]);

  const years = HORIZON_TO_YEARS[horizon];

  const candidates = useMemo(
    () => rows.filter((r) => matchHorizon(r.lockup, horizon)),
    [rows, horizon]
  );

  const computed = useMemo(() => {
    return candidates
      .map((r) => {
        const headlineApy = r.apy / 100;
        const effTax = taxAdjusted
          ? primaryRate / 100 +
            (r.secondaryTaxFree ? 0 : (tax.secondaryLabel ? secondaryRate / 100 : 0))
          : 0;
        const realDrag = realAdjusted ? regionData.cpiYoy / 100 : 0;
        const netRate = headlineApy * (1 - effTax) - realDrag;
        const value =
          years < 1
            ? amount * (1 + netRate * years)
            : amount * Math.pow(1 + netRate, years);
        return {
          vehicle: r.vehicle,
          coverage: r.coverage,
          apy: r.apy,
          netRate: netRate * 100,
          gain: value - amount,
          value,
          secondaryTaxFree: r.secondaryTaxFree,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [candidates, amount, years, taxAdjusted, primaryRate, secondaryRate, realAdjusted, regionData.cpiYoy, tax.secondaryLabel]);

  const top = computed[0];
  const wedge = computed[computed.length - 1];

  return (
    <section className="rounded-lg border border-border bg-surface paper p-4 sm:p-5">
      <div className="flex items-center gap-1.5">
        <CalcIcon size={13} className="text-accent" />
        <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-fg-subtle">
          Calculator — what does {sym}X earn?
        </h3>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          label={`Amount (${regionData.currency === "Mixed" ? "USD" : regionData.currency})`}
          value={amount}
          onChange={setAmount}
          prefix={sym}
          step={500}
        />
        <SelectField
          label="Horizon"
          value={horizon}
          onChange={(v) => setHorizon(v as Horizon)}
          options={[
            ["<3mo", "3 months"],
            ["3-12mo", "1 year"],
            ["1-5y", "3 years"],
            ["5y+", "7 years"],
          ]}
        />
        <NumberField
          label={tax.primaryLabel}
          value={primaryRate}
          onChange={setPrimaryRate}
          disabled={!taxAdjusted}
          step={1}
        />
        {tax.secondaryLabel ? (
          <NumberField
            label={tax.secondaryLabel}
            value={secondaryRate}
            onChange={setSecondaryRate}
            disabled={!taxAdjusted}
            step={1}
          />
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
        <Toggle label="Tax-adjusted" on={taxAdjusted} onChange={setTaxAdjusted} />
        <Toggle
          label={`Inflation-adjusted (${regionData.cpiLabel} ${regionData.cpiYoy.toFixed(1)}%)`}
          on={realAdjusted}
          onChange={setRealAdjusted}
        />
      </div>

      <div className="mt-4 scroll-x rounded-md border border-border">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-surface-2">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Vehicle</th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Headline APY</th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">
                {taxAdjusted ? "After-tax" : "Pre-tax"}{realAdjusted ? " (real)" : ""}
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Gain</th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Value at maturity</th>
            </tr>
          </thead>
          <tbody>
            {computed.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-fg-subtle">
                  No vehicles match this horizon. Pick a different bucket.
                </td>
              </tr>
            ) : (
              computed.map((c, i) => (
                <tr
                  key={c.vehicle}
                  className={[
                    "border-b border-border last:border-0",
                    i === 0 ? "bg-accent/8" : "",
                  ].join(" ")}
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-fg">{c.vehicle}</span>
                      {i === 0 && (
                        <span className="rounded-full border border-accent/40 bg-accent/10 px-1.5 py-px text-[9.5px] font-medium uppercase tracking-wider text-accent">
                          Best
                        </span>
                      )}
                      {c.secondaryTaxFree && taxAdjusted && tax.secondaryLabel && (
                        <span className="rounded border border-positive/30 bg-positive/10 px-1 py-px text-[9px] uppercase tracking-wider text-positive">
                          {tax.exemptBadge}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular text-fg-muted">{c.apy.toFixed(2)}%</td>
                  <td className={`px-3 py-2 text-right tabular ${c.netRate < 0 ? "text-danger" : "text-fg"}`}>
                    {c.netRate.toFixed(2)}%
                  </td>
                  <td className={`px-3 py-2 text-right tabular ${c.gain < 0 ? "text-danger" : "text-positive"}`}>
                    {c.gain >= 0 ? "+" : ""}{sym}{Math.round(c.gain).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right tabular font-semibold">
                    {sym}{Math.round(c.value).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {top && wedge && top !== wedge && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-[12px] text-fg-muted">
          <Info size={13} className="mt-0.5 shrink-0 text-accent" />
          <p>
            For {sym}{amount.toLocaleString()} over {HORIZON_LABEL[horizon]},{" "}
            <span className="font-semibold text-fg">{top.vehicle}</span> ends at{" "}
            <span className="tabular text-fg">{sym}{Math.round(top.value).toLocaleString()}</span>{" "}
            — that's{" "}
            <span className="tabular font-semibold text-positive">
              {sym}{Math.round(top.value - wedge.value).toLocaleString()} more
            </span>{" "}
            than {wedge.vehicle}, the worst pick at this horizon.
            {taxAdjusted && top.secondaryTaxFree && tax.secondaryLabel && (
              <> The {tax.exemptBadge.toLowerCase()} advantage explains most of the spread.</>
            )}
          </p>
        </div>
      )}

      {tax.taxNote && (
        <p className="mt-2 text-[11px] text-fg-subtle leading-snug">
          {tax.taxNote}
        </p>
      )}
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  step = 1,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-[0.16em] text-fg-subtle">
        {label}
      </span>
      <div className="mt-1 flex items-center rounded-md border border-border bg-surface-2 focus-within:border-accent">
        {prefix && (
          <span className="pl-2.5 text-fg-subtle text-[12.5px]">{prefix}</span>
        )}
        <input
          type="number"
          step={step}
          min={0}
          disabled={disabled}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full bg-transparent px-2.5 py-1.5 tabular text-[13px] text-fg outline-none disabled:opacity-50"
        />
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-[0.16em] text-fg-subtle">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[13px] text-fg focus:border-accent"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[12px] hover:border-border-strong"
    >
      <span
        aria-hidden
        className={`relative h-3.5 w-7 rounded-full border transition-colors ${on ? "bg-accent border-accent" : "bg-border border-border-strong"}`}
      >
        <span className={`absolute top-px h-2.5 w-2.5 rounded-full bg-surface transition-all ${on ? "left-[14px]" : "left-px"}`} />
      </span>
      <span className="text-fg-muted">{label}</span>
    </button>
  );
}
