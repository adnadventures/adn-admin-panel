export type ISO = string;

export type CrmMeta = {
  id: string;
  createdAt: ISO;
  updatedAt: ISO;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  deletedAt?: ISO | null;
  deletedBy?: string | null;
};

export type CrmLeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "unqualified"
  | "proposal"
  | "negotiation"
  | "converted";

export type CrmLeadRating = "hot" | "warm" | "cold";

export type CrmStage = CrmMeta & {
  name: string;
  sequence: number;
  color?: string;
  isFolded?: boolean;
};

export type CrmLead = CrmMeta & {
  name: string;
  stageId?: string;
  stageName?: string;
  company?: string;
  contactName?: string;
  title?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  leadSource?: string;
  leadStatus?: CrmLeadStatus;
  rating?: CrmLeadRating;
  priority?: number; // 0, 1, 2, 3 stars
  activityStatus?: "today" | "overdue" | "planned" | "none";
  activityDate?: string;
  interestedPackageId?: string;
  interestedPackageName?: string;
  expectedRevenue?: number;
  expectedBudget?: number;
  assignedTo?: string;
  assignedToName?: string;
  createdByName?: string;
  description?: string;
  notes?: string;
  tags?: string[];
  probability?: number;
  expectedClosing?: string;
  lostReason?: string;
  isLost?: boolean;
  salesTeam?: string;
  travelDestination?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  adultsCount?: number;
  childrenCount?: number;
  specialRequirements?: string;
  convertedContactId?: string;
  convertedAccountId?: string;
  convertedDealId?: string;
  convertedAt?: string;
};

export type CrmChatterItemType =
  | "message"
  | "note"
  | "stage_change"
  | "status_change"
  | "activity_log";

export type CrmChatterItem = CrmMeta & {
  leadId: string;
  type: CrmChatterItemType;
  content: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  oldStage?: string;
  newStage?: string;
  isInternal?: boolean;
  activityId?: string;
  attachments?: Array<{ name: string; url: string; size?: number }>;
};

export type CrmAccount = CrmMeta & {
  name: string;
  industry: string;
  phone: string;
  email: string;
  website: string;
  annualRevenue: number;
  employeesCount: number;
  billingAddress: string;
  shippingAddress: string;
  assignedTo: string;
  assignedToName: string;
  notes: string;
};

export type CrmContact = CrmMeta & {
  accountId?: string;
  accountName?: string;
  customerId?: string; // Linked ADN Customer ID
  firstName: string;
  lastName: string;
  name: string; // Full Name
  title: string;
  email: string;
  phone: string;
  department: string;
  address: string;
  city: string;
  country: string;
  leadSource: string;
  assignedTo: string;
  assignedToName: string;
  notes: string;
};

export type CrmDealStage =
  | "qualification"
  | "needs_analysis"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type CrmDealType = "new_business" | "existing_business";

export type CrmDeal = CrmMeta & {
  name: string;
  accountId?: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  amount: number;
  stage: CrmDealStage;
  probability: number;
  expectedRevenue: number;
  closingDate: string;
  type: CrmDealType;
  leadSource: string;
  campaignId?: string;
  campaignName?: string;
  assignedTo: string;
  assignedToName: string;
  lostReason?: string;
  wonReason?: string;
  notes: string;
};

export type CrmActivityType = "task" | "call" | "meeting" | "follow_up";
export type CrmActivityStatus = "planned" | "completed" | "overdue" | "cancelled";
export type CrmActivityPriority = "high" | "medium" | "low";

export type CrmActivity = CrmMeta & {
  type: CrmActivityType;
  subject: string;
  dueDate: string;
  dueTime?: string;
  status: CrmActivityStatus;
  priority: CrmActivityPriority;
  relatedToType: "lead" | "contact" | "account" | "deal";
  relatedToId: string;
  relatedToName: string;
  assignedTo: string;
  assignedToName: string;
  notes: string;
  completedAt?: string;
};

