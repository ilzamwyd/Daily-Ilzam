"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  accentClassName?: string;
  labels?: [string, string];
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  accentClassName = "accent-primary",
  labels,
}: SliderProps) {
  const display = value ?? Math.round((min + max) / 2);
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        {labels ? (
          <span className="text-xs text-muted-foreground">{labels[0]}</span>
        ) : (
          <span />
        )}
        <span className="font-display text-2xl font-semibold tabular-nums">{display}</span>
        {labels ? (
          <span className="text-xs text-muted-foreground">{labels[1]}</span>
        ) : (
          <span />
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={display}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("h-2 w-full cursor-pointer appearance-none rounded-full bg-muted", accentClassName)}
      />
    </div>
  );
}
