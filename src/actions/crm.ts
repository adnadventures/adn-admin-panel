"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireModule, requireModuleEditor } from "@/lib/auth/session";
import {
  COL,
  auditEntry,
  createMeta,
  deleteMeta,
  serializeDoc,
  updateMeta,
} from "@/lib/firestore/helpers";
import {
  accountSchema,
  activitySchema,
  campaignSchema,
  caseSchema,
  communicationLogSchema,
  contactSchema,
  convertLeadSchema,
  dealSchema,
  leadSchema,
  orderSchema,
  quoteSchema,
  solutionSchema,
  stageSchema,
  quickLeadSchema,
  sendChatterMessageSchema,
  scheduleLeadActivitySchema,
  leadDetailUpdateSchema,
  type AccountInput,
  type ActivityInput,
  type CampaignInput,
  type CaseInput,
  type CommunicationLogInput,
  type ContactInput,
  type ConvertLeadInput,
  type DealInput,
  type LeadInput,
  type OrderInput,
  type QuoteInput,
  type SolutionInput,
  type StageInput,
  type QuickLeadInput,
  type SendChatterMessageInput,
  type ScheduleLeadActivityInput,
  type LeadDetailUpdateInput,
} from "@/lib/validators/crm";
import type { CrmDealStage, CrmLead, CrmStage, CrmChatterItem, CrmActivity } from "@/types/crm";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/* =========================================================================
 * LEADS
 * ========================================================================= */

export async function createCrmLead(raw: LeadInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lead data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmLeads).doc();
  const meta = createMeta(user);

  const payload = {
    ...d,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_lead.create", "crmLead", docRef.id, { name: d.name, company: d.company })
  );

  await batch.commit();
  revalidatePath("/crm/leads");
  revalidatePath("/crm");
  return { ok: true, id: docRef.id };
}

export async function updateCrmLead(id: string, raw: LeadInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lead data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmLeads).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Lead not found" };

  const meta = updateMeta(user);
  const payload = {
    ...d,
    ...meta,
  };

  const batch = adminDb.batch();
  batch.update(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_lead.update", "crmLead", id, { name: d.name })
  );

  await batch.commit();
  revalidatePath("/crm/leads");
  revalidatePath(`/crm/leads/${id}`);
  revalidatePath("/crm");
  return { ok: true, id };
}

export async function deleteCrmLead(id: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmLeads).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Lead not found" };

  const meta = deleteMeta(user);
  const batch = adminDb.batch();
  batch.update(docRef, meta);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_lead.delete", "crmLead", id)
  );

  await batch.commit();
  revalidatePath("/crm/leads");
  revalidatePath("/crm");
  return { ok: true };
}

