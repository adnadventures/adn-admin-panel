import { z } from "zod";

export const CRM_LEAD_SOURCES = [
  "Website",
  "Referral",
  "Cold Call",
  "Social Media",
  "Partner",
  "Google Ads",
  "Trade Show / Event",
  "Walk In",
  "Other",
] as const;

export const CRM_LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "proposal",
  "negotiation",
  "converted",
] as const;

export const CRM_LEAD_RATINGS = ["hot", "warm", "cold"] as const;

export const CRM_DEAL_STAGES = [
  "qualification",
  "needs_analysis",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

export const CRM_DEAL_STAGE_CONFIGS = [
  { id: "qualification", label: "Qualification", probability: 20, color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  { id: "needs_analysis", label: "Needs Analysis", probability: 40, color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  { id: "proposal", label: "Proposal / Quote", probability: 60, color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  { id: "negotiation", label: "Negotiation / Review", probability: 80, color: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30" },
  { id: "closed_won", label: "Closed Won", probability: 100, color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  { id: "closed_lost", label: "Closed Lost", probability: 0, color: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30" },
] as const;

export const CRM_DEAL_TYPES = ["new_business", "existing_business"] as const;

export const CRM_ACTIVITY_TYPES = ["task", "call", "meeting", "follow_up"] as const;
export const CRM_ACTIVITY_STATUSES = ["planned", "completed", "overdue", "cancelled"] as const;
export const CRM_ACTIVITY_PRIORITIES = ["high", "medium", "low"] as const;

export const CRM_QUOTE_STATUSES = [
  "draft",
  "negotiation",
  "delivered",
  "on_hold",
  "confirmed",
  "closed_accepted",
  "closed_lost",
] as const;

export const CRM_ORDER_STATUSES = ["pending", "approved", "in_progress", "completed", "cancelled"] as const;

export const CRM_CASE_TYPES = ["problem", "feature_request", "inquiry", "complaint"] as const;
export const CRM_CASE_STATUSES = ["new", "working", "escalated", "closed"] as const;
export const CRM_CASE_PRIORITIES = ["high", "medium", "low"] as const;
export const CRM_CASE_ORIGINS = ["phone", "email", "web", "chat"] as const;

export const CRM_CAMPAIGN_TYPES = ["email", "telemarketing", "google_ads", "social_media", "event", "other"] as const;
export const CRM_CAMPAIGN_STATUSES = ["planning", "active", "inactive", "completed"] as const;

export const CRM_COMMUNICATION_TYPES = ["call", "email", "meeting", "whatsapp"] as const;

/* ---------- SCHEMAS ---------- */

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  company: z.string().trim().max(100).default(""),
  title: z.string().trim().max(100).default(""),
  email: z.string().trim().email("Invalid email address").or(z.literal("")).default(""),
  phone: z.string().trim().min(7, "Phone must be at least 7 digits").max(25),
  address: z.string().trim().max(250).default(""),
  city: z.string().trim().max(100).default(""),
  state: z.string().trim().max(100).default(""),
  country: z.string().trim().max(100).default("India"),
  postalCode: z.string().trim().max(20).default(""),
  leadSource: z.string().trim().default("Website"),
  leadStatus: z.enum(CRM_LEAD_STATUSES).default("new"),
  rating: z.enum(CRM_LEAD_RATINGS).default("warm"),
  interestedPackageId: z.string().optional(),
  interestedPackageName: z.string().optional(),
  expectedBudget: z.coerce.number().min(0).default(0),
  assignedTo: z.string().trim().optional().default(""),
  assignedToName: z.string().trim().default(""),
  description: z.string().trim().max(2000).default(""),
  tags: z.array(z.string().trim()).default([]),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const convertLeadSchema = z.object({
  leadId: z.string().min(1),
  createAccount: z.boolean().default(true),
  accountName: z.string().trim().optional(),
  contactName: z.string().trim().min(1, "Contact name is required"),
  createDeal: z.boolean().default(true),
  dealName: z.string().trim().optional(),
  dealAmount: z.coerce.number().min(0).optional(),
  dealClosingDate: z.string().optional(),
  dealStage: z.enum(CRM_DEAL_STAGES).default("qualification"),
});
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;

export const accountSchema = z.object({
  name: z.string().trim().min(2, "Account Name is required").max(120),
  industry: z.string().trim().max(100).default(""),
  phone: z.string().trim().max(25).default(""),
  email: z.string().trim().email("Invalid email").or(z.literal("")).default(""),
  website: z.string().trim().max(150).default(""),
  annualRevenue: z.coerce.number().min(0).default(0),
  employeesCount: z.coerce.number().min(0).default(0),
  billingAddress: z.string().trim().max(250).default(""),
  shippingAddress: z.string().trim().max(250).default(""),
  assignedTo: z.string().trim().optional().default(""),
  assignedToName: z.string().trim().default(""),
  notes: z.string().trim().max(2000).default(""),
});
export type AccountInput = z.infer<typeof accountSchema>;

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().max(50).default(""),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  customerId: z.string().optional(), // Linked ADN Customer
  title: z.string().trim().max(100).default(""),
  email: z.string().trim().email("Invalid email").or(z.literal("")).default(""),
  phone: z.string().trim().min(7, "Phone must be at least 7 digits").max(25),
  department: z.string().trim().max(100).default(""),
  address: z.string().trim().max(250).default(""),
  city: z.string().trim().max(100).default(""),
  country: z.string().trim().max(100).default("India"),
  leadSource: z.string().trim().default("Website"),
  assignedTo: z.string().trim().optional().default(""),
  assignedToName: z.string().trim().default(""),
  notes: z.string().trim().max(2000).default(""),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const dealSchema = z.object({
  name: z.string().trim().min(2, "Deal name is required").max(120),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  contactId: z.string().optional(),
  contactName: z.string().optional(),
  amount: z.coerce.number().min(0, "Amount must be at least 0"),
  stage: z.enum(CRM_DEAL_STAGES).default("qualification"),
  probability: z.coerce.number().min(0).max(100).default(20),
  closingDate: z.string().min(1, "Closing date is required"),
  type: z.enum(CRM_DEAL_TYPES).default("new_business"),
  leadSource: z.string().trim().default("Website"),
  campaignId: z.string().optional(),
  campaignName: z.string().optional(),
  assignedTo: z.string().trim().optional().default(""),
  assignedToName: z.string().trim().default(""),
  lostReason: z.string().trim().optional(),
  wonReason: z.string().trim().optional(),
  notes: z.string().trim().max(2000).default(""),
});
export type DealInput = z.infer<typeof dealSchema>;

export const activitySchema = z.object({
  type: z.enum(CRM_ACTIVITY_TYPES).default("task"),
  subject: z.string().trim().min(2, "Subject is required").max(150),
  dueDate: z.string().min(1, "Due date is required"),
  dueTime: z.string().optional(),
  status: z.enum(CRM_ACTIVITY_STATUSES).default("planned"),
  priority: z.enum(CRM_ACTIVITY_PRIORITIES).default("medium"),
  relatedToType: z.enum(["lead", "contact", "account", "deal"]).default("lead"),
  relatedToId: z.string().min(1, "Related record ID is required"),
  relatedToName: z.string().trim().min(1, "Related name is required"),
  assignedTo: z.string().trim().optional().default(""),
  assignedToName: z.string().trim().default(""),
  notes: z.string().trim().max(2000).default(""),
});
export type ActivityInput = z.infer<typeof activitySchema>;

export const quoteLineItemSchema = z.object({
  packageId: z.string().optional(),
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().min(1).default(1),
  unitPrice: z.coerce.number().min(0).default(0),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  taxPercent: z.coerce.number().min(0).max(100).default(0),
  total: z.coerce.number().min(0).default(0),
});

export const quoteSchema = z.object({
  subject: z.string().trim().min(2, "Subject is required").max(150),
  dealId: z.string().optional(),
  dealName: z.string().optional(),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  contactId: z.string().optional(),
  contactName: z.string().optional(),
  status: z.enum(CRM_QUOTE_STATUSES).default("draft"),
  validUntil: z.string().min(1, "Valid until date is required"),
  lineItems: z.array(quoteLineItemSchema).min(1, "At least one item is required"),
  termsAndConditions: z.string().trim().max(3000).default(""),
  assignedTo: z.string().trim().optional().default(""),
  assignedToName: z.string().trim().default(""),
});
export type QuoteInput = z.infer<typeof quoteSchema>;

export const orderSchema = z.object({
  subject: z.string().trim().min(2, "Subject is required").max(150),
  quoteId: z.string().optional(),
  dealId: z.string().optional(),
  dealName: z.string().optional(),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  contactId: z.string().optional(),
  contactName: z.string().optional(),
  status: z.enum(CRM_ORDER_STATUSES).default("pending"),
  totalAmount: z.coerce.number().min(0),
  orderDate: z.string().min(1, "Order date is required"),
  notes: z.string().trim().max(2000).default(""),
  assignedTo: z.string().trim().optional().default(""),
  assignedToName: z.string().trim().default(""),
});
export type OrderInput = z.infer<typeof orderSchema>;

export const caseSchema = z.object({
  subject: z.string().trim().min(2, "Subject is required").max(150),
  contactId: z.string().optional(),
  contactName: z.string().optional(),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  type: z.enum(CRM_CASE_TYPES).default("inquiry"),
  status: z.enum(CRM_CASE_STATUSES).default("new"),
  priority: z.enum(CRM_CASE_PRIORITIES).default("medium"),
  origin: z.enum(CRM_CASE_ORIGINS).default("phone"),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  resolution: z.string().trim().default(""),
  assignedTo: z.string().trim().optional().default(""),
  assignedToName: z.string().trim().default(""),
});
export type CaseInput = z.infer<typeof caseSchema>;

export const solutionSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(150),
  category: z.string().trim().min(2, "Category is required").max(80),
  status: z.enum(["draft", "reviewed", "published"]).default("draft"),
  question: z.string().trim().min(5, "Issue/Question is required"),
  solution: z.string().trim().min(5, "Solution details are required"),
});
export type SolutionInput = z.infer<typeof solutionSchema>;

export const campaignSchema = z.object({
  name: z.string().trim().min(2, "Campaign name is required").max(120),
  type: z.enum(CRM_CAMPAIGN_TYPES).default("email"),
  status: z.enum(CRM_CAMPAIGN_STATUSES).default("planning"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  expectedRevenue: z.coerce.number().min(0).default(0),
  budgetedCost: z.coerce.number().min(0).default(0),
  actualCost: z.coerce.number().min(0).default(0),
  expectedResponsePercent: z.coerce.number().min(0).max(100).default(0),
  description: z.string().trim().max(2000).default(""),
});
export type CampaignInput = z.infer<typeof campaignSchema>;

export const communicationLogSchema = z.object({
  type: z.enum(CRM_COMMUNICATION_TYPES).default("call"),
  subject: z.string().trim().min(2, "Subject is required").max(150),
  details: z.string().trim().min(2, "Details are required").max(2000),
  outcome: z.string().trim().max(100).default("Completed"),
  timestamp: z.string().min(1, "Timestamp is required"),
  relatedToType: z.enum(["lead", "contact", "account", "deal"]).default("lead"),
  relatedToId: z.string().min(1, "Related ID is required"),
  relatedToName: z.string().trim().min(1, "Related name is required"),
});
export type CommunicationLogInput = z.infer<typeof communicationLogSchema>;

/* ---------- PIPELINE STAGES & QUICK LEAD ---------- */

export const stageSchema = z.object({
  name: z.string().trim().min(1, "Stage name is required").max(60),
  color: z.string().optional(),
});
export type StageInput = z.infer<typeof stageSchema>;

export const quickLeadSchema = z.object({
  name: z.string().trim().min(1, "Opportunity / Lead name is required").max(120),
  stageId: z.string().min(1, "Stage is required"),
  stageName: z.string().min(1, "Stage name is required"),
  contactName: z.string().trim().max(100).optional().default(""),
  company: z.string().trim().max(100).optional().default(""),
  expectedRevenue: z.coerce.number().min(0).default(0),
  assignedTo: z.string().trim().optional().default(""),
  assignedToName: z.string().trim().optional().default(""),
  priority: z.coerce.number().min(0).max(3).default(0),
  phone: z.string().trim().max(25).optional().default(""),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  activityStatus: z.enum(["today", "overdue", "planned", "none"]).optional().default("none"),
});
export type QuickLeadInput = z.input<typeof quickLeadSchema>;

/* ---------- CHATTER & LEAD DETAIL UPDATE SCHEMAS ---------- */

export const sendChatterMessageSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  type: z.enum(["message", "note"]).default("message"),
  content: z.string().trim().min(1, "Content is required").max(5000),
  isInternal: z.boolean().default(false),
});
export type SendChatterMessageInput = z.input<typeof sendChatterMessageSchema>;

export const scheduleLeadActivitySchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  type: z.enum(["task", "call", "meeting", "follow_up"]).default("call"),
  subject: z.string().trim().min(1, "Summary is required").max(200),
  dueDate: z.string().min(1, "Due date is required"),
  dueTime: z.string().optional().default(""),
  assignedTo: z.string().optional().default(""),
  assignedToName: z.string().optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});
export type ScheduleLeadActivityInput = z.input<typeof scheduleLeadActivitySchema>;

export const leadDetailUpdateSchema = z.object({
  name: z.string().trim().min(1, "Lead name is required").max(120),
  contactName: z.string().trim().max(100).optional().default(""),
  company: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email("Invalid email").or(z.literal("")).optional().default(""),
  phone: z.string().trim().max(25).optional().default(""),
  expectedRevenue: z.coerce.number().min(0).default(0),
  probability: z.coerce.number().min(0).max(100).default(50),
  expectedClosing: z.string().optional().default(""),
  priority: z.coerce.number().min(0).max(3).default(0),
  tags: z.array(z.string().trim()).optional().default([]),
  assignedTo: z.string().optional().default(""),
  assignedToName: z.string().optional().default(""),
  salesTeam: z.string().optional().default("Sales"),
  leadSource: z.string().optional().default("Website"),
  notes: z.string().max(5000).optional().default(""),
  description: z.string().max(5000).optional().default(""),
  travelDestination: z.string().optional().default(""),
  travelStartDate: z.string().optional().default(""),
  travelEndDate: z.string().optional().default(""),
  adultsCount: z.coerce.number().min(0).optional().default(1),
  childrenCount: z.coerce.number().min(0).optional().default(0),
  interestedPackageName: z.string().optional().default(""),
  expectedBudget: z.coerce.number().min(0).optional().default(0),
  specialRequirements: z.string().max(3000).optional().default(""),
});
export type LeadDetailUpdateInput = z.input<typeof leadDetailUpdateSchema>;



