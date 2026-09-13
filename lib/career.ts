import { CareerReview } from "./types";
import { startOfWeek, formatDateISO } from "./utils";

export interface CareerSignal {
  label: string;
  text: string;
  tone: "good" | "watch" | "strain" | "unknown";
  avgStress: number | null;
  avgEnjoyment: number | null;
}

function average(nums: (number | null | undefined)[]): number | null {
  const valid = nums.filter((n): n is number => typeof n === "number");
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

// Reviews are now logged DAILY (from Daily Check-In). Everything downstream
// (the matrix, the signals, "this week's snapshot") works off a WEEKLY view,
// so this averages each day's entries into one row per role per week.
export function aggregateDailyToWeekly(reviews: CareerReview[]): CareerReview[] {
  const groups = new Map<string, CareerReview[]>();
  for (const r of reviews) {
    const basis = r.date ?? r.week_start;
    const weekStart = formatDateISO(startOfWeek(new Date(basis)));
    const key = `${r.role}:${weekStart}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const result: CareerReview[] = [];
  for (const [key, rows] of groups) {
    const [role, weekStart] = key.split(":");
    result.push({
      role: role as "main" | "expanded",
      week_start: weekStart,
      date: weekStart,
      workload: average(rows.map((r) => r.workload)),
      enjoyment: average(rows.map((r) => r.enjoyment)),
      learning: average(rows.map((r) => r.learning)),
      impact: average(rows.map((r) => r.impact)),
      stress: average(rows.map((r) => r.stress)),
    });
  }
  return result.sort((a, b) => (a.week_start < b.week_start ? -1 : 1));
}

function classify(avgStress: number | null, avgEnjoyment: number | null): { tone: CareerSignal["tone"]; text: string } {
  if (avgStress == null || avgEnjoyment == null) {
    return { tone: "unknown", text: "Not enough weekly snapshots yet — fill it in from Daily Check-In to see a pattern." };
  }
  if (avgStress >= 7 && avgEnjoyment <= 4) {
    return { tone: "strain", text: "Possible pattern: stress has been high and enjoyment low here — this is the one worth a closer look." };
  }
  if (avgStress >= 7 && avgEnjoyment > 4) {
    return { tone: "watch", text: "Possible pattern: stress is elevated, but you're still finding meaning in it — worth watching, not necessarily a problem yet." };
  }
  if (avgStress <= 4 && avgEnjoyment >= 6) {
    return { tone: "good", text: "Possible pattern: energy is good and stress is manageable — this looks sustainable right now." };
  }
  return { tone: "watch", text: "Possible pattern: a mixed picture — no strong signal either way over recent weeks." };
}

// Looks at the most recent N weekly snapshots (default 4) to smooth out any one bad week.
export function computeCareerSignals(rawReviews: CareerReview[], recentWeeks = 4) {
  const reviews = aggregateDailyToWeekly(rawReviews);
  const byRole = (role: "main" | "expanded") =>
    reviews
      .filter((r) => r.role === role)
      .sort((a, b) => (a.week_start < b.week_start ? 1 : -1))
      .slice(0, recentWeeks);

  const mainRows = byRole("main");
  const expandedRows = byRole("expanded");

  const mainStress = average(mainRows.map((r) => r.stress));
  const mainEnjoyment = average(mainRows.map((r) => r.enjoyment));
  const expandedStress = average(expandedRows.map((r) => r.stress));
  const expandedEnjoyment = average(expandedRows.map((r) => r.enjoyment));

  const main: CareerSignal = { label: "Main Role", avgStress: mainStress, avgEnjoyment: mainEnjoyment, ...classify(mainStress, mainEnjoyment) };
  const expanded: CareerSignal = {
    label: "Expanded Role",
    avgStress: expandedStress,
    avgEnjoyment: expandedEnjoyment,
    ...classify(expandedStress, expandedEnjoyment),
  };

  // Combined: average the two roles together, week by week where both exist, so one
  // very demanding role doesn't get invisibly diluted by treating it as one big pool.
  const weeks = Array.from(new Set([...mainRows.map((r) => r.week_start), ...expandedRows.map((r) => r.week_start)]));
  const combinedStressPerWeek = weeks.map((w) => {
    const m = mainRows.find((r) => r.week_start === w)?.stress;
    const e = expandedRows.find((r) => r.week_start === w)?.stress;
    return average([m, e]);
  });
  const combinedEnjoymentPerWeek = weeks.map((w) => {
    const m = mainRows.find((r) => r.week_start === w)?.enjoyment;
    const e = expandedRows.find((r) => r.week_start === w)?.enjoyment;
    return average([m, e]);
  });
  const combinedStress = average(combinedStressPerWeek);
  const combinedEnjoyment = average(combinedEnjoymentPerWeek);
  const combined: CareerSignal = {
    label: "Combined",
    avgStress: combinedStress,
    avgEnjoyment: combinedEnjoyment,
    ...classify(combinedStress, combinedEnjoyment),
  };

  return { main, expanded, combined };
}
