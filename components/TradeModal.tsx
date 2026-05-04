"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Wallet, Check, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import type { Basket } from "@/lib/baskets";
import { allocate } from "@/lib/baskets";
import type { EtoroSession } from "@/lib/etoro";

type Step = "review" | "confirm" | "executing" | "result";

interface Props {
  open: boolean;
  onClose: () => void;
  basket: Basket;
  session: EtoroSession | null;
  onAskConnect: () => void;
}

const QUICK = [250, 500, 1000, 5000];

export function TradeModal({ open, onClose, basket, session, onAskConnect }: Props) {
  const [amount, setAmount] = useState(1000);
  const [step, setStep] = useState<Step>("review");
  const [results, setResults] = useState<Array<{ ticker: string; ok: boolean; error?: string }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "executing") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, step]);

  // Reset step when (re)opened.
  useEffect(() => {
    if (open) {
      setStep("review");
      setResults([]);
    }
  }, [open]);

  const allocation = useMemo(() => allocate(basket, amount), [basket, amount]);

  if (!open || !mounted) return null;

  async function execute() {
    if (!session) {
      onAskConnect();
      return;
    }
    setStep("executing");
    try {
      const res = await fetch("/api/etoro/trade-basket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: session.apiKey,
          userKey: session.userKey,
          env: session.env,
          basket: allocation.map((a) => ({
            ticker: a.ticker,
            instrumentId: a.instrumentId,
            amount: a.dollars,
          })),
        }),
      });
      const json = await res.json();
      setResults(
        Array.isArray(json.results)
          ? json.results
          : allocation.map((a) => ({ ticker: a.ticker, ok: false, error: "no response" }))
      );
    } catch (e: any) {
      setResults(
        allocation.map((a) => ({ ticker: a.ticker, ok: false, error: e?.message ?? "network" }))
      );
    }
    setStep("result");
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-black/45 backdrop-blur-sm p-4"
      onClick={() => step !== "executing" && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-lg border border-border bg-surface paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="min-w-0 pr-2">
            <h3 className="flex items-start gap-2 text-[14px] font-semibold leading-snug">
              <Wallet size={14} className="mt-0.5 text-accent shrink-0" />
              <span>{basket.title}</span>
            </h3>
            <p className="mt-1 text-[11.5px] text-fg-muted leading-snug">{basket.thesis}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={step === "executing"}
            onClick={onClose}
            className="rounded-md p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </header>

        {step === "review" && (
          <div className="px-5 py-4">
            <label className="block">
              <span className="block text-[10.5px] font-mono uppercase tracking-[0.16em] text-fg-subtle">
                Amount (USD)
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={amount}
                  onChange={(e) =>
                    setAmount(Math.max(1, Number(e.target.value) || 0))
                  }
                  className="w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 tabular text-[14px] text-fg focus:border-accent"
                />
                <div className="flex flex-wrap gap-1">
                  {QUICK.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(v)}
                      className="rounded-md border border-border px-2 py-1 text-[11px] hover:bg-surface-2"
                    >
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </label>

            <AllocationTable allocation={allocation} />

            <details className="mt-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-[12px] text-fg-muted">
              <summary className="cursor-pointer font-medium">Why these holdings →</summary>
              <ul className="mt-2 space-y-1.5">
                {allocation.map((a) => (
                  <li key={a.ticker} className="leading-snug">
                    <span className="font-medium text-fg">{a.ticker}</span> · {a.shortRationale}
                  </li>
                ))}
              </ul>
            </details>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border px-3 py-1.5 text-[12.5px] hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-medium text-bg hover:brightness-110"
              >
                Review order <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="px-5 py-4">
            <div className="rounded-md border border-border">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Ticker</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Weight</th>
                    <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {allocation.map((a) => (
                    <tr key={a.ticker} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium">{a.ticker}</td>
                      <td className="px-3 py-2 text-right tabular">{a.weight}%</td>
                      <td className="px-3 py-2 text-right tabular">${a.dollars.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface-2">
                    <td className="px-3 py-2 font-medium">Total</td>
                    <td />
                    <td className="px-3 py-2 text-right tabular font-semibold">
                      ${amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-md border border-warn/30 bg-warn/10 px-3 py-2 text-[12px] text-warn">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>
                Make sure you have the required funds available in your{" "}
                {session?.env === "demo" ? "demo" : "real"} account.
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setStep("review")}
                className="rounded-md border border-border px-3 py-1.5 text-[12.5px] hover:bg-surface-2"
              >
                Back
              </button>
              <button
                type="button"
                onClick={execute}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-medium text-bg hover:brightness-110"
              >
                {session ? "Execute basket" : "Connect & execute"}
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

        {step === "executing" && (
          <div className="px-5 py-10 text-center">
            <Loader2 className="mx-auto animate-spin text-accent" size={20} />
            <p className="mt-3 text-[13px] text-fg-muted">Submitting orders…</p>
          </div>
        )}

        {step === "result" && (
          <div className="px-5 py-4">
            <div className="rounded-md border border-border">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Ticker</th>
                    <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.ticker} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium">{r.ticker}</td>
                      <td className="px-3 py-2">
                        {r.ok ? (
                          <span className="inline-flex items-center gap-1 text-positive">
                            <Check size={13} /> Order placed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-danger">
                            <X size={13} /> {r.error ? `Failed — ${r.error}` : "Failed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-medium text-bg hover:brightness-110"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function AllocationTable({
  allocation,
}: {
  allocation: ReturnType<typeof allocate>;
}) {
  return (
    <div className="mt-3 rounded-md border border-border">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Ticker</th>
            <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Holding</th>
            <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Wt.</th>
            <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-fg-subtle">$</th>
          </tr>
        </thead>
        <tbody>
          {allocation.map((a) => (
            <tr key={a.ticker} className="border-b border-border last:border-0">
              <td className="px-3 py-2 font-medium">{a.ticker}</td>
              <td className="px-3 py-2 text-fg-muted leading-snug">{a.name}</td>
              <td className="px-3 py-2 text-right tabular">{a.weight}%</td>
              <td className="px-3 py-2 text-right tabular">${a.dollars.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
