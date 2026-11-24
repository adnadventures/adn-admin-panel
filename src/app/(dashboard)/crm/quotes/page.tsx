import { listCrmQuotes } from "@/lib/data/crm";
import { QuotesView } from "./quotes-view";

export const metadata = {
  title: "Quotes Management | CRM",
};

export default async function QuotesPage() {
  const quotes = await listCrmQuotes();
  return <QuotesView initialQuotes={quotes} />;
}
