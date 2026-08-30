"use client";
import { getBalanceBand } from "@/lib/constants";

export function WeeklyBalanceRing({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
        <p className="text-sm text-muted-foreground">Log a few more days to see your Weekly Balance Score.</p>
      </div>
    );
  }

  const band = getBalanceBand(score);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={band.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold">{score}</span>
          <span className="text-xs font-medium" style={{ color: band.color }}>
            {band.label}
          </span>
        </div>
      </div>
      <p className="max-w-[220px] text-center text-xs text-muted-foreground">
        70–80 is sustainable success — this isn't a race to 100.
      </p>
    </div>
  );
}