export type CrmQuoteStatus =
  | "draft"
  | "negotiation"
  | "delivered"
  | "on_hold"
  | "confirmed"
  | "closed_accepted"
  | "closed_lost";

export type CrmLineItem = {
  packageId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
};

export type CrmQuote = CrmMeta & {
  quoteNumber: string;
  subject: string;
  dealId?: string;
  dealName?: string;
  accountId?: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  status: CrmQuoteStatus;
  validUntil: string;
  lineItems: CrmLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  termsAndConditions: string;
  assignedTo: string;
  assignedToName: string;
};

export type CrmOrderStatus = "pending" | "approved" | "in_progress" | "completed" | "cancelled";

export type CrmOrder = CrmMeta & {
  orderNumber: string;
  subject: string;
  quoteId?: string;
  dealId?: string;
  dealName?: string;
  accountId?: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  status: CrmOrderStatus;
  totalAmount: number;
  orderDate: string;
  notes: string;
  assignedTo: string;
  assignedToName: string;
};

export type CrmCaseType = "problem" | "feature_request" | "inquiry" | "complaint";
export type CrmCaseStatus = "new" | "working" | "escalated" | "closed";
export type CrmCasePriority = "high" | "medium" | "low";
export type CrmCaseOrigin = "phone" | "email" | "web" | "chat";

export type CrmCase = CrmMeta & {
  caseNumber: string;
  subject: string;
  contactId?: string;
  contactName?: string;
  accountId?: string;
  accountName?: string;
  type: CrmCaseType;
  status: CrmCaseStatus;
  priority: CrmCasePriority;
  origin: CrmCaseOrigin;
  description: string;
  resolution?: string;
  assignedTo: string;
  assignedToName: string;
};

export type CrmSolutionStatus = "draft" | "reviewed" | "published";

export type CrmSolution = CrmMeta & {
  solutionNumber: string;
  title: string;
  status: CrmSolutionStatus;
  question: string;
  solution: string;
  category: string;
};

export type CrmCampaignType = "email" | "telemarketing" | "google_ads" | "social_media" | "event" | "other";
export type CrmCampaignStatus = "planning" | "active" | "inactive" | "completed";

export type CrmCampaign = CrmMeta & {
  name: string;
  type: CrmCampaignType;
  status: CrmCampaignStatus;
  startDate: string;
  endDate: string;
  expectedRevenue: number;
  budgetedCost: number;
  actualCost: number;
  expectedResponsePercent: number;
  leadsCount: number;
  contactsCount: number;
  description: string;
};

export type CrmCommunicationLogType = "call" | "email" | "meeting" | "whatsapp";

export type CrmCommunicationLog = CrmMeta & {
  type: CrmCommunicationLogType;
  subject: string;
  details: string;
  outcome: string;
  timestamp: string;
  relatedToType: "lead" | "contact" | "account" | "deal";
  relatedToId: string;
  relatedToName: string;
  loggedBy: string;
  loggedByName: string;
};

export type CrmStageConfig = {
  id: CrmDealStage;
  label: string;
  probability: number;
  color: string;
};

export type CrmSettings = {
  leadSources: string[];
  leadStatuses: string[];
  dealStages: CrmStageConfig[];
  activityTypes: string[];
  caseStatuses: string[];
  defaultAssignedUserId?: string;
};

export type CrmDashboardStats = {
  totalLeads: number;
  totalContacts: number;
  totalAccounts: number;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  pipelineValue: number;
  wonRevenue: number;
  conversionRate: number;
  followUpsDue: number;
  overdueActivities: number;
  recentActivities: CrmActivity[];
  dealsByStage: { stage: string; label: string; count: number; value: number }[];
  leadsBySource: { source: string; count: number }[];
  performanceByOwner: { owner: string; dealsWon: number; revenue: number }[];
};
