import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  await requireUser(["admin"]);
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details, GST and currency conversion"
      />
      <SettingsForm initial={settings} />
    </>
  );
}