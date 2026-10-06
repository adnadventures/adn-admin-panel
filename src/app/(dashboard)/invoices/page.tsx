import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser();
  return <PageHeader title="Invoices" description="Coming soon" />;
}
