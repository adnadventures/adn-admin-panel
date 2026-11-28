import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { COL, serializeDoc } from "@/lib/firestore/helpers";
import type { Booking, Member } from "@/types/models";

export async function listBookings(): Promise<Booking[]> {
  const snap = await adminDb.collection(COL.bookings).where("isDeleted", "==", false).get();
  const all = snap.docs.map((d) => serializeDoc<Booking>(d));
  const live = all
    .filter((b) => b.status === "open" || b.status === "closed")
    .sort((a, b) => a.travelStart.localeCompare(b.travelStart)); // soonest first
  const past = all
    .filter((b) => b.status === "completed" || b.status === "cancelled")
    .sort((a, b) => b.travelStart.localeCompare(a.travelStart));
  return [...live, ...past];
}

/**
 * Lightweight projection used only for dashboard aggregation.
 * Avoids fetching large fields like notes, itinerary, description, attachments.
 */
export async function listBookingsForDashboard(): Promise<Booking[]> {
  const snap = await adminDb.collection(COL.bookings)
    .where("isDeleted", "==", false)
    .select(
      "id", "status", "travelStart", "memberCount", "maxPersons",
      "currency", "totalAmount", "packageId", "bookingNo", "title",
      "destination", "createdBy", "isDeleted"
    )
    .get();
  const all = snap.docs.map((d) => serializeDoc<Booking>(d));
  const live = all
    .filter((b) => b.status === "open" || b.status === "closed")
    .sort((a, b) => a.travelStart.localeCompare(b.travelStart));
  const past = all
    .filter((b) => b.status === "completed" || b.status === "cancelled")
    .sort((a, b) => b.travelStart.localeCompare(a.travelStart));
  return [...live, ...past];
}

export async function getBooking(id: string): Promise<Booking | null> {
  const snap = await adminDb.collection(COL.bookings).doc(id).get();
  if (!snap.exists || snap.data()?.isDeleted) return null;
  return serializeDoc<Booking>(snap);
}

export async function listMembers(bookingId: string): Promise<Member[]> {
  const snap = await adminDb.collection(COL.bookings).doc(bookingId).collection("members").get();
  return snap.docs
    .map((d) => serializeDoc<Member>(d))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}