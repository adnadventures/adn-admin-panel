"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createExpense, deleteExpense } from "@/actions/expenses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CURRENCIES, CURRENCY_CODES, formatMoney, type CurrencyCode } from "@/lib/finance/currency";
import { formatDate } from "@/lib/format";

type ReportInvoice = {
  issueDate: string;
  currency: CurrencyCode;
  total: number;
  remainingBalance: number;
  status: string;
  payments: { amount: number; date: string }[];
  package: {
    name: string;
    destination: string;
    cost: { currency: CurrencyCode; amount: number } | null;
  };
};

type ReportExpense = {
  id: string;
  date: string;
  description: string;
  category: string;
  vendor: string;
  amount: number;
  currency: CurrencyCode;
  note: string;
  receipt: { name: string; contentType: string } | null;
};

type Props = {
  invoices: ReportInvoice[];
  expenses: ReportExpense[];
  today: string;
};

type Totals = {
  revenue: number;
  collected: number;
  pending: number;
  packageCosts: number;
  operatingExpenses: number;
};

const EMPTY_TOTALS = (): Totals => ({
  revenue: 0,
  collected: 0,
  pending: 0,
  packageCosts: 0,
  operatingExpenses: 0,
});
const day = (value: string) => value.slice(0, 10);
const within = (value: string, start: string, end: string) =>
  day(value) >= start && day(value) <= end;
const displayDate = (value: string) => formatDate(day(value));

function currentRange(today: string, preset: "weekly" | "monthly") {
  const date = new Date(`${today}T00:00:00.000Z`);
  if (preset === "weekly") {
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - mondayOffset);
    const start = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 6);
    return { start, end: date.toISOString().slice(0, 10) };
  }
  const start = `${today.slice(0, 7)}-01`;
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