export async function convertCrmLead(raw: ConvertLeadInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = convertLeadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid conversion data" };
  }

  const { leadId, createAccount, accountName, contactName, createDeal, dealName, dealAmount, dealClosingDate, dealStage } = parsed.data;

  const leadRef = adminDb.collection(COL.crmLeads).doc(leadId);
  const leadSnap = await leadRef.get();
  if (!leadSnap.exists) return { ok: false, error: "Lead not found" };
  const lead = serializeDoc(leadSnap) as CrmLead;

  const batch = adminDb.batch();
  const meta = createMeta(user);

  let newAccountId = "";
  let finalAccountName = accountName?.trim() || lead.company || "";

  // 1. Create Account if requested
  if (createAccount && finalAccountName) {
    const accountRef = adminDb.collection(COL.crmAccounts).doc();
    newAccountId = accountRef.id;
    batch.set(accountRef, {
      id: newAccountId,
      name: finalAccountName,
      industry: "General",
      phone: lead.phone || "",
      email: lead.email || "",
      website: "",
      annualRevenue: 0,
      employeesCount: 0,
      billingAddress: lead.address || "",
      shippingAddress: lead.address || "",
      assignedTo: lead.assignedTo || user.uid,
      assignedToName: lead.assignedToName || user.name,
      notes: `Created from converted lead: ${lead.name}`,
      ...meta,
    });
  }

  // 2. Create Contact
  const nameParts = contactName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const contactRef = adminDb.collection(COL.crmContacts).doc();
  const newContactId = contactRef.id;
  batch.set(contactRef, {
    id: newContactId,
    accountId: newAccountId || undefined,
    accountName: finalAccountName || undefined,
    firstName,
    lastName,
    name: contactName.trim(),
    title: lead.title || "",
    email: lead.email || "",
    phone: lead.phone || "",
    department: "",
    address: lead.address || "",
    city: lead.city || "",
    country: lead.country || "India",
    leadSource: lead.leadSource || "Website",
    assignedTo: lead.assignedTo || user.uid,
    assignedToName: lead.assignedToName || user.name,
    notes: `Converted from lead. ${lead.description || ""}`,
    ...meta,
  });

  // 3. Create Deal if requested
  let newDealId = "";
  if (createDeal) {
    const dealRef = adminDb.collection(COL.crmDeals).doc();
    newDealId = dealRef.id;
    const amount = Number(dealAmount) || Number(lead.expectedBudget) || 0;
    const stage = dealStage || "qualification";
    batch.set(dealRef, {
      id: newDealId,
      name: dealName?.trim() || `${contactName} - Package Deal`,
      accountId: newAccountId || undefined,
      accountName: finalAccountName || undefined,
      contactId: newContactId,
      contactName: contactName.trim(),
      amount,
      stage,
      probability: stage === "qualification" ? 20 : 50,
      expectedRevenue: amount * 0.5,
      closingDate: dealClosingDate || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      type: "new_business",
      leadSource: lead.leadSource || "Website",
      assignedTo: lead.assignedTo || user.uid,
      assignedToName: lead.assignedToName || user.name,
      notes: `Created from converted lead: ${lead.name}`,
      ...meta,
    });
  }

  // 4. Update Lead to converted
  batch.update(leadRef, {
    leadStatus: "converted",
    convertedContactId: newContactId,
    ...(newAccountId ? { convertedAccountId: newAccountId } : {}),
    ...(newDealId ? { convertedDealId: newDealId } : {}),
    convertedAt: new Date().toISOString(),
    ...updateMeta(user),
  });

  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_lead.convert", "crmLead", leadId, {
      contactId: newContactId,
      accountId: newAccountId,
      dealId: newDealId,
    })
  );

  await batch.commit();

  revalidatePath("/crm/leads");
  revalidatePath("/crm/contacts");
  revalidatePath("/crm/accounts");
  revalidatePath("/crm/deals");
  revalidatePath("/crm");

  return { ok: true, id: newContactId };
}

/* =========================================================================
 * ACCOUNTS
 * ========================================================================= */

export async function createCrmAccount(raw: AccountInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = accountSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid account data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmAccounts).doc();
  const meta = createMeta(user);

  const payload = {
    ...d,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_account.create", "crmAccount", docRef.id, { name: d.name })
  );

  await batch.commit();
  revalidatePath("/crm/accounts");
  revalidatePath("/crm");
  return { ok: true, id: docRef.id };
}

export async function updateCrmAccount(id: string, raw: AccountInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = accountSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid account data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmAccounts).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Account not found" };

  const meta = updateMeta(user);
  const payload = { ...d, ...meta };

  const batch = adminDb.batch();
  batch.update(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_account.update", "crmAccount", id, { name: d.name })
  );

  await batch.commit();
  revalidatePath("/crm/accounts");
  revalidatePath(`/crm/accounts/${id}`);
  return { ok: true, id };
}

export async function deleteCrmAccount(id: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmAccounts).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Account not found" };

  const meta = deleteMeta(user);
  const batch = adminDb.batch();
  batch.update(docRef, meta);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_account.delete", "crmAccount", id)
  );

  await batch.commit();
  revalidatePath("/crm/accounts");
  revalidatePath("/crm");
  return { ok: true };
}

/* =========================================================================
 * CONTACTS
 * ========================================================================= */

export async function createCrmContact(raw: ContactInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid contact data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmContacts).doc();
  const meta = createMeta(user);

  const fullName = [d.firstName, d.lastName].filter(Boolean).join(" ");
  const payload = {
    ...d,
    name: fullName,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_contact.create", "crmContact", docRef.id, { name: fullName })
  );

  await batch.commit();
  revalidatePath("/crm/contacts");
  revalidatePath("/crm");
  return { ok: true, id: docRef.id };
}

export async function updateCrmContact(id: string, raw: ContactInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid contact data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmContacts).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Contact not found" };

  const fullName = [d.firstName, d.lastName].filter(Boolean).join(" ");
  const meta = updateMeta(user);
  const payload = { ...d, name: fullName, ...meta };

  const batch = adminDb.batch();
  batch.update(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_contact.update", "crmContact", id, { name: fullName })
  );

  await batch.commit();
  revalidatePath("/crm/contacts");
  revalidatePath(`/crm/contacts/${id}`);
  return { ok: true, id };
}

export async function deleteCrmContact(id: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmContacts).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Contact not found" };

  const meta = deleteMeta(user);
  const batch = adminDb.batch();
  batch.update(docRef, meta);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_contact.delete", "crmContact", id)
  );

  await batch.commit();
  revalidatePath("/crm/contacts");
  revalidatePath("/crm");
  return { ok: true };
}

