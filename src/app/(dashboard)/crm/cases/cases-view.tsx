"use client";

import { useState } from "react";
import {
  LifeBuoy,
  BookOpen,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
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
  CRM_CASE_PRIORITIES,
  CRM_CASE_STATUSES,
  CRM_CASE_TYPES,
  caseSchema,
  solutionSchema,
  type CaseInput,
  type SolutionInput,
} from "@/lib/validators/crm";
import { createCrmCase, createCrmSolution } from "@/actions/crm";
import type { CrmCase, CrmSolution } from "@/types/crm";

export function CasesView({
  initialCases,
  initialSolutions,
}: {
  initialCases: CrmCase[];
  initialSolutions: CrmSolution[];
}) {
  const [activeTab, setActiveTab] = useState<"cases" | "solutions">("cases");
  const [cases, setCases] = useState<CrmCase[]>(initialCases);
  const [solutions, setSolutions] = useState<CrmSolution[]>(initialSolutions);
  const [search, setSearch] = useState("");

  // Case Dialog
  const [isCaseOpen, setIsCaseOpen] = useState(false);
  const [caseForm, setCaseForm] = useState<CaseInput>({
    subject: "",
    contactName: "",
    type: "inquiry",
    status: "new",
    priority: "medium",
    origin: "phone",
    description: "",
    resolution: "",
    assignedTo: "",
    assignedToName: "Support Team",
  });

  // Solution Dialog
  const [isSolutionOpen, setIsSolutionOpen] = useState(false);
  const [solForm, setSolForm] = useState<SolutionInput>({
    title: "",
    category: "Booking & Cancellation",
    status: "published",
    question: "",
    solution: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredCases = cases.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.caseNumber?.toLowerCase().includes(s) ||
      c.subject?.toLowerCase().includes(s) ||
      c.contactName?.toLowerCase().includes(s)
    );
  });

  const filteredSolutions = solutions.filter((sol) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      sol.solutionNumber?.toLowerCase().includes(s) ||
      sol.title?.toLowerCase().includes(s) ||
      sol.category?.toLowerCase().includes(s)
    );
  });

  const handleSubmitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createCrmCase(caseForm);
      if (!res.ok) {
        setErrorMsg(res.error);
      } else {
        const newDoc: CrmCase = {
          id: res.id || Date.now().toString(),
          caseNumber: `CAS-${Date.now().toString().slice(-5)}`,
          ...caseForm,
          assignedTo: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "user",
          updatedBy: "user",
          isDeleted: false,
        };
        setCases((prev) => [newDoc, ...prev]);
        setIsCaseOpen(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create case");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createCrmSolution(solForm);
      if (!res.ok) {
        setErrorMsg(res.error);
      } else {
        const newDoc: CrmSolution = {
          id: res.id || Date.now().toString(),
          solutionNumber: `SOL-${Date.now().toString().slice(-4)}`,
          ...solForm,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "user",
          updatedBy: "user",
          isDeleted: false,
        };
        setSolutions((prev) => [newDoc, ...prev]);
        setIsSolutionOpen(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create solution");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("cases")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "cases"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LifeBuoy className="size-3.5" />
              Customer Cases ({cases.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("solutions")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "solutions"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="size-3.5" />
              Knowledge Base ({solutions.length})
            </button>
          </div>

          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        </div>

        <div>
          {activeTab === "cases" ? (
            <Button onClick={() => setIsCaseOpen(true)} size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Create Case
            </Button>
          ) : (
            <Button onClick={() => setIsSolutionOpen(true)} size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Add Solution
            </Button>
          )}
        </div>
      </div>

      {/* CASES VIEW */}
      {activeTab === "cases" ? (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Case #</th>
                <th className="px-4 py-3">Subject & Details</th>
                <th className="px-4 py-3">Customer Contact</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No support cases found.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-primary">{c.caseNumber}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div>{c.subject}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{c.description}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.contactName || "—"}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{c.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          c.priority === "high"
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : c.priority === "medium"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 capitalize">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.assignedToName || "Support"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* SOLUTIONS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSolutions.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
              No knowledge solutions published.
            </div>
          ) : (
            filteredSolutions.map((sol) => (
              <div
                key={sol.id}
                className="rounded-xl border border-border/60 bg-card p-4 shadow-sm hover:border-primary/50 transition-all space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-primary font-bold">
                    {sol.solutionNumber}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {sol.category}
                  </span>
                </div>
                <h4 className="font-bold text-foreground text-sm">{sol.title}</h4>
                <div className="rounded-md bg-muted/40 p-2 text-muted-foreground">
                  <span className="font-semibold text-foreground">Issue: </span>
                  {sol.question}
                </div>
                <div className="text-foreground">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Resolution: </span>
                  {sol.solution}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE CASE DIALOG */}
      <Dialog open={isCaseOpen} onOpenChange={setIsCaseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Support Case</DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmitCase} className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-foreground">Case Subject *</label>
              <Input
                required
                placeholder="e.g. Flight Rescheduling Request"
                value={caseForm.subject}
                onChange={(e) => setCaseForm({ ...caseForm, subject: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-medium text-foreground">Customer Contact</label>
                <Input
                  placeholder="Client Name"
                  value={caseForm.contactName}
                  onChange={(e) => setCaseForm({ ...caseForm, contactName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Priority</label>
                <select
                  value={caseForm.priority}
                  onChange={(e) => setCaseForm({ ...caseForm, priority: e.target.value as any })}
                  className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 capitalize"
                >
                  {CRM_CASE_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="font-medium text-foreground">Case Description *</label>
              <textarea
                required
                rows={3}
                placeholder="Customer requires date change on confirmed itinerary..."
                value={caseForm.description}
                onChange={(e) => setCaseForm({ ...caseForm, description: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs outline-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCaseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Save Case"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE SOLUTION DIALOG */}
      <Dialog open={isSolutionOpen} onOpenChange={setIsSolutionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Knowledge Solution</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitSolution} className="space-y-3 text-xs">
            <div>
              <label className="font-medium text-foreground">Title *</label>
              <Input
                required
                placeholder="How to process refund on seasonal tour cancel"
                value={solForm.title}
                onChange={(e) => setSolForm({ ...solForm, title: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-foreground">Category</label>
              <Input
                value={solForm.category}
                onChange={(e) => setSolForm({ ...solForm, category: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <label className="font-medium text-foreground">Question / Problem *</label>
              <textarea
                required
                rows={2}
                value={solForm.question}
                onChange={(e) => setSolForm({ ...solForm, question: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs outline-none"
              />
            </div>
            <div>
              <label className="font-medium text-foreground">Solution Details *</label>
              <textarea
                required
                rows={3}
                value={solForm.solution}
                onChange={(e) => setSolForm({ ...solForm, solution: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs outline-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSolutionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Publish Solution"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
