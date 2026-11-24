"use client";

import { useState } from "react";
import { ReportPdfButton } from "@/components/shared/report-pdf-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES, formatMoney, type CurrencyCode } from "@/lib/finance/currency";
import { formatDate } from "@/lib/format";
import { formatReportAmount } from "@/lib/reports/pdf";

type ReportInvoice = {
  id: string;
  invoiceNo: string;
  customer: string;
  issueDate: string;
  currency: CurrencyCode;
  status: string;
  amountPaid: number;
  remainingBalance: number;
  packageCost: number;
};

type ReportExpense = {
  id: string;
  date: string;
  description: string;
  category: string;
  payee: string;
  currency: CurrencyCode;
  amount: number;
};

type Props = {
  invoices: ReportInvoice[];
  bookingExpenses: ReportExpense[];
  companyExpenses: ReportExpense[];
  today: string;
};

type Totals = {
  revenue: number;
  pendingCollection: number;
  invoiceCosts: number;
  bookingExpenses: number;
  companyExpenses: number;
  invoiceCount: number;
};

type Period = "today" | "week" | "month" | "year" | "all-time" | "custom";
type DateRange = { start: string; end: string };

const day = (value: string) => value.slice(0, 10);
const within = (value: string, start: string, end: string) =>
  day(value) >= start && day(value) <= end;

function periodRange(period: Exclude<Period, "custom">, today: string) {
  if (period === "all-time") return null;

  const date = new Date(`${today}T00:00:00.000Z`);
  let start: string;
  switch (period) {
    case "today":
      start = today;
      break;
    case "week":
      date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      start = date.toISOString().slice(0, 10);
      break;
    case "month":
      start = `${today.slice(0, 7)}-01`;
      break;
    case "year":
      start = `${today.slice(0, 4)}-01-01`;
      break;
  }
  return { start, end: today };
}

