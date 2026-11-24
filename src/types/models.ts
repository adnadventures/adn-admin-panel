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

// amount = per-person price in minor units, applies from `fromPersons` upward; base price starts at 1
export type PriceTier = { fromPersons: number; amount: number };

export type PackageListing = {
  name: string;
  phone: string;
  photos: string[];
};

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
  cost?: MoneyEntry | null;
  priceTiers: PriceTier[]; // sorted, first tier starts at minPersons
  inclusions: string[];
  exclusions: string[];
  rooms: PackageListing[];
  travelProviders: PackageListing[];
  roomImages?: string[];
  transportImages?: string[];
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
  contactName: string;
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
  dateOfBirth?: string;
  aadhaarCard?: {
    name: string;
    objectPath: string;
    contentType: "image/jpeg" | "image/png" | "image/webp";
    size: number;
  } | null;
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

export type InvoicePayment = { paymentId?: string; amount: number; date: ISO; money?: MoneyEntry }; // amount in minor units
export type InvoiceAttachmentContentType =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export type InvoiceAttachment = {
  id: string;
  name: string;
  objectPath: string;
  contentType: InvoiceAttachmentContentType;
  size: number;
};

export type Invoice = Meta & {
  invoiceNo: string; // ADN-2026-0001
  bookingId: string | null;
  issueDate: ISO;
  tripDestination: string;
  tripStatus: "upcoming" | "completed" | "cancelled";
  customer: { id: string | null; name: string; email?: string; phone: string; address: string };
  package: {
    name?: string;
    destination: string;
    startDate: ISO;
    endDate: ISO;
    duration?: string;
    memberCount: number;
    totalPrice: number;
    cost?: MoneyEntry | null;
  };
  business: { name: string; tagline?: string; gstin: string; address: string }; // snapshot
  currency: CurrencyCode;
  discount: number;
  tax: TaxConfig;       // snapshot, overridable per invoice
  subtotal: number;
  taxable: number;
  taxAmount: number;
  total: number;
  payments: InvoicePayment[];
  nextPaymentDue?: { amount: number; date: ISO } | null;
  amountPaid: number;   // total payments in invoice currency
  remainingBalance: number;
  status: InvoiceStatus;
  paymentTerms: string;
  cancellationPolicy: string;
  termsAndConditions: string;
  importantNotes: string;
  attachments: InvoiceAttachment[];
};

export type InvoiceBookingOption = {
  id: string;
  bookingNo: string;
  title: string;
  contactName: string;
  destination: string;
  packageName?: string;
  travelStart: string;
  travelEnd: string;
  memberCount: number;
  totalAmount: number;
  currency: CurrencyCode;
  defaultPackageCost?: number;
  packageCostConversionMissing?: boolean;
  status: BookingStatus;
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

export type ExpenseReceipt = {
  id: string;
  name: string;
  objectPath: string;
  contentType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  size: number;
};

export type FinanceExpense = Meta & {
  date: ISO;
  description: string;
  category: string;
  vendor: string;
  payee?: string;
  bookingId?: string;
  money: MoneyEntry;
  note: string;
  receipt: ExpenseReceipt | null;
};

export type TargetMetric =
  | "bookings"
  | "completed_bookings"
  | "revenue"
  | "profit"
  | "customers"
  | "travelers";
export type TargetPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "half_yearly"
  | "yearly"
  | "custom";
export type TargetRecordStatus = "active" | "paused";
export type TargetDisplayStatus = "in_progress" | "completed" | "expired" | "paused";

export type Target = Meta & {
  name: string;
  metric: TargetMetric;
  targetValue: number;
  currency?: CurrencyCode;
  period: TargetPeriod;
  startDate: ISO;
  endDate: ISO;
  description: string;
  status: TargetRecordStatus;
  completedAt?: ISO | null;
  completionNotifiedAt?: ISO | null;
};

export type TargetProgress = Target & {
  actualValue: number | null;
  remainingValue: number | null;
  progressPercent: number | null;
  displayStatus: TargetDisplayStatus;
  celebration: boolean;
<<<<<<< HEAD
};

/* =========================================================================
 * VENDORS MANAGEMENT
 * ========================================================================= */

export type VendorType = "travels" | "hotel";
export type VendorStatus = "active" | "inactive" | "blocked";

export type BusDetail = {
  id: string;
  registrationNumber: string; // e.g. "DL 01 AB 1234"
  busType: string; // e.g. "ac_sleeper", "volvo_multiaxle", "ac_seater", etc.
  seatingCapacity: number; // positive integer, e.g. 40
  makeModel?: string; // e.g. "Volvo 9600", "BharatBenz"
  amenities: string[]; // e.g. ["AC", "WiFi", "Charging Port", "Blanket", "Water Bottle"]
  driverName?: string;
  driverPhone?: string;
  permitType?: string; // "all_india", "state", etc.
  fitnessExpiryDate?: string; // "YYYY-MM-DD"
  insuranceExpiryDate?: string; // "YYYY-MM-DD"
  status: "active" | "maintenance" | "inactive";
};

export type VendorTravelsDetails = {
  operatingRoutes?: string[]; // destinations served, e.g. ["Manali", "Goa", "Shimla"]
  fleetTypes?: string[]; // e.g. ["Volvo Buses", "Tempo Traveller"]
  buses: BusDetail[];
  totalBusCount: number; // auto-computed
  totalSeatCapacity: number; // auto-computed
  emergencyContact?: string;
};

export type VendorHotelDetails = {
  propertyType: "hotel" | "resort" | "homestay" | "villa" | "heritage_hotel" | "guest_house" | "camp";
  starRating?: number; // 0 for unrated, 1-5 for stars
  totalRooms?: number;
  roomTypes: string[]; // e.g. ["Standard", "Deluxe", "Suite"]
  amenities: string[]; // e.g. ["WiFi", "Swimming Pool", "Restaurant", "Parking"]
  checkInTime?: string; // e.g. "12:00 PM"
  checkOutTime?: string; // e.g. "11:00 AM"
  mealPlans: string[]; // e.g. ["EP", "CP", "MAP", "AP"]
  cancellationPolicy?: string;
  childPolicy?: string;
  reservationEmail?: string;
  frontDeskPhone?: string;
  tariffRange?: string; // e.g. "₹2,500 - ₹6,000 / night"
};

export type Vendor = Meta & {
  type: VendorType;
  name: string; // company / hotel / travels agency name
  searchName: string;
  tradeName?: string;
  status: VendorStatus;

  // Contact Info
  contactPerson: string;
  designation?: string;
  phone: string;
  phoneDigits: string;
  alternatePhone?: string;
  email: string;

  // Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  destination: string; // primary destination / route coverage area
  locationUrl?: string; // Google Maps URL

  // Business / Tax / Financial
  gstin?: string;
  pan?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  upiId?: string;
  paymentTerms: string; // "immediate", "credit_15", "credit_30", "advance", etc.
  currency: CurrencyCode;

  // Contract / Dates & Notes
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;

  // Category specifics
  travelsDetails?: VendorTravelsDetails;
  hotelDetails?: VendorHotelDetails;
};
=======
};
>>>>>>> d644832e8d57e8b947621595736c63fc395104ee
