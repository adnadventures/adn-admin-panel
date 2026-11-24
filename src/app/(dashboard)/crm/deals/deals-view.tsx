"use client";

import { useState } from "react";
import {
  Briefcase,
  Search,
  Plus,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  Calendar,
  Building,
  User,
  ArrowRight,
  ChevronRight,
  TrendingUp,
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
import {
  CRM_DEAL_STAGES,
  CRM_DEAL_STAGE_CONFIGS,
  dealSchema,
  type DealInput,
} from "@/lib/validators/crm";
import {
  createCrmDeal,
  updateCrmDeal,
  updateCrmDealStage,
  deleteCrmDeal,
} from "@/actions/crm";
import type { CrmDeal, CrmDealStage } from "@/types/crm";

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DealsView({ initialDeals }: { initialDeals: CrmDeal[] }) {
  const [deals, setDeals] = useState<CrmDeal[]>(initialDeals);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<CrmDeal | null>(null);
  const [formData, setFormData] = useState<DealInput>({
    name: "",
    accountName: "",
    contactName: "",
    amount: 100000,
    stage: "qualification",
    probability: 20,
    closingDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    type: "new_business",
    leadSource: "Website",
    assignedTo: "",
    assignedToName: "Admin",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filtered = deals.filter((d) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      d.name?.toLowerCase().includes(s) ||
      d.accountName?.toLowerCase().includes(s) ||
      d.contactName?.toLowerCase().includes(s)
    );
  });

  const handleOpenCreate = () => {
    setEditingDeal(null);
    setFormData({
      name: "",
      accountName: "",
      contactName: "",
      amount: 100000,
      stage: "qualification",
      probability: 20,
      closingDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      type: "new_business",
      leadSource: "Website",
      assignedTo: "",
      assignedToName: "Admin",
      notes: "",
    });
    setErrorMsg("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (d: CrmDeal) => {
    setEditingDeal(d);
    setFormData({
      name: d.name,
      accountName: d.accountName || "",
      contactName: d.contactName || "",
      amount: d.amount || 0,
      stage: d.stage,
      probability: d.probability || 20,
      closingDate: d.closingDate || "",
      type: d.type || "new_business",
      leadSource: d.leadSource || "Website",
      assignedTo: d.assignedTo || "",
      assignedToName: d.assignedToName || "Admin",
      notes: d.notes || "",
    });
    setErrorMsg("");
    setIsDialogOpen(true);
  };

  const handleStageChange = async (dealId: string, newStage: CrmDealStage) => {
    const config = CRM_DEAL_STAGE_CONFIGS.find((c) => c.id === newStage);
    const newProb = config ? config.probability : 50;

    // Optimistic UI update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage: newStage,
              probability: newProb,
              expectedRevenue: Math.round(((d.amount || 0) * newProb) / 100),
            }
          : d
      )
    );

    await updateCrmDealStage(dealId, newStage, newProb);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (editingDeal) {
        const res = await updateCrmDeal(editingDeal.id, formData);
        if (!res.ok) {
          setErrorMsg(res.error);
        } else {
          setDeals((prev) =>
            prev.map((d) => (d.id === editingDeal.id ? { ...d, ...formData } : d))
          );
          setIsDialogOpen(false);
        }
      } else {
        const res = await createCrmDeal(formData);
        if (!res.ok) {
          setErrorMsg(res.error);
        } else {
          const newDoc: CrmDeal = {
            id: res.id || Date.now().toString(),
            ...formData,
            expectedRevenue: Math.round((formData.amount * formData.probability) / 100),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "user",
            updatedBy: "user",
            isDeleted: false,
          };
          setDeals((prev) => [newDoc, ...prev]);
          setIsDialogOpen(false);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save deal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;
    const res = await deleteCrmDeal(id);
    if (res.ok) {
      setDeals((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search deals, accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "kanban"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-3.5" />
              Table
            </button>
          </div>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          Add Deal
        </Button>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {CRM_DEAL_STAGE_CONFIGS.map((stageConfig) => {
            const stageDeals = filtered.filter((d) => d.stage === stageConfig.id);
            const totalStageValue = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

            return (
              <div
                key={stageConfig.id}
                className="flex flex-col rounded-xl border border-border/60 bg-muted/20 p-2.5 min-w-[240px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b pb-2 mb-2.5">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">{stageConfig.label}</h3>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      {formatRupees(totalStageValue)}
                    </div>
                  </div>
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                    {stageDeals.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-2 overflow-y-auto max-h-[70vh]">
                  {stageDeals.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-muted-foreground">
                      No deals in this stage
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="rounded-lg border border-border/60 bg-card p-3 shadow-xs hover:border-primary/50 transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-semibold text-foreground line-clamp-1">
                            {deal.name}
                          </h4>
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(deal)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="size-3 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(deal.id)}
                              className="h-6 w-6 p-0 hover:text-destructive"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Amount & Expected */}
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-foreground">
                            {formatRupees(deal.amount || 0)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {deal.probability}% prob
                          </span>
                        </div>

                        {/* Account & Contact */}
                        <div className="space-y-0.5 text-[11px] text-muted-foreground">
                          {deal.accountName && (
                            <div className="flex items-center gap-1 truncate">
                              <Building className="size-3 shrink-0" />
                              <span className="truncate">{deal.accountName}</span>
                            </div>
                          )}
                          {deal.contactName && (
                            <div className="flex items-center gap-1 truncate">
                              <User className="size-3 shrink-0" />
                              <span className="truncate">{deal.contactName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-[10px]">
                            <Calendar className="size-3 shrink-0" />
                            <span>Close: {deal.closingDate}</span>
                          </div>
                        </div>

                        {/* Stage Selector Dropdown */}
                        <div className="pt-1 border-t">
                          <select
                            value={deal.stage}
                            onChange={(e) =>
                              handleStageChange(deal.id, e.target.value as CrmDealStage)
                            }
                            className="w-full rounded border border-border bg-muted/40 py-1 px-1.5 text-[10px] text-foreground font-medium"
                          >
                            {CRM_DEAL_STAGE_CONFIGS.map((s) => (
                              <option key={s.id} value={s.id}>
                                → Move: {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Deal Name</th>
                <th className="px-4 py-3">Account & Contact</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Probability</th>
                <th className="px-4 py-3">Closing Date</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No deals found.
                  </td>
                </tr>
              ) : (
                filtered.map((deal) => (
                  <tr key={deal.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{deal.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{deal.accountName || "—"}</div>
                      <div className="text-[11px] text-muted-foreground">{deal.contactName || "—"}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-foreground">
                      {formatRupees(deal.amount || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={deal.stage}
                        onChange={(e) =>
                          handleStageChange(deal.id, e.target.value as CrmDealStage)
                        }
                        className="rounded border border-border bg-background py-0.5 px-2 text-xs font-medium capitalize"
                      >
                        {CRM_DEAL_STAGE_CONFIGS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {deal.probability}% ({formatRupees(deal.expectedRevenue || 0)})
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{deal.closingDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{deal.assignedToName || "Admin"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(deal)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="size-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(deal.id)}
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
      )}

      {/* DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingDeal ? "Edit Deal" : "Create New Deal"}</DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="font-medium text-foreground">Deal Name *</label>
                <Input
                  required
                  placeholder="e.g. Deluxe Shimla Holiday 15 Pax"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Account Name</label>
                <Input
                  placeholder="Acme Corp"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Contact Name</label>
                <Input
                  placeholder="Primary Traveler / Decision Maker"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Amount (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: Number(e.target.value) || 0 })
                  }
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => {
                    const st = e.target.value as CrmDealStage;
                    const cfg = CRM_DEAL_STAGE_CONFIGS.find((c) => c.id === st);
                    setFormData({
                      ...formData,
                      stage: st,
                      probability: cfg ? cfg.probability : formData.probability,
                    });
                  }}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  {CRM_DEAL_STAGE_CONFIGS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({s.probability}%)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-foreground">Closing Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.closingDate}
                  onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Assigned Owner</label>
                <Input
                  value={formData.assignedToName}
                  onChange={(e) => setFormData({ ...formData, assignedToName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Deal Notes / Requirements</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingDeal ? "Update Deal" : "Save Deal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
