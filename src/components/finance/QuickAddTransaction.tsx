"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Transaction, TransactionType } from "@/lib/types";
import { BANK_SOURCES, INCOME_CATEGORIES, EXPENSE_CODES, subcategoriesFor, todayStr, nowTimeStr } from "@/lib/finance";
import { Segmented } from "@/components/ui/segmented";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";

export function QuickAddTransaction({ onSaved }: { onSaved?: () => void }) {
  const supabase = createClient();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState<string>(EXPENSE_CODES[0]);
  const [category, setCategory] = useState<string>(subcategoriesFor(EXPENSE_CODES[0])[0]);
  const [source, setSource] = useState<string>("Cash");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  function switchType(next: TransactionType) {
    setType(next);
    if (next === "income") {
      setCode("Income");
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCode(EXPENSE_CODES[0]);
      setCategory(subcategoriesFor(EXPENSE_CODES[0])[0]);
    }
  }

  function switchCode(next: string) {
    setCode(next);
    setCategory(subcategoriesFor(next)[0]);
  }

  const amountNum = Number(amount.replace(/[^0-9]/g, ""));
  const canSave = amountNum > 0 && category;

  async function handleSave(again: boolean) {
    if (!canSave) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const payload: Transaction = {
      user_id: user.id,
      date: todayStr(),
      time: nowTimeStr(),
      type,
      amount: amountNum,
      source,
      code,
      category,
      note: note.trim() || null,
    };
    const { error } = await supabase.from("transactions").insert(payload);
    setSaving(false);
    if (error) {
      console.error(error.message);
      return;
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
    onSaved?.();
    if (again) {
      setAmount("");
      setNote("");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <Segmented
        options={["expense", "income"] as const}
        value={type}
        onChange={switchType}
        activeClassName="bg-finance text-white"
      />

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount (Rp)</label>
        <Input
          inputMode="numeric"
          autoFocus
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-2xl font-semibold"
        />
      </div>

      {type === "expense" ? (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Group</label>
            <Segmented options={EXPENSE_CODES} value={code} onChange={switchCode} activeClassName="bg-finance text-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
            <Segmented
              options={subcategoriesFor(code)}
              value={category}
              onChange={setCategory}
              activeClassName="bg-finance/80 text-white"
            />
          </div>
        </>
      ) : (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Income Category</label>
          <Segmented
            options={INCOME_CATEGORIES}
            value={category}
            onChange={setCategory}
            activeClassName="bg-finance text-white"
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Source</label>
        <Segmented options={BANK_SOURCES} value={source} onChange={setSource} activeClassName="bg-finance text-white" />
      </div>

      <Input placeholder="Note (optional) — e.g. Beli Nasi Padang" value={note} onChange={(e) => setNote(e.target.value)} />

      <div className="flex gap-2">
        <Button className="flex-1 gap-2" disabled={!canSave || saving} onClick={() => handleSave(true)}>
          {justSaved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {justSaved ? "Saved!" : "Save & Add Another"}
        </Button>
        <Button variant="soft" disabled={!canSave || saving} onClick={() => handleSave(false)}>
          Save & Close
        </Button>
      </div>
    </div>
  );
}
