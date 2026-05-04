export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-surface-2/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 text-[11.5px] text-fg-subtle space-y-2">
        <p>
          Treasury Yield Compass — what's the best safe place for cash, right now?
          Built for the eToro App Store. Not financial advice.
        </p>
        <p>
          Yields refresh on a 24-hour cycle from FRED, TreasuryDirect, and FDIC.
          HYSA APYs are curated; always verify rates with the issuer before deposit.
          ETF wrappers carry small expense ratios; shown yields are gross of fees.
        </p>
        <p className="text-fg-subtle/80">
          Past performance does not guarantee future returns. Treasuries carry no credit risk
          but are subject to interest-rate risk if sold before maturity. FDIC coverage limits apply
          to insured deposits. Tax treatment is illustrative — consult a tax advisor.
        </p>
      </div>
    </footer>
  );
}
