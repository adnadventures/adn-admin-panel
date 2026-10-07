import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";
import { listOrderSources } from "@/lib/data/order-sources";
import { OrderSourcesTable } from "./order-sources-table";

export default async function OrderSourcesPage() {
  await requireUser(["admin", "manager"]);
  const sources = await listOrderSources();

  return (
    <>
      <PageHeader
        title="Order Sources"
        description="Where your bookings come from. Used in analytics to see which channels work."
      />
      <OrderSourcesTable data={sources} />
    </>
  );
}