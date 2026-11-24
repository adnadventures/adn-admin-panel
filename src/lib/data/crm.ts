import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL, serializeDoc } from "@/lib/firestore/helpers";
import type {
  CrmAccount,
  CrmActivity,
  CrmCampaign,
  CrmCase,
  CrmCommunicationLog,
  CrmContact,
  CrmDashboardStats,
  CrmDeal,
  CrmLead,
  CrmOrder,
  CrmQuote,
  CrmSettings,
  CrmSolution,
  CrmStage,
  CrmChatterItem,
} from "@/types/crm";
import { CRM_DEAL_STAGE_CONFIGS } from "@/lib/validators/crm";

/* ---------- PIPELINE STAGES & LEADS ---------- */

export const DEFAULT_CRM_STAGES = [
  { name: "New", sequence: 1, color: "#3B82F6" },
  { name: "Qualified", sequence: 2, color: "#F59E0B" },
  { name: "Proposition", sequence: 3, color: "#8B5CF6" },
  { name: "Won", sequence: 4, color: "#10B981" },
];

export async function listCrmStages(): Promise<CrmStage[]> {
  const snap = await adminDb
    .collection(COL.crmStages)
    .where("isDeleted", "==", false)
    .get();

  let stages = snap.docs.map((d) => serializeDoc(d) as CrmStage);

  // If no stages exist in Firestore yet, seed default Odoo stages automatically
  if (stages.length === 0) {
    const batch = adminDb.batch();
    const seededStages: CrmStage[] = [];
    const now = new Date().toISOString();

    for (const def of DEFAULT_CRM_STAGES) {
      const docRef = adminDb.collection(COL.crmStages).doc();
      const stageData: CrmStage = {
        id: docRef.id,
        name: def.name,
        sequence: def.sequence,
        color: def.color,
        isFolded: false,
        createdAt: now,
        updatedAt: now,
        createdBy: "system",
        updatedBy: "system",
        isDeleted: false,
      };
      batch.set(docRef, stageData);
      seededStages.push(stageData);
    }
    await batch.commit();
    stages = seededStages;
  }

  return stages.sort((a, b) => a.sequence - b.sequence);
}

