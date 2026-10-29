import { PageHeader } from "@/components/shared/page-header";
import { requireModule } from "@/lib/auth/session";
import { listPackages } from "@/lib/data/packages";
import { getSettings } from "@/lib/settings";
import { PackagesTable } from "./packages-table";

export default async function PackagesPage() {
  const user = await requireModule("packages");
  const [packages, settings] = await Promise.all([listPackages(), getSettings()]);

  return (
    <>
      <PageHeader
        title="Packages"
        description="Tour packages you sell. Only Active packages can be booked."
      />
      <PackagesTable
        data={packages}
        rates={settings.fx.rates}
        canManage={user.role === "admin" || user.role === "manager"}
      />
    </>
  );
}