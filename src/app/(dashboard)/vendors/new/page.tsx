import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireModuleEditor } from "@/lib/auth/session";
import { VendorForm } from "../vendor-form";

export default async function NewVendorPage() {
  await requireModuleEditor("vendors", ["admin", "manager"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/vendors"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1" })}
        >
          ← Back to Vendors
        </Link>
      </div>

      <PageHeader
        title="Create New Vendor"
        description="Select the vendor category (Travels or Hotel) to display all necessary business details, contact points, and category-specific management."
      />

      <VendorForm vendor={null} />
    </div>
  );
}
