"use client";

import { useEffect, useState } from "react";
import { Compass, Plug, CheckCircle2, ChevronDown, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { ConnectEtoroModal } from "./ConnectEtoroModal";
import { ModeToggle, type Mode } from "./ModeToggle";
import { clearEtoroSession, loadEtoroSession, type EtoroSession } from "@/lib/etoro";

interface Props {
  mode: Mode;
  onModeChange: (m: Mode) => void;
}

export function Header({ mode, onModeChange }: Props) {
  const [session, setSession] = useState<EtoroSession | null>(null);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    setSession(loadEtoroSession());
    const handler = () => setSession(loadEtoroSession());
    window.addEventListener("tyc-etoro-changed", handler);
    return () => window.removeEventListener("tyc-etoro-changed", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-bg/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-2.5">
          <a href="/" className="group flex items-center gap-2.5 min-w-0 transition-transform hover:scale-[1.005]">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-accent/40 bg-gradient-to-br from-accent/15 to-accent/5 text-accent transition-shadow group-hover:shadow-[0_0_0_3px_rgb(var(--accent)/0.10)]">
              <Compass size={16} strokeWidth={1.75} />
            </span>
            <div className="leading-tight min-w-0">
              <div className="text-[15px] font-semibold tracking-tight text-fg truncate">
                BondSpace<span className="text-accent">.</span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-fg-subtle hidden sm:block">
                Make sense of bonds
              </div>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <ModeToggle value={mode} onChange={onModeChange} />
            {!session ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Connect eToro"
                className="inline-flex items-center gap-1.5 rounded-md border border-accent/50 bg-accent/10 px-2 sm:px-2.5 py-1.5 text-[12.5px] font-medium text-accent hover:bg-accent/20 transition-colors"
              >
                <Plug size={13} />
                <span className="hidden sm:inline">Connect eToro</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenu((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-positive/30 bg-positive/10 px-2.5 py-1.5 text-[12.5px] text-positive transition-colors hover:bg-positive/15"
                >
                  <CheckCircle2 size={13} />
                  <span className="font-medium">@{session.username}</span>
                  {session.env === "demo" && (
                    <span className="rounded border border-warn/40 bg-warn/10 px-1 py-px text-[9.5px] font-mono uppercase tracking-wider text-warn">
                      Virtual
                    </span>
                  )}
                  <ChevronDown size={12} />
                </button>
                {menu && (
                  <div
                    className="absolute right-0 mt-1.5 w-48 rounded-md border border-border bg-surface shadow-lg"
                    onMouseLeave={() => setMenu(false)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        clearEtoroSession();
                        setMenu(false);
                      }}
                      className="flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-left text-[12.5px] text-fg-muted hover:bg-surface-2 hover:text-fg"
                    >
                      <LogOut size={12} /> Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <ConnectEtoroModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
