"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUser, requireModule, requireModuleEditor } from "@/lib/auth/session";
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
import type { Vendor, VendorImage, VendorStatus } from "@/types/models";
import { listVendors } from "@/lib/data/vendors";
import {
  deleteVendorImageFromR2,
  uploadVendorImageToR2,
} from "@/lib/r2/vendor-storage";

type Result = { ok: true; id: string } | { ok: false; error: string };
type StatusResult = { ok: true } | { ok: false; error: string };

const MANAGE: Role[] = ["admin", "manager"];

function prepareVendorDoc(data: VendorFormValues) {
  const imageUrls =
    data.imageUrls && data.imageUrls.length > 0
      ? data.imageUrls
      : data.images?.map((img) => img.url) || [];

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
    email: data.email?.trim().toLowerCase() || "",

    // Location
    address: data.address.trim(),
    state: data.state.trim(),
    pincode: data.pincode?.trim() || "",
    destination: data.destination.trim(),
    locationUrl: data.locationUrl?.trim() || "",

    // Images
    images: data.images || [],
    imageUrls,
  };

  if (data.type === "travels" && data.travelsDetails) {
    const rawBuses = data.travelsDetails.buses || [];
    const buses = rawBuses.map((bus, idx) => {
      const busImgs =
        bus.images && bus.images.length > 0
          ? bus.images
          : bus.image
            ? [bus.image]
            : [];
      const busImgUrls =
        bus.imageUrls && bus.imageUrls.length > 0
          ? bus.imageUrls
          : bus.imageUrl
            ? [bus.imageUrl]
            : busImgs.map((i) => i.url);

      return {
        id: bus.id || `bus-${Date.now()}-${idx}`,
        registrationNumber: bus.registrationNumber.trim().toUpperCase(),
        busType: bus.busType,
        seatingCapacity: Number(bus.seatingCapacity) || 0,
        makeModel: bus.makeModel?.trim() || "",
        amenities: bus.amenities || [],
        driverName: bus.driverName?.trim() || "",
        driverPhone: bus.driverPhone?.trim() || "",
        permitType: bus.permitType || "all_india",
        status: bus.status || "active",
        images: busImgs,
        imageUrls: busImgUrls,
        image: busImgs[0] || null,
        imageUrl: busImgUrls[0] || "",
      };
    });

    const totalBusCount = buses.length;
    const totalSeatCapacity = buses.reduce(
      (sum, b) => sum + (Number(b.seatingCapacity) || 0),
      0,
    );

    const busImageUrls = buses.flatMap((b) => b.imageUrls).filter(Boolean);
    const busImages = buses
      .flatMap((b) => b.images)
      .filter((img): img is VendorImage => Boolean(img));

    return {
      ...base,
      images: busImages.length > 0 ? busImages : base.images,
      imageUrls: busImageUrls.length > 0 ? busImageUrls : base.imageUrls,
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
        tariffRange: data.hotelDetails.tariffRange?.trim() || "",
      },
      travelsDetails: null,
    };
  }

  return base;
}

async function findDuplicateVendor(
  name: string,
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

  return null;
}

async function ensureDestinationPersisted(destName: string) {
  const trimmed = destName.trim();
  if (!trimmed) return;
  const searchName = toSearchName(trimmed);

  const snap = await adminDb
    .collection(COL.destinations)
    .where("isDeleted", "==", false)
    .where("searchName", "==", searchName)
    .limit(1)
    .get();

  if (snap.empty) {
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    await adminDb.collection(COL.destinations).add({
      name: formatted,
      searchName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    });
  }
}

export async function getDestinationsAction(): Promise<string[]> {
  try {
    const snap = await adminDb
      .collection(COL.destinations)
      .where("isDeleted", "==", false)
      .get();

    const fromCol = snap.docs.map((d) => (d.data().name as string) || "").filter(Boolean);

    // Also collect distinct destinations from existing vendors
    const vendorSnap = await adminDb
      .collection(COL.vendors)
      .where("isDeleted", "==", false)
      .get();

    const fromVendors = vendorSnap.docs
      .map((d) => (d.data().destination as string) || "")
      .filter(Boolean);

    const merged = Array.from(new Set([...fromCol, ...fromVendors])).sort();
    return merged;
  } catch (err) {
    console.error("Error fetching destinations:", err);
    return [];
  }
}

export async function saveDestinationAction(name: string): Promise<void> {
  await ensureDestinationPersisted(name);
}

export async function uploadVendorImageAction(
  formData: FormData
): Promise<{ ok: true; image: VendorImage } | { ok: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false, error: "Authentication required" };
    }
    const file = formData.get("file") as File | null;
    const vendorType = (formData.get("vendorType") as "travels" | "hotel") || "travels";

    if (!file) {
      return { ok: false, error: "No file provided" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { objectKey, url } = await uploadVendorImageToR2(
      buffer,
      file.name,
      file.type,
      vendorType
    );

    const image: VendorImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      objectKey,
      url,
      size: file.size,
      contentType: file.type,
      uploadedAt: new Date().toISOString(),
    };

    return { ok: true, image };
  } catch (err: unknown) {
    console.error("Upload vendor image error:", err);
    const msg = err instanceof Error ? err.message : "Failed to upload image";
    return { ok: false, error: msg };
  }
}

export async function deleteVendorImageAction(
  objectKey: string
): Promise<{ ok: boolean }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { ok: false };
    }
    await deleteVendorImageFromR2(objectKey);
    return { ok: true };
  } catch (err) {
    console.error("Delete vendor image error:", err);
    return { ok: false };
  }
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
  await ensureDestinationPersisted(docData.destination);

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
  await ensureDestinationPersisted(docData.destination);

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