function SummaryCard({
  title,
  amount,
  currency,
  description,
  unavailable,
  valueClassName,
}: {
  title: string;
  amount: number;
  currency: CurrencyCode;
  description: string;
  unavailable?: boolean;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className={`text-xl ${valueClassName ?? ""}`}>
          {unavailable ? "Unavailable — check exchange rates" : formatMoney(amount, currency)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

export function FinanceDashboard({ invoices, bookingExpenses, companyExpenses, today }: Props) {
  const [period, setPeriod] = useState<Period>("month");
  const [customRange, setCustomRange] = useState<DateRange>(() => periodRange("month", today)!);
  const range = period === "custom" ? customRange : periodRange(period, today);
  const validRange = period !== "custom"
    || Boolean(range?.start && range.end && range.start <= range.end);
  const changeDate = (key: keyof DateRange, value: string) => {
    const currentRange = range ?? { start: "", end: "" };
    setCustomRange({ ...currentRange, [key]: value });
    setPeriod("custom");
  };
  const isInPeriod = (value: string) =>
    period === "all-time"
    || (validRange && range !== null && within(value, range.start, range.end));
  const selectedInvoices = invoices.filter((invoice) =>
    invoice.status !== "cancelled" && isInPeriod(invoice.issueDate),
  );
  const selectedBookingExpenses = bookingExpenses.filter((expense) =>
    isInPeriod(expense.date),
  );
  const selectedCompanyExpenses = companyExpenses.filter((expense) =>
    isInPeriod(expense.date),
  );
  const totalsByCurrency = new Map<CurrencyCode, Totals>();

  for (const invoice of selectedInvoices) {
    const totals = totalsByCurrency.get(invoice.currency) ?? {
      revenue: 0,
      pendingCollection: 0,
      invoiceCosts: 0,
      bookingExpenses: 0,
      companyExpenses: 0,
      invoiceCount: 0,
    };
    totals.revenue += invoice.amountPaid;
    totals.pendingCollection += invoice.remainingBalance;
    totals.invoiceCosts += invoice.packageCost;
    if (invoice.amountPaid > 0) totals.invoiceCount++;
    totalsByCurrency.set(invoice.currency, totals);
  }

  for (const expense of selectedBookingExpenses) {
    const totals = totalsByCurrency.get(expense.currency) ?? {
      revenue: 0,
      pendingCollection: 0,
      invoiceCosts: 0,
      bookingExpenses: 0,
      companyExpenses: 0,
      invoiceCount: 0,
    };
    totals.bookingExpenses += expense.amount;
    totalsByCurrency.set(expense.currency, totals);
  }

  for (const expense of selectedCompanyExpenses) {
    const totals = totalsByCurrency.get(expense.currency) ?? {
      revenue: 0,
      pendingCollection: 0,
      invoiceCosts: 0,
      bookingExpenses: 0,
      companyExpenses: 0,
      invoiceCount: 0,
    };
    totals.companyExpenses += expense.amount;
    totalsByCurrency.set(expense.currency, totals);
  }

  const currencies = Array.from(totalsByCurrency.keys()).sort((a, b) => a.localeCompare(b));
  const periodLabel = period === "custom"
    ? `Custom range: ${range?.start || "Any date"} to ${range?.end || "Any date"}`
    : period === "all-time"
      ? "All time"
      : `${period === "week" ? "This week" : period === "month" ? "This month" : period === "year" ? "This year" : "Today"} (${range?.start} to ${range?.end})`;
  const pdfReport = {
    title: "Finance report",
    period: periodLabel,
    fileName: `finance-${period}`,
    summary: [
      ["Non-cancelled invoices", String(selectedInvoices.length)],
      ["Invoices with pending balances", String(selectedInvoices.filter((invoice) => invoice.remainingBalance > 0).length)],
      ["Booking expenses", String(selectedBookingExpenses.length)],
      ["Company expenses", String(selectedCompanyExpenses.length)],
      ["Currencies", currencies.join(", ") || "None"],
    ] as [string, string][],
    sections: [
      ...currencies.map((currency) => {
        const totals = totalsByCurrency.get(currency)!;
        const totalExpenses = totals.invoiceCosts + totals.bookingExpenses + totals.companyExpenses;
        return {
          title: `${currency} - ${CURRENCIES[currency].name}`,
          columns: ["Metric", "Amount"],
          rows: [
            ["Paid invoice revenue", formatReportAmount(totals.revenue, currency)],
            ["Pending collection", formatReportAmount(totals.pendingCollection, currency)],
            ["Invoice package costs", formatReportAmount(totals.invoiceCosts, currency)],
            ["Booking expenses", formatReportAmount(totals.bookingExpenses, currency)],
            ["Company expenses", formatReportAmount(totals.companyExpenses, currency)],
            ["Total expenses", formatReportAmount(totalExpenses, currency)],
            ["Profit", formatReportAmount(totals.revenue - totalExpenses, currency)],
          ],
        };
      }),
      {
        title: "Invoices in this period",
        columns: ["Invoice No.", "Client", "Issue date", "Currency", "Paid", "Pending", "Package cost", "Profit"],
        rows: selectedInvoices.map((invoice) => {
          return [
            invoice.invoiceNo,
            invoice.customer,
            formatDate(invoice.issueDate),
            invoice.currency,
            formatReportAmount(invoice.amountPaid, invoice.currency),
            formatReportAmount(invoice.remainingBalance, invoice.currency),
            formatReportAmount(invoice.packageCost, invoice.currency),
            formatReportAmount(invoice.amountPaid - invoice.packageCost, invoice.currency),
          ];
        }),
      },
      {
        title: "Booking expenses in this period",
        columns: ["Date", "Description", "Category", "Payee", "Currency", "Amount"],
        rows: selectedBookingExpenses.map((expense) => [
          formatDate(expense.date),
          expense.description,
          expense.category,
          expense.payee,
          expense.currency,
          formatReportAmount(expense.amount, expense.currency),
        ]),
      },
      {
        title: "Company expenses in this period",
        columns: ["Date", "Description", "Category", "Payee", "Currency", "Amount"],
        rows: selectedCompanyExpenses.map((expense) => [
          formatDate(expense.date),
          expense.description,
          expense.category,
          expense.payee,
          expense.currency,
          formatReportAmount(expense.amount, expense.currency),
        ]),
      },
    ],
  };

  return (
    <div className="space-y-6">
      {validRange && (
        <div className="flex justify-end">
          <ReportPdfButton report={pdfReport} />
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Reporting period</CardTitle>
          <CardDescription>
            Invoices are filtered by issue date; expenses are filtered by expense date.
            Only paid amounts count as revenue; remaining balances are shown as pending collection.
            Cancelled invoices are excluded and currency totals stay separate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="finance-period">Period</Label>
              <select
                id="finance-period"
                value={period}
                onChange={(event) => setPeriod(event.target.value as Period)}
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
                <option value="all-time">All time</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="finance-start">From</Label>
              <Input
                id="finance-start"
                type="date"
                value={range?.start ?? ""}
                onChange={(event) => changeDate("start", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="finance-end">To</Label>
              <Input
                id="finance-end"
                type="date"
                value={range?.end ?? ""}
                onChange={(event) => changeDate("end", event.target.value)}
              />
            </div>
          </div>
          {!validRange && (
            <p className="text-destructive text-sm">Choose a valid date range.</p>
          )}
        </CardContent>
      </Card>

      {currencies.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            No invoices or expenses in this date range.
          </CardContent>
        </Card>
      ) : currencies.map((currency) => {
        const totals = totalsByCurrency.get(currency)!;
        const totalExpenses = totals.invoiceCosts + totals.bookingExpenses + totals.companyExpenses;
        const profit = totals.revenue - totalExpenses;
        const bookingExpenseCount = selectedBookingExpenses
          .filter((expense) => expense.currency === currency)
          .length;
        const companyExpenseCount = selectedCompanyExpenses
          .filter((expense) => expense.currency === currency)
          .length;
        return (
          <section key={currency} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {currency} · {CURRENCIES[currency].name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
              <SummaryCard
                title="Paid invoice revenue"
                amount={totals.revenue}
                currency={currency}
                description={`Collected from ${totals.invoiceCount} invoice${totals.invoiceCount === 1 ? "" : "s"} in this period.`}
              />
              <SummaryCard
                title="Pending collection"
                amount={totals.pendingCollection}
                currency={currency}
                description="Remaining balances on non-cancelled invoices issued in this period."
              />
              <SummaryCard
                title="Invoice package costs"
                amount={totals.invoiceCosts}
                currency={currency}
                description="Package costs saved on each invoice."
              />
              <SummaryCard
                title="Booking expenses"
                amount={totals.bookingExpenses}
                currency={currency}
                description={`${bookingExpenseCount} booking expense${bookingExpenseCount === 1 ? "" : "s"} in this period.`}
              />
              <SummaryCard
                title="Company expenses"
                amount={totals.companyExpenses}
                currency={currency}
                description={`${companyExpenseCount} company expense${companyExpenseCount === 1 ? "" : "s"} in this period.`}
              />
              <SummaryCard
                title="Total expenses"
                amount={totalExpenses}
                currency={currency}
                description="Invoice package costs plus booking and company expenses."
              />
              <SummaryCard
                title="Profit"
                amount={profit}
                currency={currency}
                description="Invoice revenue minus total expenses."
                valueClassName={profit >= 0 ? "text-green-700 dark:text-green-400" : "text-destructive"}
              />
            </div>
          </section>
        );
      })}

      {selectedInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invoices in this period</CardTitle>
            <CardDescription>Paid amounts, pending balances, package costs, and profit for each invoice.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Invoice</th>
                  <th className="py-2 pr-3 font-medium">Issue date</th>
                  <th className="py-2 pr-3 font-medium">Currency</th>
                  <th className="py-2 pr-3 text-right font-medium">Paid</th>
                  <th className="py-2 pr-3 text-right font-medium">Pending</th>
                  <th className="py-2 pr-3 text-right font-medium">Package cost</th>
                  <th className="py-2 text-right font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoices.map((invoice) => {
                  return (
                    <tr key={invoice.id} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-medium">
                        {invoice.customer}
                        <span className="text-muted-foreground block text-xs">{invoice.invoiceNo}</span>
                      </td>
                      <td className="py-3 pr-3">{formatDate(invoice.issueDate)}</td>
                      <td className="py-3 pr-3">{invoice.currency}</td>
                      <td className="py-3 pr-3 text-right">{formatMoney(invoice.amountPaid, invoice.currency)}</td>
                      <td className="py-3 pr-3 text-right">{formatMoney(invoice.remainingBalance, invoice.currency)}</td>
                      <td className="py-3 pr-3 text-right">{formatMoney(invoice.packageCost, invoice.currency)}</td>
                      <td className="py-3 text-right">
                        {formatMoney(invoice.amountPaid - invoice.packageCost, invoice.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
