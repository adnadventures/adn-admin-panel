"use client";

import { useState } from "react";
import {
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Building,
  Mail,
  Phone,
  Flame,
  Snowflake,
  Sun,
  Trash2,
  Edit,
  ArrowRightCircle,
  Plus,
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
  CRM_LEAD_SOURCES,
  CRM_LEAD_STATUSES,
  CRM_LEAD_RATINGS,
  CRM_DEAL_STAGES,
  type LeadInput,
  type ConvertLeadInput,
} from "@/lib/validators/crm";
import {
  createCrmLead,
  updateCrmLead,
  deleteCrmLead,
  convertCrmLead,
} from "@/actions/crm";
import type { CrmLead } from "@/types/crm";

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusBadgeClasses: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  contacted: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  qualified: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  unqualified: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  proposal: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  negotiation: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  converted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export function LeadsView({ initialLeads }: { initialLeads: CrmLead[] }) {
  const [leads, setLeads] = useState<CrmLead[]>(initialLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  // Lead Form Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);
  const [formData, setFormData] = useState<LeadInput>({
    name: "",
    company: "",
    title: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    leadSource: "Website",
    leadStatus: "new",
    rating: "warm",
    expectedBudget: 0,
    assignedTo: "",
    assignedToName: "Admin",
    description: "",
    tags: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Convert Dialog
  const [convertTarget, setConvertTarget] = useState<CrmLead | null>(null);
  const [convertData, setConvertData] = useState<ConvertLeadInput>({
    leadId: "",
    createAccount: true,
    accountName: "",
    contactName: "",
    createDeal: true,
    dealName: "",
    dealAmount: 0,
    dealClosingDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    dealStage: "qualification",
  });
  const [isConverting, setIsConverting] = useState(false);

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    if (statusFilter !== "all" && l.leadStatus !== statusFilter) return false;
    if (ratingFilter !== "all" && l.rating !== ratingFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const match =
        l.name?.toLowerCase().includes(s) ||
        l.company?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.phone?.includes(s);
      if (!match) return false;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setEditingLead(null);
    setFormData({
      name: "",
      company: "",
      title: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      postalCode: "",
      leadSource: "Website",
      leadStatus: "new",
      rating: "warm",
      expectedBudget: 0,
      assignedTo: "",
      assignedToName: "Admin",
      description: "",
      tags: [],
    });
    setErrorMsg("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (lead: CrmLead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      company: lead.company || "",
      title: lead.title || "",
      email: lead.email || "",
      phone: lead.phone || "",
      address: lead.address || "",
      city: lead.city || "",
      state: lead.state || "",
      country: lead.country || "India",
      postalCode: lead.postalCode || "",
      leadSource: lead.leadSource || "Website",
      leadStatus: lead.leadStatus || "new",
      rating: lead.rating || "warm",
      expectedBudget: lead.expectedBudget || 0,
      assignedTo: lead.assignedTo || "",
      assignedToName: lead.assignedToName || "Admin",
      description: lead.description || "",
      tags: lead.tags || [],
    });
    setErrorMsg("");
    setIsDialogOpen(true);
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (editingLead) {
        const res = await updateCrmLead(editingLead.id, formData);
        if (!res.ok) {
          setErrorMsg(res.error);
        } else {
          setLeads((prev) =>
            prev.map((l) => (l.id === editingLead.id ? { ...l, ...formData } : l))
          );
          setIsDialogOpen(false);
        }
      } else {
        const res = await createCrmLead(formData);
        if (!res.ok) {
          setErrorMsg(res.error);
        } else {
          const newDoc: CrmLead = {
            id: res.id || Date.now().toString(),
            ...formData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "user",
            updatedBy: "user",
            isDeleted: false,
          };
          setLeads((prev) => [newDoc, ...prev]);
          setIsDialogOpen(false);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    const res = await deleteCrmLead(id);
    if (res.ok) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } else {
      alert(res.error);
    }
  };

  const handleOpenConvert = (lead: CrmLead) => {
    setConvertTarget(lead);
    setConvertData({
      leadId: lead.id,
      createAccount: !!lead.company,
      accountName: lead.company || "",
      contactName: lead.name,
      createDeal: true,
      dealName: `${lead.name} - Tour Deal`,
      dealAmount: lead.expectedBudget || 50000,
      dealClosingDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      dealStage: "qualification",
    });
  };

  const handleExecuteConvert = async () => {
    if (!convertTarget) return;
    setIsConverting(true);
    try {
      const res = await convertCrmLead(convertData);
      if (!res.ok) {
        alert(res.error);
      } else {
        setLeads((prev) =>
          prev.map((l) => (l.id === convertTarget.id ? { ...l, leadStatus: "converted" } : l))
        );
        setConvertTarget(null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search leads by name, company, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground"
          >
            <option value="all">All Statuses</option>
            {CRM_LEAD_STATUSES.map((st) => (
              <option key={st} value={st} className="capitalize">
                {st}
              </option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground"
          >
            <option value="all">All Ratings</option>
            {CRM_LEAD_RATINGS.map((rt) => (
              <option key={rt} value={rt} className="capitalize">
                {rt} Rating
              </option>
            ))}
          </select>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          Add Lead
        </Button>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Lead Name</th>
              <th className="px-4 py-3">Company & Title</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Expected Budget</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div>{lead.name}</div>
                    <div className="text-[11px] text-muted-foreground">{lead.city || "India"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{lead.company || "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{lead.title || "—"}</div>
                  </td>
                  <td className="px-4 py-3 space-y-0.5">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="size-3" />
                      <span>{lead.phone}</span>
                    </div>
                    {lead.email && (
                      <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <Mail className="size-3" />
                        <span>{lead.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.leadSource}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        (lead.leadStatus && statusBadgeClasses[lead.leadStatus]) || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {lead.leadStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 font-medium capitalize">
                      {lead.rating === "hot" ? (
                        <Flame className="size-3.5 text-rose-500 fill-rose-500" />
                      ) : lead.rating === "warm" ? (
                        <Sun className="size-3.5 text-amber-500 fill-amber-500" />
                      ) : (
                        <Snowflake className="size-3.5 text-sky-500" />
                      )}
                      <span>{lead.rating}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-foreground">
                    {formatRupees(lead.expectedBudget || 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {lead.leadStatus !== "converted" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenConvert(lead)}
                          className="h-7 px-2 text-primary hover:text-primary text-[11px] font-semibold"
                        >
                          <ArrowRightCircle className="size-3.5 mr-1" />
                          Convert
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(lead)}
                        className="h-7 w-7 p-0"
                        title="Edit Lead"
                      >
                        <Edit className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLead(lead.id)}
                        className="h-7 w-7 p-0 hover:text-destructive"
                        title="Delete Lead"
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

      {/* CREATE / EDIT LEAD MODAL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead" : "Create New Lead"}</DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-2.5 text-xs text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmitLead} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">Lead Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Company / Organization</label>
                <Input
                  placeholder="e.g. Infosys Ltd"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Phone Number *</label>
                <Input
                  required
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="ramesh@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Lead Source</label>
                <select
                  value={formData.leadSource}
                  onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground"
                >
                  {CRM_LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-foreground">Lead Status</label>
                <select
                  value={formData.leadStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, leadStatus: e.target.value as any })
                  }
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground capitalize"
                >
                  {CRM_LEAD_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-foreground">Lead Rating</label>
                <select
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: e.target.value as any })
                  }
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground capitalize"
                >
                  {CRM_LEAD_RATINGS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-foreground">Expected Budget (₹)</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="50000"
                  value={formData.expectedBudget}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedBudget: Number(e.target.value) || 0 })
                  }
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">City</label>
                <Input
                  placeholder="Mumbai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Assigned Owner Name</label>
                <Input
                  placeholder="e.g. Sales Agent"
                  value={formData.assignedToName}
                  onChange={(e) => setFormData({ ...formData, assignedToName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Description & Requirements</label>
              <textarea
                rows={3}
                placeholder="Inquired about family tour package to Kashmir / Goa..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingLead ? "Update Lead" : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONVERT LEAD MODAL */}
      <Dialog open={!!convertTarget} onOpenChange={(open) => !open && setConvertTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-600" />
              Convert Lead to Deal & Contact
            </DialogTitle>
          </DialogHeader>

          {convertTarget && (
            <div className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                Converting <strong>{convertTarget.name}</strong> will create an active Contact, optionally an Account, and a sales Deal in your pipeline.
              </p>

              {/* Contact Info */}
              <div className="rounded-lg border bg-muted/30 p-2.5 space-y-1">
                <span className="font-semibold text-foreground">New Contact:</span>
                <div>{convertTarget.name} ({convertTarget.phone})</div>
              </div>

              {/* Account Checkbox */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertData.createAccount}
                    onChange={(e) =>
                      setConvertData({ ...convertData, createAccount: e.target.checked })
                    }
                    className="rounded border-input text-primary"
                  />
                  <span>Create Account (Company)</span>
                </label>
                {convertData.createAccount && (
                  <Input
                    placeholder="Company / Account Name"
                    value={convertData.accountName}
                    onChange={(e) =>
                      setConvertData({ ...convertData, accountName: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                )}
              </div>

              {/* Deal Checkbox */}
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={convertData.createDeal}
                    onChange={(e) =>
                      setConvertData({ ...convertData, createDeal: e.target.checked })
                    }
                    className="rounded border-input text-primary"
                  />
                  <span>Create Deal in Pipeline</span>
                </label>
                {convertData.createDeal && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Deal Name"
                      value={convertData.dealName}
                      onChange={(e) =>
                        setConvertData({ ...convertData, dealName: e.target.value })
                      }
                      className="h-8 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground">Deal Amount (₹)</label>
                        <Input
                          type="number"
                          value={convertData.dealAmount}
                          onChange={(e) =>
                            setConvertData({
                              ...convertData,
                              dealAmount: Number(e.target.value) || 0,
                            })
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Stage</label>
                        <select
                          value={convertData.dealStage}
                          onChange={(e) =>
                            setConvertData({ ...convertData, dealStage: e.target.value as any })
                          }
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs capitalize"
                        >
                          {CRM_DEAL_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConvertTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleExecuteConvert}
                  disabled={isConverting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isConverting ? "Converting..." : "Complete Conversion"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
