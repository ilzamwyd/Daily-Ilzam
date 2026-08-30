"use client";
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
  labels?: Partial<Record<T, string>>;
  activeClassName?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  labels,
  activeClassName = "bg-primary text-primary-foreground",
}: SegmentedProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-full border border-border px-4 py-2 text-sm capitalize transition-colors",
            value === opt ? activeClassName : "bg-transparent hover:bg-muted"
          )}
        >
          {labels?.[opt] ?? opt}
        </button>
      ))}
    </div>
  );
}