/* =========================================================================
 * DEALS
 * ========================================================================= */

export async function createCrmDeal(raw: DealInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = dealSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid deal data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmDeals).doc();
  const meta = createMeta(user);

  const expectedRevenue = Math.round((d.amount * d.probability) / 100);
  const payload = {
    ...d,
    expectedRevenue,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_deal.create", "crmDeal", docRef.id, { name: d.name, amount: d.amount })
  );

  await batch.commit();
  revalidatePath("/crm/deals");
  revalidatePath("/crm");
  return { ok: true, id: docRef.id };
}

export async function updateCrmDeal(id: string, raw: DealInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = dealSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid deal data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmDeals).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Deal not found" };

  const expectedRevenue = Math.round((d.amount * d.probability) / 100);
  const meta = updateMeta(user);
  const payload = {
    ...d,
    expectedRevenue,
    ...meta,
  };

  const batch = adminDb.batch();
  batch.update(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_deal.update", "crmDeal", id, { name: d.name })
  );

  await batch.commit();
  revalidatePath("/crm/deals");
  revalidatePath(`/crm/deals/${id}`);
  revalidatePath("/crm");
  return { ok: true, id };
}

export async function updateCrmDealStage(
  id: string,
  stage: CrmDealStage,
  probability?: number
): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmDeals).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Deal not found" };

  const current = snap.data();
  const finalProb = probability !== undefined ? probability : stage === "closed_won" ? 100 : stage === "closed_lost" ? 0 : current?.probability ?? 50;
  const expectedRevenue = Math.round(((current?.amount || 0) * finalProb) / 100);

  const meta = updateMeta(user);
  const payload = {
    stage,
    probability: finalProb,
    expectedRevenue,
    ...meta,
  };

  const batch = adminDb.batch();
  batch.update(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_deal.stage_change", "crmDeal", id, { from: current?.stage, to: stage })
  );

  await batch.commit();
  revalidatePath("/crm/deals");
  revalidatePath("/crm");
  return { ok: true };
}

export async function deleteCrmDeal(id: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmDeals).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Deal not found" };

  const meta = deleteMeta(user);
  const batch = adminDb.batch();
  batch.update(docRef, meta);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_deal.delete", "crmDeal", id)
  );

  await batch.commit();
  revalidatePath("/crm/deals");
  revalidatePath("/crm");
  return { ok: true };
}

/* =========================================================================
 * ACTIVITIES
 * ========================================================================= */

export async function createCrmActivity(raw: ActivityInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = activitySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid activity data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmActivities).doc();
  const meta = createMeta(user);

  const payload = {
    ...d,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_activity.create", "crmActivity", docRef.id, { subject: d.subject })
  );

  await batch.commit();
  revalidatePath("/crm/activities");
  revalidatePath("/crm");
  return { ok: true, id: docRef.id };
}

export async function completeCrmActivity(id: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmActivities).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Activity not found" };

  const meta = updateMeta(user);
  const payload = {
    status: "completed",
    completedAt: new Date().toISOString(),
    ...meta,
  };

  const batch = adminDb.batch();
  batch.update(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_activity.complete", "crmActivity", id)
  );

  await batch.commit();
  revalidatePath("/crm/activities");
  revalidatePath("/crm");
  return { ok: true };
}

export async function deleteCrmActivity(id: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmActivities).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Activity not found" };

  const meta = deleteMeta(user);
  const batch = adminDb.batch();
  batch.update(docRef, meta);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_activity.delete", "crmActivity", id)
  );

  await batch.commit();
  revalidatePath("/crm/activities");
  revalidatePath("/crm");
  return { ok: true };
}

/* =========================================================================
 * QUOTES
 * ========================================================================= */

export async function createCrmQuote(raw: QuoteInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid quote data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmQuotes).doc();
  const meta = createMeta(user);

  const subtotal = d.lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discountTotal = d.lineItems.reduce(
    (acc, item) => acc + (item.quantity * item.unitPrice * (item.discountPercent || 0)) / 100,
    0
  );
  const taxable = subtotal - discountTotal;
  const taxTotal = d.lineItems.reduce(
    (acc, item) => acc + ((item.quantity * item.unitPrice - (item.quantity * item.unitPrice * (item.discountPercent || 0)) / 100) * (item.taxPercent || 0)) / 100,
    0
  );
  const grandTotal = Math.round(taxable + taxTotal);

  const quoteNumber = `QT-${Date.now().toString().slice(-6)}`;

  const payload = {
    ...d,
    quoteNumber,
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_quote.create", "crmQuote", docRef.id, { quoteNumber, grandTotal })
  );

  await batch.commit();
  revalidatePath("/crm/quotes");
  return { ok: true, id: docRef.id };
}

