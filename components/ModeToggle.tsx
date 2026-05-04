"use client";

export type Mode = "simple" | "pro";

interface Props {
  value: Mode;
  onChange: (m: Mode) => void;
}

export function ModeToggle({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Display mode"
      className="relative inline-flex rounded-full border border-border bg-surface-2 p-0.5 text-[11.5px]"
    >
      {(["simple", "pro"] as const).map((m) => {
        const active = m === value;
        return (
          <button
            key={m}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m)}
            className={[
              "relative rounded-full px-2.5 py-1 font-semibold transition-colors capitalize",
              active
                ? "bg-surface text-fg shadow-[inset_0_0_0_1px_rgb(var(--accent)/0.5)]"
                : "text-fg-muted hover:text-fg",
            ].join(" ")}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}
