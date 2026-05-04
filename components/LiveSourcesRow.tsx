"use client";

import type { SourceHealth } from "@/lib/types";
import { Activity } from "lucide-react";

interface Props {
  generatedAt: string;
  sources: SourceHealth[];
}

/**
 * Header live-sources row.
 *
 * Shows ONLY sources that are actually live-fetched on the cron (status === "live").
 * Cached / curated sources are referenced in the footer instead — putting them here
 * with a green dot would over-claim freshness; with an amber dot it just adds noise.
 */
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

  const live = sources.filter((s) => s.status === "live");

  return (
    <div
      className="flex flex-wrap items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.16em] text-fg-subtle"
      title="Refreshed timestamp = last cron run. Sources shown are live-fetched on each refresh; curated references are listed in the footer."
    >
      <span className="inline-flex items-center gap-1">
        <Activity size={11} className="text-positive" />
        Refreshed · {fmt} UTC
      </span>
      {live.length > 0 && (
        <>
          <span aria-hidden className="text-border-strong">·</span>
          <ul className="flex flex-wrap items-center gap-1.5">
            {live.map((s) => {
              const inner = (
                <span
                  className="inline-flex items-center gap-1"
                  title={`${s.name} — pulled live on the cron`}
                >
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-positive" />
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
        </>
      )}
    </div>
  );
}
