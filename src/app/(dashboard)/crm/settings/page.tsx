import { getCrmSettings } from "@/lib/data/crm";
import { SettingsView } from "./settings-view";

export const metadata = {
  title: "CRM Settings",
};

export default async function SettingsPage() {
  const settings = await getCrmSettings();
  return <SettingsView initialSettings={settings} />;
}
