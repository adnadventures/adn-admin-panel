import { requireModuleEditor } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { PackageForm } from "../package-form";

export default async function NewPackagePage() {
  await requireModuleEditor("packages", ["admin", "manager"]);
  const settings = await getSettings();

  return (
    <PackageForm
      pkg={null}
      rates={settings.fx.rates}
      showPageHeader
      headerTitle="New package"
      headerDescription="Create a tour package."
      backHref="/packages"
      backLabel="Back to Packages"
    />
  );
}