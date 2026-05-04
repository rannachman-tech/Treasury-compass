"use client";

import type { SourceHealth } from "@/lib/types";
import { Activity } from "lucide-react";

interface Props {
  generatedAt: string;
  sources: SourceHealth[];
}

export function LiveSourcesRow({ generatedAt, sources }: Props) {
  const updated = new Date(generatedAt);
  const fmt = updated.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.16em] text-fg-subtle">
      <span className="inline-flex items-center gap-1">
        <Activity size={11} className="text-positive" />
        Live · {fmt} UTC
      </span>
      <span aria-hidden className="text-border-strong">·</span>
      <ul className="flex flex-wrap items-center gap-1.5">
        {sources.map((s) => {
          const dot =
            s.status === "live"
              ? "bg-positive"
              : s.status === "cached"
              ? "bg-warn"
              : "bg-danger";
          const inner = (
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              {s.name}
            </span>
          );
          return (
            <li key={s.name}>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-fg"
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
