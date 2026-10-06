import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";

export default async function Page() {
  await requireUser(["admin", "manager"]);
  return <PageHeader title="Order-sources" description="Coming soon" />;
}
