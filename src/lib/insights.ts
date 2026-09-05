import { DailyLog } from "./types";
import { average } from "./utils";

export interface Insight {
  category: "maintain" | "watch" | "fix";
  text: string;
}

/**
 * Simple, transparent rule-based engine — no ML, no diagnoses.
 * Looks at the trailing window of logs (expects most-recent-last).
 */
export function generateInsights(logs: DailyLog[]): Insight[] {
  const insights: Insight[] = [];
  if (logs.length < 3) return insights;

  const last7 = logs.slice(-7);
  const last3 = logs.slice(-3);

  const avgSleep = average(last7.map((l) => l.sleep_hours));
  const avgStress = average(last7.map((l) => l.stress));
  const avgSteps = average(last7.map((l) => l.steps));
  const gymCount = last7.filter((l) => l.gym).length;
  const socialCount = last7.filter((l) => l.social_activity).length;
  const familyCount = last7.filter((l) => l.family_contact || l.family_call).length;
  const recoveryCount = last7.filter((l) => l.recovery).length;
  const afterNineCount = last7.filter((l) => l.worked_after_9).length;
  const last3AfterNine = last3.filter((l) => l.worked_after_9).length;
  const last3Stress = last3.map((l) => l.stress).filter((v): v is number => v != null);
  const last3Sleep = last3.map((l) => l.sleep_hours).filter((v): v is number => v != null);

  // MAINTAIN
  if (gymCount >= 3) insights.push({ category: "maintain", text: "Consistent gym attendance this week — keep the rhythm going." });
  if (avgSleep !== null && avgSleep >= 7) insights.push({ category: "maintain", text: "Sleep has been steady and in a healthy range." });
  if (familyCount >= 2) insights.push({ category: "maintain", text: "Regular family contact this week — that connection is holding." });
  if (recoveryCount >= 3) insights.push({ category: "maintain", text: "You're giving yourself real recovery time. That's a core KPI, not a bonus." });

  // WATCH
  if (avgSleep !== null && avgSleep < 7 && avgSleep >= 6) insights.push({ category: "watch", text: "Sleep is trending a little under your target this week." });
  if (afterNineCount >= 2 && afterNineCount < 4) insights.push({ category: "watch", text: "Work is finishing later on a few days this week." });
  if (avgStress !== null && avgStress >= 6 && avgStress < 7.5) insights.push({ category: "watch", text: "Stress has been running a bit higher lately." });
  if (avgSteps !== null && logs.length >= 10) {
    const prevWeek = logs.slice(-14, -7);
    const prevAvgSteps = average(prevWeek.map((l) => l.steps));
    if (prevAvgSteps !== null && avgSteps < prevAvgSteps * 0.8) {
      insights.push({ category: "watch", text: "Steps have declined compared to last week." });
    }
  }
  if (socialCount === 0 && logs.length >= 7) insights.push({ category: "watch", text: "Less social interaction than usual this week." });

  // FIX NOW — only for repeated, meaningful issues
  if (last3Stress.length === 3 && last3Stress.every((s) => s >= 8)) {
    insights.push({ category: "fix", text: "Stress has been very high for several days in a row." });
  }
  if (last3AfterNine >= 3) {
    insights.push({ category: "fix", text: "You've worked past 9 PM several days in a row." });
  }
  if (last3Sleep.length === 3 && last3Sleep.every((s) => s < 6)) {
    insights.push({ category: "fix", text: "Sleep has been very low for several days in a row." });
  }
  if (recoveryCount === 0 && logs.length >= 7) {
    insights.push({ category: "fix", text: "No recovery days logged this week." });
  }
  const last14 = logs.slice(-14);
  if (last14.length >= 14 && last14.every((l) => !l.social_activity)) {
    insights.push({ category: "fix", text: "No social interaction logged for two weeks or more." });
  }

  return insights;
}

export interface PatternInsight {
  text: string;
}

/**
 * Correlation-flavored observations. Deliberately hedged — "possible pattern",
 * never "cause" — and only surfaced once there's enough data to say anything.
 */
export function generatePatterns(logs: DailyLog[]): PatternInsight[] {
  const patterns: PatternInsight[] = [];
  const withSleepStress = logs.filter((l) => l.sleep_hours != null && l.stress != null);
  if (withSleepStress.length >= 8) {
    const lowSleep = withSleepStress.filter((l) => (l.sleep_hours as number) < 6.5);
    const highSleep = withSleepStress.filter((l) => (l.sleep_hours as number) >= 7);
    const lowSleepStress = average(lowSleep.map((l) => l.stress));
    const highSleepStress = average(highSleep.map((l) => l.stress));
    if (lowSleep.length >= 3 && highSleep.length >= 3 && lowSleepStress !== null && highSleepStress !== null) {
      if (lowSleepStress - highSleepStress >= 1) {
        patterns.push({ text: "Possible pattern: your stress tends to be higher on lower-sleep days." });
      }
    }
  }

  const withStressEating = logs.filter((l) => l.stress != null);
  if (withStressEating.length >= 8) {
    const highStressDays = withStressEating.filter((l) => (l.stress as number) >= 7);
    const stressEatingOnHighStress = highStressDays.filter((l) => l.stress_eating !== "no").length;
    if (highStressDays.length >= 3 && stressEatingOnHighStress / highStressDays.length >= 0.5) {
      patterns.push({ text: "Possible pattern: stress eating shows up more often on high-stress days." });
    }
  }

  const withMoodSocial = logs.filter((l) => l.mood != null);
  if (withMoodSocial.length >= 8) {
    const socialDays = withMoodSocial.filter((l) => l.social_activity);
    const nonSocialDays = withMoodSocial.filter((l) => !l.social_activity);
    const socialMood = average(socialDays.map((l) => l.mood));
    const nonSocialMood = average(nonSocialDays.map((l) => l.mood));
    if (socialDays.length >= 3 && nonSocialDays.length >= 3 && socialMood !== null && nonSocialMood !== null) {
      if (socialMood - nonSocialMood >= 0.8) {
        patterns.push({ text: "Possible pattern: mood tends to be higher on social activity days." });
      }
    }
  }

  return patterns;
}

export interface DailyCalorieTotal {
  date: string;
  kcal: number;
}

/**
 * Calorie data lives in food_log, not daily_logs, so this takes pre-aggregated
 * daily totals rather than DailyLog[]. Only looks at days that actually have
 * logged food, so a day with nothing logged isn't treated as "0 calories".
 */
export function generateCalorieInsights(dailyTotals: DailyCalorieTotal[], calorieMax: number | null): Insight[] {
  if (!calorieMax) return [];
  const recent = dailyTotals.filter((d) => d.kcal > 0).slice(-7);
  if (recent.length < 3) return [];

  const overDays = recent.filter((d) => d.kcal > calorieMax);
  if (overDays.length >= 3) {
    return [
      {
        category: "fix",
        text: `Calories went over your ${calorieMax} kcal reference on ${overDays.length} of the last ${recent.length} logged days.`,
      },
    ];
  }
  if (overDays.length >= 1) {
    return [
      {
        category: "watch",
        text: `Calories went over your ${calorieMax} kcal reference on ${overDays.length} day${overDays.length === 1 ? "" : "s"} recently.`,
      },
    ];
  }
  return [{ category: "maintain", text: `Calories have stayed within your ${calorieMax} kcal reference recently.` }];
}
