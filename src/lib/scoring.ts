/**
 * Scoring engine.
 *
 * UoM logic:
 *   NUMERIC_MAX — higher actual is better   → score = (actual / target) * 100
 *   NUMERIC_MIN — lower  actual is better   → score = (target / actual) * 100
 *   TIMELINE    — actual is a timestamp vs target timestamp
 *                 on-time or early = 100, late penalised proportionally
 *   ZERO        — target is 0 incidents; actual = 0 → 100%, else 0%
 */

export type UoMType = "NUMERIC_MAX" | "NUMERIC_MIN" | "TIMELINE" | "ZERO";

/**
 * Compute a 0–100+ score for a single goal.
 * Returns null when actual is missing / not applicable.
 */
export function computeScore(
  uom: UoMType,
  target: number,
  actual: number | null | undefined
): number | null {
  if (actual === null || actual === undefined) return null;

  switch (uom) {
    case "NUMERIC_MAX": {
      if (target === 0) return actual > 0 ? 100 : 0;
      return Math.round((actual / target) * 100);
    }
    case "NUMERIC_MIN": {
      if (actual === 0) return 100;
      if (target === 0) return 0;
      return Math.round((target / actual) * 100);
    }
    case "TIMELINE": {
      // target and actual are stored as epoch-ms (Float).
      // On-time or early → 100. Late → penalised proportionally (30-day window).
      if (actual <= target) return 100;
      const lateDays = (actual - target) / (1000 * 60 * 60 * 24);
      const penalty = Math.min(lateDays / 30, 1); // fully penalised at 30 days late
      return Math.round((1 - penalty) * 100);
    }
    case "ZERO": {
      return actual === 0 ? 100 : 0;
    }
    default:
      return null;
  }
}

/**
 * Score → colour bucket.
 */
export function scoreColor(score: number | null): "red" | "amber" | "green" | "gray" {
  if (score === null) return "gray";
  if (score < 60) return "red";
  if (score <= 85) return "amber";
  return "green";
}
