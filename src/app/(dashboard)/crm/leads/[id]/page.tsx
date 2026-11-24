import { notFound } from "next/navigation";
import { getLeadDetailWithChatter, listCrmStages } from "@/lib/data/crm";
import { LeadDetailView } from "./lead-detail-view";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lead Details | ADN Admin Panel",
};

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [{ lead, chatter, activities }, stages] = await Promise.all([
    getLeadDetailWithChatter(id),
    listCrmStages(),
  ]);

  if (!lead) {
    notFound();
  }

  return (
    <LeadDetailView
      initialLead={lead}
      stages={stages}
      initialChatter={chatter}
      initialActivities={activities}
    />
  );
}
