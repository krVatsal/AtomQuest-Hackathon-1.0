/**
 * Quarter utilities.
 *
 * Quarter windows are derived from the GoalCycle dates:
 *   Q1: q1Open  → q2Open
 *   Q2: q2Open  → q3Open
 *   Q3: q3Open  → q4Open
 *   Q4: q4Open  → end of cycle (next year's phase1Open, or cycle year + 1 Apr 30)
 */

export type QuarterKey = "Q1" | "Q2" | "Q3" | "Q4";

export interface GoalCycleDates {
  phase1Open: Date;
  q1Open: Date;
  q2Open: Date;
  q3Open: Date;
  q4Open: Date;
  year: number;
}

export interface ActiveQuarter {
  quarter: QuarterKey;
  opensAt: Date;
  closesAt: Date;
}

/**
 * Returns the currently-active quarter for a given cycle, or null if
 * today falls outside all quarter windows (i.e. still in goal-setting phase).
 */
export function getActiveQuarter(
  cycle: GoalCycleDates,
  now: Date = new Date()
): ActiveQuarter | null {
  const windows: { quarter: QuarterKey; open: Date; close: Date }[] = [
    { quarter: "Q1", open: cycle.q1Open, close: cycle.q2Open },
    { quarter: "Q2", open: cycle.q2Open, close: cycle.q3Open },
    { quarter: "Q3", open: cycle.q3Open, close: cycle.q4Open },
    {
      quarter: "Q4",
      open: cycle.q4Open,
      close: new Date(cycle.year + 1, 3, 30), // April 30 next year
    },
  ];

  for (const w of windows) {
    if (now >= w.open && now < w.close) {
      return { quarter: w.quarter, opensAt: w.open, closesAt: w.close };
    }
  }

  return null;
}

/**
 * Returns the month name when check-ins will first open (Q1 open date).
 */
export function nextCheckInMonth(cycle: GoalCycleDates): string {
  return cycle.q1Open.toLocaleString("en-US", { month: "long", year: "numeric" });
}

/**
 * All quarter keys in order.
 */
export const ALL_QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];
