"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney, type CurrencyCode } from "@/lib/finance/currency";
import { formatDate } from "@/lib/format";
import type { Invoice } from "@/types/models";

const statusLabels = {
  draft: "Draft",
  sent: "Unpaid",
  partially_paid: "Partially paid",
  paid: "Paid",
  cancelled: "Cancelled",
} as const;

export function InvoiceSearch({
  invoices,
  canManage,
}: {
  invoices: Invoice[];
  canManage: boolean;
}) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const invalidRange = Boolean(startDate && endDate && startDate > endDate);
  const filteredInvoices = useMemo(() => {
    if (invalidRange) return [];
    const query = name.trim().toLocaleLowerCase();
    return invoices.filter((invoice) => {
      const issueDate = invoice.issueDate.slice(0, 10);
      return (
        (!query || invoice.customer.name.toLocaleLowerCase().includes(query))
        && (!startDate || issueDate >= startDate)
        && (!endDate || issueDate <= endDate)
      );
    });
  }, [endDate, invalidRange, invoices, name, startDate]);
  const totalsByCurrency = filteredInvoices.reduce((totals, invoice) => {
    totals.set(invoice.currency, (totals.get(invoice.currency) ?? 0) + invoice.total);
    return totals;
  }, new Map<CurrencyCode, number>());
  const hasFilters = Boolean(name || startDate || endDate);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-[minmax(0,1.4fr)_1fr_1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="invoice-search-name">Client name</Label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="invoice-search-name"
              type="search"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Search by client name"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice-search-start">From date</Label>
          <Input
            id="invoice-search-start"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice-search-end">To date</Label>
          <Input
            id="invoice-search-end"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!hasFilters}
          onClick={() => {
            setName("");
            setStartDate("");
            setEndDate("");
          }}
        >
          <X className="mr-2 size-4" /> Clear
        </Button>
      </div>

      {invalidRange && (
        <p className="text-sm text-destructive">The start date must be on or before the end date.</p>
      )}

      {invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center sm:p-12">
          <h2 className="text-lg font-semibold">No invoices yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a manual invoice or start with an existing booking.
          </p>
          {canManage && (
            <Link href="/invoices/new" className={`${buttonVariants()} mt-4`}>
              Create your first invoice
            </Link>
          )}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No invoices match your search and date filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 text-sm text-muted-foreground">
            <span>Showing {filteredInvoices.length} of {invoices.length} invoices</span>
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              {Array.from(totalsByCurrency, ([currency, total]) => (
                <span key={currency}>Total · {formatMoney(total, currency)}</span>
              ))}
            </span>
          </div>
          <table className="w-full min-w-[740px] text-left text-sm">
            <thead className="bg-muted/70 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/invoices/${invoice.id}`} className="text-primary underline-offset-4 hover:underline">
                      {invoice.invoiceNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{invoice.customer.name}</div>
                    <div className="text-xs text-muted-foreground">{invoice.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3">{invoice.tripDestination}</td>
                  <td className="px-4 py-3">{formatDate(invoice.issueDate)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(invoice.total, invoice.currency)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {statusLabels[invoice.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
