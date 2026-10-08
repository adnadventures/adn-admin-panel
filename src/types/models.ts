import type { CurrencyCode } from "@/lib/finance/currency";
import type { MoneyEntry } from "@/lib/finance/fx";
import type { TaxConfig } from "@/lib/finance/tax";

type ISO = string;

export type Meta = {
  id: string;
  createdAt: ISO;
  updatedAt: ISO;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  deletedAt?: ISO | null;
  deletedBy?: string | null;
};

export type Money = { currency: CurrencyCode; amount: number }; // minor units

export type OrderSource = Meta & {
  name: string;
  searchName: string;
  active: boolean;
  notes?: string;
};

export type IdType =
  | "aadhaar" | "pan" | "passport" | "voter_id" | "driving_license" | "other";

// What the browser sees. The encrypted number stays on the server.
export type CustomerIdDoc = { id: string; type: IdType; last4: string };

export type Customer = Meta & {
  name: string;
  searchName: string;
  phone: string;
  phoneDigits: string; // last 10 digits, for search and duplicate checks
  email: string;
  country: string;
  address: string;
  notes: string;
  idDocs: CustomerIdDoc[];
};

export type PackageStatus = "draft" | "active" | "archived";

export type TravelPackage = Meta & {
  name: string;
  searchName: string;
  destination: string;
  days: number;
  nights: number;
  price: Money; // base / starting price
  inclusions: string[];
  exclusions: string[];
  itinerary: { day: number; title: string; description: string }[];
  status: PackageStatus;
};

export type BookingStatus = "enquiry" | "confirmed" | "paid" | "completed" | "cancelled";

export type Booking = Meta & {
  bookingNo: string;
  // IDs + snapshots (names copied at creation)
  customerId: string;
  customerName: string;
  packageId: string;
  packageName: string;
  sourceId: string;
  sourceName: string;
  travelStart: ISO;
  travelEnd: ISO;
  adults: number;
  children: number;
  price: Money;           // agreed price
  status: BookingStatus;  // "paid" is set automatically when fully paid
  paidInr: number;        // aggregate of income minus refunds (net INR)
  expensesInr: number;    // aggregate of linked expenses
  searchName: string;     // lowercase customer name for search
  notes?: string;
};

export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "cancelled";

export type InvoiceLine = {
  description: string;
  qty: number;
  unitPrice: number; // minor units, invoice currency
  total: number;     // qty × unitPrice
};

export type Invoice = Meta & {
  invoiceNo: string; // ADN-2026-0001
  bookingId: string;
  customer: { id: string; name: string; email?: string; phone?: string; address?: string };
  business: { name: string; gstin: string; address: string }; // snapshot
  currency: CurrencyCode;
  lines: InvoiceLine[];
  discount: number;
  tax: TaxConfig;       // snapshot, overridable per invoice
  subtotal: number;
  taxable: number;
  taxAmount: number;
  total: number;
  amountPaid: number;   // invoice currency
  status: InvoiceStatus;
  issueDate: ISO;
  dueDate: ISO;
  notes?: string;
};

export type TransactionType = "income" | "expense" | "refund";
export type PaymentMethod = "cash" | "upi" | "bank_transfer" | "card" | "cheque" | "other";

export type Transaction = Meta & {
  type: TransactionType;
  date: ISO;
  monthKey: string; // "2026-10", IST
  money: MoneyEntry; // original currency, frozen rate, INR values, fee
  method: PaymentMethod;
  categoryId?: string;   // expenses
  categoryName?: string;
  vendor?: string;       // expenses
  bookingId?: string;
  invoiceId?: string;
  customerId?: string;
  appliedToInvoice?: number; // minor units in the invoice's currency
  reference?: string;
  note?: string;
};

export type ExpenseCategory = Meta & { name: string; active: boolean };