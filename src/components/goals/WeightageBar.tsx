"use client";

import { cn } from "@/lib/utils";

interface GoalSegment {
  id: string;
  title: string;
  weightage: number;
}

interface WeightageBarProps {
  goals: GoalSegment[];
}

const SEGMENT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
];

export function WeightageBar({ goals }: WeightageBarProps) {
  const total = goals.reduce((sum, g) => sum + g.weightage, 0);
  const isExact = total === 100;
  const isOver = total > 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Total Weightage</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            isExact
              ? "text-emerald-600"
              : isOver
                ? "text-red-600"
                : "text-red-600"
          )}
        >
          {total}% / 100%
          {!isExact && (
            <span className="ml-1 text-xs font-normal">
              ({isOver ? `+${total - 100}% over` : `${100 - total}% remaining`})
            </span>
          )}
        </span>
      </div>

      <div className="relative h-6 w-full overflow-hidden rounded-md bg-muted">
        <div className="flex h-full">
          {goals.map((goal, i) => (
            <div
              key={goal.id}
              className={cn(
                "relative h-full transition-all duration-300",
                SEGMENT_COLORS[i % SEGMENT_COLORS.length]
              )}
              style={{ width: `${Math.min(goal.weightage, 100)}%` }}
              title={`${goal.title}: ${goal.weightage}%`}
            >
              {goal.weightage >= 12 && (
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-white">
                  {goal.weightage}%
                </span>
              )}
            </div>
          ))}
          {!isExact && !isOver && (
            <div
              className="h-full bg-muted"
              style={{ width: `${100 - total}%` }}
            />
          )}
        </div>
      </div>

      {goals.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {goals.map((goal, i) => (
            <div key={goal.id} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "size-2.5 rounded-full",
                  SEGMENT_COLORS[i % SEGMENT_COLORS.length]
                )}
              />
              <span>
                {goal.title} ({goal.weightage}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
