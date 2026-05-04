"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { saveEtoroSession } from "@/lib/etoro";
import { X, KeyRound, ShieldCheck, ChevronRight, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ConnectEtoroModal({ open, onClose }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [userKey, setUserKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, busy]);

  if (!open || !mounted) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/etoro/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, userKey }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
      saveEtoroSession({
        apiKey,
        userKey,
        env: json.detectedEnv,
        username: json.profile.username,
        cid: json.profile.cid,
        connectedAt: new Date().toISOString(),
      });
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Connection failed");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={() => !busy && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-title"
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-surface paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 id="connect-title" className="flex items-center gap-2 text-[14px] font-semibold">
            <KeyRound size={14} className="text-accent" /> Connect eToro
          </h3>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
            className="rounded-md p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-3 px-5 py-4">
          <p className="text-[12.5px] leading-snug text-fg-muted">
            We auto-detect demo vs. real account. Keys live in your browser only —
            we never see them.
          </p>

          <Field
            label="Public API Key"
            value={apiKey}
            onChange={setApiKey}
            placeholder="UUID-style"
          />
          <Field
            label="Private Key"
            value={userKey}
            onChange={setUserKey}
            placeholder="UUID-style"
            type="password"
          />

          <details className="rounded-md border border-border bg-surface-2 px-3 py-2 text-[12px] text-fg-muted">
            <summary className="cursor-pointer font-medium">
              Where do I get these?
            </summary>
            <ol className="mt-1.5 list-decimal pl-4 leading-snug space-y-0.5">
              <li>
                Sign in to <span className="font-mono">developers.etoro.com</span>.
              </li>
              <li>Create an app — request market-data + trading scopes.</li>
              <li>Copy the Public API Key + Private Key into the fields above.</li>
            </ol>
          </details>

          {err && (
            <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
              {err}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-md border border-border px-3 py-1.5 text-[12.5px] hover:bg-surface-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !apiKey || !userKey}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-medium text-bg hover:brightness-110 disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Testing…
                </>
              ) : (
                <>
                  <ShieldCheck size={13} />
                  Test connection
                  <ChevronRight size={13} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10.5px] font-mono uppercase tracking-[0.16em] text-fg-subtle">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[12px] text-fg placeholder:text-fg-subtle focus:border-accent"
        spellCheck={false}
        autoComplete="off"
      />
    </label>
  );
}
