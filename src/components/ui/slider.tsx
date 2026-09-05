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
  const midpoint = Math.round((min + max) / 2);
  const display = value ?? "—";
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        {labels ? (
          <span className="text-xs text-muted-foreground">{labels[0]}</span>
        ) : (
          <span />
        )}
        <span className={cn("font-display text-2xl font-semibold tabular-nums", value == null && "text-muted-foreground")}>
          {display}
        </span>
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
        value={value ?? midpoint}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full",
          value == null ? "bg-muted/50 opacity-60" : "bg-muted",
          accentClassName
        )}
      />
      {value == null && <p className="mt-1 text-[11px] text-muted-foreground">Drag to set a value — not saved until you do.</p>}
    </div>
  );
}
