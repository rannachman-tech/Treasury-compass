"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function flip() {
    const next = !dark;
    setDark(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    try {
      localStorage.setItem("tyc-theme", next ? "dark" : "light");
    } catch {}
  }

  if (!mounted) return <div className="h-8 w-8" aria-hidden />;

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={flip}
      className="rounded-md border border-border bg-surface-2 p-1.5 text-fg-muted hover:border-border-strong hover:text-fg"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
