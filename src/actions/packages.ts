"use server";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/session";
import { toMinor } from "@/lib/finance/currency";
import {
  COL, auditEntry, createMeta, deleteMeta, toSearchName, updateMeta,
} from "@/lib/firestore/helpers";
import {
  packageInputSchema, packageStatusSchema, type PackageInput,
} from "@/lib/validators/package";
import type { Role } from "@/types/roles";
import { FieldValue } from "firebase-admin/firestore";

type Result = { ok: true; id: string } | { ok: false; error: string };
const MANAGE: Role[] = ["admin", "manager"];

function toDoc(d: PackageInput) {
  const base = toMinor(d.price);
  return {
    name: d.name,
    searchName: toSearchName(d.name),
    destination: d.destination,
    days: d.days,
    nights: d.nights,
    groupType: d.groupType,
    minPersons: d.minPersons,
    maxPersons: d.maxPersons,
    price: { currency: d.currency, amount: base }, // base per-person price
    priceTiers: [
      { fromPersons: d.minPersons, amount: base },
      ...d.extraTiers.map((t) => ({ fromPersons: t.fromPersons, amount: toMinor(t.price) })),
    ],
    inclusions: d.inclusions,
    exclusions: d.exclusions,
    itinerary: d.itinerary.map((x, i) => ({ day: i + 1, title: x.title, description: x.description })),
    status: d.status,
  };
}

async function nameTaken(searchName: string, exceptId?: string) {
  const snap = await adminDb
    .collection(COL.packages)
    .where("searchName", "==", searchName)
    .where("isDeleted", "==", false)
    .get();
  return snap.docs.some((d) => d.id !== exceptId);
}

const NEEDS_PRICE = "Set a price above 0 before making a package Active";

export async function createPackage(input: unknown): Promise<Result> {
  const user = await requireUser(MANAGE);

  const parsed = packageInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const doc = toDoc(parsed.data);
  if (doc.status === "active" && doc.price.amount <= 0) return { ok: false, error: NEEDS_PRICE };
  if (await nameTaken(doc.searchName)) {
    return { ok: false, error: "A package with this name already exists" };
  }

  const ref = adminDb.collection(COL.packages).doc();
  const batch = adminDb.batch();
  batch.set(ref, { ...doc, ...createMeta(user) });
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "package.create", "package", ref.id, {
      name: doc.name, status: doc.status, price: doc.price,
    }),
  );
  await batch.commit();

  revalidatePath("/packages");
  return { ok: true, id: ref.id };
}

export async function updatePackage(id: string, input: unknown): Promise<Result> {
  const user = await requireUser(MANAGE);

  const parsed = packageInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const ref = adminDb.collection(COL.packages).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.isDeleted) return { ok: false, error: "Package not found" };

  const doc = toDoc(parsed.data);
  if (doc.status === "active" && doc.price.amount <= 0) return { ok: false, error: NEEDS_PRICE };
  if (await nameTaken(doc.searchName, id)) {
    return { ok: false, error: "A package with this name already exists" };
  }

  const batch = adminDb.batch();
  batch.update(ref, { ...doc, priceBasis: FieldValue.delete(), ...updateMeta(user) });
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "package.update", "package", id, {
      before: { name: snap.data()?.name, price: snap.data()?.price, status: snap.data()?.status },
      after: { name: doc.name, price: doc.price, status: doc.status },
    }),
  );
  await batch.commit();

  revalidatePath("/packages");
  revalidatePath(`/packages/${id}`);
  return { ok: true, id };
}

export async function setPackageStatus(id: string, status: unknown): Promise<Result> {
  const user = await requireUser(MANAGE);

  const parsedStatus = packageStatusSchema.safeParse(status);
  if (!parsedStatus.success) return { ok: false, error: "Invalid status" };

  const ref = adminDb.collection(COL.packages).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.isDeleted) return { ok: false, error: "Package not found" };

  if (parsedStatus.data === "active" && !(snap.data()?.price?.amount > 0)) {
    return { ok: false, error: NEEDS_PRICE };
  }

  const batch = adminDb.batch();
  batch.update(ref, { status: parsedStatus.data, ...updateMeta(user) });
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "package.status", "package", id, {
      from: snap.data()?.status, to: parsedStatus.data,
    }),
  );
  await batch.commit();

  revalidatePath("/packages");
  revalidatePath(`/packages/${id}`);
  return { ok: true, id };
}

export async function deletePackage(id: string): Promise<Result> {
  const user = await requireUser(MANAGE);

  const ref = adminDb.collection(COL.packages).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.isDeleted) return { ok: false, error: "Package not found" };

  const used = await adminDb.collection(COL.bookings).where("packageId", "==", id).limit(1).get();
  if (!used.empty) {
    return { ok: false, error: "Bookings use this package. Archive it instead of deleting." };
  }

  const batch = adminDb.batch();
  batch.update(ref, deleteMeta(user));
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "package.delete", "package", id, { name: snap.data()?.name }),
  );
  await batch.commit();

  revalidatePath("/packages");
  return { ok: true, id };
}