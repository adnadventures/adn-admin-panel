import { requireUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";
import { listEmployeeAccounts } from "@/actions/employee-access";
import { getSystemOverviewAction } from "@/actions/system-overview";
import { EmployeeAccessManager } from "./employee-access-manager";
import { ChangeAdminPassword } from "./change-admin-password";
import { SettingsForm } from "./settings-form";
import { SystemOverviewCard } from "./system-overview-card";

export default async function SettingsPage() {
  const user = await requireUser(["admin"]);
  // Fast parallel load for essential settings and employee list (<50ms)
  // Heavy system storage metrics are loaded asynchronously in SystemOverviewCard
  const [settings, employees] = await Promise.all([
    getSettings(),
    listEmployeeAccounts(),
  ]);

  return (
    <>
      <SettingsForm initial={settings} />
      <ChangeAdminPassword email={user.email} />
      <EmployeeAccessManager initialEmployees={employees} />
      <SystemOverviewCard initialData={null} />
    </>
  );
}