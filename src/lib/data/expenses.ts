import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL, serializeDoc } from "@/lib/firestore/helpers";
import type { FinanceExpense } from "@/types/models";

export async function listExpenses(): Promise<FinanceExpense[]> {
  const snapshot = await adminDb.collection(COL.transactions)
    .where("isDeleted", "==", false)
    .where("type", "==", "expense")
    .get();
  return snapshot.docs
    .map((doc) => serializeDoc<FinanceExpense>(doc))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getExpense(id: string): Promise<FinanceExpense | null> {
  const snapshot = await adminDb.collection(COL.transactions).doc(id).get();
  if (!snapshot.exists || snapshot.data()?.isDeleted || snapshot.data()?.type !== "expense") {
    return null;
  }
  return serializeDoc<FinanceExpense>(snapshot);
}
