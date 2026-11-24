import { listCrmDeals } from "@/lib/data/crm";
import { DealsView } from "./deals-view";

export const metadata = {
  title: "Deals & Pipeline | CRM",
};

export default async function DealsPage() {
  const deals = await listCrmDeals();
  return <DealsView initialDeals={deals} />;
}
