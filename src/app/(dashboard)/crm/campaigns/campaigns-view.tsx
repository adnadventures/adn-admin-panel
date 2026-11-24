"use client";

import { useState } from "react";
import { Megaphone, Search, Plus, TrendingUp, DollarSign } from "lucide-react";
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
  CRM_CAMPAIGN_STATUSES,
  CRM_CAMPAIGN_TYPES,
  campaignSchema,
  type CampaignInput,
} from "@/lib/validators/crm";
import { createCrmCampaign } from "@/actions/crm";
import type { CrmCampaign } from "@/types/crm";

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CampaignsView({ initialCampaigns }: { initialCampaigns: CrmCampaign[] }) {
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>(initialCampaigns);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CampaignInput>({
    name: "",
    type: "social_media",
    status: "active",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    expectedRevenue: 300000,
    budgetedCost: 50000,
    actualCost: 35000,
    expectedResponsePercent: 8,
    description: "Promotional campaign targeting holiday travelers.",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await createCrmCampaign(formData);
      if (res.ok) {
        const newDoc: CrmCampaign = {
          id: res.id || Date.now().toString(),
          ...formData,
          leadsCount: 0,
          contactsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "user",
          updatedBy: "user",
          isDeleted: false,
        };
        setCampaigns((prev) => [newDoc, ...prev]);
        setIsDialogOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Marketing & Ad Campaigns</h2>
          <p className="text-xs text-muted-foreground">Track lead generation campaigns and ROI</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
            No active marketing campaigns found.
          </div>
        ) : (
          campaigns.map((camp) => {
            const roi =
              camp.actualCost > 0
                ? Math.round(((camp.expectedRevenue - camp.actualCost) / camp.actualCost) * 100)
                : 0;

            return (
              <div
                key={camp.id}
                className="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">{camp.name}</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                    {camp.status}
                  </span>
                </div>

                <div className="text-muted-foreground line-clamp-1">{camp.description}</div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Budgeted Cost</span>
                    <div className="font-bold text-foreground">{formatRupees(camp.budgetedCost)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Actual Cost</span>
                    <div className="font-bold text-foreground">{formatRupees(camp.actualCost)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Exp. Revenue</span>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupees(camp.expectedRevenue)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Est. ROI</span>
                    <div className="font-bold text-primary">+{roi}%</div>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground">
                  Duration: {camp.startDate} to {camp.endDate}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Marketing Campaign</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-foreground">Campaign Name *</label>
              <Input
                required
                placeholder="Google Ads - Summer Holidays"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-foreground">Channel Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 capitalize"
                >
                  {CRM_CAMPAIGN_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-foreground">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 capitalize"
                >
                  {CRM_CAMPAIGN_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-foreground">Budgeted Cost (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.budgetedCost}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetedCost: Number(e.target.value) || 0 })
                  }
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Expected Revenue (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.expectedRevenue}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedRevenue: Number(e.target.value) || 0 })
                  }
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">End Date</label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Description</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs outline-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
