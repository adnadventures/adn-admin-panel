import Link from "next/link";
<<<<<<< HEAD
=======
import { FilePlus2 } from "lucide-react";
>>>>>>> d644832e8d57e8b947621595736c63fc395104ee
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireModule } from "@/lib/auth/session";
import { listInvoices } from "@/lib/data/invoices";
import { todayIST } from "@/lib/format";
import { canManageAssignedModules } from "@/types/roles";
import { InvoiceSearch } from "./invoice-search";

export default async function InvoicesPage() {
  const user = await requireModule("invoices");
  const invoices = await listInvoices();
  const canManage = canManageAssignedModules(user);

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create and manage travel invoices, payments, and supporting documents."
        actions={
          canManage ? (
            <Link href="/invoices/new" className={buttonVariants()}>
<<<<<<< HEAD
              + Create Invoice
=======
              <FilePlus2 className="mr-2 size-4" /> Create Invoice
>>>>>>> d644832e8d57e8b947621595736c63fc395104ee
            </Link>
          ) : undefined
        }
      />
      <InvoiceSearch invoices={invoices} canManage={canManage} today={todayIST()} />
    </>
  );
}
