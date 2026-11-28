import { requireModule } from "@/lib/auth/session";
import { listCrmActivities, listCrmEmployees, listCrmStages, listPipelineLeads } from "@/lib/data/crm";
import { CrmKanbanPipeline } from "./crm-kanban-pipeline";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CRM Pipeline | ADN Admin Panel",
};

export default async function CrmPage() {
  await requireModule("crm");
  const [stages, leads, employees, activities] = await Promise.all([
    listCrmStages(),
    listPipelineLeads(),
    listCrmEmployees(),
    listCrmActivities(),
  ]);

  return (
    <CrmKanbanPipeline
      initialStages={stages}
      initialLeads={leads}
      initialEmployees={employees}
      initialActivities={activities}
    />
  );
}

