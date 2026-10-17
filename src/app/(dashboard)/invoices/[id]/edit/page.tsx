import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";
import { getInvoice } from "@/lib/data/invoices";
import { listBookings } from "@/lib/data/bookings";
import { getSettings } from "@/lib/settings";
import { todayIST } from "@/lib/format";
import type { InvoiceBookingOption } from "@/types/models";
import { InvoiceForm } from "../../invoice-form";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["admin", "manager"]);
  const { id } = await params;
  const [invoice, bookings, settings] = await Promise.all([
    getInvoice(id),
    listBookings(),
    getSettings(),
  ]);
  if (!invoice) notFound();

  const options: InvoiceBookingOption[] = bookings.map((booking) => ({
    id: booking.id,
    bookingNo: booking.bookingNo,
    title: booking.title,
    contactName: booking.contactName,
    destination: booking.destination,
    travelStart: booking.travelStart,
    travelEnd: booking.travelEnd,
    memberCount: booking.memberCount,
    totalAmount: booking.totalAmount,
    currency: booking.currency,
    status: booking.status,
  }));

  return (
    <>
      <PageHeader title={`Edit ${invoice.invoiceNo}`} description="Update invoice details and documents." />
      <InvoiceForm
        bookings={options}
        business={{ ...invoice.business, tagline: invoice.business.tagline ?? "" }}
        defaultTax={settings.gst}
        suggestedInvoiceNo={invoice.invoiceNo}
        today={todayIST()}
        invoice={invoice}
      />
    </>
  );
}