export async function deleteCrmQuote(id: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmQuotes).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Quote not found" };

  const meta = deleteMeta(user);
  const batch = adminDb.batch();
  batch.update(docRef, meta);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_quote.delete", "crmQuote", id)
  );

  await batch.commit();
  revalidatePath("/crm/quotes");
  return { ok: true };
}

/* =========================================================================
 * ORDERS
 * ========================================================================= */

export async function createCrmOrder(raw: OrderInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmOrders).doc();
  const meta = createMeta(user);

  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
  const payload = {
    ...d,
    orderNumber,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_order.create", "crmOrder", docRef.id, { orderNumber, totalAmount: d.totalAmount })
  );

  await batch.commit();
  revalidatePath("/crm/orders");
  return { ok: true, id: docRef.id };
}

export async function deleteCrmOrder(id: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmOrders).doc(id);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Order not found" };

  const meta = deleteMeta(user);
  const batch = adminDb.batch();
  batch.update(docRef, meta);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_order.delete", "crmOrder", id)
  );

  await batch.commit();
  revalidatePath("/crm/orders");
  return { ok: true };
}

/* =========================================================================
 * CASES & SOLUTIONS
 * ========================================================================= */

export async function createCrmCase(raw: CaseInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = caseSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid case data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmCases).doc();
  const meta = createMeta(user);
  const caseNumber = `CAS-${Date.now().toString().slice(-5)}`;

  const payload = {
    ...d,
    caseNumber,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_case.create", "crmCase", docRef.id, { caseNumber, subject: d.subject })
  );

  await batch.commit();
  revalidatePath("/crm/cases");
  return { ok: true, id: docRef.id };
}

export async function createCrmSolution(raw: SolutionInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = solutionSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid solution data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmSolutions).doc();
  const meta = createMeta(user);
  const solutionNumber = `SOL-${Date.now().toString().slice(-4)}`;

  const payload = {
    ...d,
    solutionNumber,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_solution.create", "crmSolution", docRef.id, { solutionNumber, title: d.title })
  );

  await batch.commit();
  revalidatePath("/crm/solutions");
  return { ok: true, id: docRef.id };
}

/* =========================================================================
 * CAMPAIGNS
 * ========================================================================= */

export async function createCrmCampaign(raw: CampaignInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = campaignSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid campaign data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmCampaigns).doc();
  const meta = createMeta(user);

  const payload = {
    ...d,
    leadsCount: 0,
    contactsCount: 0,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_campaign.create", "crmCampaign", docRef.id, { name: d.name })
  );

  await batch.commit();
  revalidatePath("/crm/campaigns");
  return { ok: true, id: docRef.id };
}

/* =========================================================================
 * COMMUNICATION LOGS
 * ========================================================================= */

export async function createCrmCommunicationLog(raw: CommunicationLogInput): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = communicationLogSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid communication data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmCommunications).doc();
  const meta = createMeta(user);

  const payload = {
    ...d,
    loggedBy: user.uid,
    loggedByName: user.name,
    ...meta,
    id: docRef.id,
  };

  const batch = adminDb.batch();
  batch.set(docRef, payload);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_communication.create", "crmCommunication", docRef.id, {
      type: d.type,
      subject: d.subject,
    })
  );

  await batch.commit();
  revalidatePath("/crm");
  return { ok: true, id: docRef.id };
}

/* =========================================================================
 * CRM SETTINGS
 * ========================================================================= */

export async function updateCrmSettings(data: Record<string, unknown>): Promise<Result> {
  const user = await requireModuleEditor("crm", ["admin", "manager"]);
  const docRef = adminDb.collection(COL.crmSettings).doc("general");

  const batch = adminDb.batch();
  batch.set(docRef, { ...data, updatedAt: new Date().toISOString(), updatedBy: user.uid }, { merge: true });
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_settings.update", "crmSettings", "general")
  );

  await batch.commit();
  revalidatePath("/crm/settings");
  return { ok: true };
}

/* =========================================================================
 * PIPELINE STAGES & KANBAN LEADS
 * ========================================================================= */

