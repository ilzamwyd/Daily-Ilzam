"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BusinessChecklistItem, BusinessSale } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatIDR } from "@/lib/finance";
import { Plus, Check, Circle, Trash2 } from "lucide-react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BusinessPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<BusinessChecklistItem[]>([]);
  const [sales, setSales] = useState<BusinessSale[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [saleDate, setSaleDate] = useState(todayStr());
  const [saleRevenue, setSaleRevenue] = useState("");
  const [saleCost, setSaleCost] = useState("");
  const [saleNote, setSaleNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [{ data: cl }, { data: sl }] = await Promise.all([
        supabase.from("business_checklist_items").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("business_sales").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
      ]);
      setChecklist((cl as BusinessChecklistItem[]) ?? []);
      setSales((sl as BusinessSale[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addChecklistItem() {
    if (!userId || !newChecklistItem.trim()) return;
    const { data } = await supabase
      .from("business_checklist_items")
      .insert({ user_id: userId, item_text: newChecklistItem.trim(), done: false })
      .select()
      .single();
    if (data) setChecklist((prev) => [...prev, data as BusinessChecklistItem]);
    setNewChecklistItem("");
  }

  async function toggleChecklist(item: BusinessChecklistItem) {
    setChecklist((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)));
    await supabase.from("business_checklist_items").update({ done: !item.done }).eq("id", item.id);
  }

  async function removeChecklist(id?: string) {
    if (!id) return;
    await supabase.from("business_checklist_items").delete().eq("id", id);
    setChecklist((prev) => prev.filter((i) => i.id !== id));
  }

  async function addSale() {
    if (!userId || !saleRevenue) return;
    const revenue = Number(saleRevenue.replace(/[^0-9]/g, "")) || 0;
    const cost = Number(saleCost.replace(/[^0-9]/g, "")) || 0;
    const { data } = await supabase
      .from("business_sales")
      .insert({ user_id: userId, date: saleDate, revenue, cost, note: saleNote.trim() || null })
      .select()
      .single();
    if (data) setSales((prev) => [data as BusinessSale, ...prev]);
    setSaleRevenue("");
    setSaleCost("");
    setSaleNote("");
  }

  const thisMonth = sales.filter((s) => s.date.startsWith(monthStr()));
  const totalRevenue = thisMonth.reduce((s, x) => s + Number(x.revenue), 0);
  const totalCost = thisMonth.reduce((s, x) => s + Number(x.cost), 0);
  const netProfit = totalRevenue - totalCost;
  const doneCount = checklist.filter((c) => c.done).length;

  if (loading) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Business</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your side venture — setup progress and daily sales, in one place.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Revenue (month)</p>
          <p className="font-display text-lg font-bold text-finance">{formatIDR(totalRevenue)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Cost (month)</p>
          <p className="font-display text-lg font-bold">{formatIDR(totalCost)}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">{netProfit >= 0 ? "Profit" : "Loss"}</p>
          <p className={`font-display text-lg font-bold ${netProfit >= 0 ? "text-finance" : "text-critical"}`}>
            {formatIDR(Math.abs(netProfit))}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Setup Checklist</h2>
          {checklist.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {doneCount}/{checklist.length} done
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Decide product & pricing, set up payment method…"
            value={newChecklistItem}
            onChange={(e) => setNewChecklistItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
          />
          <Button size="icon" onClick={addChecklistItem} disabled={!newChecklistItem.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {checklist.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing yet — start with the basics: product/service, pricing, payment method, where you'll sell.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {checklist.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <button onClick={() => toggleChecklist(c)} className="text-finance">
                  {c.done ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                </button>
                <span className={`flex-1 text-sm ${c.done ? "text-muted-foreground line-through" : ""}`}>{c.item_text}</span>
                <button onClick={() => removeChecklist(c.id)} className="text-muted-foreground hover:text-critical">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-base font-semibold">Daily Sales</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input type="date" className="sm:w-40" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
          <Input
            inputMode="numeric"
            placeholder="Revenue (Rp)"
            className="sm:w-36"
            value={saleRevenue}
            onChange={(e) => setSaleRevenue(e.target.value)}
          />
          <Input
            inputMode="numeric"
            placeholder="Cost (Rp)"
            className="sm:w-36"
            value={saleCost}
            onChange={(e) => setSaleCost(e.target.value)}
          />
          <Input placeholder="Note (optional)" className="sm:flex-1" value={saleNote} onChange={(e) => setSaleNote(e.target.value)} />
          <Button size="icon" onClick={addSale} disabled={!saleRevenue}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {sales.length === 0 ? (
          <div className="mt-4">
            <EmptyState message="No sales logged yet. Add today's numbers above, even if it's zero." />
          </div>
        ) : (
          <div className="mt-4 flex flex-col divide-y divide-border">
            {sales.slice(0, 15).map((s) => {
              const profit = Number(s.revenue) - Number(s.cost);
              return (
                <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{s.date}</p>
                    {s.note && <p className="text-xs text-muted-foreground">{s.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className={profit >= 0 ? "font-semibold text-finance" : "font-semibold text-critical"}>
                      {profit >= 0 ? "+" : "-"}
                      {formatIDR(Math.abs(profit))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatIDR(Number(s.revenue))} rev · {formatIDR(Number(s.cost))} cost
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
