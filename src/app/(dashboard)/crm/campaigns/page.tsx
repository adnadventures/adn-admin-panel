import { listCrmCampaigns } from "@/lib/data/crm";
import { CampaignsView } from "./campaigns-view";

export const metadata = {
  title: "Campaigns Management | CRM",
};

export default async function CampaignsPage() {
  const campaigns = await listCrmCampaigns();
  return <CampaignsView initialCampaigns={campaigns} />;
}
