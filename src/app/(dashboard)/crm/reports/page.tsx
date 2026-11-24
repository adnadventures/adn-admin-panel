import { getCrmDashboardStats } from "@/lib/data/crm";
import { ReportsView } from "./reports-view";

export const metadata = {
  title: "CRM Analytics & Reports",
};

export default async function ReportsPage() {
  const stats = await getCrmDashboardStats();
  return <ReportsView stats={stats} />;
}
