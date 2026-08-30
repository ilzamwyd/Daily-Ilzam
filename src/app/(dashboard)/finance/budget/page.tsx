"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MonthlyBudget } from "@/lib/types";
import { EXPENSE_GROUPS, INCOME_CATEGORIES, monthStr, formatIDR } from "@/lib/finance";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

type BudgetMap = Record<string, number>; // key: `${type}:${code}:${category}`

export default function BudgetSettingsPage() {
  const supabase = createClient();
  const [month] = useState(monthStr());
  const [values, setValues] = useState<BudgetMap>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("monthly_budgets").select("*").eq("user_id", user.id).eq("month", month);
      const map: BudgetMap = {};
      for (const b of (data ?? []) as MonthlyBudget[]) {
        map[`${b.type}:${b.code}:${b.category}`] = Number(b.budgeted_amount);
      }
      setValues(map);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setVal(key: string, v: string) {
    const num = Number(v.replace(/[^0-9]/g, "")) || 0;
    setValues((prev) => ({ ...prev, [key]: num }));
    setSaved(false);
  }

  const totalExpenseBudget = Object.entries(values)
    .filter(([k]) => k.startsWith("expense:"))
    .reduce((s, [, v]) => s + v, 0);
  const totalIncomeBudget = Object.entries(values)
    .filter(([k]) => k.startsWith("income:"))
    .reduce((s, [, v]) => s + v, 0);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    const rows = Object.entries(values)
      .filter(([, v]) => v > 0)
      .map(([key, v]) => {
        const [type, code, category] = key.split(":");
        return { user_id: userId, month, type, code, category, budgeted_amount: v };
      });
    if (rows.length > 0) {
      await supabase.from("monthly_budgets").upsert(rows, { onConflict: "user_id,month,type,code,category" });
    }
    setSaving(false);
    setSaved(true);
  }

  if (loading) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Monthly Budget</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(month).toLocaleDateString("en-US", { month: "long", year: "numeric" })} — set what you expect to
          earn and plan to spend, per category.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="font-display text-base font-semibold text-finance">Expected Income</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {INCOME_CATEGORIES.map((cat) => (
            <BudgetInput
              key={cat}
              label={cat}
              value={values[`income:Income:${cat}`] ?? 0}
              onChange={(v) => setVal(`income:Income:${cat}`, v)}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Total expected: {formatIDR(totalIncomeBudget)}</p>
      </Card>

      {Object.entries(EXPENSE_GROUPS).map(([code, subcats]) => (
        <Card key={code} className="p-6">
          <h2 className="font-display text-base font-semibold">{code}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {subcats.map((cat) => (
              <BudgetInput
                key={cat}
                label={cat}
                value={values[`expense:${code}:${cat}`] ?? 0}
                onChange={(v) => setVal(`expense:${code}:${cat}`, v)}
              />
            ))}
          </div>
        </Card>
      ))}

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">Total budgeted expense</p>
          <p className="font-display text-xl font-bold">{formatIDR(totalExpenseBudget)}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saved ? <Check className="h-4 w-4" /> : null}
          {saving ? "Saving…" : saved ? "Saved" : "Save Budget"}
        </Button>
      </Card>
    </div>
  );
}

function BudgetInput({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <Input inputMode="numeric" value={value ? String(value) : ""} placeholder="0" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
