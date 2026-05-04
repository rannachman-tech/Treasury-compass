export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-surface-2/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 text-[11.5px] text-fg-subtle space-y-2">
        <p>
          BondSpace<span className="text-accent">.</span> — make sense of bonds.
          Built for the eToro App Store. Not financial advice.
        </p>
        <p>
          Policy rates and the US Treasury curve are pulled live from{" "}
          <a
            href="https://fred.stlouisfed.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-accent hover:underline"
          >
            FRED
          </a>{" "}
          on a 24-hour cycle. EU Bunds, UK gilts, FDIC averages, NS&amp;I rates, HYSA top tiers,
          and brokered-CD rates are curated references, verified periodically — toggle{" "}
          <span className="font-medium text-fg-muted">Net of fees</span> to subtract per-fund
          expense ratios from displayed APYs. Always verify rates with the issuer before depositing.
        </p>
        <p>
          Reference sources (not live-fetched):{" "}
          <a href="https://treasurydirect.gov" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-accent hover:underline">TreasuryDirect</a>,{" "}
          <a href="https://www.fdic.gov" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-accent hover:underline">FDIC</a>,{" "}
          <a href="https://www.deutsche-finanzagentur.de" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-accent hover:underline">Finanzagentur</a>,{" "}
          <a href="https://www.dmo.gov.uk" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-accent hover:underline">UK DMO</a>,{" "}
          <a href="https://www.nsandi.com" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-accent hover:underline">NS&amp;I</a>,{" "}
          <a href="https://www.fscs.org.uk" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-accent hover:underline">FSCS</a>.
        </p>
        <p className="text-fg-subtle/80">
          Past performance does not guarantee future returns. Treasuries carry no credit risk
          but are subject to interest-rate risk if sold before maturity. FDIC / FSCS coverage limits apply
          to insured deposits. Tax treatment is illustrative — consult a tax advisor.
        </p>
      </div>
    </footer>
  );
}
