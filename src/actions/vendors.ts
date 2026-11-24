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
  toSearchName,
  updateMeta,
} from "@/lib/firestore/helpers";
import {
  vendorFormSchema,
  type VendorFormValues,
} from "@/lib/validators/vendor";
import type { Role } from "@/types/roles";
import type { Vendor, VendorStatus } from "@/types/models";
import { getVendor, listVendors } from "@/lib/data/vendors";

type Result = { ok: true; id: string } | { ok: false; error: string };
type StatusResult = { ok: true } | { ok: false; error: string };

const MANAGE: Role[] = ["admin", "manager"];

function prepareVendorDoc(data: VendorFormValues) {
  const base = {
    type: data.type,
    name: data.name.trim(),
    searchName: toSearchName(data.name),
    tradeName: data.tradeName?.trim() || "",
    status: data.status,

    // Contact
    contactPerson: data.contactPerson.trim(),
    designation: data.designation?.trim() || "",
    phone: data.phone.trim(),
    phoneDigits: data.phone.replace(/\D/g, "").slice(-10),
    alternatePhone: data.alternatePhone?.trim() || "",
    email: data.email.trim().toLowerCase(),

    // Location
    address: data.address.trim(),
    city: data.city.trim(),
    state: data.state.trim(),
    pincode: data.pincode?.trim() || "",
    destination: data.destination.trim(),
    locationUrl: data.locationUrl?.trim() || "",

    // Business & Financial
    gstin: data.gstin?.trim().toUpperCase() || "",
    pan: data.pan?.trim().toUpperCase() || "",
    bankName: data.bankName?.trim() || "",
    accountNumber: data.accountNumber?.trim() || "",
    accountHolderName: data.accountHolderName?.trim() || "",
    ifscCode: data.ifscCode?.trim().toUpperCase() || "",
    upiId: data.upiId?.trim() || "",
    paymentTerms: data.paymentTerms,
    currency: data.currency,

    // Contracts & Notes
    contractStartDate: data.contractStartDate?.trim() || "",
    contractEndDate: data.contractEndDate?.trim() || "",
    notes: data.notes?.trim() || "",
  };

  if (data.type === "travels" && data.travelsDetails) {
    const rawBuses = data.travelsDetails.buses || [];
    const buses = rawBuses.map((bus, idx) => ({
      id: bus.id || `bus-${Date.now()}-${idx}`,
      registrationNumber: bus.registrationNumber.trim().toUpperCase(),
      busType: bus.busType,
      seatingCapacity: Number(bus.seatingCapacity) || 0,
      makeModel: bus.makeModel?.trim() || "",
      amenities: bus.amenities || [],
      driverName: bus.driverName?.trim() || "",
      driverPhone: bus.driverPhone?.trim() || "",
      permitType: bus.permitType || "all_india",
      fitnessExpiryDate: bus.fitnessExpiryDate?.trim() || "",
      insuranceExpiryDate: bus.insuranceExpiryDate?.trim() || "",
      status: bus.status || "active",
    }));

    const totalBusCount = buses.length;
    const totalSeatCapacity = buses.reduce(
      (sum, b) => sum + (Number(b.seatingCapacity) || 0),
      0,
    );

    return {
      ...base,
      travelsDetails: {
        operatingRoutes: data.travelsDetails.operatingRoutes || [],
        fleetTypes: data.travelsDetails.fleetTypes || [],
        buses,
        totalBusCount,
        totalSeatCapacity,
        emergencyContact: data.travelsDetails.emergencyContact?.trim() || "",
      },
      hotelDetails: null,
    };
  }

  if (data.type === "hotel" && data.hotelDetails) {
    return {
      ...base,
      hotelDetails: {
        propertyType: data.hotelDetails.propertyType,
        starRating: Number(data.hotelDetails.starRating) || 0,
        totalRooms: Number(data.hotelDetails.totalRooms) || 0,
        roomTypes: data.hotelDetails.roomTypes || [],
        amenities: data.hotelDetails.amenities || [],
        checkInTime: data.hotelDetails.checkInTime?.trim() || "12:00 PM",
        checkOutTime: data.hotelDetails.checkOutTime?.trim() || "11:00 AM",
        mealPlans: data.hotelDetails.mealPlans || [],
        cancellationPolicy: data.hotelDetails.cancellationPolicy?.trim() || "",
        childPolicy: data.hotelDetails.childPolicy?.trim() || "",
        reservationEmail: data.hotelDetails.reservationEmail?.trim().toLowerCase() || "",
        frontDeskPhone: data.hotelDetails.frontDeskPhone?.trim() || "",
        tariffRange: data.hotelDetails.tariffRange?.trim() || "",
      },
      travelsDetails: null,
    };
  }

  return base;
}

