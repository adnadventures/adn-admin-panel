import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireModuleEditor } from "@/lib/auth/session";
import { getVendor } from "@/lib/data/vendors";
import { VendorForm } from "../../vendor-form";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireModuleEditor("vendors", ["admin", "manager"]);

  const vendor = await getVendor(id);
  if (!vendor) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={`/vendors/${vendor.id}`}
          className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1" })}
        >
          ← Back to Vendor Details
        </Link>
      </div>

      <PageHeader
        title={`Edit Vendor: ${vendor.name}`}
        description="Update contact, location, tax, and specific fleet or accommodation inventory details."
      />

      <VendorForm vendor={vendor} />
    </div>
  );
}
