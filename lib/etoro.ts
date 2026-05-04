// Storage + helpers for the eToro session. localStorage-only — no PII.

const KEY = "tyc-etoro:v1";

export interface EtoroSession {
  apiKey: string;
  userKey: string;
  env: "real" | "demo";
  username: string;
  cid: number;
  connectedAt: string;
}

export function loadEtoroSession(): EtoroSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EtoroSession;
  } catch {
    return null;
  }
}

export function saveEtoroSession(s: EtoroSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("tyc-etoro-changed"));
}

export function clearEtoroSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("tyc-etoro-changed"));
}

/** Open the eToro market page in a new tab, deep-linked when possible. */
export function etoroDeepLink(symbolFull: string): string {
  // Public market page works for everyone, even without auth.
  // eToro symbols on /markets/ are lowercased.
  const slug = symbolFull.toLowerCase().replace(/\./g, "");
  return `https://www.etoro.com/markets/${encodeURIComponent(slug)}`;
}
