import { listCrmAccounts } from "@/lib/data/crm";
import { AccountsView } from "./accounts-view";

export const metadata = {
  title: "Accounts Management | CRM",
};

export default async function AccountsPage() {
  const accounts = await listCrmAccounts();
  return <AccountsView initialAccounts={accounts} />;
}
