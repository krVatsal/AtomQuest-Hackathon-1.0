"use client";

import { computeScore, scoreColor, type UoMType } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface ProgressScoreProps {
  uom: UoMType;
  target: number;
  actual: number | null | undefined;
  className?: string;
}

const COLOR_MAP: Record<ReturnType<typeof scoreColor>, string> = {
  red: "text-red-600",
  amber: "text-amber-600",
  green: "text-emerald-600",
  gray: "text-muted-foreground",
};

const BG_MAP: Record<ReturnType<typeof scoreColor>, string> = {
  red: "bg-red-100",
  amber: "bg-amber-100",
  green: "bg-emerald-100",
  gray: "bg-muted",
};

export function ProgressScore({ uom, target, actual, className }: ProgressScoreProps) {
  const score = computeScore(uom, target, actual);
  const color = scoreColor(score);

  if (score === null) {
    return (
      <span className={cn("text-sm text-muted-foreground", className)}>—</span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
        COLOR_MAP[color],
        BG_MAP[color],
        className
      )}
    >
      {score}%
    </span>
  );
}
