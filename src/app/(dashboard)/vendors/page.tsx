import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireModule } from "@/lib/auth/session";
import { getVendorStats, listVendors } from "@/lib/data/vendors";
import { canManageAssignedModules } from "@/types/roles";
import { VendorsView } from "./vendors-view";

export default async function VendorsPage() {
  const user = await requireModule("vendors");
  const canManage = canManageAssignedModules(user);

  const [vendors, stats] = await Promise.all([
    listVendors(),
    getVendorStats(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors Management"
        description="Create and manage your verified Travels (fleet & buses) and Hotel (inventory & rooms) service partners."
        actions={
          canManage ? (
            <Link href="/vendors/new" className={buttonVariants({ className: "gap-2" })}>
              + Add Vendor
            </Link>
          ) : undefined
        }
      />

      <VendorsView vendors={vendors} stats={stats} canManage={canManage} />
    </div>
  );
}
