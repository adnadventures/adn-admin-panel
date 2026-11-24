import { listCrmCases, listCrmSolutions } from "@/lib/data/crm";
import { CasesView } from "./cases-view";

export const metadata = {
  title: "Cases & Knowledge Base | CRM",
};

export default async function CasesPage() {
  const [cases, solutions] = await Promise.all([listCrmCases(), listCrmSolutions()]);
  return <CasesView initialCases={cases} initialSolutions={solutions} />;
}
