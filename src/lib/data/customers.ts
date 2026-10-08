import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { COL, serializeDoc } from "@/lib/firestore/helpers";
import type { Customer } from "@/types/models";

const PAGE_SIZE = 20;
export type CustomersPage = { items: Customer[]; nextCursor: string | null };

/** Strips the encrypted ID numbers so they can never reach the browser */
export function toCustomer(snap: FirebaseFirestore.DocumentSnapshot): Customer {
  const c = serializeDoc<Customer & { idDocs?: Array<Record<string, string>> }>(snap);
  return {
    ...c,
    idDocs: (c.idDocs ?? []).map((d) => ({
      id: d.id,
      type: d.type as Customer["idDocs"][number]["type"],
      last4: d.last4,
    })),
  };
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const snap = await adminDb.collection(COL.customers).doc(id).get();
  if (!snap.exists || snap.data()?.isDeleted) return null;
  return toCustomer(snap);
}

/**
 * Alphabetical, prefix search on name. If the search is 3+ digits it searches phone instead.
 * cursor = "<last value>|<last doc id>"
 */
export async function listCustomersPage(rawQuery = "", cursor?: string | null): Promise<CustomersPage> {
  const q = rawQuery.trim().toLowerCase();
  const digits = q.replace(/[\s+-]/g, "");
  const byPhone = /^\d{3,}$/.test(digits);
  const field = byPhone ? "phoneDigits" : "searchName";
  const term = byPhone ? digits : q;

  let query: FirebaseFirestore.Query = adminDb
    .collection(COL.customers)
    .where("isDeleted", "==", false)
    .orderBy(field)
    .orderBy(FieldPath.documentId());

  if (term) query = query.where(field, ">=", term).where(field, "<", term + "\uf8ff");

  if (cursor) {
    const i = cursor.lastIndexOf("|");
    query = query.startAfter(cursor.slice(0, i), cursor.slice(i + 1));
  }

  const snap = await query.limit(PAGE_SIZE + 1).get();
  const docs = snap.docs.slice(0, PAGE_SIZE);
  const last = docs[docs.length - 1];

  return {
    items: docs.map(toCustomer),
    nextCursor: snap.docs.length > PAGE_SIZE && last ? `${last.get(field)}|${last.id}` : null,
  };
}