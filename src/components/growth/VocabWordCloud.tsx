"use client";
import { EnglishVocab } from "@/lib/types";
import { formatDateISO } from "@/lib/utils";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function VocabWordCloud({ words }: { words: EnglishVocab[] }) {
  if (words.length === 0) return <p className="text-sm text-muted-foreground">No words logged yet.</p>;

  const today = formatDateISO(new Date());

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-2">
      {words.map((w) => {
        const reviewCount = w.review_count ?? 0;
        // Fewer reviews = bigger + bolder, since that's the word that most needs attention.
        const fontSize = Math.max(13, 30 - reviewCount * 4);
        const isOverdue = (w.next_review_date ?? today) <= today;
        const rotation = (hashString(w.word) % 7) - 3; // deterministic -3..3 deg
        return (
          <span
            key={w.id}
            title={w.note ?? ""}
            style={{ fontSize: `${fontSize}px`, transform: `rotate(${rotation}deg)` }}
            className={`inline-block font-display font-semibold transition-colors ${
              isOverdue ? "text-warn" : "text-growth"
            }`}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
}
