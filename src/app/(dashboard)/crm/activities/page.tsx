import { listCrmActivities } from "@/lib/data/crm";
import { ActivitiesView } from "./activities-view";

export const metadata = {
  title: "Activities & Tasks | CRM",
};

export default async function ActivitiesPage() {
  const activities = await listCrmActivities();
  return <ActivitiesView initialActivities={activities} />;
}
