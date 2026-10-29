import { PageHeader } from "@/components/shared/page-header";
import { requireModule } from "@/lib/auth/session";
import { listBookings } from "@/lib/data/bookings";
import { BookingsTable } from "./bookings-table";

export default async function BookingsPage() {
  const user = await requireModule("bookings");
  const bookings = await listBookings();

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Group bookings. Add members one by one until the booking closes."
      />
      <BookingsTable data={bookings} canManage={user.role === "admin" || user.role === "manager"} />
    </>
  );
}