export async function createCrmStage(name: string, color?: string): Promise<{ ok: true; stage: CrmStage } | { ok: false; error: string }> {
  const user = await requireModuleEditor("crm");
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Stage name is required" };
  }

  // Get current max sequence
  const snap = await adminDb
    .collection(COL.crmStages)
    .where("isDeleted", "==", false)
    .get();

  let maxSeq = 0;
  snap.docs.forEach((d) => {
    const seq = (d.data().sequence as number) || 0;
    if (seq > maxSeq) maxSeq = seq;
  });

  const docRef = adminDb.collection(COL.crmStages).doc();
  const meta = createMeta(user);
  const now = new Date().toISOString();

  const newStage: CrmStage = {
    id: docRef.id,
    name: trimmed,
    sequence: maxSeq + 1,
    color: color || "#3B82F6",
    isFolded: false,
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
    updatedBy: user.uid,
    isDeleted: false,
  };

  const batch = adminDb.batch();
  batch.set(docRef, { ...newStage, ...meta, id: docRef.id });
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_stage.create", "crmStage", docRef.id, { name: trimmed })
  );

  await batch.commit();
  revalidatePath("/crm");
  return { ok: true, stage: newStage };
}

export async function renameCrmStage(id: string, name: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "Stage name is required" };
  }

  const stageRef = adminDb.collection(COL.crmStages).doc(id);
  const stageSnap = await stageRef.get();
  if (!stageSnap.exists) {
    return { ok: false, error: "Stage not found" };
  }

  const batch = adminDb.batch();
  const meta = updateMeta(user);
  batch.update(stageRef, { name: trimmed, ...meta });

  // Also update stageName on leads in this stage
  const leadsSnap = await adminDb
    .collection(COL.crmLeads)
    .where("stageId", "==", id)
    .where("isDeleted", "==", false)
    .get();

  leadsSnap.docs.forEach((doc) => {
    batch.update(doc.ref, { stageName: trimmed, ...meta });
  });

  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_stage.rename", "crmStage", id, { name: trimmed })
  );

  await batch.commit();
  revalidatePath("/crm");
  return { ok: true };
}

/* =========================================================================
 * MODULE 2: LEAD DETAIL, CHATTER, ACTIVITIES, AND STAGE CHANGES
 * ========================================================================= */


export async function deleteCrmStage(id: string): Promise<Result> {
  const user = await requireModuleEditor("crm");

  // Validate if stage has leads
  const leadSnap = await adminDb
    .collection(COL.crmLeads)
    .where("stageId", "==", id)
    .where("isDeleted", "==", false)
    .limit(1)
    .get();

  if (!leadSnap.empty) {
    return {
      ok: false,
      error: "Cannot delete stage containing leads. Please move existing leads to another stage first.",
    };
  }

  const stageRef = adminDb.collection(COL.crmStages).doc(id);
  const stageSnap = await stageRef.get();
  if (!stageSnap.exists) {
    return { ok: false, error: "Stage not found" };
  }

  const meta = deleteMeta(user);
  const batch = adminDb.batch();
  batch.update(stageRef, meta);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_stage.delete", "crmStage", id)
  );

  await batch.commit();
  revalidatePath("/crm");
  return { ok: true };
}

/* =========================================================================
 * MODULE 2: LEAD DETAIL, CHATTER, ACTIVITIES, AND STAGE CHANGES
 * ========================================================================= */


export async function quickCreateLead(raw: QuickLeadInput): Promise<{ ok: true; lead: CrmLead } | { ok: false; error: string }> {
  const user = await requireModuleEditor("crm");
  const parsed = quickLeadSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lead data" };
  }

  const d = parsed.data;
  const docRef = adminDb.collection(COL.crmLeads).doc();
  const meta = createMeta(user);
  const now = new Date().toISOString();

  const payload: CrmLead = {
    id: docRef.id,
    name: d.name,
    stageId: d.stageId,
    stageName: d.stageName,
    contactName: d.contactName || d.name,
    company: d.company || "",
    expectedRevenue: d.expectedRevenue,
    assignedTo: d.assignedTo || user.uid,
    assignedToName: d.assignedToName || user.name || "Admin",
    priority: d.priority,
    phone: d.phone || "",
    email: d.email || "",
    notes: d.notes || "",
    activityStatus: d.activityStatus || "none",
    leadStatus: d.stageName.toLowerCase() === "won" ? "converted" : "new",
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
    updatedBy: user.uid,
    isDeleted: false,
  };

  const batch = adminDb.batch();
  batch.set(docRef, { ...payload, ...meta, id: docRef.id });
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_lead.quick_create", "crmLead", docRef.id, {
      name: d.name,
      stageId: d.stageId,
      expectedRevenue: d.expectedRevenue,
    })
  );

  await batch.commit();
  revalidatePath("/crm");
  return { ok: true, lead: payload };
}

