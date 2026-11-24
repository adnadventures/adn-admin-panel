"use client";

import { useState } from "react";
import {
  Building,
  Search,
  Plus,
  Phone,
  Mail,
  Globe,
  Edit,
  Trash2,
  Users,
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
import { accountSchema, type AccountInput } from "@/lib/validators/crm";
import { createCrmAccount, updateCrmAccount, deleteCrmAccount } from "@/actions/crm";
import type { CrmAccount } from "@/types/crm";

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AccountsView({ initialAccounts }: { initialAccounts: CrmAccount[] }) {
  const [accounts, setAccounts] = useState<CrmAccount[]>(initialAccounts);
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CrmAccount | null>(null);
  const [formData, setFormData] = useState<AccountInput>({
    name: "",
    industry: "Information Technology",
    phone: "",
    email: "",
    website: "",
    annualRevenue: 0,
    employeesCount: 0,
    billingAddress: "",
    shippingAddress: "",
    assignedTo: "",
    assignedToName: "Admin",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filtered = accounts.filter((a) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(s) ||
      a.industry?.toLowerCase().includes(s) ||
      a.phone?.includes(s) ||
      a.email?.toLowerCase().includes(s)
    );
  });

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({
      name: "",
      industry: "Corporate & Travel",
      phone: "",
      email: "",
      website: "",
      annualRevenue: 0,
      employeesCount: 0,
      billingAddress: "",
      shippingAddress: "",
      assignedTo: "",
      assignedToName: "Admin",
      notes: "",
    });
    setErrorMsg("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (a: CrmAccount) => {
    setEditingAccount(a);
    setFormData({
      name: a.name,
      industry: a.industry || "",
      phone: a.phone || "",
      email: a.email || "",
      website: a.website || "",
      annualRevenue: a.annualRevenue || 0,
      employeesCount: a.employeesCount || 0,
      billingAddress: a.billingAddress || "",
      shippingAddress: a.shippingAddress || "",
      assignedTo: a.assignedTo || "",
      assignedToName: a.assignedToName || "Admin",
      notes: a.notes || "",
    });
    setErrorMsg("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (editingAccount) {
        const res = await updateCrmAccount(editingAccount.id, formData);
        if (!res.ok) {
          setErrorMsg(res.error);
        } else {
          setAccounts((prev) =>
            prev.map((a) => (a.id === editingAccount.id ? { ...a, ...formData } : a))
          );
          setIsDialogOpen(false);
        }
      } else {
        const res = await createCrmAccount(formData);
        if (!res.ok) {
          setErrorMsg(res.error);
        } else {
          const newDoc: CrmAccount = {
            id: res.id || Date.now().toString(),
            ...formData,
            assignedTo: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "user",
            updatedBy: "user",
            isDeleted: false,
          };
          setAccounts((prev) => [newDoc, ...prev]);
          setIsDialogOpen(false);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    const res = await deleteCrmAccount(id);
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts & companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          Add Account
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Account Name</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Phone & Email</th>
              <th className="px-4 py-3">Website</th>
              <th className="px-4 py-3">Annual Revenue</th>
              <th className="px-4 py-3">Assigned Owner</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No accounts found.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Building className="size-3.5" />
                      </span>
                      <span>{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.industry || "General"}</td>
                  <td className="px-4 py-3 space-y-0.5">
                    {a.phone && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="size-3" />
                        <span>{a.phone}</span>
                      </div>
                    )}
                    {a.email && (
                      <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <Mail className="size-3" />
                        <span>{a.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.website ? (
                      <span className="flex items-center gap-1 text-primary">
                        <Globe className="size-3" />
                        {a.website}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-foreground">
                    {a.annualRevenue ? formatRupees(a.annualRevenue) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.assignedToName || "Admin"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(a)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(a.id)}
                        className="h-7 w-7 p-0 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
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
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">Account Name *</label>
                <Input
                  required
                  placeholder="e.g. Reliance Group"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Industry</label>
                <Input
                  placeholder="Tourism / Hospitality"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Phone</label>
                <Input
                  placeholder="+91 22 12345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="corp@account.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Website</label>
                <Input
                  placeholder="https://company.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Annual Revenue (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.annualRevenue}
                  onChange={(e) =>
                    setFormData({ ...formData, annualRevenue: Number(e.target.value) || 0 })
                  }
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div className="col-span-2">
                <label className="font-medium text-foreground">Billing / Office Address</label>
                <Input
                  placeholder="Street, City, State"
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingAccount ? "Update" : "Save Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
