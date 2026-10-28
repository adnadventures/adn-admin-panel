import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";
import { listBookings } from "@/lib/data/bookings";
import { todayIST } from "@/lib/format";
import { BookingsAnalytics } from "./bookings-analytics";

export default async function Page() {
  await requireUser(["admin", "manager"]);
  const bookings = await listBookings();
  const reportBookings = bookings.map((booking) => ({
    id: booking.id,
    bookingNo: booking.bookingNo,
    title: booking.title,
    destination: booking.destination,
    packageName: booking.packageName,
    travelStart: booking.travelStart,
    travelEnd: booking.travelEnd,
    currency: booking.currency,
    status: booking.status,
    memberCount: booking.status === "cancelled" ? 0 : booking.memberCount,
    totalAmount: booking.status === "cancelled" ? 0 : booking.totalAmount,
  }));

  return (
    <>
      <PageHeader
        title="Bookings analytics"
        description="Review booking volume, traveler counts, revenue, status, and popular destinations."
      />
      <BookingsAnalytics bookings={reportBookings} today={todayIST()} />
    </>
  );
}