export async function moveLeadStage(
  leadId: string,
  newStageId: string,
  newStageName: string
): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmLeads).doc(leadId);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Lead not found" };

  const meta = updateMeta(user);
  const updates: Record<string, unknown> = {
    stageId: newStageId,
    stageName: newStageName,
    ...meta,
  };

  if (newStageName.toLowerCase() === "won") {
    updates.leadStatus = "converted";
  }

  const batch = adminDb.batch();
  batch.update(docRef, updates);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_lead.move_stage", "crmLead", leadId, {
      newStageId,
      newStageName,
    })
  );

  await batch.commit();
  revalidatePath("/crm");
  return { ok: true };
}

/* =========================================================================
 * MODULE 2: LEAD DETAIL, CHATTER, ACTIVITIES, AND STAGE CHANGES
 * ========================================================================= */


export async function updateLeadPriority(leadId: string, priority: number): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmLeads).doc(leadId);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Lead not found" };

  const meta = updateMeta(user);
  const batch = adminDb.batch();
  batch.update(docRef, { priority, ...meta });
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_lead.priority", "crmLead", leadId, { priority })
  );

  await batch.commit();
  revalidatePath("/crm");
  return { ok: true };
}

/* =========================================================================
 * MODULE 2: LEAD DETAIL, CHATTER, ACTIVITIES, AND STAGE CHANGES
 * ========================================================================= */


export async function updateLeadDetails(
  leadId: string,
  data: {
    name?: string;
    contactName?: string;
    company?: string;
    expectedRevenue?: number;
    phone?: string;
    email?: string;
    notes?: string;
    priority?: number;
    stageId?: string;
    stageName?: string;
  }
): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmLeads).doc(leadId);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Lead not found" };

  const meta = updateMeta(user);
  const batch = adminDb.batch();
  batch.update(docRef, { ...data, ...meta });
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_lead.update_details", "crmLead", leadId, data)
  );

  await batch.commit();
  revalidatePath("/crm");
  return { ok: true };
}

/* =========================================================================
 * MODULE 2: LEAD DETAIL, CHATTER, ACTIVITIES, AND STAGE CHANGES
 * ========================================================================= */


/* =========================================================================
 * MODULE 2: LEAD DETAIL, CHATTER, ACTIVITIES, AND STAGE CHANGES
 * ========================================================================= */

export async function changeLeadStageFromDetail(
  leadId: string,
  targetStageId: string,
  targetStageName: string
): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmLeads).doc(leadId);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Lead not found" };

  const leadData = snap.data() as CrmLead;
  const oldStageName = leadData.stageName || "New";

  // Prevent duplicate stage-change history entries if already in target stage
  if (leadData.stageId === targetStageId) {
    return { ok: true };
  }

  const now = new Date().toISOString();
  const meta = updateMeta(user);
  const batch = adminDb.batch();

  const updates: Record<string, unknown> = {
    stageId: targetStageId,
    stageName: targetStageName,
    ...meta,
  };

  if (targetStageName.toLowerCase() === "won") {
    updates.leadStatus = "converted";
    updates.isLost = false;
  }

  batch.update(docRef, updates);

  // Add stage-change entry to chatter history
  const chatterRef = adminDb.collection(COL.crmCommunications).doc();
  const chatterPayload: CrmChatterItem = {
    id: chatterRef.id,
    leadId,
    type: "stage_change",
    content: "Stage changed",
    oldStage: oldStageName,
    newStage: targetStageName,
    senderId: user.uid,
    senderName: user.name || "User",
    senderEmail: user.email || "",
    isInternal: true,
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
    updatedBy: user.uid,
    isDeleted: false,
  };
  batch.set(chatterRef, chatterPayload);

  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_lead.stage_change_detail", "crmLead", leadId, {
      from: oldStageName,
      to: targetStageName,
    })
  );

  await batch.commit();
  revalidatePath("/crm");
  revalidatePath(`/crm/leads/${leadId}`);
  return { ok: true };
}

