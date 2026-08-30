import { DailyLog, UserTargets } from "./types";
import { average } from "./utils";

/**
 * Weekly Balance Score.
 * Deliberately excludes spiritual practice (see brief section 8/14).
 * Blends: sleep, exercise, recovery, social connection, family connection,
 * personal growth, work-life balance. Each sub-score is 0-100, then averaged.
 * Missing data is excluded rather than penalized, so a light-logging week
 * doesn't get punished harder than a fully-logged mediocre week.
 */
export function computeWeeklyBalanceScore(logs: DailyLog[], targets: UserTargets) {
  if (logs.length === 0) return null;

  const parts: { key: string; score: number | null }[] = [];

  // Sleep: proportion of nights within/near target band
  const sleepVals = logs.map((l) => l.sleep_hours).filter((v): v is number => v != null);
  if (sleepVals.length) {
    const mid = (targets.sleep_target_min + targets.sleep_target_max) / 2;
    const s = average(
      sleepVals.map((h) => {
        const diff = Math.abs(h - mid);
        return Math.max(0, 100 - diff * 18);
      })
    );
    parts.push({ key: "sleep", score: s });
  }

  // Exercise: gym sessions vs weekly target
  const gymCount = logs.filter((l) => l.gym).length;
  parts.push({
    key: "exercise",
    score: Math.min(100, (gymCount / Math.max(1, targets.gym_weekly_target)) * 100),
  });

  // Recovery: days with intentional recovery vs 7
  const recoveryDays = logs.filter((l) => l.recovery).length;
  parts.push({ key: "recovery", score: Math.min(100, (recoveryDays / 4) * 100) });

  // Social connection
  const socialDays = logs.filter((l) => l.social_activity).length;
  parts.push({
    key: "social",
    score: Math.min(100, (socialDays / Math.max(1, targets.social_weekly_target)) * 100),
  });

  // Family connection
  const familyTouchpoints = logs.filter((l) => l.family_contact || l.family_call).length;
  parts.push({
    key: "family",
    score: Math.min(100, (familyTouchpoints / Math.max(1, targets.family_contact_weekly_target)) * 100),
  });

  // Personal growth: english + content combined
  const englishDays = logs.filter((l) => l.english_practice).length;
  const contentDays = logs.filter((l) => l.content_worked).length;
  const growthScore =
    Math.min(100, (englishDays / Math.max(1, targets.english_weekly_target)) * 60) +
    Math.min(40, contentDays * 20);
  parts.push({ key: "growth", score: Math.min(100, growthScore) });

  // Work-life balance: fewer after-9pm days is better
  const afterNine = logs.filter((l) => l.worked_after_9).length;
  parts.push({ key: "workLife", score: Math.max(0, 100 - afterNine * 20) });

  const valid = parts.filter((p) => p.score !== null) as { key: string; score: number }[];
  if (!valid.length) return null;

  const overall = average(valid.map((p) => p.score));
  return {
    overall: overall === null ? null : Math.round(overall),
    breakdown: valid,
  };
}
