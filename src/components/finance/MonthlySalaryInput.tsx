"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatIDR } from "@/lib/finance";
import { Eye, EyeOff, Check } from "lucide-react";

export function MonthlySalaryInput({ month, onChanged }: { month: string; onChanged: (amount: number) => void }) {
  const supabase = createClient();
  const [amount, setAmount] = useState("");
  const [hidden, setHidden] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("monthly_salary").select("*").eq("user_id", user.id).eq("month", month).maybeSingle();
      const amt = data?.amount ?? 0;
      setAmount(amt ? String(amt) : "");
      onChanged(amt);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  async function save() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const value = Number(amount) || 0;
    await supabase.from("monthly_salary").upsert({ user_id: user.id, month, amount: value }, { onConflict: "user_id,month" });
    onChanged(value);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 1500);
  }

  if (loading) return null;

  return (
    <div className="flex items-center justify-between rounded-2xl bg-muted p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Salary this month:</span>
        {editing ? (
          <Input
            inputMode="numeric"
            className="h-8 w-36"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            autoFocus
          />
        ) : (
          <span className="font-medium">{hidden ? "••••••••" : formatIDR(Number(amount) || 0)}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {editing ? (
          <Button type="button" size="sm" className="gap-1" onClick={save}>
            <Check className="h-3.5 w-3.5" /> {saved ? "Saved" : "Save"}
          </Button>
        ) : (
          <>
            <button onClick={() => setHidden((h) => !h)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-card">
              {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <Button type="button" size="sm" variant="soft" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
