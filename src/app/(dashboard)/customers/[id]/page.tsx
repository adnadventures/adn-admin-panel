import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getCustomer } from "@/lib/data/customers";
import { formatDate } from "@/lib/format";
import { CustomerActions } from "./customer-actions";
import { IdProofs } from "./id-proofs";

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm whitespace-pre-line">{value || "—"}</p>
    </div>
  );
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <>
      <PageHeader
        title={customer.name}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        actions={<CustomerActions customer={customer} role={user.role} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" value={customer.phone} />
            <Field label="Email" value={customer.email} />
            <Field label="Country" value={customer.country} />
            <div className="sm:col-span-2"><Field label="Address" value={customer.address} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ID proofs</CardTitle></CardHeader>
          <CardContent>
            <IdProofs customerId={customer.id} docs={customer.idDocs} canReveal={user.role !== "staff"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><Field label="" value={customer.notes} /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bookings and payments</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Booking history will appear here once the Bookings module is built.
          </CardContent>
        </Card>
      </div>
    </>
  );
}