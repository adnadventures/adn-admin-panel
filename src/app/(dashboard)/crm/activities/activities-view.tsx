"use client";

import { useState } from "react";
import {
  CalendarCheck,
  Phone,
  Video,
  ListTodo,
  Clock,
  Plus,
  CheckCircle2,
  Trash2,
  AlertCircle,
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
  CRM_ACTIVITY_TYPES,
  CRM_ACTIVITY_PRIORITIES,
  CRM_ACTIVITY_STATUSES,
  type ActivityInput,
} from "@/lib/validators/crm";
import {
  createCrmActivity,
  completeCrmActivity,
  deleteCrmActivity,
} from "@/actions/crm";
import type { CrmActivity } from "@/types/crm";

export function ActivitiesView({ initialActivities }: { initialActivities: CrmActivity[] }) {
  const [activities, setActivities] = useState<CrmActivity[]>(initialActivities);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ActivityInput>({
    type: "call",
    subject: "",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: "10:00",
    status: "planned",
    priority: "medium",
    relatedToType: "lead",
    relatedToId: "generic",
    relatedToName: "Prospective Client",
    assignedTo: "",
    assignedToName: "Admin",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filtered = activities.filter((a) => {
    if (filterType !== "all" && a.type !== filterType) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  });

  const handleOpenCreate = () => {
    setFormData({
      type: "call",
      subject: "",
      dueDate: new Date().toISOString().split("T")[0],
      dueTime: "10:00",
      status: "planned",
      priority: "medium",
      relatedToType: "lead",
      relatedToId: "generic",
      relatedToName: "Prospective Client",
      assignedTo: "",
      assignedToName: "Admin",
      notes: "",
    });
    setErrorMsg("");
    setIsDialogOpen(true);
  };

  const handleComplete = async (id: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "completed" } : a))
    );
    await completeCrmActivity(id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await deleteCrmActivity(id);
    if (res.ok) {
      setActivities((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createCrmActivity(formData);
      if (!res.ok) {
        setErrorMsg(res.error);
      } else {
        const newDoc: CrmActivity = {
          id: res.id || Date.now().toString(),
          ...formData,
          assignedTo: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "user",
          updatedBy: "user",
          isDeleted: false,
        };
        setActivities((prev) => [newDoc, ...prev]);
        setIsDialogOpen(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs capitalize text-foreground"
          >
            <option value="all">All Types</option>
            {CRM_ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2.5 text-xs capitalize text-foreground"
          >
            <option value="all">All Statuses</option>
            {CRM_ACTIVITY_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          Schedule Activity
        </Button>
      </div>

      {/* Activities List */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Related To</th>
              <th className="px-4 py-3">Due Date & Time</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned Owner</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  No activities found.
                </td>
              </tr>
            ) : (
              filtered.map((act) => (
                <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 font-medium capitalize text-foreground">
                      {act.type === "call" ? (
                        <Phone className="size-3.5 text-blue-500" />
                      ) : act.type === "meeting" ? (
                        <Video className="size-3.5 text-purple-500" />
                      ) : (
                        <ListTodo className="size-3.5 text-amber-500" />
                      )}
                      <span>{act.type}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    <div>{act.subject}</div>
                    {act.notes && (
                      <div className="text-[11px] text-muted-foreground truncate max-w-xs">{act.notes}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="capitalize font-medium text-foreground">[{act.relatedToType}]</span> {act.relatedToName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">
                    {act.dueDate} {act.dueTime ? `@ ${act.dueTime}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        act.priority === "high"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : act.priority === "medium"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {act.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        act.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : act.status === "overdue"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {act.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{act.assignedToName || "Admin"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {act.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleComplete(act.id)}
                          className="h-7 px-2 text-emerald-600 hover:text-emerald-700 text-[11px] font-semibold"
                        >
                          <CheckCircle2 className="size-3.5 mr-1" />
                          Mark Done
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(act.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Activity</DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 capitalize"
                >
                  {CRM_ACTIVITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-medium text-foreground">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 capitalize"
                >
                  {CRM_ACTIVITY_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="font-medium text-foreground">Subject *</label>
                <Input
                  required
                  placeholder="e.g. Follow-up call on Kashmir tour package"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Due Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Due Time</label>
                <Input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div className="col-span-2">
                <label className="font-medium text-foreground">Related Prospect / Client Name</label>
                <Input
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.relatedToName}
                  onChange={(e) => setFormData({ ...formData, relatedToName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Agenda / Details</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs outline-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Save Activity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
