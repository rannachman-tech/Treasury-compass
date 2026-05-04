/**
 * POST /api/etoro/validate
 *
 * Validates a (apiKey, userKey) pair against the eToro Public API and returns
 * the resolved username + auto-detected env.
 *
 * Edge runtime — fast cold start, no heavy deps.
 */

export const runtime = "edge";

const BASE = "https://public-api.etoro.com/api/v1";

function rid() {
  return crypto.randomUUID();
}

interface MeResp {
  realCid?: number;
  cid?: number;
  gcid?: number;
  username?: string;
}

export async function POST(req: Request) {
  let body: { apiKey?: string; userKey?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
  const apiKey = (body.apiKey ?? "").trim();
  const userKey = (body.userKey ?? "").trim();
  if (!apiKey || !userKey) {
    return Response.json(
      { ok: false, error: "Both Public API Key and Private Key are required." },
      { status: 400 }
    );
  }

  const headers = {
    "x-api-key": apiKey,
    "x-user-key": userKey,
    "x-request-id": rid(),
  };

  // Step 1 — /me  (canonical path per the eToro Public API; /user/me 404s)
  const meRes = await fetch(`${BASE}/me`, { headers });
  if (!meRes.ok) {
    const body = await meRes.text().catch(() => "");
    return Response.json(
      {
        ok: false,
        error: `eToro rejected the keys (HTTP ${meRes.status}). Verify the Public API Key + Private Key from Settings → Trading → API keys.`,
        debug: body.slice(0, 200),
      },
      { status: meRes.status === 401 || meRes.status === 403 ? 401 : 502 }
    );
  }
  const me = (await meRes.json()) as MeResp;

  // Use realCid, NOT gcid (skill gotcha #9).
  const cid = me.realCid ?? me.cid;
  if (!cid) {
    return Response.json(
      { ok: false, error: "Could not resolve account ID from /me." },
      { status: 500 }
    );
  }

  // Step 2 — username via /user-info/people
  let username = me.username ?? "";
  try {
    const pplRes = await fetch(
      `${BASE}/user-info/people?cidList=${cid}`,
      { headers }
    );
    if (pplRes.ok) {
      const ppl: any = await pplRes.json();
      const profile =
        (Array.isArray(ppl) ? ppl[0] : null) ??
        ppl?.users?.[0] ??
        ppl?.people?.[0] ??
        ppl?.data?.[0] ??
        ppl?.ppl?.[0];
      if (profile?.userName) username = profile.userName;
      else if (profile?.username) username = profile.username;
    }
  } catch {
    // Non-fatal — fall back to me.username (may be empty).
  }

  // Step 3 — env probe
  let detectedEnv: "real" | "demo" = "demo";
  try {
    const probe = await fetch(`${BASE}/trading/info/portfolio`, { headers });
    if (probe.ok) detectedEnv = "real";
    else if (probe.status === 401 || probe.status === 403) detectedEnv = "demo";
  } catch {
    /* default to demo */
  }

  return Response.json({
    ok: true,
    detectedEnv,
    profile: { cid, username: username || `user-${cid}` },
  });
}
