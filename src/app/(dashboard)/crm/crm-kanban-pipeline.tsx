"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Settings,
  Edit,
  Trash2,
  Star,
  Clock,
  Search,
  Building2,
  User,
  Phone,
  Mail,
  Loader2,
  X,
  AlertCircle,
  FileText,
  IndianRupee,
  LayoutGrid,
  List,
  Filter,
  MoreVertical,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import type { CrmLead, CrmStage } from "@/types/crm";
import type { CrmEmployee } from "@/lib/data/crm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  createCrmStage,
  renameCrmStage,
  deleteCrmStage,
  quickCreateLead,
  moveLeadStage,
  updateLeadPriority,
  updateLeadDetails,
  deleteCrmLead,
} from "@/actions/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface CrmKanbanPipelineProps {
  initialStages: CrmStage[];
  initialLeads: CrmLead[];
  initialEmployees?: CrmEmployee[];
}

interface FilterState {
  stageId: string;
  salesperson: string;
  priority: string;
  status: string;
  minRevenue: string;
  maxRevenue: string;
  createdFrom: string;
  createdTo: string;
  closingFrom: string;
  closingTo: string;
}

const initialFilters: FilterState = {
  stageId: "all",
  salesperson: "all",
  priority: "all",
  status: "all",
  minRevenue: "",
  maxRevenue: "",
  createdFrom: "",
  createdTo: "",
  closingFrom: "",
  closingTo: "",
};

export function parseLeadRevenue(val: unknown): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") {
    return isNaN(val) || !isFinite(val) ? 0 : Math.max(0, val);
  }
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]/g, "").trim();
    if (!cleaned) return 0;
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) || !isFinite(parsed) ? 0 : Math.max(0, parsed);
  }
  return 0;
}

