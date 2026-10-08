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

export type GroupType = "couple" | "fixed_group" | "open_group";

// amount = per-person price in minor units, applies from `fromPersons` upward
export type PriceTier = { fromPersons: number; amount: number };

export type TravelPackage = Meta & {
  name: string;
  searchName: string;
  destination: string;
  days: number;
  nights: number;
  groupType: GroupType;
  minPersons: number;
  maxPersons: number;     // 0 = no limit
  price: Money;           // base per-person price (the first tier)
  priceTiers: PriceTier[]; // sorted, first tier starts at minPersons
  inclusions: string[];
  exclusions: string[];
  itinerary: { day: number; title: string; description: string }[];
  status: PackageStatus;
};

export type AgeCategory = "adult" | "child" | "senior";
export type Gender = "male" | "female" | "other";
export type PerCategory = Record<AgeCategory, number>; // minor units for rates, headcount for counts
export type BookingStatus = "open" | "closed" | "completed" | "cancelled";

export type Booking = Meta & {
  bookingNo: string; // ADN-B-2026-0001
  title: string;
  searchName: string;
  packageId: string;
  packageName: string;
  destination: string;
  currency: CurrencyCode;
  travelStart: string; // "YYYY-MM-DD" (IST)
  travelEnd: string;
  closeDate: string;   // members can be added until the end of this day
  minPersons: number;
  maxPersons: number;  // 0 = no limit
  rates: PerCategory;  // per-person price by category
  counts: PerCategory; // active members by category
  memberCount: number; // active members
  totalAmount: number; // sum of active member prices
  status: BookingStatus;
  notes: string;
};

export type Member = Meta & {
  bookingId: string;
  customerId: string | null; // null only for members created before this change
  name: string;
  searchName: string;
  gender: Gender;
  category: AgeCategory;
  age: number | null;
  phone: string;
  sourceId: string;
  sourceName: string;
  price: number; // minor units, booking currency
  priceOverridden: boolean;
  status: "active" | "cancelled";
  note: string;
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