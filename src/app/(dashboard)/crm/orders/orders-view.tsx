"use client";

import { useState } from "react";
import { ShoppingCart, Search, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { orderSchema, type OrderInput } from "@/lib/validators/crm";
import { createCrmOrder, deleteCrmOrder } from "@/actions/crm";
import type { CrmOrder } from "@/types/crm";

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OrdersView({ initialOrders }: { initialOrders: CrmOrder[] }) {
  const [orders, setOrders] = useState<CrmOrder[]>(initialOrders);
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<OrderInput>({
    subject: "",
    accountName: "",
    contactName: "",
    status: "pending",
    totalAmount: 75000,
    orderDate: new Date().toISOString().split("T")[0],
    notes: "",
    assignedTo: "",
    assignedToName: "Admin",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filtered = orders.filter((o) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(s) ||
      o.subject?.toLowerCase().includes(s) ||
      o.accountName?.toLowerCase().includes(s)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createCrmOrder(formData);
      if (!res.ok) {
        setErrorMsg(res.error);
      } else {
        const newDoc: CrmOrder = {
          id: res.id || Date.now().toString(),
          orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
          ...formData,
          assignedTo: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "user",
          updatedBy: "user",
          isDeleted: false,
        };
        setOrders((prev) => [newDoc, ...prev]);
        setIsDialogOpen(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create order");
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
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="sm" className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          Create Order
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Account & Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order Date</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No confirmed orders recorded.
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-foreground">{o.orderNumber}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{o.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{o.accountName || "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{o.contactName || "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.orderDate}</td>
                  <td className="px-4 py-3 font-mono font-bold text-foreground">
                    {formatRupees(o.totalAmount || 0)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.assignedToName || "Admin"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sales Order</DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-foreground">Order Subject *</label>
              <Input
                required
                placeholder="Confirmed Kerala Explorer Tour"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-foreground">Account Name</label>
                <Input
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Contact Name</label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Total Amount (₹) *</label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, totalAmount: Number(e.target.value) || 0 })
                  }
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Order Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