export function formatINR(val?: unknown): string {
  const num = parseLeadRevenue(val);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(isoString?: string): string {
  if (!isoString) return "—";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStageAccentColor(stageName: string, customColor?: string): string {
  if (customColor) return customColor;
  const lower = stageName.toLowerCase().trim();
  if (lower.includes("new")) return "#3B82F6"; // blue
  if (lower.includes("qual")) return "#F59E0B"; // amber
  if (lower.includes("prop")) return "#8B5CF6"; // purple
  if (lower.includes("won")) return "#10B981"; // emerald
  return "#64748B"; // slate
}

type SortColumn =
  | "name"
  | "contact"
  | "stage"
  | "revenue"
  | "salesperson"
  | "closingDate"
  | "priority"
  | "createdAt";

export function CrmKanbanPipeline({
  initialStages,
  initialLeads,
  initialEmployees = [],
}: CrmKanbanPipelineProps) {
  const router = useRouter();
  const [stages, setStages] = React.useState<CrmStage[]>(initialStages);
  const [leads, setLeads] = React.useState<CrmLead[]>(initialLeads);
  const [employees] = React.useState<CrmEmployee[]>(initialEmployees);
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>("all");

  // View Mode: default is "kanban"
  const [viewMode, setViewMode] = React.useState<"kanban" | "table">("kanban");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filters, setFilters] = React.useState<FilterState>(initialFilters);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = React.useState(false);

  // Table sorting & pagination state
  const [sortColumn, setSortColumn] = React.useState<SortColumn>("createdAt");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Drag and drop state (Kanban)
  const [draggedLeadId, setDraggedLeadId] = React.useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = React.useState<string | null>(null);

  // Quick Lead Modal state
  const [quickLeadOpen, setQuickLeadOpen] = React.useState(false);
  const [quickLeadStage, setQuickLeadStage] = React.useState<{ id: string; name: string } | null>(null);
  const [quickLeadForm, setQuickLeadForm] = React.useState({
    name: "",
    contactName: "",
    company: "",
    expectedRevenue: "",
    phone: "",
    email: "",
    priority: 0,
    notes: "",
  });
  const [isSubmittingLead, setIsSubmittingLead] = React.useState(false);

  // Rename Stage Modal state
  const [editStageModal, setEditStageModal] = React.useState<{
    open: boolean;
    stage: CrmStage | null;
    name: string;
  }>({ open: false, stage: null, name: "" });
  const [isRenamingStage, setIsRenamingStage] = React.useState(false);

  // Delete Stage Modal state
  const [deleteStageModal, setDeleteStageModal] = React.useState<{
    open: boolean;
    stage: CrmStage | null;
    leadCount: number;
  }>({ open: false, stage: null, leadCount: 0 });
  const [isDeletingStage, setIsDeletingStage] = React.useState(false);

  // Delete Single Lead state (Three-Dot Menu)
  const [leadToDelete, setLeadToDelete] = React.useState<CrmLead | null>(null);
  const [isDeletingLead, setIsDeletingLead] = React.useState(false);

  // Add Stage state
  const [isAddingStage, setIsAddingStage] = React.useState(false);
  const [newStageName, setNewStageName] = React.useState("");
  const [isSubmittingStage, setIsSubmittingStage] = React.useState(false);

  // Active filter count calculation
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.stageId !== "all") count++;
    if (filters.salesperson !== "all") count++;
    if (filters.priority !== "all") count++;
    if (filters.status !== "all") count++;
    if (filters.minRevenue || filters.maxRevenue) count++;
    if (filters.createdFrom || filters.createdTo) count++;
    if (filters.closingFrom || filters.closingTo) count++;
    return count;
  }, [filters]);

  // Distinct salesperson list
  const salespersons = React.useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.assignedToName) set.add(l.assignedToName);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Selected employee object from Settings-created employees
  const selectedEmployeeObj = React.useMemo(() => {
    if (selectedEmployee === "all") return null;
    return employees.find((e) => e.uid === selectedEmployee) || null;
  }, [employees, selectedEmployee]);

  // Visible display name for the Employee Filter button - NEVER displays UID or email
  const selectedEmployeeLabel = React.useMemo(() => {
    if (selectedEmployee === "all") return "All Employees";
    if (selectedEmployeeObj) {
      return selectedEmployeeObj.name?.trim() || "Name unavailable";
    }
    return "Name unavailable";
  }, [selectedEmployee, selectedEmployeeObj]);

  // Filtered leads applying search + filters
  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      // 0. Employee Filter: Creator-wise (lead.createdBy === selectedEmployee UID)
      if (selectedEmployee !== "all") {
        if (lead.createdBy !== selectedEmployee) {
          return false;
        }
      }

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          lead.name?.toLowerCase().includes(q) ||
          lead.company?.toLowerCase().includes(q) ||
          lead.contactName?.toLowerCase().includes(q) ||
          lead.email?.toLowerCase().includes(q) ||
          lead.phone?.includes(q);
        if (!match) return false;
      }

      // 2. Stage Filter
      if (filters.stageId !== "all") {
        if (lead.stageId !== filters.stageId) return false;
      }

      // 3. Salesperson Filter
      if (filters.salesperson !== "all") {
        if ((lead.assignedToName || "Admin") !== filters.salesperson) return false;
      }

      // 4. Priority Filter
      if (filters.priority !== "all") {
        const minPri = parseInt(filters.priority, 10);
        if ((lead.priority || 0) < minPri) return false;
      }

      // 5. Status Filter
      if (filters.status === "active") {
        if (
          lead.isLost ||
          lead.leadStatus === "unqualified" ||
          lead.stageName?.toLowerCase() === "won" ||
          lead.leadStatus === "converted"
        ) {
          return false;
        }
      } else if (filters.status === "won") {
        if (
          lead.stageName?.toLowerCase() !== "won" &&
          lead.leadStatus !== "converted"
        ) {
          return false;
        }
      } else if (filters.status === "lost") {
        if (!lead.isLost && lead.leadStatus !== "unqualified") {
          return false;
        }
      }

      // 6. Expected Revenue Range
      if (filters.minRevenue) {
        const min = parseFloat(filters.minRevenue);
        const rev = parseLeadRevenue(lead.expectedRevenue);
        if (!isNaN(min) && rev < min) return false;
      }
      if (filters.maxRevenue) {
        const max = parseFloat(filters.maxRevenue);
        const rev = parseLeadRevenue(lead.expectedRevenue);
        if (!isNaN(max) && rev > max) return false;
      }

      // 7. Created Date Range
      if (filters.createdFrom) {
        if (lead.createdAt < filters.createdFrom) return false;
      }
      if (filters.createdTo) {
        const nextDay = new Date(filters.createdTo);
        nextDay.setDate(nextDay.getDate() + 1);
        if (lead.createdAt >= nextDay.toISOString()) return false;
      }

      // 8. Expected Closing Date Range
      if (filters.closingFrom) {
        if (!lead.expectedClosing || lead.expectedClosing < filters.closingFrom) return false;
      }
      if (filters.closingTo) {
        if (!lead.expectedClosing || lead.expectedClosing > filters.closingTo) return false;
      }

      return true;
    });
  }, [leads, searchQuery, filters, selectedEmployee]);

  // Overall pipeline revenue for filtered leads (sum of valid lead amounts across all stages)
  const totalPipelineRevenue = React.useMemo(() => {
    return filteredLeads.reduce(
      (sum, l) => sum + parseLeadRevenue(l.expectedRevenue),
      0
    );
  }, [filteredLeads]);

  // Won Revenue for filtered leads (Won leads only: won stage or converted status, not lost)
  const wonRevenue = React.useMemo(() => {
    return filteredLeads
      .filter((l) => {
        const stage = (l.stageName || "").toLowerCase().trim();
        const isWon = stage === "won" || l.leadStatus === "converted";
        return isWon && !l.isLost && l.leadStatus !== "unqualified";
      })
      .reduce((sum, l) => sum + parseLeadRevenue(l.expectedRevenue), 0);
  }, [filteredLeads]);

  // Sorted and Paginated leads for Table View
  const sortedLeads = React.useMemo(() => {
    const list = [...filteredLeads];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "");
          break;
        case "contact":
          cmp = (a.contactName || a.company || "").localeCompare(b.contactName || b.company || "");
          break;
        case "stage":
          cmp = (a.stageName || "").localeCompare(b.stageName || "");
          break;
        case "revenue":
          cmp = parseLeadRevenue(a.expectedRevenue) - parseLeadRevenue(b.expectedRevenue);
          break;
        case "salesperson":
          cmp = (a.assignedToName || "").localeCompare(b.assignedToName || "");
          break;
        case "closingDate":
          cmp = (a.expectedClosing || "").localeCompare(b.expectedClosing || "");
          break;
        case "priority":
          cmp = (a.priority || 0) - (b.priority || 0);
          break;
        case "createdAt":
        default:
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filteredLeads, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedLeads = sortedLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Sorting header click handler
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  // Card click: navigate to detail page
  const handleCardClick = (lead: CrmLead) => {
    router.push(`/crm/leads/${lead.id}`);
  };

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedLeadId(leadId);
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  // Handle Drag Leave
  const handleDragLeave = (e: React.DragEvent, stageId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  };

  // Handle Drop
  const handleDrop = async (e: React.DragEvent, targetStage: CrmStage) => {
    e.preventDefault();
    setDragOverStageId(null);
    const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId;
    setDraggedLeadId(null);

    if (!leadId) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stageId === targetStage.id) return;

    const prevLeads = [...leads];

    // Optimistic Update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stageId: targetStage.id,
              stageName: targetStage.name,
              leadStatus: targetStage.name.toLowerCase() === "won" ? "converted" : l.leadStatus,
            }
          : l
      )
    );

    try {
      const res = await moveLeadStage(leadId, targetStage.id, targetStage.name);
      if (!res.ok) {
        setLeads(prevLeads);
        toast.error(res.error || "Failed to move lead");
      } else {
        toast.success(`Moved to ${targetStage.name}`);
      }
    } catch {
      setLeads(prevLeads);
      toast.error("An error occurred while moving the lead");
    }
  };

  // Priority Click Handler
  const handleTogglePriority = async (e: React.MouseEvent, lead: CrmLead, starIndex: number) => {
    e.stopPropagation();
    const currentPriority = lead.priority || 0;
    const newPriority = currentPriority === starIndex ? 0 : starIndex;

    const prevLeads = [...leads];
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, priority: newPriority } : l))
    );

    try {
      const res = await updateLeadPriority(lead.id, newPriority);
      if (!res.ok) {
        setLeads(prevLeads);
        toast.error("Failed to update priority");
      }
    } catch {
      setLeads(prevLeads);
      toast.error("Failed to update priority");
    }
  };

  // Confirm Single Lead Delete
  const handleConfirmDeleteLead = async () => {
    if (!leadToDelete) return;

    setIsDeletingLead(true);
    try {
      const res = await deleteCrmLead(leadToDelete.id);
      if (!res.ok) {
        toast.error(res.error || "Failed to delete lead");
      } else {
        setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
        setLeadToDelete(null);
        toast.success("Lead deleted successfully");
      }
    } catch {
      toast.error("Failed to delete lead");
    } finally {
      setIsDeletingLead(false);
    }
  };

  // Open Quick Create Lead Modal
  const openQuickLeadModal = (stage?: CrmStage) => {
    const targetStage = stage || stages[0];
    if (!targetStage) {
      toast.error("Please create a stage first");
      return;
    }
    setQuickLeadStage({ id: targetStage.id, name: targetStage.name });
    setQuickLeadForm({
      name: "",
      contactName: "",
      company: "",
      expectedRevenue: "",
      phone: "",
      email: "",
      priority: 0,
      notes: "",
    });
    setQuickLeadOpen(true);
  };

  // Submit Quick Create Lead
  const handleQuickLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLeadStage) return;
    if (!quickLeadForm.name.trim()) {
      toast.error("Opportunity name is required");
      return;
    }

    setIsSubmittingLead(true);
    try {
      const revNum = parseLeadRevenue(quickLeadForm.expectedRevenue);
      const res = await quickCreateLead({
        name: quickLeadForm.name.trim(),
        stageId: quickLeadStage.id,
        stageName: quickLeadStage.name,
        contactName: quickLeadForm.contactName.trim() || quickLeadForm.name.trim(),
        company: quickLeadForm.company.trim(),
        expectedRevenue: revNum,
        phone: quickLeadForm.phone.trim(),
        email: quickLeadForm.email.trim(),
        priority: quickLeadForm.priority,
        notes: quickLeadForm.notes.trim(),
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to create lead");
      } else {
        setLeads((prev) => [res.lead, ...prev]);
        setQuickLeadOpen(false);
        toast.success("Lead created successfully");
      }
    } catch {
      toast.error("An error occurred creating lead");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Rename Stage
  const handleOpenEditStage = (stage: CrmStage) => {
    setEditStageModal({
      open: true,
      stage,
      name: stage.name,
    });
  };

  const handleRenameStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStageModal.stage) return;
    const trimmed = editStageModal.name.trim();
    if (!trimmed) {
      toast.error("Stage name cannot be empty");
      return;
    }

    setIsRenamingStage(true);
    try {
      const res = await renameCrmStage(editStageModal.stage.id, trimmed);
      if (!res.ok) {
        toast.error(res.error || "Failed to rename stage");
      } else {
        setStages((prev) =>
          prev.map((s) => (s.id === editStageModal.stage?.id ? { ...s, name: trimmed } : s))
        );
        setLeads((prev) =>
          prev.map((l) => (l.stageId === editStageModal.stage?.id ? { ...l, stageName: trimmed } : l))
        );
        setEditStageModal({ open: false, stage: null, name: "" });
        toast.success("Stage renamed successfully");
      }
    } catch {
      toast.error("An error occurred renaming stage");
    } finally {
      setIsRenamingStage(false);
    }
  };

  // Delete Stage
  const handleOpenDeleteStage = (stage: CrmStage) => {
    const leadCount = leads.filter((l) => l.stageId === stage.id).length;
    setDeleteStageModal({
      open: true,
      stage,
      leadCount,
    });
  };

  const handleDeleteStageSubmit = async () => {
    if (!deleteStageModal.stage) return;
    if (deleteStageModal.leadCount > 0) {
      toast.error("Cannot delete stage containing leads");
      return;
    }

    setIsDeletingStage(true);
    try {
      const res = await deleteCrmStage(deleteStageModal.stage.id);
      if (!res.ok) {
        toast.error(res.error || "Failed to delete stage");
      } else {
        setStages((prev) => prev.filter((s) => s.id !== deleteStageModal.stage?.id));
        setDeleteStageModal({ open: false, stage: null, leadCount: 0 });
        toast.success("Stage deleted successfully");
      }
    } catch {
      toast.error("An error occurred deleting stage");
    } finally {
      setIsDeletingStage(false);
    }
  };

  // Add Stage
  const handleAddStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStageName.trim();
    if (!trimmed) {
      toast.error("Stage name is required");
      return;
    }

    setIsSubmittingStage(true);
    try {
      const res = await createCrmStage(trimmed);
      if (!res.ok) {
        toast.error(res.error || "Failed to create stage");
      } else {
        setStages((prev) => [...prev, res.stage]);
        setNewStageName("");
        setIsAddingStage(false);
        toast.success(`Stage "${trimmed}" created`);
      }
    } catch {
      toast.error("An error occurred creating stage");
    } finally {
      setIsSubmittingStage(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full overflow-hidden select-none">
      {/* TOP HEADER / CONTROL BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-3 shrink-0 border-b border-border/40">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Pipeline
          </h1>

          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border/50">
            {filteredLeads.length} {filteredLeads.length === 1 ? "Lead" : "Leads"}
          </span>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
            Total {formatINR(totalPipelineRevenue)}
          </span>

          {/* View Switcher: Kanban vs Table */}
          <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              title="Kanban View"
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                viewMode === "kanban"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px]">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table / List View"
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px]">Table</span>
            </button>
          </div>

          {/* Filter Toggle Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={cn(
              "h-8 gap-1.5 text-xs font-medium border-border/60",
              (activeFilterCount > 0 || isFilterPanelOpen) &&
                "border-primary text-primary bg-primary/5 font-semibold"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search leads, contacts, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs bg-muted/40 border-border/60 focus:bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Employee Filter Dropdown */}
          <div className="w-40 sm:w-48">
            <Select
              value={selectedEmployee}
              onValueChange={(val: string | null) => setSelectedEmployee(val || "all")}
            >
              <SelectTrigger className="h-8 text-xs bg-muted/40 border-border/60 focus:bg-background">
                <div className="flex items-center gap-1.5 truncate">
                  <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{selectedEmployeeLabel}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
                      All
                    </div>
                    <span>All Employees</span>
                  </div>
                </SelectItem>
                {employees.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No employees available
                  </div>
                ) : (
                  employees.map((emp) => {
                    const displayName = emp.name?.trim() || "Name unavailable";
                    const initials = displayName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "EM";
                    return (
                      <SelectItem key={emp.uid} value={emp.uid} className="text-xs">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 text-[10px]">
                            {emp.photoURL && (
                              <AvatarImage src={emp.photoURL} alt={displayName} />
                            )}
                            <AvatarFallback className="text-[9px] bg-muted font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{displayName}</span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Clear Button next to Employee Filter */}
          {selectedEmployee !== "all" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedEmployee("all")}
              className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground border-border/60 gap-1 shrink-0"
              title="Clear Employee Filter"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </Button>
          )}

          {/* Quick Add Button */}
          <Button
            size="sm"
            onClick={() => openQuickLeadModal()}
            className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        </div>
      </div>

      {/* EXPANDABLE FILTER PANEL */}
      {isFilterPanelOpen && (
        <div className="p-3 bg-muted/30 border-b border-border/60 space-y-3 animate-in fade-in-50 duration-150 shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground/90">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Filter Opportunities</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                ({filteredLeads.length} matching {filteredLeads.length === 1 ? "lead" : "leads"})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilters(initialFilters)}
                  className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Clear All Filters
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsFilterPanelOpen(false)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
            {/* 1. Stage */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Stage</Label>
              <select
                value={filters.stageId}
                onChange={(e) => setFilters({ ...filters, stageId: e.target.value })}
                className="h-7 w-full rounded border border-border/70 bg-background px-2 text-xs"
              >
                <option value="all">All Stages</option>
                {stages.map((stg) => (
                  <option key={stg.id} value={stg.id}>
                    {stg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Salesperson */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Salesperson</Label>
              <select
                value={filters.salesperson}
                onChange={(e) => setFilters({ ...filters, salesperson: e.target.value })}
                className="h-7 w-full rounded border border-border/70 bg-background px-2 text-xs"
              >
                <option value="all">All Salespersons</option>
                {salespersons.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Priority */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Priority</Label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="h-7 w-full rounded border border-border/70 bg-background px-2 text-xs"
              >
                <option value="all">All Priorities</option>
                <option value="3">★★★ (3 Stars)</option>
                <option value="2">★★☆ (2+ Stars)</option>
                <option value="1">★☆☆ (1+ Star)</option>
              </select>
            </div>

            {/* 4. Status */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Status</Label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="h-7 w-full rounded border border-border/70 bg-background px-2 text-xs"
              >
                <option value="all">All Status</option>
                <option value="active">Active Pipeline</option>
                <option value="won">Won Only</option>
                <option value="lost">Lost Only</option>
              </select>
            </div>

            {/* 5. Revenue Min */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Min Revenue</Label>
              <Input
                type="number"
                min="0"
                placeholder="₹ Min"
                value={filters.minRevenue}
                onChange={(e) => setFilters({ ...filters, minRevenue: e.target.value })}
                className="h-7 text-xs bg-background"
              />
            </div>

            {/* 6. Revenue Max */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Max Revenue</Label>
              <Input
                type="number"
                min="0"
                placeholder="₹ Max"
                value={filters.maxRevenue}
                onChange={(e) => setFilters({ ...filters, maxRevenue: e.target.value })}
                className="h-7 text-xs bg-background"
              />
            </div>

            {/* 7. Closing Date From */}
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground font-medium">Closing Date</Label>
              <Input
                type="date"
                value={filters.closingFrom}
                onChange={(e) => setFilters({ ...filters, closingFrom: e.target.value })}
                className="h-7 text-xs bg-background"
              />
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === "kanban" && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pt-4 pb-2">
          <div className="flex gap-4 items-start h-full min-w-max pb-2 px-1">
            {stages.map((stage) => {
              const stageLeads = filteredLeads.filter(
                (l) => l.stageId === stage.id || (!l.stageId && stage.sequence === 1)
              );
              const stageTotalRevenue = stageLeads.reduce(
                (acc, l) => acc + parseLeadRevenue(l.expectedRevenue),
                0
              );
              const isTargetDrop = dragOverStageId === stage.id;
              const accentColor = getStageAccentColor(stage.name, stage.color);

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={(e) => handleDragLeave(e, stage.id)}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={cn(
                    "w-[310px] shrink-0 flex flex-col max-h-full rounded-xl transition-all duration-150",
                    "bg-muted/40 dark:bg-card/40 border border-border/80 shadow-xs",
                    isTargetDrop && "ring-2 ring-primary/80 border-primary bg-primary/5 dark:bg-primary/10"
                  )}
                >
                  {/* Stage Header */}
                  <div className="p-3 pb-2.5 shrink-0 border-b border-border/60">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span className="font-semibold text-sm text-foreground truncate capitalize">
                        {stage.name}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openQuickLeadModal(stage)}
                          title={`Quick add lead to ${stage.name}`}
                          className="h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Stage settings"
                          >
                            <Settings className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleOpenEditStage(stage)}>
                              <Edit className="h-3.5 w-3.5 mr-2" />
                              <span>Edit Stage</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleOpenDeleteStage(stage)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              <span>Delete Stage</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatINR(stageTotalRevenue)}
                      </span>
                      <span className="text-[11px] font-medium bg-background text-muted-foreground px-2 py-0.5 rounded-full border border-border/70 shadow-2xs">
                        {stageLeads.length} {stageLeads.length === 1 ? "lead" : "leads"}
                      </span>
                    </div>

                    <div className="mt-2.5 h-1 w-full bg-muted dark:bg-muted/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: accentColor,
                          width: stageLeads.length > 0 ? "100%" : "0%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[140px]">
                    {stageLeads.length === 0 ? (
                      <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-border/80 bg-background/50 rounded-lg text-muted-foreground">
                        <p className="text-xs">No leads here</p>
                        <button
                          type="button"
                          onClick={() => openQuickLeadModal(stage)}
                          className="mt-1 text-[11px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
                        >
                          <Plus className="h-3 w-3" /> Add Lead
                        </button>
                      </div>
                    ) : (
                      stageLeads.map((lead) => {
                        const priority = lead.priority || 0;
                        const initials = (lead.assignedToName || "Admin")
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();

                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            onClick={() => handleCardClick(lead)}
                            className={cn(
                              "group/card relative rounded-xl p-3 cursor-grab active:cursor-grabbing select-none transition-all duration-150",
                              "bg-card text-card-foreground border border-border/80 hover:border-primary/50 shadow-xs hover:shadow-md",
                              draggedLeadId === lead.id && "opacity-40 scale-95"
                            )}
                          >
                            {/* Card Header: Opportunity Title & Three-Dot Menu (Edit & Delete) */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-semibold text-xs leading-snug text-foreground group-hover/card:text-primary transition-colors line-clamp-2 flex-1">
                                {lead.name}
                              </div>

                              {/* Three-Dot Menu (Edit & Delete) */}
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-6 w-6 rounded-md border border-border/80 hover:border-primary/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 transition-colors"
                                  aria-label="Lead actions"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-28">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/crm/leads/${lead.id}`);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-2" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLeadToDelete(lead);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Contact & Company Subtitle */}
                            {(lead.contactName || lead.company) && (
                              <div className="text-[11px] text-muted-foreground mt-1 truncate flex items-center gap-1.5 font-medium">
                                {lead.contactName && (
                                  <span className="h-4 w-4 rounded bg-primary/15 text-primary font-bold text-[9px] flex items-center justify-center shrink-0">
                                    {lead.contactName[0]?.toUpperCase()}
                                  </span>
                                )}
                                <span className="truncate">
                                  {lead.contactName || lead.company}
                                </span>
                              </div>
                            )}

                            {/* Expected Revenue */}
                            <div
                              className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-full"
                              title={formatINR(lead.expectedRevenue)}
                            >
                              {formatINR(lead.expectedRevenue)}
                            </div>

                            {/* Footer row: Priority Stars, Activity Clock, Salesperson Avatar */}
                            <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                              {/* 3 Clickable Priority Stars */}
                              <div
                                className="flex items-center gap-0.5"
                                title={`Priority: ${priority} / 3`}
                              >
                                {[1, 2, 3].map((starIdx) => {
                                  const isFilled = priority >= starIdx;
                                  return (
                                    <button
                                      key={starIdx}
                                      type="button"
                                      onClick={(e) => handleTogglePriority(e, lead, starIdx)}
                                      className="p-0.5 text-muted-foreground/30 hover:text-amber-500 transition-colors"
                                    >
                                      <Star
                                        className={cn(
                                          "h-3.5 w-3.5 transition-colors",
                                          isFilled
                                            ? "text-amber-500 fill-amber-500"
                                            : "hover:text-amber-400"
                                        )}
                                      />
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Activity Indicator Clock & Salesperson Avatar */}
                              <div className="flex items-center gap-2">
                                <div
                                  title={
                                    lead.activityStatus === "overdue"
                                      ? "Activity overdue"
                                      : lead.activityStatus === "today"
                                      ? "Activity due today"
                                      : lead.activityStatus === "planned"
                                      ? "Activity planned"
                                      : "No scheduled activity"
                                  }
                                  className="flex items-center"
                                >
                                  <Clock
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      lead.activityStatus === "overdue" && "text-rose-500",
                                      lead.activityStatus === "today" && "text-amber-500",
                                      lead.activityStatus === "planned" && "text-emerald-500",
                                      (!lead.activityStatus || lead.activityStatus === "none") &&
                                        "text-muted-foreground/40"
                                    )}
                                  />
                                </div>

                                <div
                                  title={`Assigned: ${lead.assignedToName || "Admin"}`}
                                  className="h-5 w-5 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center text-[9px] font-bold shrink-0"
                                >
                                  {initials}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Stage Column / Control */}
            <div className="w-[280px] shrink-0">
              {isAddingStage ? (
                <form
                  onSubmit={handleAddStageSubmit}
                  className="bg-card border border-border/80 rounded-xl p-3.5 space-y-3 shadow-xs"
                >
                  <div className="text-xs font-semibold text-foreground">New Stage</div>
                  <Input
                    autoFocus
                    type="text"
                    placeholder="e.g. Negotiation"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    className="h-8 text-xs bg-background border-border"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmittingStage || !newStageName.trim()}
                      className="h-7 text-xs font-medium"
                    >
                      {isSubmittingStage ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        "Add Stage"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsAddingStage(false);
                        setNewStageName("");
                      }}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingStage(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-border/80 bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground text-xs font-medium transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Stage</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === "table" && (
        <div className="flex-1 flex flex-col overflow-y-auto pt-3 pb-2 space-y-2.5">
          <div className="overflow-x-auto max-h-[calc(100vh-14rem)] border border-border/60 rounded-xl bg-card shadow-xs">
            <table className="w-full text-xs border-collapse min-w-[1080px] table-fixed">
              <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-border/60 backdrop-blur-sm">
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className="w-[17%] px-3.5 py-2.5 cursor-pointer hover:text-foreground transition-colors font-semibold text-left"
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span className="truncate">Opportunity Name</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("contact")}
                    className="w-[14%] px-3.5 py-2.5 cursor-pointer hover:text-foreground transition-colors font-semibold text-left"
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span className="truncate">Customer / Contact</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />
                    </div>
                  </th>
                  <th className="w-[11%] px-3.5 py-2.5 font-semibold text-left">Phone</th>
                  <th className="w-[14%] px-3.5 py-2.5 font-semibold text-left">Email</th>
                  <th
                    onClick={() => handleSort("stage")}
                    className="w-[8%] px-3.5 py-2.5 cursor-pointer hover:text-foreground transition-colors font-semibold text-center"
                  >
                    <div className="inline-flex items-center justify-center gap-1 w-full">
                      <span>Stage</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("revenue")}
                    className="w-[13%] px-3.5 py-2.5 cursor-pointer hover:text-foreground transition-colors font-semibold text-right"
                  >
                    <div className="inline-flex items-center justify-end gap-1 w-full">
                      <span>Expected Revenue</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("salesperson")}
                    className="w-[10%] px-3.5 py-2.5 cursor-pointer hover:text-foreground transition-colors font-semibold text-left"
                  >
                    <div className="flex items-center gap-1 truncate">
                      <span className="truncate">Salesperson</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("closingDate")}
                    className="w-[9%] px-3.5 py-2.5 cursor-pointer hover:text-foreground transition-colors font-semibold text-center"
                  >
                    <div className="inline-flex items-center justify-center gap-1 w-full">
                      <span>Expected Closing</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("priority")}
                    className="w-[7%] px-3.5 py-2.5 cursor-pointer hover:text-foreground transition-colors font-semibold text-center"
                  >
                    <div className="inline-flex items-center justify-center gap-1 w-full">
                      <span>Priority</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="w-[8%] px-3.5 py-2.5 cursor-pointer hover:text-foreground transition-colors font-semibold text-center"
                  >
                    <div className="inline-flex items-center justify-center gap-1 w-full">
                      <span>Created</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60 shrink-0" />
                    </div>
                  </th>
                  <th className="w-[5%] px-3.5 py-2.5 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-muted-foreground text-xs">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileText className="h-8 w-8 text-muted-foreground/40" />
                        <p className="font-medium text-foreground">No leads found</p>
                        <p className="text-[11px] text-muted-foreground/70">
                          {searchQuery || activeFilterCount > 0
                            ? "Try adjusting your search or active filters."
                            : "Create your first opportunity using the + New button above."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => {
                    const accentColor = getStageAccentColor(lead.stageName || "New");
                    const priority = lead.priority || 0;
                    const initials = (lead.assignedToName || "Admin")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => handleCardClick(lead)}
                        className="hover:bg-muted/40 cursor-pointer transition-colors group h-12"
                      >
                        {/* 1. Name */}
                        <td className="px-3.5 py-2.5 font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {lead.name}
                        </td>

                        {/* 2. Customer / Company */}
                        <td className="px-3.5 py-2.5 text-muted-foreground truncate">
                          <div className="truncate">{lead.contactName || "—"}</div>
                          {lead.company && (
                            <div className="text-[10px] text-muted-foreground/70 truncate">{lead.company}</div>
                          )}
                        </td>

                        {/* 3. Phone */}
                        <td className="px-3.5 py-2.5 text-muted-foreground whitespace-nowrap">
                          {lead.phone || "—"}
                        </td>

                        {/* 4. Email */}
                        <td className="px-3.5 py-2.5 text-muted-foreground truncate" title={lead.email}>
                          {lead.email || "—"}
                        </td>

                        {/* 5. Stage */}
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            {lead.stageName || "New"}
                          </span>
                        </td>

                        {/* 6. Expected Revenue */}
                        <td className="px-3.5 py-2.5 text-right font-bold text-emerald-500 dark:text-emerald-400 whitespace-nowrap" title={formatINR(lead.expectedRevenue)}>
                          {formatINR(lead.expectedRevenue)}
                        </td>

                        {/* 7. Salesperson */}
                        <td className="px-3.5 py-2.5 text-left whitespace-nowrap">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-[9px] font-bold shrink-0">
                              {initials}
                            </span>
                            <span className="text-foreground truncate">{lead.assignedToName || "Admin"}</span>
                          </div>
                        </td>

                        {/* 8. Expected Closing Date */}
                        <td className="px-3.5 py-2.5 text-center text-muted-foreground whitespace-nowrap">
                          {formatDate(lead.expectedClosing)}
                        </td>

                        {/* 9. Priority Stars */}
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          <div
                            className="inline-flex items-center justify-center gap-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {[1, 2, 3].map((starIdx) => (
                              <button
                                key={starIdx}
                                type="button"
                                onClick={(e) => handleTogglePriority(e, lead, starIdx)}
                                className="p-0.5 text-muted-foreground/40 hover:text-amber-400"
                              >
                                <Star
                                  className={cn(
                                    "h-3 w-3",
                                    priority >= starIdx
                                      ? "text-amber-400 fill-amber-400"
                                      : "hover:text-amber-300"
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </td>

                        {/* 10. Created Date */}
                        <td className="px-3.5 py-2.5 text-center text-muted-foreground whitespace-nowrap text-[11px]">
                          {formatDate(lead.createdAt)}
                        </td>

                        {/* 11. Actions */}
                        <td
                          className="px-3.5 py-2.5 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="h-6 w-6 rounded-md hover:bg-muted inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
                              aria-label="Actions"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-28">
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setLeadToDelete(lead)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-muted/40 border-t border-border/80 font-semibold text-xs">
                <tr className="h-10">
                  <td colSpan={5} className="px-3.5 py-2 text-foreground font-semibold text-left">
                    Total ({filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"})
                  </td>
                  <td className="px-3.5 py-2 text-right text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                    {formatINR(totalPipelineRevenue)}
                  </td>
                  <td colSpan={5} className="px-3.5 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-7 rounded border border-border/70 bg-background px-2 text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>
                Showing {sortedLeads.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
                {Math.min(currentPage * pageSize, sortedLeads.length)} of {sortedLeads.length} leads
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 text-xs px-2"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <span className="px-2 font-medium text-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 text-xs px-2"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CREATE LEAD MODAL */}
      <Dialog open={quickLeadOpen} onOpenChange={setQuickLeadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Quick Create Lead
              {quickLeadStage && (
                <span className="text-xs font-normal text-muted-foreground">
                  (Stage: {quickLeadStage.name})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuickLeadSubmit} className="space-y-3.5 mt-1">
            <div className="space-y-1">
              <Label htmlFor="lead-name" className="text-xs font-medium">
                Opportunity / Lead Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead-name"
                required
                placeholder="e.g. Dubai Luxury Tour 15 Pax"
                value={quickLeadForm.name}
                onChange={(e) => setQuickLeadForm({ ...quickLeadForm, name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="contact-name" className="text-xs font-medium">
                  Contact Person
                </Label>
                <Input
                  id="contact-name"
                  placeholder="e.g. Rajesh Kumar"
                  value={quickLeadForm.contactName}
                  onChange={(e) =>
                    setQuickLeadForm({ ...quickLeadForm, contactName: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-company" className="text-xs font-medium">
                  Company / Organization
                </Label>
                <Input
                  id="lead-company"
                  placeholder="e.g. TechCorp Solutions"
                  value={quickLeadForm.company}
                  onChange={(e) =>
                    setQuickLeadForm({ ...quickLeadForm, company: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="lead-revenue" className="text-xs font-medium">
                  Expected Revenue (₹)
                </Label>
                <Input
                  id="lead-revenue"
                  type="number"
                  min="0"
                  placeholder="e.g. 50000"
                  value={quickLeadForm.expectedRevenue}
                  onChange={(e) =>
                    setQuickLeadForm({ ...quickLeadForm, expectedRevenue: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium block">Priority</Label>
                <div className="flex items-center gap-1 h-8">
                  {[1, 2, 3].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setQuickLeadForm({
                          ...quickLeadForm,
                          priority: quickLeadForm.priority === star ? 0 : star,
                        })
                      }
                      className="p-1 hover:text-amber-400"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          quickLeadForm.priority >= star
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/40"
                        )}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">
                    {quickLeadForm.priority > 0 ? `${quickLeadForm.priority} star` : "None"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="lead-phone" className="text-xs font-medium">
                  Phone Number
                </Label>
                <Input
                  id="lead-phone"
                  placeholder="+91 9876543210"
                  value={quickLeadForm.phone}
                  onChange={(e) =>
                    setQuickLeadForm({ ...quickLeadForm, phone: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="lead-email" className="text-xs font-medium">
                  Email
                </Label>
                <Input
                  id="lead-email"
                  type="email"
                  placeholder="contact@example.com"
                  value={quickLeadForm.email}
                  onChange={(e) =>
                    setQuickLeadForm({ ...quickLeadForm, email: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="lead-notes" className="text-xs font-medium">
                Notes / Details
              </Label>
              <Textarea
                id="lead-notes"
                rows={2}
                placeholder="Key requirements, customer preferences..."
                value={quickLeadForm.notes}
                onChange={(e) =>
                  setQuickLeadForm({ ...quickLeadForm, notes: e.target.value })
                }
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickLeadOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingLead}
                className="h-8 text-xs font-medium"
              >
                {isSubmittingLead ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  "Create Lead"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RENAME STAGE MODAL */}
      <Dialog
        open={editStageModal.open}
        onOpenChange={(open) =>
          !open && setEditStageModal({ open: false, stage: null, name: "" })
        }
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Rename Stage</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameStageSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="stage-rename-input" className="text-xs font-medium">
                Stage Name
              </Label>
              <Input
                id="stage-rename-input"
                required
                value={editStageModal.name}
                onChange={(e) =>
                  setEditStageModal({ ...editStageModal, name: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditStageModal({ open: false, stage: null, name: "" })}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isRenamingStage || !editStageModal.name.trim()}
                className="h-8 text-xs"
              >
                {isRenamingStage ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE STAGE MODAL */}
      <Dialog
        open={deleteStageModal.open}
        onOpenChange={(open) =>
          !open && setDeleteStageModal({ open: false, stage: null, leadCount: 0 })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Delete Stage &quot;{deleteStageModal.stage?.name}&quot;
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {deleteStageModal.leadCount > 0 ? (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed space-y-1">
                <div className="font-semibold text-rose-200">Cannot delete this stage</div>
                <p>
                  This stage currently contains{" "}
                  <strong>
                    {deleteStageModal.leadCount}{" "}
                    {deleteStageModal.leadCount === 1 ? "lead" : "leads"}
                  </strong>
                  .
                </p>
                <p className="text-muted-foreground pt-1">
                  Please move or drag all leads to another stage before deleting this stage.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to delete stage &quot;{deleteStageModal.stage?.name}&quot;?
                This action cannot be undone.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setDeleteStageModal({ open: false, stage: null, leadCount: 0 })
              }
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteStageModal.leadCount > 0 || isDeletingStage}
              onClick={handleDeleteStageSubmit}
              className="h-8 text-xs"
            >
              {isDeletingStage ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                "Delete Stage"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE SINGLE LEAD CONFIRMATION MODAL (Three-Dot Menu) */}
      <Dialog
        open={!!leadToDelete}
        onOpenChange={(open) => !open && setLeadToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Delete Lead
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete lead{" "}
            <strong className="text-foreground font-semibold">
              &quot;{leadToDelete?.name}&quot;
            </strong>
            ? This action will remove the lead from your CRM pipeline.
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLeadToDelete(null)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeletingLead}
              onClick={handleConfirmDeleteLead}
              className="h-8 text-xs font-medium"
            >
              {isDeletingLead ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
