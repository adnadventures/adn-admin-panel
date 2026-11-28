import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { listTargetsWithProgress } from "@/lib/data/targets";
import { listEmployeesForTarget } from "@/actions/targets";
import { canAccessModule } from "@/components/layout/nav-items";
import { todayIST } from "@/lib/format";
import { TargetsPanel } from "./targets-panel";

export default async function TargetsPage() {
  const user = await requireUser(["admin", "manager", "employee"]);
  if (user.role === "employee" && !canAccessModule(user, "targets")) {
    redirect("/");
  }

  const isManagement = user.role === "admin" || user.role === "manager";
  const today = todayIST();
  const targets = await listTargetsWithProgress(
    user.role === "employee" ? { employeeId: user.uid } : undefined,
  );
  const employees = isManagement ? await listEmployeesForTarget() : [];

  return (
    <TargetsPanel
      targets={targets}
      today={today}
      management={isManagement}
      employees={employees}
      currentUser={{ uid: user.uid, name: user.name, role: user.role }}
    />
  );
}
