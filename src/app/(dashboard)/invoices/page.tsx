import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listInvoices } from "@/lib/data/invoices";
import { formatMoney } from "@/lib/finance/currency";
import { formatDate } from "@/lib/format";

const statusLabels = {
  draft: "Draft",
  sent: "Unpaid",
  partially_paid: "Partially paid",
  paid: "Paid",
  cancelled: "Cancelled",
} as const;

export default async function InvoicesPage() {
  const user = await requireUser();
  const invoices = await listInvoices();
  const canManage = user.role === "admin" || user.role === "manager";

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Create and manage travel invoices, payments, and supporting documents."
        actions={canManage ? (
          <Link href="/invoices/new" className={buttonVariants()}>
            <FilePlus2 className="mr-2 size-4" /> Create Invoice
          </Link>
        ) : undefined}
      />

      {invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center sm:p-12">
          <h2 className="text-lg font-semibold">No invoices yet</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a manual invoice or start with an existing booking.
          </p>
          {canManage && (
            <Link href="/invoices/new" className={`${buttonVariants()} mt-4`}>
              <FilePlus2 className="mr-2 size-4" /> Create your first invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[740px] text-left text-sm">
            <thead className="bg-muted/70 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/invoices/${invoice.id}`} className="text-primary underline-offset-4 hover:underline">
                      {invoice.invoiceNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>{invoice.customer.name}</div>
                    <div className="text-muted-foreground text-xs">{invoice.customer.phone}</div>
                  </td>
                  <td className="px-4 py-3">{invoice.tripDestination}</td>
                  <td className="px-4 py-3">{formatDate(invoice.issueDate)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(invoice.total, invoice.currency)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                      {statusLabels[invoice.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
