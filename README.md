# Treasury Yield Compass

> What's the best safe place for my cash right now?

A bespoke yield ladder for the eToro App Store. Answers one question with a
beautiful instrument-style hero: what risk-free vehicle wins each maturity bucket
on the Treasury curve? T-bills, HYSA, MMFs, brokered CDs, Treasury notes, TIPS —
ranked by horizon, with FDIC/SIPC coverage, lockup, and tax treatment.

## What's in the app

- **Yield ladder centerpiece** — 7 vertical rungs (overnight → 10y), each rung
  shows the winning vehicle, yield (tabular nums), coverage badge, lockup, tax.
  Active rung gets a 1px brass outline + slightly larger type. Bespoke SVG rails
  with rivets — feels like a real physical ladder, not a list.
- **Insights card** — natural-language insight per horizon, plus three live
  stats (best APY, real yield vs CPI, curve slope 10y-3m), plus a w/w move
  indicator at the active horizon.
- **Trade-on-eToro CTA** — phase-aware copy, opens a Review → Confirm →
  Executing → Result modal. Submits market-buy orders for each holding via the
  eToro Public API.
- **Horizon picker + inflation toggle** — segmented control above the ladder;
  inflation toggle subtracts CPI YoY from displayed yields.
- **Live yield curve chart** — today's curve plus a dotted prev-week overlay,
  hover tooltip with delta in bps.
- **Comparator table** — 15 vehicles side by side, sortable + horizon-filterable.
- **Calculator** — `$X for Y horizon → expected at maturity per option`, with
  tax-adjusted toggle (separate federal + state %) and inflation-adjusted toggle.
  Treasuries get a "state-tax-free" badge that the calculator honours.
- **5-year history chart** — Fed Funds, 3-month, 2-year, 10-year.
- **eToro citizenship chrome** — risk warning banner, Connect eToro
  modal (manual API key flow with auto demo/real detection), live sources health
  row, NFA disclaimer footer, theme toggle (light/dark, OS-aware first paint).

## Tech stack

- Next.js 14 + TypeScript + Tailwind 3
- Recharts for the charts; bespoke SVG for the ladder centerpiece
- Edge runtime API routes for the eToro validate + trade-basket endpoints
- GitHub Actions cron that refreshes `data/yields.json` daily
- localStorage for prefs + eToro session (no PII, no cookies, no fingerprinting)
- Vercel-ready (`next` runtime, no server deps)

## Data sources

- FRED — DGS3MO, DGS6MO, DGS1, DGS2, DGS3, DGS5, DGS7, DGS10, DGS20, DGS30, DFF, CPIAUCSL
- TreasuryDirect — auction yields (referenced)
- FDIC — coverage limits + national rate caps (referenced)
- HYSA APYs are curated (no public API for individual bank rates)

## Trade baskets

`lib/baskets.ts` — 16 baskets, region (US, EU, UK, Global) × horizon (`<3mo`,
`3-12mo`, `1-5y`, `5y+`). Each basket has 3 holdings, weights sum to 100, max
single weight ≤ 55%. Every `instrumentId` is pre-resolved against the eToro
public catalog (no runtime `/market-data/search`).

Confirmed-tradeable instrument IDs:

| Region | Tickers |
|---|---|
| US | BIL=4407, SHV=4321, IEF=3101, TLT=3020, TIP=4311 |
| EU | IS3M.DE=10565, IBCI.DE=10585, EUNA.DE=10586, XY4P.DE=10614 |
| UK | ERNS.L=14495, SYBG.DE=10641 |
| Global | AGGU.L=13553, DTLA.L=13564, IB01.L=1442 |

Verify any time with: `node scripts/spot-check.mjs` (no install needed).

## Local development

```sh
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Verify + simulate

```sh
npm run verify:baskets    # cross-check every instrumentId vs live catalog
npm run simulate:baskets  # 9-section structural simulator
```

CI runs both on every push to `lib/baskets.ts` or the scripts (see
`.github/workflows/verify.yml`).

## Deploy

1. Push to GitHub.
2. Connect the repo to Vercel (or Coolify on eToro infra).
3. (Optional) Set `FRED_API_KEY` for the data refresh job — works without one
   thanks to the public CSV fallback.
4. The data cron runs at 21:00 UTC weekdays (`.github/workflows/data.yml`) and
   commits any updated `data/yields.json` automatically.

## Audit checklist before each ship

- [ ] `npm run typecheck` clean
- [ ] `npm run build` clean
- [ ] `npm run verify:baskets` clean
- [ ] `npm run simulate:baskets` clean
- [ ] `node scripts/spot-check.mjs` clean (no install needed)
- [ ] Live UI test: every region tab, every horizon, theme toggle, both modals,
      trade flow per horizon
- [ ] Console errors filtered for extension noise
- [ ] Mobile responsive at 380px and desktop 1080p
- [ ] OS prefers-color-scheme honored on first paint

## Not financial advice

Yields move daily. ETF wrappers carry small expense ratios. Treasuries carry no
credit risk but interest-rate risk applies if sold before maturity. FDIC limits
apply to insured deposits. Tax treatment is illustrative — consult a tax
advisor.
