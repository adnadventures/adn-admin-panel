import { listCrmContacts } from "@/lib/data/crm";
import { ContactsView } from "./contacts-view";

export const metadata = {
  title: "Contacts Management | CRM",
};

export default async function ContactsPage() {
  const contacts = await listCrmContacts();
  return <ContactsView initialContacts={contacts} />;
}
