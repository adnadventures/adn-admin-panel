import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth/session";
import { getVendor } from "@/lib/data/vendors";
import { canManageAssignedModules } from "@/types/roles";
import { VendorDetailView } from "../vendor-detail-view";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireModule("vendors");
  const canManage = canManageAssignedModules(user);

  const vendor = await getVendor(id);
  if (!vendor) notFound();

  return <VendorDetailView vendor={vendor} canManage={canManage} />;
}
