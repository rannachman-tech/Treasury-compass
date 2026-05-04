"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  /** Total tween duration in ms. Default 600. */
  duration?: number;
  /** Decimal places. Default 0. */
  decimals?: number;
  /** Optional prefix (e.g. "$", "£", "€"). */
  prefix?: string;
  /** Optional suffix (e.g. "%"). */
  suffix?: string;
  /** Tabular className override. */
  className?: string;
}

/**
 * Smoothly tweens between numeric values with an ease-out curve.
 * Skips the animation on first paint (just shows `value`); subsequent
 * changes animate from the previous value.
 *
 * Used for the "grows to" hero number — when the user nudges the
 * amount slider or changes bucket, the value glides instead of snapping.
 */
export function AnimatedCounter({
  value,
  duration = 600,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startedRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(value);
  const firstPaint = useRef(true);

  useEffect(() => {
    targetRef.current = value;

    if (firstPaint.current) {
      firstPaint.current = false;
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    fromRef.current = display;
    startedRef.current = null;

    const tick = (now: number) => {
      if (startedRef.current === null) startedRef.current = now;
      const elapsed = now - startedRef.current;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (targetRef.current - fromRef.current) * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const formatted = formatNumber(display, decimals);
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

function formatNumber(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return "0";
  if (decimals === 0) return Math.round(n).toLocaleString();
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
