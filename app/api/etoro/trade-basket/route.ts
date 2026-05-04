/**
 * POST /api/etoro/trade-basket
 *
 * Submits market-buy orders for each holding in a basket. Returns per-ticker
 * success/failure. Client decides what to do with the result.
 *
 * Edge runtime.
 */

export const runtime = "edge";

const BASE = "https://public-api.etoro.com/api/v1";

interface TradeBody {
  apiKey: string;
  userKey: string;
  env: "real" | "demo";
  basket: Array<{ ticker: string; instrumentId: number; amount: number }>;
}

function rid() {
  return crypto.randomUUID();
}

export async function POST(req: Request) {
  let body: TradeBody;
  try {
    body = (await req.json()) as TradeBody;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.apiKey || !body.userKey || !Array.isArray(body.basket)) {
    return Response.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const headers = {
    "x-api-key": body.apiKey,
    "x-user-key": body.userKey,
    "x-request-id": rid(),
    "Content-Type": "application/json",
  };
  const path =
    body.env === "demo"
      ? `${BASE}/trading/execution/demo/market-open-orders/by-amount`
      : `${BASE}/trading/execution/market-open-orders/by-amount`;

  const results = await Promise.all(
    body.basket.map(async (h) => {
      try {
        const res = await fetch(path, {
          method: "POST",
          headers,
          // PascalCase per skill gotcha #12.
          body: JSON.stringify({
            InstrumentID: h.instrumentId,
            IsBuy: true,
            Leverage: 1,
            Amount: h.amount,
          }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          return { ticker: h.ticker, ok: false, status: res.status, error: txt.slice(0, 200) };
        }
        const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return { ticker: h.ticker, ok: true, response: json };
      } catch (err: any) {
        return { ticker: h.ticker, ok: false, status: 0, error: err?.message ?? "network" };
      }
    })
  );

  return Response.json({ ok: true, results });
}
