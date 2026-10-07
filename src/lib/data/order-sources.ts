import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL, serializeDoc } from "@/lib/firestore/helpers";
import type { OrderSource } from "@/types/models";

export async function listOrderSources(): Promise<OrderSource[]> {
  const snap = await adminDb
    .collection(COL.orderSources)
    .where("isDeleted", "==", false)
    .get();

  return snap.docs
    .map((d) => serializeDoc<OrderSource>(d))
    .sort((a, b) => a.name.localeCompare(b.name));
}