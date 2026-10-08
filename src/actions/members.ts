"use server";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/session";
import { blockReason } from "@/lib/booking-utils";
import { toMinor } from "@/lib/finance/currency";
import {
  COL, auditEntry, createMeta, toSearchName, updateMeta,
} from "@/lib/firestore/helpers";
import { memberInputSchema, type MemberInput } from "@/lib/validators/booking";
import type { AgeCategory, BookingStatus, PerCategory } from "@/types/models";

type Result = { ok: true } | { ok: false; error: string; duplicate?: boolean };

class UserError extends Error {}
function fail(e: unknown): Result {
  if (e instanceof UserError) return { ok: false, error: e.message };
  throw e;
}

type BookingRaw = {
  isDeleted: boolean; status: BookingStatus; closeDate: string;
  memberCount: number; minPersons: number; maxPersons: number; rates: PerCategory;
};
type MemberRaw = {
  status: "active" | "cancelled"; category: AgeCategory; price: number;
  sourceId: string; sourceName: string; name: string;
};

const bookingDoc = (id: string) => adminDb.collection(COL.bookings).doc(id);


function memberFields(d: MemberInput) {
  return {
    gender: d.gender,
    category: d.category,
    age: d.age === "" ? null : Number(d.age),
    note: d.note,
  };
}

function activeSource(s: FirebaseFirestore.DocumentSnapshot) {
  const x = s.data();
  if (!s.exists || !x || x.isDeleted || !x.active) throw new UserError("Choose an active order source");
  return x.name as string;
}

