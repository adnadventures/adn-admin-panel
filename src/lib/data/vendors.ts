import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL, serializeDoc } from "@/lib/firestore/helpers";
import type { Vendor, VendorType } from "@/types/models";

function normalizeVendor(v: Vendor): Vendor {
  return {
    ...v,
    tradeName: v.tradeName ?? "",
    alternatePhone: v.alternatePhone ?? "",
    designation: v.designation ?? "",
    pincode: v.pincode ?? "",
    locationUrl: v.locationUrl ?? "",
    gstin: v.gstin ?? "",
    pan: v.pan ?? "",
    bankName: v.bankName ?? "",
    accountNumber: v.accountNumber ?? "",
    accountHolderName: v.accountHolderName ?? "",
    ifscCode: v.ifscCode ?? "",
    upiId: v.upiId ?? "",
    contractStartDate: v.contractStartDate ?? "",
    contractEndDate: v.contractEndDate ?? "",
    notes: v.notes ?? "",
    travelsDetails:
      v.type === "travels" && v.travelsDetails
        ? {
            ...v.travelsDetails,
            operatingRoutes: v.travelsDetails.operatingRoutes ?? [],
            fleetTypes: v.travelsDetails.fleetTypes ?? [],
            buses: (v.travelsDetails.buses ?? []).map((bus) => ({
              ...bus,
              amenities: bus.amenities ?? [],
              status: bus.status ?? "active",
              permitType: bus.permitType ?? "all_india",
              makeModel: bus.makeModel ?? "",
              driverName: bus.driverName ?? "",
              driverPhone: bus.driverPhone ?? "",
              fitnessExpiryDate: bus.fitnessExpiryDate ?? "",
              insuranceExpiryDate: bus.insuranceExpiryDate ?? "",
            })),
            totalBusCount:
              v.travelsDetails.totalBusCount ?? (v.travelsDetails.buses?.length ?? 0),
            totalSeatCapacity:
              v.travelsDetails.totalSeatCapacity ??
              (v.travelsDetails.buses?.reduce(
                (sum, b) => sum + (Number(b.seatingCapacity) || 0),
                0,
              ) ?? 0),
            emergencyContact: v.travelsDetails.emergencyContact ?? "",
          }
        : undefined,
    hotelDetails:
      v.type === "hotel" && v.hotelDetails
        ? {
            ...v.hotelDetails,
            propertyType: v.hotelDetails.propertyType ?? "hotel",
            starRating: v.hotelDetails.starRating ?? 0,
            totalRooms: v.hotelDetails.totalRooms ?? 0,
            roomTypes: v.hotelDetails.roomTypes ?? [],
            amenities: v.hotelDetails.amenities ?? [],
            mealPlans: v.hotelDetails.mealPlans ?? [],
            checkInTime: v.hotelDetails.checkInTime ?? "12:00 PM",
            checkOutTime: v.hotelDetails.checkOutTime ?? "11:00 AM",
            cancellationPolicy: v.hotelDetails.cancellationPolicy ?? "",
            childPolicy: v.hotelDetails.childPolicy ?? "",
            reservationEmail: v.hotelDetails.reservationEmail ?? "",
            frontDeskPhone: v.hotelDetails.frontDeskPhone ?? "",
            tariffRange: v.hotelDetails.tariffRange ?? "",
          }
        : undefined,
  };
}

const read = (snap: FirebaseFirestore.DocumentSnapshot) =>
  normalizeVendor(serializeDoc<Vendor>(snap));

export async function getVendor(id: string): Promise<Vendor | null> {
  const snap = await adminDb.collection(COL.vendors).doc(id).get();
  if (!snap.exists || snap.data()?.isDeleted) return null;
  return read(snap);
}

export async function listVendors(filters?: {
  type?: VendorType | "all";
  status?: string;
}): Promise<Vendor[]> {
  let query: FirebaseFirestore.Query = adminDb
    .collection(COL.vendors)
    .where("isDeleted", "==", false);

  if (filters?.type && filters.type !== "all") {
    query = query.where("type", "==", filters.type);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.where("status", "==", filters.status);
  }

  const snap = await query.get();
  return snap.docs
    .map(read)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listActiveVendors(type?: VendorType): Promise<Vendor[]> {
  let query: FirebaseFirestore.Query = adminDb
    .collection(COL.vendors)
    .where("isDeleted", "==", false)
    .where("status", "==", "active");

  if (type) {
    query = query.where("type", "==", type);
  }

  const snap = await query.get();
  return snap.docs.map(read).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getVendorStats(): Promise<{
  total: number;
  travels: number;
  hotel: number;
  totalBuses: number;
  totalRooms: number;
}> {
  const snap = await adminDb
    .collection(COL.vendors)
    .where("isDeleted", "==", false)
    .get();

  const vendors = snap.docs.map(read);

  let travels = 0;
  let hotel = 0;
  let totalBuses = 0;
  let totalRooms = 0;

  for (const v of vendors) {
    if (v.type === "travels") {
      travels++;
      totalBuses += v.travelsDetails?.buses?.length ?? 0;
    } else if (v.type === "hotel") {
      hotel++;
      totalRooms += v.hotelDetails?.totalRooms ?? 0;
    }
  }

  return {
    total: vendors.length,
    travels,
    hotel,
    totalBuses,
    totalRooms,
  };
}
