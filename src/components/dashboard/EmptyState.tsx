import { Sparkles } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border py-14 text-center">
      <Sparkles className="h-6 w-6 text-muted-foreground" />
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