export async function markLeadWon(leadId: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmLeads).doc(leadId);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Lead not found" };

  const leadData = snap.data() as CrmLead;
  const oldStageName = leadData.stageName || "New";

  // Find Won stage in collection
  const stagesSnap = await adminDb
    .collection(COL.crmStages)
    .where("isDeleted", "==", false)
    .get();

  let wonStage = stagesSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as CrmStage))
    .find((s) => s.name.toLowerCase().includes("won"));

  const now = new Date().toISOString();
  const meta = updateMeta(user);
  const batch = adminDb.batch();

  const updates: Record<string, unknown> = {
    leadStatus: "converted",
    isLost: false,
    ...meta,
  };

  if (wonStage) {
    updates.stageId = wonStage.id;
    updates.stageName = wonStage.name;
  } else {
    updates.stageName = "Won";
  }

  batch.update(docRef, updates);

  // Add chatter entry
  const chatterRef = adminDb.collection(COL.crmCommunications).doc();
  const chatterPayload: CrmChatterItem = {
    id: chatterRef.id,
    leadId,
    type: "status_change",
    content: "Opportunity marked as Won",
    oldStage: oldStageName,
    newStage: "Won",
    senderId: user.uid,
    senderName: user.name || "User",
    senderEmail: user.email || "",
    isInternal: true,
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
    updatedBy: user.uid,
    isDeleted: false,
  };
  batch.set(chatterRef, chatterPayload);

  await batch.commit();
  revalidatePath("/crm");
  revalidatePath(`/crm/leads/${leadId}`);
  return { ok: true };
}

export async function markLeadLost(leadId: string, reason?: string): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const docRef = adminDb.collection(COL.crmLeads).doc(leadId);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Lead not found" };

  const leadData = snap.data() as CrmLead;
  const now = new Date().toISOString();
  const meta = updateMeta(user);
  const batch = adminDb.batch();

  const lostNote = reason?.trim() || "No reason specified";

  batch.update(docRef, {
    leadStatus: "unqualified",
    isLost: true,
    lostReason: lostNote,
    ...meta,
  });

  // Add chatter entry
  const chatterRef = adminDb.collection(COL.crmCommunications).doc();
  const chatterPayload: CrmChatterItem = {
    id: chatterRef.id,
    leadId,
    type: "status_change",
    content: `Opportunity marked as Lost (${lostNote})`,
    oldStage: leadData.stageName,
    newStage: "Lost",
    senderId: user.uid,
    senderName: user.name || "User",
    senderEmail: user.email || "",
    isInternal: true,
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
    updatedBy: user.uid,
    isDeleted: false,
  };
  batch.set(chatterRef, chatterPayload);

  await batch.commit();
  revalidatePath("/crm");
  revalidatePath(`/crm/leads/${leadId}`);
  return { ok: true };
}

export async function sendLeadChatterMessage(
  raw: SendChatterMessageInput
): Promise<{ ok: true; item: CrmChatterItem } | { ok: false; error: string }> {
  const user = await requireModuleEditor("crm");
  const parsed = sendChatterMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message data" };
  }

  const d = parsed.data;
  const leadDoc = await adminDb.collection(COL.crmLeads).doc(d.leadId).get();
  if (!leadDoc.exists) return { ok: false, error: "Lead not found" };

  const now = new Date().toISOString();
  const docRef = adminDb.collection(COL.crmCommunications).doc();

  const chatterItem: CrmChatterItem = {
    id: docRef.id,
    leadId: d.leadId,
    type: d.type,
    content: d.content,
    senderId: user.uid,
    senderName: user.name || "User",
    senderEmail: user.email || "",
    isInternal: d.isInternal,
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
    updatedBy: user.uid,
    isDeleted: false,
  };

  const batch = adminDb.batch();
  batch.set(docRef, chatterItem);
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_chatter.post", "crmCommunication", docRef.id, {
      leadId: d.leadId,
      type: d.type,
      isInternal: d.isInternal,
    })
  );

  await batch.commit();
  revalidatePath(`/crm/leads/${d.leadId}`);
  return { ok: true, item: chatterItem };
}

