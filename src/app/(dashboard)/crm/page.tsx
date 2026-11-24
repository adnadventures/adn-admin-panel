import { listCrmStages, listPipelineLeads } from "@/lib/data/crm";
import { CrmKanbanPipeline } from "./crm-kanban-pipeline";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CRM Pipeline | ADN Admin Panel",
};

export default async function CrmPage() {
  const [stages, leads] = await Promise.all([
    listCrmStages(),
    listPipelineLeads(),
  ]);

  return <CrmKanbanPipeline initialStages={stages} initialLeads={leads} />;
}

