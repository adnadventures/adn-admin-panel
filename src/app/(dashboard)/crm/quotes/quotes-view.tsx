"use client";

import { useState } from "react";
import {
  FileCheck,
  Search,
  Plus,
  Trash2,
  Building,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { quoteSchema, type QuoteInput } from "@/lib/validators/crm";
import { createCrmQuote, deleteCrmQuote } from "@/actions/crm";
import type { CrmQuote } from "@/types/crm";

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function QuotesView({ initialQuotes }: { initialQuotes: CrmQuote[] }) {
  const [quotes, setQuotes] = useState<CrmQuote[]>(initialQuotes);
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<QuoteInput>({
    subject: "",
    accountName: "",
    contactName: "",
    status: "draft",
    validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    lineItems: [
      {
        description: "Standard Deluxe Holiday Package",
        quantity: 2,
        unitPrice: 25000,
        discountPercent: 5,
        taxPercent: 5,
        total: 49875,
      },
    ],
    termsAndConditions: "50% advance on confirmation. Balance 7 days prior to departure.",
    assignedTo: "",
    assignedToName: "Admin",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filtered = quotes.filter((q) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.quoteNumber?.toLowerCase().includes(s) ||
      q.subject?.toLowerCase().includes(s) ||
      q.contactName?.toLowerCase().includes(s)
    );
  });

  const handleOpenCreate = () => {
    setFormData({
      subject: "",
      accountName: "",
      contactName: "",
      status: "draft",
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      lineItems: [
        {
          description: "Tour Package Itinerary",
          quantity: 2,
          unitPrice: 30000,
          discountPercent: 0,
          taxPercent: 5,
          total: 63000,
        },
      ],
      termsAndConditions: "Standard booking cancellation policies apply.",
      assignedTo: "",
      assignedToName: "Admin",
    });
    setErrorMsg("");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await deleteCrmQuote(id);
    if (res.ok) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createCrmQuote(formData);
      if (!res.ok) {
        setErrorMsg(res.error);
      } else {
        const grandTotal = formData.lineItems.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
        const newDoc: CrmQuote = {
          id: res.id || Date.now().toString(),
          quoteNumber: `QT-${Date.now().toString().slice(-6)}`,
          ...formData,
          subtotal: grandTotal,
          discountTotal: 0,
          taxTotal: 0,
          grandTotal,
          assignedTo: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "user",
          updatedBy: "user",
          isDeleted: false,
        };
        setQuotes((prev) => [newDoc, ...prev]);
        setIsDialogOpen(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create quote");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          Create Quote
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Quote #</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Account & Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Valid Until</th>
              <th className="px-4 py-3">Grand Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No quotes found.
                </td>
              </tr>
            ) : (
              filtered.map((q) => (
                <tr key={q.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{q.quoteNumber}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{q.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{q.accountName || "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{q.contactName || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 capitalize">
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{q.validUntil}</td>
                  <td className="px-4 py-3 font-mono font-bold text-foreground">
                    {formatRupees(q.grandTotal || 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(q.id)}
                      className="h-7 w-7 p-0 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Quote</DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="font-medium text-foreground">Subject / Tour Package *</label>
                <Input
                  required
                  placeholder="Quotation for Goa Corporate Retreat"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Account Name</label>
                <Input
                  placeholder="Company Name"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Contact Name</label>
                <Input
                  placeholder="Recipient Name"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Valid Until Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Package Unit Price (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.lineItems[0]?.unitPrice || 0}
                  onChange={(e) => {
                    const price = Number(e.target.value) || 0;
                    const items = [...formData.lineItems];
                    if (items[0]) {
                      items[0].unitPrice = price;
                      items[0].total = items[0].quantity * price;
                    }
                    setFormData({ ...formData, lineItems: items });
                  }}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Terms & Conditions</label>
              <textarea
                rows={2}
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs outline-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Generating..." : "Generate Quote"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