export async function scheduleLeadActivity(
  raw: ScheduleLeadActivityInput
): Promise<{ ok: true; activity: CrmActivity } | { ok: false; error: string }> {
  const user = await requireModuleEditor("crm");
  const parsed = scheduleLeadActivitySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid activity data" };
  }

  const d = parsed.data;
  const leadDoc = await adminDb.collection(COL.crmLeads).doc(d.leadId).get();
  if (!leadDoc.exists) return { ok: false, error: "Lead not found" };
  const lead = leadDoc.data() as CrmLead;

  const now = new Date().toISOString();
  const docRef = adminDb.collection(COL.crmActivities).doc();
  const meta = createMeta(user);

  const todayStr = new Date().toISOString().split("T")[0];
  const activityStatus = d.dueDate === todayStr ? "today" : d.dueDate < todayStr ? "overdue" : "planned";

  const activityPayload: CrmActivity = {
    id: docRef.id,
    type: d.type,
    subject: d.subject,
    dueDate: d.dueDate,
    dueTime: d.dueTime || "",
    status: "planned",
    priority: "medium",
    relatedToType: "lead",
    relatedToId: d.leadId,
    relatedToName: lead.name,
    assignedTo: d.assignedTo || user.uid,
    assignedToName: d.assignedToName || user.name || "Admin",
    notes: d.notes || "",
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
    updatedBy: user.uid,
    isDeleted: false,
  };

  const batch = adminDb.batch();
  batch.set(docRef, { ...activityPayload, ...meta });

  // Update lead's activityStatus indicator
  batch.update(adminDb.collection(COL.crmLeads).doc(d.leadId), {
    activityStatus,
    activityDate: d.dueDate,
    updatedAt: now,
    updatedBy: user.uid,
  });

  // Log in chatter timeline
  const chatterRef = adminDb.collection(COL.crmCommunications).doc();
  const chatterPayload: CrmChatterItem = {
    id: chatterRef.id,
    leadId: d.leadId,
    activityId: docRef.id,
    type: "activity_log",
    content: `Scheduled activity: ${d.type.toUpperCase()} - "${d.subject}" (Due: ${d.dueDate})`,
    senderId: user.uid,
    senderName: user.name || "User",
    senderEmail: user.email || "",
    isInternal: true,
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
    updatedBy: user.uid,
    isDeleted: false,
  };
  batch.set(chatterRef, chatterPayload);

  await batch.commit();
  revalidatePath(`/crm/leads/${d.leadId}`);
  revalidatePath("/crm");
  return { ok: true, activity: activityPayload };
}

export async function completeLeadActivity(
  activityId: string,
  leadId: string,
  feedback?: string
): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const actRef = adminDb.collection(COL.crmActivities).doc(activityId);
  const actSnap = await actRef.get();
  if (!actSnap.exists) return { ok: false, error: "Activity not found" };

  const actData = actSnap.data() as CrmActivity;
  const now = new Date().toISOString();
  const meta = updateMeta(user);
  const batch = adminDb.batch();

  batch.update(actRef, {
    status: "completed",
    completedAt: now,
    completedBy: user.uid,
    feedback: feedback || "",
    ...meta,
  });

  // Log in chatter
  const chatterRef = adminDb.collection(COL.crmCommunications).doc();
  const chatterPayload: CrmChatterItem = {
    id: chatterRef.id,
    leadId,
    activityId,
    type: "activity_log",
    content: `Activity marked as Done: ${actData.type.toUpperCase()} - "${actData.subject}"${
      feedback ? ` (Feedback: ${feedback})` : ""
    }`,
    senderId: user.uid,
    senderName: user.name || "User",
    senderEmail: user.email || "",
    isInternal: true,
    createdAt: now,
    updatedAt: now,
    createdBy: user.uid,
    updatedBy: user.uid,
    isDeleted: false,
  };
  batch.set(chatterRef, chatterPayload);

  // Check if other planned activities exist
  const remainingSnap = await adminDb
    .collection(COL.crmActivities)
    .where("relatedToId", "==", leadId)
    .where("status", "==", "planned")
    .where("isDeleted", "==", false)
    .get();

  const remaining = remainingSnap.docs.filter((d) => d.id !== activityId);
  let nextStatus: "today" | "overdue" | "planned" | "none" = "none";
  let nextDate = "";

  if (remaining.length > 0) {
    const todayStr = new Date().toISOString().split("T")[0];
    const earliest = remaining.map((d) => d.data() as CrmActivity).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    if (earliest) {
      nextDate = earliest.dueDate;
      nextStatus = earliest.dueDate === todayStr ? "today" : earliest.dueDate < todayStr ? "overdue" : "planned";
    }
  }

  batch.update(adminDb.collection(COL.crmLeads).doc(leadId), {
    activityStatus: nextStatus,
    activityDate: nextDate,
    updatedAt: now,
    updatedBy: user.uid,
  });

  await batch.commit();
  revalidatePath(`/crm/leads/${leadId}`);
  revalidatePath("/crm");
  return { ok: true };
}

export async function updateLeadFullDetails(
  leadId: string,
  raw: LeadDetailUpdateInput
): Promise<Result> {
  const user = await requireModuleEditor("crm");
  const parsed = leadDetailUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lead details" };
  }

  const docRef = adminDb.collection(COL.crmLeads).doc(leadId);
  const snap = await docRef.get();
  if (!snap.exists) return { ok: false, error: "Lead not found" };

  const d = parsed.data;
  const meta = updateMeta(user);
  const batch = adminDb.batch();

  batch.update(docRef, { ...d, ...meta });
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "crm_lead.update_full", "crmLead", leadId, {
      name: d.name,
      expectedRevenue: d.expectedRevenue,
    })
  );

  await batch.commit();
  revalidatePath("/crm");
  revalidatePath(`/crm/leads/${leadId}`);
  return { ok: true };
}