export async function listPipelineLeads(): Promise<CrmLead[]> {
  const snap = await adminDb
    .collection(COL.crmLeads)
    .where("isDeleted", "==", false)
    .get();

  const leads = snap.docs.map((d) => serializeDoc(d) as CrmLead);
  return leads.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/* ---------- LEADS ---------- */

export async function listCrmLeads(filters?: {
  status?: string;
  rating?: string;
  search?: string;
  assignedTo?: string;
}): Promise<CrmLead[]> {
  let q = adminDb
    .collection(COL.crmLeads)
    .where("isDeleted", "==", false);

  if (filters?.status && filters.status !== "all") {
    q = q.where("leadStatus", "==", filters.status);
  }
  if (filters?.rating && filters.rating !== "all") {
    q = q.where("rating", "==", filters.rating);
  }
  if (filters?.assignedTo && filters.assignedTo !== "all") {
    q = q.where("assignedTo", "==", filters.assignedTo);
  }

  const snap = await q.get();
  let leads = snap.docs.map((doc) => serializeDoc(doc) as CrmLead);

  if (filters?.search) {
    const s = filters.search.toLowerCase().trim();
    leads = leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(s) ||
        l.company?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.phone?.includes(s)
    );
  }

  return leads.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCrmLead(id: string): Promise<CrmLead | null> {
  const doc = await adminDb.collection(COL.crmLeads).doc(id).get();
  if (!doc.exists) return null;
  const lead = serializeDoc(doc) as CrmLead;
  return lead.isDeleted ? null : lead;
}

export async function getLeadDetailWithChatter(id: string): Promise<{
  lead: CrmLead | null;
  chatter: CrmChatterItem[];
  activities: CrmActivity[];
}> {
  const leadDoc = await adminDb.collection(COL.crmLeads).doc(id).get();
  if (!leadDoc.exists) return { lead: null, chatter: [], activities: [] };
  const lead = serializeDoc(leadDoc) as CrmLead;
  if (lead.isDeleted) return { lead: null, chatter: [], activities: [] };

  const [chatterSnap, activitiesSnap] = await Promise.all([
    adminDb
      .collection(COL.crmCommunications)
      .where("leadId", "==", id)
      .where("isDeleted", "==", false)
      .get(),
    adminDb
      .collection(COL.crmActivities)
      .where("relatedToId", "==", id)
      .where("isDeleted", "==", false)
      .get(),
  ]);

  const chatter = chatterSnap.docs.map((d) => serializeDoc(d) as CrmChatterItem);
  const activities = activitiesSnap.docs.map((d) => serializeDoc(d) as CrmActivity);

  // Sort chatter chronological order
  chatter.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  activities.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  return { lead, chatter, activities };
}

/* ---------- ACCOUNTS ---------- */

export async function listCrmAccounts(filters?: { search?: string }): Promise<CrmAccount[]> {
  const snap = await adminDb
    .collection(COL.crmAccounts)
    .where("isDeleted", "==", false)
    .get();

  let accounts = snap.docs.map((doc) => serializeDoc(doc) as CrmAccount);

  if (filters?.search) {
    const s = filters.search.toLowerCase().trim();
    accounts = accounts.filter(
      (a) =>
        a.name?.toLowerCase().includes(s) ||
        a.industry?.toLowerCase().includes(s) ||
        a.phone?.includes(s) ||
        a.email?.toLowerCase().includes(s)
    );
  }

  return accounts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCrmAccount(id: string): Promise<CrmAccount | null> {
  const doc = await adminDb.collection(COL.crmAccounts).doc(id).get();
  if (!doc.exists) return null;
  const a = serializeDoc(doc) as CrmAccount;
  return a.isDeleted ? null : a;
}

/* ---------- CONTACTS ---------- */

export async function listCrmContacts(filters?: {
  search?: string;
  accountId?: string;
}): Promise<CrmContact[]> {
  let q = adminDb.collection(COL.crmContacts).where("isDeleted", "==", false);

  if (filters?.accountId) {
    q = q.where("accountId", "==", filters.accountId);
  }

  const snap = await q.get();
  let contacts = snap.docs.map((doc) => serializeDoc(doc) as CrmContact);

  if (filters?.search) {
    const s = filters.search.toLowerCase().trim();
    contacts = contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.phone?.includes(s) ||
        c.accountName?.toLowerCase().includes(s)
    );
  }

  return contacts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCrmContact(id: string): Promise<CrmContact | null> {
  const doc = await adminDb.collection(COL.crmContacts).doc(id).get();
  if (!doc.exists) return null;
  const c = serializeDoc(doc) as CrmContact;
  return c.isDeleted ? null : c;
}

/* ---------- DEALS ---------- */

export async function listCrmDeals(filters?: {
  stage?: string;
  accountId?: string;
  search?: string;
}): Promise<CrmDeal[]> {
  let q = adminDb.collection(COL.crmDeals).where("isDeleted", "==", false);

  if (filters?.stage && filters.stage !== "all") {
    q = q.where("stage", "==", filters.stage);
  }
  if (filters?.accountId) {
    q = q.where("accountId", "==", filters.accountId);
  }

  const snap = await q.get();
  let deals = snap.docs.map((doc) => serializeDoc(doc) as CrmDeal);

  if (filters?.search) {
    const s = filters.search.toLowerCase().trim();
    deals = deals.filter(
      (d) =>
        d.name?.toLowerCase().includes(s) ||
        d.accountName?.toLowerCase().includes(s) ||
        d.contactName?.toLowerCase().includes(s)
    );
  }

  return deals.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCrmDeal(id: string): Promise<CrmDeal | null> {
  const doc = await adminDb.collection(COL.crmDeals).doc(id).get();
  if (!doc.exists) return null;
  const d = serializeDoc(doc) as CrmDeal;
  return d.isDeleted ? null : d;
}

/* ---------- ACTIVITIES ---------- */

export async function listCrmActivities(filters?: {
  relatedToId?: string;
  relatedToType?: string;
  status?: string;
  type?: string;
  assignedTo?: string;
}): Promise<CrmActivity[]> {
  let q = adminDb.collection(COL.crmActivities).where("isDeleted", "==", false);

  if (filters?.relatedToId) {
    q = q.where("relatedToId", "==", filters.relatedToId);
  }
  if (filters?.relatedToType) {
    q = q.where("relatedToType", "==", filters.relatedToType);
  }
  if (filters?.status && filters.status !== "all") {
    q = q.where("status", "==", filters.status);
  }
  if (filters?.type && filters.type !== "all") {
    q = q.where("type", "==", filters.type);
  }
  if (filters?.assignedTo && filters.assignedTo !== "all") {
    q = q.where("assignedTo", "==", filters.assignedTo);
  }

  const snap = await q.get();
  const activities = snap.docs.map((doc) => serializeDoc(doc) as CrmActivity);

  return activities.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
}

export async function getCrmActivity(id: string): Promise<CrmActivity | null> {
  const doc = await adminDb.collection(COL.crmActivities).doc(id).get();
  if (!doc.exists) return null;
  const a = serializeDoc(doc) as CrmActivity;
  return a.isDeleted ? null : a;
}

/* ---------- QUOTES ---------- */

export async function listCrmQuotes(filters?: { search?: string }): Promise<CrmQuote[]> {
  const snap = await adminDb
    .collection(COL.crmQuotes)
    .where("isDeleted", "==", false)
    .get();

  let quotes = snap.docs.map((doc) => serializeDoc(doc) as CrmQuote);

  if (filters?.search) {
    const s = filters.search.toLowerCase().trim();
    quotes = quotes.filter(
      (q) =>
        q.quoteNumber?.toLowerCase().includes(s) ||
        q.subject?.toLowerCase().includes(s) ||
        q.accountName?.toLowerCase().includes(s) ||
        q.contactName?.toLowerCase().includes(s)
    );
  }

  return quotes.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCrmQuote(id: string): Promise<CrmQuote | null> {
  const doc = await adminDb.collection(COL.crmQuotes).doc(id).get();
  if (!doc.exists) return null;
  const q = serializeDoc(doc) as CrmQuote;
  return q.isDeleted ? null : q;
}

/* ---------- ORDERS ---------- */

export async function listCrmOrders(filters?: { search?: string }): Promise<CrmOrder[]> {
  const snap = await adminDb
    .collection(COL.crmOrders)
    .where("isDeleted", "==", false)
    .get();

  let orders = snap.docs.map((doc) => serializeDoc(doc) as CrmOrder);

  if (filters?.search) {
    const s = filters.search.toLowerCase().trim();
    orders = orders.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(s) ||
        o.subject?.toLowerCase().includes(s) ||
        o.accountName?.toLowerCase().includes(s) ||
        o.contactName?.toLowerCase().includes(s)
    );
  }

  return orders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCrmOrder(id: string): Promise<CrmOrder | null> {
  const doc = await adminDb.collection(COL.crmOrders).doc(id).get();
  if (!doc.exists) return null;
  const o = serializeDoc(doc) as CrmOrder;
  return o.isDeleted ? null : o;
}

/* ---------- CASES ---------- */

export async function listCrmCases(filters?: { status?: string; search?: string }): Promise<CrmCase[]> {
  let q = adminDb.collection(COL.crmCases).where("isDeleted", "==", false);

  if (filters?.status && filters.status !== "all") {
    q = q.where("status", "==", filters.status);
  }

  const snap = await q.get();
  let cases = snap.docs.map((doc) => serializeDoc(doc) as CrmCase);

  if (filters?.search) {
    const s = filters.search.toLowerCase().trim();
    cases = cases.filter(
      (c) =>
        c.caseNumber?.toLowerCase().includes(s) ||
        c.subject?.toLowerCase().includes(s) ||
        c.contactName?.toLowerCase().includes(s)
    );
  }

  return cases.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCrmCase(id: string): Promise<CrmCase | null> {
  const doc = await adminDb.collection(COL.crmCases).doc(id).get();
  if (!doc.exists) return null;
  const c = serializeDoc(doc) as CrmCase;
  return c.isDeleted ? null : c;
}

/* ---------- SOLUTIONS ---------- */

export async function listCrmSolutions(filters?: { search?: string; category?: string }): Promise<CrmSolution[]> {
  let q = adminDb.collection(COL.crmSolutions).where("isDeleted", "==", false);

  if (filters?.category && filters.category !== "all") {
    q = q.where("category", "==", filters.category);
  }

  const snap = await q.get();
  let solutions = snap.docs.map((doc) => serializeDoc(doc) as CrmSolution);

  if (filters?.search) {
    const s = filters.search.toLowerCase().trim();
    solutions = solutions.filter(
      (sol) =>
        sol.solutionNumber?.toLowerCase().includes(s) ||
        sol.title?.toLowerCase().includes(s) ||
        sol.question?.toLowerCase().includes(s) ||
        sol.solution?.toLowerCase().includes(s)
    );
  }

  return solutions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/* ---------- CAMPAIGNS ---------- */

export async function listCrmCampaigns(filters?: { status?: string }): Promise<CrmCampaign[]> {
  let q = adminDb.collection(COL.crmCampaigns).where("isDeleted", "==", false);

  if (filters?.status && filters.status !== "all") {
    q = q.where("status", "==", filters.status);
  }

  const snap = await q.get();
  const campaigns = snap.docs.map((doc) => serializeDoc(doc) as CrmCampaign);

  return campaigns.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCrmCampaign(id: string): Promise<CrmCampaign | null> {
  const doc = await adminDb.collection(COL.crmCampaigns).doc(id).get();
  if (!doc.exists) return null;
  const camp = serializeDoc(doc) as CrmCampaign;
  return camp.isDeleted ? null : camp;
}

/* ---------- COMMUNICATIONS ---------- */

export async function listCrmCommunicationLogs(relatedToId?: string): Promise<CrmCommunicationLog[]> {
  let q = adminDb.collection(COL.crmCommunications).where("isDeleted", "==", false);

  if (relatedToId) {
    q = q.where("relatedToId", "==", relatedToId);
  }

  const snap = await q.get();
  const logs = snap.docs.map((doc) => serializeDoc(doc) as CrmCommunicationLog);

  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/* ---------- SETTINGS ---------- */

export async function getCrmSettings(): Promise<CrmSettings> {
  const doc = await adminDb.collection(COL.crmSettings).doc("general").get();
  if (doc.exists) {
    return doc.data() as CrmSettings;
  }
  return {
    leadSources: [
      "Website",
      "Referral",
      "Cold Call",
      "Social Media",
      "Partner",
      "Google Ads",
      "Trade Show / Event",
      "Walk In",
      "Other",
    ],
    leadStatuses: ["new", "contacted", "qualified", "unqualified", "proposal", "negotiation", "converted"],
    dealStages: [...CRM_DEAL_STAGE_CONFIGS],
    activityTypes: ["task", "call", "meeting", "follow_up"],
    caseStatuses: ["new", "working", "escalated", "closed"],
  };
}

/* ---------- DASHBOARD STATS ---------- */

export async function getCrmDashboardStats(): Promise<CrmDashboardStats> {
  const [leadsSnap, contactsSnap, accountsSnap, dealsSnap, activitiesSnap] = await Promise.all([
    adminDb.collection(COL.crmLeads).where("isDeleted", "==", false).get(),
    adminDb.collection(COL.crmContacts).where("isDeleted", "==", false).get(),
    adminDb.collection(COL.crmAccounts).where("isDeleted", "==", false).get(),
    adminDb.collection(COL.crmDeals).where("isDeleted", "==", false).get(),
    adminDb.collection(COL.crmActivities).where("isDeleted", "==", false).get(),
  ]);

  const leads = leadsSnap.docs.map((d) => serializeDoc(d) as CrmLead);
  const contacts = contactsSnap.docs.map((d) => serializeDoc(d) as CrmContact);
  const accounts = accountsSnap.docs.map((d) => serializeDoc(d) as CrmAccount);
  const deals = dealsSnap.docs.map((d) => serializeDoc(d) as CrmDeal);
  const activities = activitiesSnap.docs.map((d) => serializeDoc(d) as CrmActivity);

  const totalLeads = leads.length;
  const totalContacts = contacts.length;
  const totalAccounts = accounts.length;
  const totalDeals = deals.length;

  const openDealsList = deals.filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost");
  const wonDealsList = deals.filter((d) => d.stage === "closed_won");
  const lostDealsList = deals.filter((d) => d.stage === "closed_lost");

  const openDeals = openDealsList.length;
  const wonDeals = wonDealsList.length;
  const lostDeals = lostDealsList.length;

  const pipelineValue = openDealsList.reduce((acc, d) => acc + (d.amount || 0), 0);
  const wonRevenue = wonDealsList.reduce((acc, d) => acc + (d.amount || 0), 0);

  const convertedLeads = leads.filter((l) => l.leadStatus === "converted").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const followUpsDue = activities.filter(
    (a) => a.status === "planned" && a.dueDate === todayStr
  ).length;

  const overdueActivities = activities.filter(
    (a) => a.status === "planned" && a.dueDate < todayStr
  ).length;

  const recentActivities = activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // Group deals by stage
  const dealsByStage = CRM_DEAL_STAGE_CONFIGS.map((stage) => {
    const matching = deals.filter((d) => d.stage === stage.id);
    return {
      stage: stage.id,
      label: stage.label,
      count: matching.length,
      value: matching.reduce((acc, d) => acc + (d.amount || 0), 0),
    };
  });

  // Group leads by source
  const sourceCountMap = new Map<string, number>();
  leads.forEach((l) => {
    const src = l.leadSource || "Other";
    sourceCountMap.set(src, (sourceCountMap.get(src) || 0) + 1);
  });
  const leadsBySource = Array.from(sourceCountMap.entries()).map(([source, count]) => ({
    source,
    count,
  }));

  // Sales performance by owner
  const ownerPerfMap = new Map<string, { dealsWon: number; revenue: number }>();
  wonDealsList.forEach((d) => {
    const owner = d.assignedToName || "Unassigned";
    const curr = ownerPerfMap.get(owner) || { dealsWon: 0, revenue: 0 };
    curr.dealsWon += 1;
    curr.revenue += d.amount || 0;
    ownerPerfMap.set(owner, curr);
  });
  const performanceByOwner = Array.from(ownerPerfMap.entries()).map(([owner, perf]) => ({
    owner,
    dealsWon: perf.dealsWon,
    revenue: perf.revenue,
  }));

  return {
    totalLeads,
    totalContacts,
    totalAccounts,
    totalDeals,
    openDeals,
    wonDeals,
    lostDeals,
    pipelineValue,
    wonRevenue,
    conversionRate,
    followUpsDue,
    overdueActivities,
    recentActivities,
    dealsByStage,
    leadsBySource,
    performanceByOwner,
  };
}
