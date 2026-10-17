import { PageHeader } from "@/components/shared/page-header";
import { requireUser } from "@/lib/auth/session";
import { listBookings } from "@/lib/data/bookings";
import { getSettings } from "@/lib/settings";
import { todayIST } from "@/lib/format";
import { suggestInvoiceNumber } from "@/lib/data/invoices";
import type { InvoiceBookingOption } from "@/types/models";
import { InvoiceForm } from "../invoice-form";

export default async function NewInvoicePage() {
  await requireUser(["admin", "manager"]);
  const today = todayIST();
  const [bookings, settings, invoiceNo] = await Promise.all([
    listBookings(),
    getSettings(),
    suggestInvoiceNumber(today),
  ]);
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
      <PageHeader title="Create Invoice" description="Create an invoice manually or prefill it from a booking." />
      <InvoiceForm
        bookings={options}
        business={settings.business}
        defaultTax={settings.gst}
        today={today}
        suggestedInvoiceNo={invoiceNo}
      />
    </>
  );
}
