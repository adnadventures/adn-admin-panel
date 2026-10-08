import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";
import { listActivePackages } from "@/lib/data/packages";
import { BookingForm } from "../booking-form";

export default async function NewBookingPage() {
  await requireUser(["admin", "manager"]);
  const packages = await listActivePackages();

  return (
    <>
      <PageHeader title="New booking" description="Set up the trip. You add members on the next screen." />
      <BookingForm packages={packages} booking={null} />
    </>
  );
}