export async function addMember(bookingId: string, input: unknown, force = false): Promise<Result> {
  const user = await requireUser(); // staff, manager and admin
  const parsed = memberInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const price = toMinor(d.price);

  // A new customer with a phone number we already know: warn before creating a duplicate
  if (!d.customerId && !force) {
    const digits = d.phone.replace(/\D/g, "").slice(-10);
    if (digits.length >= 7) {
      const hit = await adminDb
        .collection(COL.customers)
        .where("isDeleted", "==", false)
        .where("phoneDigits", "==", digits)
        .limit(1)
        .get();
      if (!hit.empty) {
        return {
          ok: false,
          duplicate: true,
          error: `A customer with this phone already exists: ${hit.docs[0].data().name}. Search and pick them instead.`,
        };
      }
    }
  }

  try {
    await adminDb.runTransaction(async (tx) => {
      const bRef = bookingDoc(bookingId);
      const cRef = d.customerId
        ? adminDb.collection(COL.customers).doc(d.customerId)
        : adminDb.collection(COL.customers).doc();

      const [bSnap, sSnap, cSnap, dupSnap] = await Promise.all([
        tx.get(bRef),
        tx.get(adminDb.collection(COL.orderSources).doc(d.sourceId)),
        d.customerId ? tx.get(cRef) : Promise.resolve(null),
        d.customerId
          ? tx.get(
              bRef.collection("members")
                .where("customerId", "==", d.customerId)
                .where("status", "==", "active")
                .limit(1),
            )
          : Promise.resolve(null),
      ]);

      const b = bSnap.data() as BookingRaw | undefined;
      if (!bSnap.exists || !b || b.isDeleted) throw new UserError("Booking not found");
      const reason = blockReason(b);
      if (reason) throw new UserError(reason);
      const sourceName = activeSource(sSnap);

      // ---- who is this member? ----
      let name = d.name;
      let phone = d.phone;
      if (d.customerId) {
        const c = cSnap?.data();
        if (!cSnap?.exists || !c || c.isDeleted) throw new UserError("Customer not found");
        if (dupSnap && !dupSnap.empty) throw new UserError(`${c.name} is already in this booking`);
        name = c.name;
        phone = c.phone ?? "";
      } else {
        tx.set(cRef, {
          name: d.name,
          searchName: toSearchName(d.name),
          phone: d.phone,
          phoneDigits: d.phone.replace(/\D/g, "").slice(-10),
          email: d.email.toLowerCase(),
          country: "India",
          address: "",
          notes: "",
          idDocs: [],
          ...createMeta(user),
        });
        tx.set(
          adminDb.collection(COL.auditLogs).doc(),
          auditEntry(user, "customer.create", "customer", cRef.id, {
            name: d.name, via: "booking", bookingId,
          }),
        );
      }

      const mRef = bRef.collection("members").doc();
      tx.set(mRef, {
        bookingId,
        customerId: cRef.id,
        name,
        searchName: toSearchName(name),
        phone,
        ...memberFields(d),
        sourceId: d.sourceId,
        sourceName,
        price,
        priceOverridden: price !== b.rates[d.category],
        status: "active",
        ...createMeta(user),
      });
      tx.update(bRef, {
        memberCount: FieldValue.increment(1),
        [`counts.${d.category}`]: FieldValue.increment(1),
        totalAmount: FieldValue.increment(price),
        ...updateMeta(user),
      });
      tx.set(
        adminDb.collection(COL.auditLogs).doc(),
        auditEntry(user, "member.add", "booking", bookingId, {
          memberId: mRef.id, customerId: cRef.id, name, category: d.category, price,
        }),
      );
    });
    revalidatePath("/bookings");
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath("/customers");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateMember(bookingId: string, memberId: string, input: unknown): Promise<Result> {
  const user = await requireUser();
  const parsed = memberInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  const price = toMinor(d.price);

  try {
    await adminDb.runTransaction(async (tx) => {
      const bRef = bookingDoc(bookingId);
      const mRef = bRef.collection("members").doc(memberId);
      const [bSnap, mSnap, sSnap] = await Promise.all([
        tx.get(bRef), tx.get(mRef), tx.get(adminDb.collection(COL.orderSources).doc(d.sourceId)),
      ]);
      const b = bSnap.data() as BookingRaw | undefined;
      const m = mSnap.data() as MemberRaw | undefined;
      if (!bSnap.exists || !b || b.isDeleted) throw new UserError("Booking not found");
      if (!mSnap.exists || !m) throw new UserError("Member not found");
      if (b.status === "completed" || b.status === "cancelled") {
        throw new UserError("A completed or cancelled booking can't be changed");
      }
      if (m.status !== "active") throw new UserError("Cancelled members can't be edited");

      const sourceName = m.sourceId === d.sourceId ? m.sourceName : activeSource(sSnap);

      tx.update(mRef, {
        ...memberFields(d),
        sourceId: d.sourceId,
        sourceName,
        price,
        priceOverridden: price !== b.rates[d.category],
        ...updateMeta(user),
      });

      const bUpdate: Record<string, unknown> = {
        totalAmount: FieldValue.increment(price - m.price),
        ...updateMeta(user),
      };
      if (m.category !== d.category) {
        bUpdate[`counts.${m.category}`] = FieldValue.increment(-1);
        bUpdate[`counts.${d.category}`] = FieldValue.increment(1);
      }
      tx.update(bRef, bUpdate);
      tx.set(
        adminDb.collection(COL.auditLogs).doc(),
        auditEntry(user, "member.update", "booking", bookingId, {
          memberId, name: m.name, oldPrice: m.price, newPrice: price,
          oldCategory: m.category, newCategory: d.category,
        }),
      );
    });
    revalidatePath("/bookings");
    revalidatePath(`/bookings/${bookingId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Frees the slot but keeps the record. Admin and Manager only. */
export async function cancelMember(bookingId: string, memberId: string): Promise<Result> {
  const user = await requireUser(["admin", "manager"]);

  try {
    await adminDb.runTransaction(async (tx) => {
      const bRef = bookingDoc(bookingId);
      const mRef = bRef.collection("members").doc(memberId);
      const [bSnap, mSnap] = await Promise.all([tx.get(bRef), tx.get(mRef)]);
      const m = mSnap.data() as MemberRaw | undefined;
      if (!bSnap.exists || bSnap.data()?.isDeleted) throw new UserError("Booking not found");
      if (!mSnap.exists || !m) throw new UserError("Member not found");
      if (m.status !== "active") throw new UserError("Member is already cancelled");

      tx.update(mRef, { status: "cancelled", ...updateMeta(user) });
      tx.update(bRef, {
        memberCount: FieldValue.increment(-1),
        [`counts.${m.category}`]: FieldValue.increment(-1),
        totalAmount: FieldValue.increment(-m.price),
        ...updateMeta(user),
      });
      tx.set(
        adminDb.collection(COL.auditLogs).doc(),
        auditEntry(user, "member.cancel", "booking", bookingId, { memberId, name: m.name, price: m.price }),
      );
    });
    revalidatePath("/bookings");
    revalidatePath(`/bookings/${bookingId}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}