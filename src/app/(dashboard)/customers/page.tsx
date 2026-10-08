import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";
import { listCustomersPage } from "@/lib/data/customers";
import { CustomersView } from "./customers-view";

export default async function CustomersPage() {
  const user = await requireUser();
  const initial = await listCustomersPage();

  return (
    <>
      <PageHeader title="Customers" description="Search by name or phone number." />
      <CustomersView initial={initial} role={user.role} />
    </>
  );
}