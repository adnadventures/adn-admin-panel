import { listCrmLeads } from "@/lib/data/crm";
import { LeadsView } from "./leads-view";

export const metadata = {
  title: "Leads Management | CRM",
};

export default async function LeadsPage() {
  const leads = await listCrmLeads();
  return <LeadsView initialLeads={leads} />;
}
