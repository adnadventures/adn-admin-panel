import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL, serializeDoc } from "@/lib/firestore/helpers";
import type { TravelPackage } from "@/types/models";

const newestFirst = (a: TravelPackage, b: TravelPackage) =>
  b.createdAt.localeCompare(a.createdAt);

export async function listPackages(): Promise<TravelPackage[]> {
  const snap = await adminDb.collection(COL.packages).where("isDeleted", "==", false).get();
  return snap.docs.map((d) => serializeDoc<TravelPackage>(d)).sort(newestFirst);
}

/** For the booking form in Phase 6 */
export async function listActivePackages(): Promise<TravelPackage[]> {
  const snap = await adminDb
    .collection(COL.packages)
    .where("isDeleted", "==", false)
    .where("status", "==", "active")
    .get();
  return snap.docs
    .map((d) => serializeDoc<TravelPackage>(d))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPackage(id: string): Promise<TravelPackage | null> {
  const snap = await adminDb.collection(COL.packages).doc(id).get();
  if (!snap.exists || snap.data()?.isDeleted) return null;
  return serializeDoc<TravelPackage>(snap);
}