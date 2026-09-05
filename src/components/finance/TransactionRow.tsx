"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Transaction } from "@/lib/types";
import { BANK_SOURCES, INCOME_CATEGORIES, EXPENSE_CODES, subcategoriesFor, formatIDR } from "@/lib/finance";
import { Segmented } from "@/components/ui/segmented";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Check, X } from "lucide-react";

export function TransactionRow({ transaction, onChanged }: { transaction: Transaction; onChanged: () => void }) {
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    amount: String(transaction.amount),
    date: transaction.date,
    code: transaction.code,
    category: transaction.category,
    source: transaction.source,
    note: transaction.note ?? "",
  });

  function switchCode(next: string) {
    setDraft((d) => ({ ...d, code: next, category: subcategoriesFor(next)[0] ?? d.category }));
  }

  async function save() {
    setSaving(true);
    await supabase
      .from("transactions")
      .update({
        amount: Number(draft.amount),
        date: draft.date,
        code: draft.code,
        category: draft.category,
        source: draft.source,
        note: draft.note.trim() || null,
      })
      .eq("id", transaction.id);
    setSaving(false);
    setEditing(false);
    onChanged();
  }

  async function remove() {
    await supabase.from("transactions").delete().eq("id", transaction.id);
    onChanged();
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
        <div>
          <p className="font-medium">{transaction.category}</p>
          <p className="text-xs text-muted-foreground">
            Input on {transaction.date} · {transaction.source}
            {transaction.note ? ` · ${transaction.note}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className={transaction.type === "income" ? "font-semibold text-finance" : "font-semibold"}>
            {transaction.type === "income" ? "+" : "-"}
            {formatIDR(Number(transaction.amount))}
          </p>
          <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-career">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={remove} className="text-muted-foreground hover:text-critical">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-muted p-3 py-3">
      <div className="flex gap-2">
        <Input type="date" className="w-40" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} />
        <Input
          inputMode="numeric"
          className="flex-1"
          value={draft.amount ? Number(draft.amount).toLocaleString("id-ID") : ""}
          onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value.replace(/[^0-9]/g, "") }))}
        />
      </div>
      {transaction.type === "expense" ? (
        <>
          <Segmented options={EXPENSE_CODES} value={draft.code} onChange={switchCode} activeClassName="bg-finance text-white" />
          <Segmented
            options={subcategoriesFor(draft.code)}
            value={draft.category}
            onChange={(v) => setDraft((d) => ({ ...d, category: v }))}
            activeClassName="bg-finance/80 text-white"
          />
        </>
      ) : (
        <Segmented
          options={INCOME_CATEGORIES}
          value={draft.category}
          onChange={(v) => setDraft((d) => ({ ...d, category: v }))}
          activeClassName="bg-finance text-white"
        />
      )}
      <Segmented options={BANK_SOURCES} value={draft.source} onChange={(v) => setDraft((d) => ({ ...d, source: v }))} activeClassName="bg-finance text-white" />
      <Input placeholder="Note" value={draft.note} onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))} />
      <div className="flex gap-2">
        <Button type="button" size="sm" className="gap-1.5" onClick={save} disabled={saving}>
          <Check className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={() => setEditing(false)}>
          <X className="h-3.5 w-3.5" /> Cancel
        </Button>
      </div>
    </div>
  );
}
