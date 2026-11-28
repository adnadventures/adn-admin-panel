import { requireModuleEditor } from "@/lib/auth/session";
import { listActivePackages } from "@/lib/data/packages";
import { listVendors } from "@/lib/data/vendors";
import { todayIST } from "@/lib/format";
import { BookingForm } from "../booking-form";

export default async function NewBookingPage() {
  await requireModuleEditor("bookings", ["admin", "manager"]);
  const [packages, vendors] = await Promise.all([
    listActivePackages(),
    listVendors({ status: "active" }),
  ]);

  return (
    <BookingForm
      packages={packages}
      booking={null}
      defaultCloseDate={todayIST()}
      vendors={vendors}
      showPageHeader
      headerTitle="New booking"
      headerDescription="Set up the trip. You add members on the next screen."
      backHref="/bookings"
      backLabel="Back to Bookings"
    />
  );
}