"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  Building,
  Star,
  Search,
  Users,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  Plus,
  ExternalLink,
  Sparkles,
  Tag,
  Check,
  CalendarDays,
  Plane,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";
import type {
  CrmLead,
  CrmStage,
  CrmChatterItem,
  CrmActivity,
} from "@/types/crm";
import {
  changeLeadStageFromDetail,
  markLeadWon,
  markLeadLost,
  sendLeadChatterMessage,
  scheduleLeadActivity,
  completeLeadActivity,
  updateLeadFullDetails,
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

interface LeadDetailViewProps {
  initialLead: CrmLead;
  stages: CrmStage[];
  initialChatter: CrmChatterItem[];
  initialActivities: CrmActivity[];
}

function formatINR(val?: unknown): string {
  if (val === undefined || val === null) return "₹ 0";
  let num = 0;
  if (typeof val === "number") {
    num = isNaN(val) || !isFinite(val) ? 0 : Math.max(0, Math.round(val));
  } else if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]/g, "").trim();
    num = cleaned ? Math.max(0, Math.round(parseFloat(cleaned) || 0)) : 0;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatChatterTimestamp(isoString: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatChatterDateGroup(isoString: string): string {
  if (!isoString) return "Recent";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "Recent";
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function LeadDetailView({
  initialLead,
  stages,
  initialChatter,
  initialActivities,
}: LeadDetailViewProps) {
  const router = useRouter();
  const [lead, setLead] = React.useState<CrmLead>(initialLead);
  const [chatter, setChatter] = React.useState<CrmChatterItem[]>(initialChatter);
  const [activities, setActivities] = React.useState<CrmActivity[]>(initialActivities);

  // Active Stage ID
  const activeStageId = lead.stageId || stages[0]?.id || "";

  // Tab State: "notes" | "extra" | "activities"
  const [activeTab, setActiveTab] = React.useState<"notes" | "extra" | "activities">("notes");

  // Form Edit State for Left Panel
  const [formData, setFormData] = React.useState({
    name: lead.name || "",
    contactName: lead.contactName || "",
    company: lead.company || "",
    email: lead.email || "",
    phone: lead.phone || "",
    expectedRevenue: lead.expectedRevenue || 0,
    probability: lead.probability !== undefined ? lead.probability : 50,
    expectedClosing: lead.expectedClosing || "",
    priority: lead.priority || 0,
    salesperson: lead.assignedToName || "Admin",
    tags: lead.tags || [],
    notes: lead.notes || "",
    description: lead.description || "",
    // Extra Info fields
    leadSource: lead.leadSource || "Website",
    salesTeam: lead.salesTeam || "Sales",
    travelDestination: lead.travelDestination || "",
    travelStartDate: lead.travelStartDate || "",
    travelEndDate: lead.travelEndDate || "",
    adultsCount: lead.adultsCount || 1,
    childrenCount: lead.childrenCount || 0,
    interestedPackageName: lead.interestedPackageName || "",
    expectedBudget: lead.expectedBudget || 0,
    specialRequirements: lead.specialRequirements || "",
  });

  const [isSavingDetails, setIsSavingDetails] = React.useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = React.useState(false);

  // Lost Modal State
  const [lostModalOpen, setLostModalOpen] = React.useState(false);
  const [lostReason, setLostReason] = React.useState("");
  const [isMarkingLost, setIsMarkingLost] = React.useState(false);

  // Chatter Composer State: "none" | "message" | "note"
  const [composerMode, setComposerMode] = React.useState<"none" | "message" | "note">("none");
  const [composerText, setComposerText] = React.useState("");
  const [isSubmittingChatter, setIsSubmittingChatter] = React.useState(false);

  // Schedule Activity Modal State
  const [activityModalOpen, setActivityModalOpen] = React.useState(false);
  const [activityForm, setActivityForm] = React.useState({
    type: "call" as "task" | "call" | "meeting" | "follow_up",
    subject: "",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: "10:00",
    notes: "",
  });
  const [isSchedulingActivity, setIsSchedulingActivity] = React.useState(false);

  // Chatter search filter
  const [chatterSearch, setChatterSearch] = React.useState("");
  const [showSearchInput, setShowSearchInput] = React.useState(false);

  // 1. Stage Click Handler
  const handleStageClick = async (targetStage: CrmStage) => {
    if (targetStage.id === activeStageId || isUpdatingStage) return;

    const oldStageName = lead.stageName || stages.find((s) => s.id === activeStageId)?.name || "New";
    const newStageName = targetStage.name;

    // Optimistic Stage update
    setIsUpdatingStage(true);
    setLead((prev) => ({
      ...prev,
      stageId: targetStage.id,
      stageName: newStageName,
      leadStatus: newStageName.toLowerCase() === "won" ? "converted" : prev.leadStatus,
      isLost: false,
    }));

    // Optimistic Chatter entry
    const optimisticChatter: CrmChatterItem = {
      id: "temp-" + Date.now(),
      leadId: lead.id,
      type: "stage_change",
      content: "Stage changed",
      oldStage: oldStageName,
      newStage: newStageName,
      senderId: "current",
      senderName: formData.salesperson || "Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current",
      updatedBy: "current",
      isDeleted: false,
    };
    setChatter((prev) => [...prev, optimisticChatter]);

    try {
      const res = await changeLeadStageFromDetail(lead.id, targetStage.id, newStageName);
      if (!res.ok) {
        toast.error(res.error || "Failed to update stage");
        // Revert
        setLead((prev) => ({ ...prev, stageId: activeStageId, stageName: oldStageName }));
      } else {
        toast.success(`Moved to ${newStageName}`);
      }
    } catch {
      toast.error("Failed to update stage");
      setLead((prev) => ({ ...prev, stageId: activeStageId, stageName: oldStageName }));
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // 2. Won Action
  const handleWonClick = async () => {
    const wonStage = stages.find((s) => s.name.toLowerCase().includes("won"));
    const targetStageId = wonStage?.id || stages[stages.length - 1]?.id || "";

    setLead((prev) => ({
      ...prev,
      stageId: targetStageId,
      stageName: "Won",
      leadStatus: "converted",
      isLost: false,
    }));

    const optimisticChatter: CrmChatterItem = {
      id: "temp-" + Date.now(),
      leadId: lead.id,
      type: "status_change",
      content: "Opportunity marked as Won",
      oldStage: lead.stageName,
      newStage: "Won",
      senderId: "current",
      senderName: formData.salesperson || "Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current",
      updatedBy: "current",
      isDeleted: false,
    };
    setChatter((prev) => [...prev, optimisticChatter]);

    try {
      const res = await markLeadWon(lead.id);
      if (!res.ok) {
        toast.error(res.error || "Failed to mark as Won");
      } else {
        toast.success("Opportunity marked as Won!");
      }
    } catch {
      toast.error("Failed to mark opportunity as Won");
    }
  };

  // 3. Lost Action
  const handleLostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMarkingLost(true);
    const reasonText = lostReason.trim() || "Lost to competitor";

    setLead((prev) => ({
      ...prev,
      leadStatus: "unqualified",
      isLost: true,
      lostReason: reasonText,
    }));

    const optimisticChatter: CrmChatterItem = {
      id: "temp-" + Date.now(),
      leadId: lead.id,
      type: "status_change",
      content: `Opportunity marked as Lost (${reasonText})`,
      oldStage: lead.stageName,
      newStage: "Lost",
      senderId: "current",
      senderName: formData.salesperson || "Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current",
      updatedBy: "current",
      isDeleted: false,
    };
    setChatter((prev) => [...prev, optimisticChatter]);

    try {
      const res = await markLeadLost(lead.id, reasonText);
      if (!res.ok) {
        toast.error(res.error || "Failed to mark as Lost");
      } else {
        setLostModalOpen(false);
        toast.success("Opportunity marked as Lost");
      }
    } catch {
      toast.error("Failed to mark as Lost");
    } finally {
      setIsMarkingLost(false);
    }
  };

  // 4. Save Left Panel Lead Details
  const handleSaveLeadDetails = async () => {
    setIsSavingDetails(true);
    try {
      const res = await updateLeadFullDetails(lead.id, {
        name: formData.name.trim(),
        contactName: formData.contactName.trim(),
        company: formData.company.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        expectedRevenue: Number(formData.expectedRevenue) || 0,
        probability: Number(formData.probability) || 0,
        expectedClosing: formData.expectedClosing,
        priority: formData.priority,
        tags: formData.tags,
        assignedToName: formData.salesperson,
        salesTeam: formData.salesTeam,
        leadSource: formData.leadSource,
        notes: formData.notes,
        description: formData.description,
        travelDestination: formData.travelDestination,
        travelStartDate: formData.travelStartDate,
        travelEndDate: formData.travelEndDate,
        adultsCount: Number(formData.adultsCount) || 1,
        childrenCount: Number(formData.childrenCount) || 0,
        interestedPackageName: formData.interestedPackageName,
        expectedBudget: Number(formData.expectedBudget) || 0,
        specialRequirements: formData.specialRequirements,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to save lead details");
      } else {
        setLead((prev) => ({
          ...prev,
          name: formData.name.trim(),
          contactName: formData.contactName.trim(),
          company: formData.company.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          expectedRevenue: Number(formData.expectedRevenue) || 0,
          probability: Number(formData.probability) || 0,
          expectedClosing: formData.expectedClosing,
          priority: formData.priority,
          tags: formData.tags,
          notes: formData.notes,
          description: formData.description,
          travelDestination: formData.travelDestination,
          travelStartDate: formData.travelStartDate,
          travelEndDate: formData.travelEndDate,
          adultsCount: Number(formData.adultsCount) || 1,
          childrenCount: Number(formData.childrenCount) || 0,
          interestedPackageName: formData.interestedPackageName,
          expectedBudget: Number(formData.expectedBudget) || 0,
          specialRequirements: formData.specialRequirements,
        }));
        toast.success("Lead details saved successfully");
      }
    } catch {
      toast.error("Failed to save lead details");
    } finally {
      setIsSavingDetails(false);
    }
  };

  // 5. Submit Chatter Message or Internal Note
  const handleSubmitChatter = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = composerText.trim();
    if (!text) return;

    setIsSubmittingChatter(true);
    const isNote = composerMode === "note";

    try {
      const res = await sendLeadChatterMessage({
        leadId: lead.id,
        type: isNote ? "note" : "message",
        content: text,
        isInternal: isNote,
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to post message");
      } else {
        setChatter((prev) => [...prev, res.item]);
        setComposerText("");
        setComposerMode("none");
        toast.success(isNote ? "Internal note logged" : "Message logged in conversation");
      }
    } catch {
      toast.error("Failed to post message");
    } finally {
      setIsSubmittingChatter(false);
    }
  };

  // 6. Schedule Activity Submit
  const handleScheduleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.subject.trim()) {
      toast.error("Activity summary is required");
      return;
    }

    setIsSchedulingActivity(true);
    try {
      const res = await scheduleLeadActivity({
        leadId: lead.id,
        type: activityForm.type,
        subject: activityForm.subject.trim(),
        dueDate: activityForm.dueDate,
        dueTime: activityForm.dueTime,
        assignedToName: formData.salesperson || "Admin",
        notes: activityForm.notes.trim(),
      });

      if (!res.ok) {
        toast.error(res.error || "Failed to schedule activity");
      } else {
        setActivities((prev) => [...prev, res.activity]);
        // Also add activity log to chatter
        const chatterEntry: CrmChatterItem = {
          id: "act-log-" + Date.now(),
          leadId: lead.id,
          activityId: res.activity.id,
          type: "activity_log",
          content: `Scheduled activity: ${activityForm.type.toUpperCase()} - "${activityForm.subject.trim()}" (Due: ${activityForm.dueDate})`,
          senderId: "current",
          senderName: formData.salesperson || "Admin",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "current",
          updatedBy: "current",
          isDeleted: false,
        };
        setChatter((prev) => [...prev, chatterEntry]);
        setActivityModalOpen(false);
        setActivityForm({
          type: "call",
          subject: "",
          dueDate: new Date().toISOString().split("T")[0],
          dueTime: "10:00",
          notes: "",
        });
        toast.success("Activity scheduled");
      }
    } catch {
      toast.error("Failed to schedule activity");
    } finally {
      setIsSchedulingActivity(false);
    }
  };

  // 7. Complete Activity
  const handleCompleteActivity = async (activityId: string) => {
    try {
      const res = await completeLeadActivity(activityId, lead.id, "Done");
      if (!res.ok) {
        toast.error(res.error || "Failed to complete activity");
      } else {
        setActivities((prev) =>
          prev.map((a) => (a.id === activityId ? { ...a, status: "completed" } : a))
        );
        toast.success("Activity marked as completed");
      }
    } catch {
      toast.error("Failed to complete activity");
    }
  };

  // Group Chatter items by Date
  const filteredChatter = React.useMemo(() => {
    if (!chatterSearch.trim()) return chatter;
    const q = chatterSearch.toLowerCase().trim();
    return chatter.filter(
      (c) =>
        c.content?.toLowerCase().includes(q) ||
        c.senderName?.toLowerCase().includes(q) ||
        c.oldStage?.toLowerCase().includes(q) ||
        c.newStage?.toLowerCase().includes(q)
    );
  }, [chatter, chatterSearch]);

  const chatterByDate = React.useMemo(() => {
    const groups: { [dateStr: string]: CrmChatterItem[] } = {};
    filteredChatter.forEach((item) => {
      const dateKey = formatChatterDateGroup(item.createdAt);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });
    return groups;
  }, [filteredChatter]);

  // Salesperson initials
  const salespersonInitials = (formData.salesperson || "Admin")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full overflow-hidden select-none bg-background text-foreground">
      {/* TOP STATUS BAR: WON / LOST & HORIZONTAL PIPELINE STAGE SELECTOR */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-2 shrink-0">
        {/* Left: Back button & Won/Lost buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/crm"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-2 border border-border/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Pipeline</span>
          </Link>

          <Button
            type="button"
            size="sm"
            onClick={handleWonClick}
            disabled={isUpdatingStage}
            className={cn(
              "h-7 text-xs font-semibold px-3 transition-all",
              lead.stageName?.toLowerCase() === "won" || lead.leadStatus === "converted"
                ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            )}
          >
            Won
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setLostModalOpen(true)}
            disabled={isUpdatingStage}
            className={cn(
              "h-7 text-xs font-medium px-3",
              lead.isLost
                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                : "border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            Lost
          </Button>

          {lead.isLost && (
            <Badge variant="destructive" className="text-[10px] h-6">
              Lost: {lead.lostReason || "Unqualified"}
            </Badge>
          )}
        </div>

        {/* Right: Horizontal Clickable Pipeline Stage Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {stages.map((stg) => {
            const isActive = stg.id === activeStageId || lead.stageName === stg.name;
            return (
              <button
                key={stg.id}
                type="button"
                disabled={isUpdatingStage}
                onClick={() => handleStageClick(stg)}
                title={`Click to set stage to ${stg.name}`}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                    : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/80"
                )}
              >
                <span>{stg.name}</span>
                {isActive && (
                  <span className="text-[10px] font-normal px-1 py-0.2 rounded bg-black/20 text-primary-foreground">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TWO PANEL MAIN CONTENT CONTAINER */}
      <div className="flex flex-1 overflow-hidden">
        {/* ============================================================== */}
        {/* LEFT SECTION: LEAD / OPPORTUNITY DETAILS & TABS (60% width)     */}
        {/* ============================================================== */}
        <div className="w-[60%] flex flex-col border-r border-border/60 overflow-y-auto bg-background/50 p-5 space-y-5">
          {/* Large Opportunity Title */}
          <div>
            <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Opportunity / Lead Name
            </Label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tech Corp Software Inquiry"
              className="w-full text-2xl font-bold bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none py-1 text-foreground transition-colors"
            />
          </div>

          {/* Revenue & Probability Row */}
          <div className="flex flex-wrap items-center gap-8 py-2 px-3 rounded-lg bg-muted/20 border border-border/50">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Expected Revenue</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-emerald-400">
                  {formatINR(formData.expectedRevenue)}
                </span>
                <input
                  type="number"
                  min="0"
                  value={formData.expectedRevenue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedRevenue: Number(e.target.value) || 0,
                    })
                  }
                  className="w-24 h-7 text-xs px-2 rounded border border-border/70 bg-background text-foreground"
                />
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <span>Probability</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-400 px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="h-2.5 w-2.5" /> AI
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted-foreground">at</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      probability: Number(e.target.value) || 0,
                    })
                  }
                  className="w-16 h-7 text-xs px-2 font-semibold text-center rounded border border-border/70 bg-background text-foreground"
                />
                <span className="text-sm font-semibold text-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Two-Column Information Layout (Exact Odoo replica) */}
          <div className="grid grid-cols-2 gap-6 pt-1">
            {/* Left Column: Contact, Email, Phone */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground w-24 shrink-0 flex items-center gap-1">
                  Contact <span className="text-[10px] text-muted-foreground/60">?</span>
                </Label>
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Customer Name"
                    className="h-8 text-xs flex-1"
                  />
                  {formData.contactName && (
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      type="button"
                      title="Open Contact"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground w-24 shrink-0">
                  Company
                </Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="h-8 text-xs flex-1"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground w-24 shrink-0">
                  Email
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="h-8 text-xs flex-1"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground w-24 shrink-0">
                  Phone
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>

            {/* Right Column: Salesperson, Expected Closing, Tags, Priority Stars */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0">
                  Salesperson
                </Label>
                <div className="flex items-center gap-2 flex-1">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {salespersonInitials}
                  </div>
                  <Input
                    value={formData.salesperson}
                    onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                    className="h-8 text-xs flex-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1">
                  Expected Closing <span className="text-[10px] text-muted-foreground/60">?</span>
                </Label>
                <Input
                  type="date"
                  value={formData.expectedClosing}
                  onChange={(e) => setFormData({ ...formData, expectedClosing: e.target.value })}
                  className="h-8 text-xs flex-1"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0 flex items-center gap-1">
                  Tags <span className="text-[10px] text-muted-foreground/60">?</span>
                </Label>
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    value={formData.tags.join(", ")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g. VIP, Luxury, High-Value"
                    className="h-8 text-xs flex-1"
                  />
                </div>
              </div>

              {/* Priority Stars */}
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium text-muted-foreground w-28 shrink-0">
                  Priority
                </Label>
                <div className="flex items-center gap-1 flex-1">
                  {[1, 2, 3].map((starIdx) => (
                    <button
                      key={starIdx}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          priority: formData.priority === starIdx ? 0 : starIdx,
                        })
                      }
                      className="p-1 text-muted-foreground/40 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          formData.priority >= starIdx
                            ? "text-amber-400 fill-amber-400"
                            : "hover:text-amber-300"
                        )}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    {formData.priority > 0 ? `${formData.priority} Stars` : "Normal"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TABS SECTION: Notes & Extra Info */}
          <div className="pt-3 border-t border-border/50 space-y-3">
            {/* Tab Headers */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-1">
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-t-md transition-all border-b-2",
                  activeTab === "notes"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Notes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("extra")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-t-md transition-all border-b-2",
                  activeTab === "extra"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Extra Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("activities")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-t-md transition-all border-b-2 flex items-center gap-1.5",
                  activeTab === "activities"
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Scheduled Meetings</span>
                {activities.filter((a) => !a.isDeleted && a.status === "planned").length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    {activities.filter((a) => !a.isDeleted && a.status === "planned").length}
                  </span>
                )}
              </button>
            </div>

            {/* Notes Tab Content */}
            {activeTab === "notes" && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Description / Requirement Summary
                  </Label>
                  <Textarea
                    rows={4}
                    placeholder="Add a description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="text-xs bg-muted/20 border-border/60"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Internal Lead Notes
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="Internal remarks for the team..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="text-xs bg-muted/20 border-border/60"
                  />
                </div>
              </div>
            )}

            {/* Extra Info Tab Content */}
            {activeTab === "extra" && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Lead Source
                    </Label>
                    <Input
                      value={formData.leadSource}
                      onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                      placeholder="e.g. Website, Partner, Social Media"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Sales Team
                    </Label>
                    <Input
                      value={formData.salesTeam}
                      onChange={(e) => setFormData({ ...formData, salesTeam: e.target.value })}
                      placeholder="e.g. Inbound Sales"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Travel Destination
                    </Label>
                    <Input
                      value={formData.travelDestination}
                      onChange={(e) =>
                        setFormData({ ...formData, travelDestination: e.target.value })
                      }
                      placeholder="e.g. Bali, Maldives, Dubai"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Start Date
                      </Label>
                      <Input
                        type="date"
                        value={formData.travelStartDate}
                        onChange={(e) =>
                          setFormData({ ...formData, travelStartDate: e.target.value })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">End Date</Label>
                      <Input
                        type="date"
                        value={formData.travelEndDate}
                        onChange={(e) =>
                          setFormData({ ...formData, travelEndDate: e.target.value })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">Adults</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.adultsCount}
                        onChange={(e) =>
                          setFormData({ ...formData, adultsCount: Number(e.target.value) || 1 })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground">Children</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.childrenCount}
                        onChange={(e) =>
                          setFormData({ ...formData, childrenCount: Number(e.target.value) || 0 })
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Interested Package
                    </Label>
                    <Input
                      value={formData.interestedPackageName}
                      onChange={(e) =>
                        setFormData({ ...formData, interestedPackageName: e.target.value })
                      }
                      placeholder="e.g. 5D4N Maldives Honeymoon"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Estimated Travel Budget (₹)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.expectedBudget}
                      onChange={(e) =>
                        setFormData({ ...formData, expectedBudget: Number(e.target.value) || 0 })
                      }
                      className="h-8 text-xs font-semibold text-emerald-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Special Requirements
                    </Label>
                    <Textarea
                      rows={2}
                      value={formData.specialRequirements}
                      onChange={(e) =>
                        setFormData({ ...formData, specialRequirements: e.target.value })
                      }
                      placeholder="Dietary requests, hotel category, private car..."
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Creator and Audit Information */}
                <div className="col-span-2 pt-3 mt-2 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-lg text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Created By</span>
                    <span className="font-semibold text-foreground">
                      {lead.createdByName || lead.createdBy || "Admin"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Created On</span>
                    <span className="font-semibold text-foreground">
                      {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Stage</span>
                    <span className="font-semibold text-foreground">
                      {lead.stageName || "New"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Assigned Employee</span>
                    <span className="font-semibold text-foreground">
                      {formData.salesperson || "Admin"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scheduled Meetings & Activities Tab Content */}
            {activeTab === "activities" && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between pb-1">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Scheduled Meetings & Activities</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setActivityModalOpen(true)}
                    className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-3 w-3" />
                    Schedule Activity
                  </Button>
                </div>

                {activities.filter((a) => !a.isDeleted).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 p-6 text-center space-y-2">
                    <Calendar className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-xs font-medium text-foreground">No meetings or activities scheduled yet</p>
                    <p className="text-[11px] text-muted-foreground">
                      Click the button above or use "Schedule Activity" in the right chatter panel to plan a meeting or follow-up.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activities
                      .filter((a) => !a.isDeleted)
                      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
                      .map((act) => {
                        const isDone = act.status === "completed";
                        return (
                          <div
                            key={act.id}
                            className={cn(
                              "p-3 rounded-lg border text-xs transition-all flex items-start justify-between gap-3",
                              isDone
                                ? "bg-muted/30 border-border/50 text-muted-foreground"
                                : "bg-card border-border/80 text-foreground shadow-2xs"
                            )}
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    act.type === "meeting"
                                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                      : act.type === "call"
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                      : "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                  )}
                                >
                                  {act.type}
                                </span>
                                <span className={cn("font-semibold text-xs", isDone && "line-through opacity-70")}>
                                  {act.subject}
                                </span>
                                {isDone ? (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                                    Done
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-500/15 text-amber-600 border border-amber-500/30">
                                    Planned
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-0.5">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground/70" />
                                  <span>{act.dueDate}</span>
                                </div>
                                {act.dueTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground/70" />
                                    <span>{act.dueTime}</span>
                                  </div>
                                )}
                                {act.assignedToName && (
                                  <div className="flex items-center gap-1">
                                    <span>Assigned: {act.assignedToName}</span>
                                  </div>
                                )}
                              </div>

                              {act.notes && (
                                <p className="text-[11px] text-muted-foreground/90 italic pt-1 border-t border-border/30 mt-1">
                                  "{act.notes}"
                                </p>
                              )}
                            </div>

                            {!isDone && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteActivity(act.id)}
                                className="h-6 px-2 text-[10px] font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30 shrink-0 gap-1"
                              >
                                <Check className="h-3 w-3" />
                                Mark Done
                              </Button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-border/50 flex justify-end">
            <Button
              size="sm"
              disabled={isSavingDetails}
              onClick={handleSaveLeadDetails}
              className="text-xs font-medium px-4 h-8"
            >
              {isSavingDetails ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT SECTION: CHATTER / COMMUNICATION & ACTIVITY (40% width)  */}
        {/* ============================================================== */}
        <div className="w-[40%] flex flex-col bg-muted/10 overflow-hidden">
          {/* Chatter Top Header Bar */}
          <div className="flex items-center justify-between border-b border-border/60 p-3 shrink-0 bg-background/60">
            {/* Primary Action Buttons: Send Message, Log Note, Activity */}
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                onClick={() => setComposerMode(composerMode === "message" ? "none" : "message")}
                className={cn(
                  "h-7 text-xs font-semibold px-2.5 transition-all",
                  composerMode === "message"
                    ? "bg-purple-600 text-white"
                    : "bg-purple-600/90 hover:bg-purple-600 text-white"
                )}
              >
                Send message
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setComposerMode(composerMode === "note" ? "none" : "note")}
                className={cn(
                  "h-7 text-xs font-medium px-2.5",
                  composerMode === "note" && "bg-muted border-primary/50 text-foreground"
                )}
              >
                Log note
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setActivityModalOpen(true)}
                className="h-7 text-xs font-medium px-2.5"
              >
                Activity
              </Button>
            </div>

            {/* Utility Icons: Search, Followers */}
            <div className="flex items-center gap-1 text-muted-foreground">
              <button
                type="button"
                onClick={() => setShowSearchInput(!showSearchInput)}
                title="Search conversation"
                className="p-1.5 rounded hover:text-foreground hover:bg-muted transition-colors"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
              <div
                title="1 Follower (Tech MAD'S)"
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-muted text-xs cursor-default"
              >
                <Users className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">1</span>
              </div>
            </div>
          </div>

          {/* Chatter Search Input if Toggled */}
          {showSearchInput && (
            <div className="p-2 border-b border-border/40 bg-background/80">
              <Input
                autoFocus
                placeholder="Search messages, activities..."
                value={chatterSearch}
                onChange={(e) => setChatterSearch(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}

          {/* Composer Form when "Send Message" or "Log Note" active */}
          {composerMode !== "none" && (
            <form
              onSubmit={handleSubmitChatter}
              className="p-3 border-b border-border/60 bg-background space-y-2 shrink-0 animate-in fade-in-50 duration-150"
            >
              <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                <span>
                  {composerMode === "message"
                    ? "Customer Message (Saved in CRM conversation)"
                    : "Internal Note (Visible to team only)"}
                </span>
                <button
                  type="button"
                  onClick={() => setComposerMode("none")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <Textarea
                autoFocus
                rows={3}
                placeholder={
                  composerMode === "message"
                    ? "Write a message..."
                    : "Log an internal remark..."
                }
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                className="text-xs"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">
                  {composerMode === "message" ? "Logged internally in CRM" : "Internal remark"}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setComposerMode("none")}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingChatter || !composerText.trim()}
                    className="h-7 text-xs font-semibold px-3"
                  >
                    {isSubmittingChatter ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Send className="h-3 w-3 mr-1" />
                    )}
                    {composerMode === "message" ? "Send" : "Log"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* PENDING ACTIVITIES LIST (if any exist) */}
          {activities.filter((a) => a.status === "planned").length > 0 && (
            <div className="p-3 border-b border-border/50 bg-amber-500/5 space-y-2 shrink-0">
              <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>Planned Activities</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {activities
                  .filter((a) => a.status === "planned")
                  .map((act) => {
                    const isOverdue = act.dueDate < new Date().toISOString().split("T")[0];
                    return (
                      <div
                        key={act.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md border text-xs bg-background/80",
                          isOverdue ? "border-rose-500/40" : "border-border/60"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {act.type === "call" ? (
                            <Phone className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          ) : act.type === "meeting" ? (
                            <Users className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-semibold text-foreground/90">
                              {act.subject}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-2">
                              Due: {act.dueDate}
                            </span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCompleteActivity(act.id)}
                          className="h-6 text-[11px] px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        >
                          <Check className="h-3 w-3 mr-1" /> Done
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* CHATTER TIMELINE FEED */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {Object.keys(chatterByDate).length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-muted-foreground text-xs space-y-1">
                <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
                <p>No activity yet.</p>
                <p className="text-[11px] text-muted-foreground/60">
                  Send a message, log a note, or schedule an activity above.
                </p>
              </div>
            ) : (
              Object.entries(chatterByDate).map(([dateKey, items]) => (
                <div key={dateKey} className="space-y-3">
                  {/* Date Separator Pill (Exact Odoo replica) */}
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/40" />
                    </div>
                    <span className="relative px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground bg-background rounded-full border border-border/50 uppercase tracking-wider">
                      {dateKey}
                    </span>
                  </div>

                  {/* Stream of Chatter Entries */}
                  <div className="space-y-3">
                    {items.map((item) => {
                      const initial = (item.senderName || "U")[0].toUpperCase();
                      const timeStr = formatChatterTimestamp(item.createdAt);

                      // Case A: Stage Change Entry
                      if (item.type === "stage_change") {
                        return (
                          <div key={item.id} className="flex items-start gap-2.5 text-xs">
                            <div className="h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {initial}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <span className="font-semibold text-foreground">
                                  {item.senderName}
                                </span>
                                <span>{timeStr}</span>
                              </div>
                              <div className="font-semibold text-foreground/90 text-[11px]">
                                Stage changed
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                <span className="line-through opacity-70">{item.oldStage}</span>{" "}
                                → <strong className="text-primary font-bold">{item.newStage}</strong>{" "}
                                <span className="text-[10px] text-muted-foreground/60">(Stage)</span>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Case B: Status Change Entry (Won / Lost)
                      if (item.type === "status_change") {
                        const isWon = item.content.includes("Won");
                        return (
                          <div key={item.id} className="flex items-start gap-2.5 text-xs">
                            <div
                              className={cn(
                                "h-6 w-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                                isWon ? "bg-emerald-600" : "bg-rose-600"
                              )}
                            >
                              {initial}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <span className="font-semibold text-foreground">
                                  {item.senderName}
                                </span>
                                <span>{timeStr}</span>
                              </div>
                              <div
                                className={cn(
                                  "font-bold text-[11px]",
                                  isWon ? "text-emerald-400" : "text-rose-400"
                                )}
                              >
                                {item.content}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Case C: Activity Log Entry
                      if (item.type === "activity_log") {
                        return (
                          <div key={item.id} className="flex items-start gap-2.5 text-xs">
                            <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {initial}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <span className="font-semibold text-foreground">
                                  {item.senderName}
                                </span>
                                <span>{timeStr}</span>
                              </div>
                              <div className="text-[11px] text-blue-300 font-medium">
                                {item.content}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Case D: Customer Message (Green bubble like reference)
                      if (item.type === "message") {
                        return (
                          <div key={item.id} className="flex items-start gap-2.5 text-xs">
                            <div className="h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                              {initial}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <span className="font-semibold text-foreground">
                                  {item.senderName}
                                </span>
                                <span>{timeStr}</span>
                              </div>
                              {/* Green chat bubble matching screenshot */}
                              <div className="inline-block px-3 py-1.5 rounded-lg bg-emerald-600/90 text-white text-xs max-w-[85%] break-words shadow-xs">
                                {item.content}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Case E: Internal Note
                      return (
                        <div key={item.id} className="flex items-start gap-2.5 text-xs">
                          <div className="h-6 w-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {initial}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                              <span className="font-semibold text-foreground">
                                {item.senderName}
                              </span>
                              <span>{timeStr}</span>
                              <span className="text-[9px] uppercase px-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                                Note
                              </span>
                            </div>
                            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 text-foreground text-xs leading-relaxed">
                              {item.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE ACTIVITY MODAL */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Schedule Activity
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleScheduleActivitySubmit} className="space-y-3.5 mt-1">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Activity Type</Label>
              <select
                value={activityForm.type}
                onChange={(e) =>
                  setActivityForm({
                    ...activityForm,
                    type: e.target.value as any,
                  })
                }
                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="task">To Do / Task</option>
                <option value="follow_up">Email / Follow-up</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">
                Summary <span className="text-destructive">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. Call customer to discuss custom tour plan"
                value={activityForm.subject}
                onChange={(e) =>
                  setActivityForm({ ...activityForm, subject: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Due Date</Label>
                <Input
                  type="date"
                  required
                  value={activityForm.dueDate}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, dueDate: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Time</Label>
                <Input
                  type="time"
                  value={activityForm.dueTime}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, dueTime: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">Log Note / Instructions</Label>
              <Textarea
                rows={2}
                placeholder="Details for the activity..."
                value={activityForm.notes}
                onChange={(e) =>
                  setActivityForm({ ...activityForm, notes: e.target.value })
                }
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActivityModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSchedulingActivity || !activityForm.subject.trim()}
                className="h-8 text-xs font-medium"
              >
                {isSchedulingActivity ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  "Schedule"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MARK LOST MODAL */}
      <Dialog open={lostModalOpen} onOpenChange={setLostModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Mark Opportunity as Lost
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLostSubmit} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Lost Reason</Label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Too expensive">Too expensive</option>
                <option value="Lost to competitor">Lost to competitor</option>
                <option value="Customer cancelled plans">Customer cancelled plans</option>
                <option value="Unresponsive">Unresponsive / Did not answer</option>
                <option value="Not interested">Not interested</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLostModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isMarkingLost}
                className="h-8 text-xs font-medium"
              >
                {isMarkingLost ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  "Mark as Lost"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