function SummaryCard({ title, amount, currency, description }: {
  title: string;
  amount: number;
  currency: CurrencyCode;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-xl">{formatMoney(amount, currency)}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

export function FinanceDashboard({ invoices, expenses, today }: Props) {
  const [preset, setPreset] = useState<"weekly" | "monthly" | "custom">("monthly");
  const initialRange = currentRange(today, "monthly");
  const [start, setStart] = useState(initialRange.start);
  const [end, setEnd] = useState(initialRange.end);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const router = useRouter();

  const validRange = Boolean(start && end && start <= end);
  const selectedInvoices = validRange
    ? invoices.filter((invoice) => invoice.status !== "cancelled" && within(invoice.issueDate, start, end))
    : [];
  const selectedExpenses = validRange
    ? expenses.filter((expense) => within(expense.date, start, end))
    : [];
  const currencyTotals = new Map<CurrencyCode, Totals>();
  const totalsFor = (currency: CurrencyCode) => {
    let totals = currencyTotals.get(currency);
    if (!totals) {
      totals = EMPTY_TOTALS();
      currencyTotals.set(currency, totals);
    }
    return totals;
  };
  const packageTotals = new Map<string, {
    name: string;
    destination: string;
    currency: CurrencyCode;
    costCurrency: CurrencyCode;
    revenue: number;
    cost: number;
    count: number;
  }>();

  for (const invoice of selectedInvoices) {
    const totals = totalsFor(invoice.currency);
    totals.revenue += invoice.total;
    totals.pending += invoice.remainingBalance;

    if (invoice.package.cost) {
      totalsFor(invoice.package.cost.currency).packageCosts += invoice.package.cost.amount;
    }
    const packageName = invoice.package.name || invoice.package.destination || "Unspecified";
    const costCurrency = invoice.package.cost?.currency ?? invoice.currency;
    const key = `${packageName}\u0000${invoice.package.destination}\u0000${invoice.currency}\u0000${costCurrency}`;
    const packageRow = packageTotals.get(key) ?? {
      name: packageName,
      destination: invoice.package.destination,
      currency: invoice.currency,
      costCurrency,
      revenue: 0,
      cost: 0,
      count: 0,
    };
    packageRow.revenue += invoice.total;
    packageRow.count++;
    if (invoice.package.cost) packageRow.cost += invoice.package.cost.amount;
    packageTotals.set(key, packageRow);

  }
  for (const invoice of invoices) {
    if (invoice.status === "cancelled") continue;
    for (const payment of invoice.payments) {
      if (validRange && within(payment.date, start, end)) {
        totalsFor(invoice.currency).collected += payment.amount;
      }
    }
  }
  for (const expense of selectedExpenses) {
    totalsFor(expense.currency).operatingExpenses += expense.amount;
  }

  const currencies = Array.from(currencyTotals.keys()).sort((a, b) => a.localeCompare(b));
  if (currencies.length === 0) currencies.push("INR");
  const packageRows = Array.from(packageTotals.values())
    .sort((a, b) => b.revenue - a.revenue);

  function changePreset(next: "weekly" | "monthly" | "custom") {
    setPreset(next);
    if (next !== "custom") {
      const range = currentRange(today, next);
      setStart(range.start);
      setEnd(range.end);
    }
  }

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startSaving(async () => {
      try {
        const result = await createExpense(formData);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Expense recorded");
        form.reset();
        router.refresh();
      } catch (error) {
        console.error("Expense creation action failed:", error);
        toast.error("Could not save the expense. Please try again.");
      }
    });
  }

  function removeExpense(id: string) {
    startDeleting(async () => {
      try {
        const result = await deleteExpense(id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Expense removed");
        router.refresh();
      } catch (error) {
        console.error("Expense deletion action failed:", error);
        toast.error("Could not remove the expense. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reporting period</CardTitle>
          <CardDescription>Sales and balances use invoice currency. Payments are grouped by their received date. Currency totals are kept separate.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="finance-period">Period</Label>
            <select
              id="finance-period"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              value={preset}
              onChange={(event) => changePreset(event.target.value as typeof preset)}
            >
              <option value="weekly">This week (Monday–Sunday)</option>
              <option value="monthly">This month</option>
              <option value="custom">Custom date range</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="finance-start">From</Label>
            <Input id="finance-start" type="date" value={start} onChange={(event) => {
              setPreset("custom");
              setStart(event.target.value);
            }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finance-end">To</Label>
            <Input id="finance-end" type="date" value={end} onChange={(event) => {
              setPreset("custom");
              setEnd(event.target.value);
            }} />
          </div>
          {!validRange && <p className="text-destructive text-sm sm:col-span-3">Choose a valid date range.</p>}
        </CardContent>
      </Card>

      {currencies.map((currency) => {
        const totals = currencyTotals.get(currency) ?? EMPTY_TOTALS();
        const allExpenses = totals.packageCosts + totals.operatingExpenses;
        const profit = totals.revenue - allExpenses;
        return (
          <section key={currency} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{currency} · {CURRENCIES[currency].name}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryCard title="Invoice revenue" amount={totals.revenue} currency={currency} description="Invoices issued in this period" />
              <SummaryCard title="Advance received" amount={totals.collected} currency={currency} description="Payments received in this period, including older invoices" />
              <SummaryCard title="Pending amount" amount={totals.pending} currency={currency} description="Remaining balances on invoices issued in this period" />
              <SummaryCard title="Package costs" amount={totals.packageCosts} currency={currency} description="Direct package costs saved on invoices in this period" />
              <SummaryCard title="Total expenses" amount={allExpenses} currency={currency} description="Package costs plus manually tracked expenses" />
              <SummaryCard title="Net profit" amount={profit} currency={currency} description="Invoice revenue less package costs and expenses in this period" />
            </div>
          </section>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>Package revenue, cost &amp; profit</CardTitle>
          <CardDescription>Grouped by package and currency, for invoices issued in this period.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {packageRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invoices in this period.</p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Package / destination</th>
                <th className="py-2 pr-3 font-medium">Invoices</th>
                <th className="py-2 pr-3 font-medium">Currency</th>
                <th className="py-2 pr-3 font-medium">Revenue</th>
                <th className="py-2 pr-3 font-medium">Cost</th>
                <th className="py-2 font-medium">Profit</th>
              </tr></thead>
              <tbody>
                {packageRows.map((row) => (
                  <tr key={`${row.name}-${row.destination}-${row.currency}-${row.costCurrency}`} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-medium">
                      {row.name}
                      {row.destination && row.destination !== row.name && <span className="block text-xs font-normal text-muted-foreground">{row.destination}</span>}
                    </td>
                    <td className="py-3 pr-3">{row.count}</td>
                    <td className="py-3 pr-3">{row.currency}</td>
                    <td className="py-3 pr-3">{formatMoney(row.revenue, row.currency)}</td>
                    <td className="py-3 pr-3">
                      {formatMoney(row.cost, row.costCurrency)}
                      {row.costCurrency !== row.currency && <span className="ml-1 text-xs text-muted-foreground">{row.costCurrency}</span>}
                    </td>
                    <td className="py-3">
                      {row.costCurrency === row.currency ? formatMoney(row.revenue - row.cost, row.currency) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Record an expense</CardTitle>
            <CardDescription>Enter the expense in its original currency. Exchange rates are saved with the record. Attach an optional PDF or image receipt.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitExpense}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input id="expense-date" name="date" type="date" defaultValue={today} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Category</Label>
                  <Input id="expense-category" name="category" maxLength={80} placeholder="Transport, lodging…" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-description">Description</Label>
                <Input id="expense-description" name="description" maxLength={160} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount</Label>
                  <Input id="expense-amount" name="amount" type="number" step="0.01" min="0.01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-currency">Currency</Label>
                  <select id="expense-currency" name="currency" defaultValue="INR" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm">
                    {CURRENCY_CODES.map((code) => <option key={code} value={code}>{code} ({CURRENCIES[code].name})</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-vendor">Vendor (optional)</Label>
                <Input id="expense-vendor" name="vendor" maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-note">Notes (optional)</Label>
                <Textarea id="expense-note" name="note" maxLength={1000} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-receipt">Receipt (optional)</Label>
                <Input id="expense-receipt" name="receipt" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
                <p className="text-xs text-muted-foreground">PDF, JPEG, PNG, or WebP up to 10 MB.</p>
              </div>
              <Button type="submit" disabled={saving}>
                <Plus className="mr-2 size-4" /> {saving ? "Saving…" : "Add expense"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>{selectedExpenses.length} manually recorded expense{selectedExpenses.length === 1 ? "" : "s"} in this period. Package costs are counted separately from these entries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedExpenses.length === 0 ? (
              <p className="text-muted-foreground text-sm">No manual expenses in this period.</p>
            ) : selectedExpenses.map((expense) => (
              <div key={expense.id} className="flex min-w-0 items-start justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">{displayDate(expense.date)} · {expense.category}{expense.vendor ? ` · ${expense.vendor}` : ""}</p>
                  {expense.note && <p className="text-xs text-muted-foreground">{expense.note}</p>}
                  {expense.receipt && (
                    <a
                      className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                      href={`/api/finance/expenses/${expense.id}/receipt`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {expense.receipt.contentType === "application/pdf" ? <FileText className="size-3.5" /> : <Receipt className="size-3.5" />}
                      {expense.receipt.name}
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <strong className="text-sm">{formatMoney(expense.amount, expense.currency)}</strong>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${expense.description}`} disabled={deleting} onClick={() => setExpenseToDelete(expense.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog
        open={expenseToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setExpenseToDelete(null);
        }}
        title="Delete this expense?"
        description="The expense will be removed from finance reports. The change will be recorded in the audit log."
        confirmLabel="Delete expense"
        onConfirm={() => {
          if (expenseToDelete) removeExpense(expenseToDelete);
          setExpenseToDelete(null);
        }}
      />
    </div>
  );
}