async function findDuplicateVendor(
  name: string,
  phoneDigits: string,
  exceptId?: string,
) {
  const col = adminDb.collection(COL.vendors);
  const searchName = toSearchName(name);

  const nameSnap = await col
    .where("isDeleted", "==", false)
    .where("searchName", "==", searchName)
    .limit(2)
    .get();

  const hitName = nameSnap.docs.find((d) => d.id !== exceptId);
  if (hitName) {
    return `A vendor with this name already exists: "${hitName.data().name}"`;
  }

  if (phoneDigits.length >= 7) {
    const phoneSnap = await col
      .where("isDeleted", "==", false)
      .where("phoneDigits", "==", phoneDigits)
      .limit(2)
      .get();

    const hitPhone = phoneSnap.docs.find((d) => d.id !== exceptId);
    if (hitPhone) {
      return `A vendor with this phone already exists: "${hitPhone.data().name}"`;
    }
  }

  return null;
}

export async function createVendor(input: unknown): Promise<Result> {
  const user = await requireModuleEditor("vendors", MANAGE);

  const parsed = vendorFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const docData = prepareVendorDoc(parsed.data);

  const duplicate = await findDuplicateVendor(
    docData.name,
    docData.phoneDigits,
  );
  if (duplicate) {
    return { ok: false, error: duplicate };
  }

  const ref = adminDb.collection(COL.vendors).doc();
  const batch = adminDb.batch();

  batch.set(ref, {
    ...docData,
    ...createMeta(user),
  });

  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "vendor.create", "vendor", ref.id, {
      name: docData.name,
      type: docData.type,
      status: docData.status,
    }),
  );

  await batch.commit();

  revalidatePath("/vendors");
  revalidatePath("/");
  return { ok: true, id: ref.id };
}

export async function updateVendor(
  id: string,
  input: unknown,
): Promise<Result> {
  const user = await requireModuleEditor("vendors", MANAGE);

  const parsed = vendorFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const ref = adminDb.collection(COL.vendors).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.isDeleted) {
    return { ok: false, error: "Vendor not found" };
  }

  const docData = prepareVendorDoc(parsed.data);

  const duplicate = await findDuplicateVendor(
    docData.name,
    docData.phoneDigits,
    id,
  );
  if (duplicate) {
    return { ok: false, error: duplicate };
  }

  const batch = adminDb.batch();

  batch.set(
    ref,
    {
      ...docData,
      ...updateMeta(user),
    },
    { merge: true },
  );

  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "vendor.update", "vendor", id, {
      name: docData.name,
      type: docData.type,
      status: docData.status,
    }),
  );

  await batch.commit();

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  revalidatePath(`/vendors/${id}/edit`);
  revalidatePath("/");
  return { ok: true, id };
}

export async function deleteVendor(id: string): Promise<StatusResult> {
  const user = await requireModuleEditor("vendors", MANAGE);

  const ref = adminDb.collection(COL.vendors).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.isDeleted) {
    return { ok: false, error: "Vendor not found" };
  }

  const current = serializeDoc<Vendor>(snap);

  const batch = adminDb.batch();
  batch.update(ref, deleteMeta(user));
  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "vendor.delete", "vendor", id, {
      name: current.name,
      type: current.type,
    }),
  );

  await batch.commit();

  revalidatePath("/vendors");
  revalidatePath("/");
  return { ok: true };
}

export async function setVendorStatus(
  id: string,
  status: VendorStatus,
): Promise<StatusResult> {
  const user = await requireModuleEditor("vendors", MANAGE);

  const ref = adminDb.collection(COL.vendors).doc(id);
  const snap = await ref.get();
  if (!snap.exists || snap.data()?.isDeleted) {
    return { ok: false, error: "Vendor not found" };
  }

  const batch = adminDb.batch();
  batch.update(ref, {
    status,
    ...updateMeta(user),
  });

  batch.set(
    adminDb.collection(COL.auditLogs).doc(),
    auditEntry(user, "vendor.status", "vendor", id, { status }),
  );

  await batch.commit();

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  return { ok: true };
}

export async function fetchVendors(
  filters?: {
    type?: Vendor["type"] | "all";
    status?: string;
  },
) {
  await requireModule("vendors");
  return listVendors(filters);
}
