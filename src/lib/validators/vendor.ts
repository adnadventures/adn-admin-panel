import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/finance/currency";

export const VENDOR_TYPES = ["travels", "hotel"] as const;
export type VendorType = (typeof VENDOR_TYPES)[number];

export const VENDOR_STATUSES = ["active", "inactive", "blocked"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  travels: "Travels Vendor",
  hotel: "Hotel Vendor",
};

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
};

export const BUS_TYPES = [
  "volvo_multiaxle",
  "ac_sleeper",
  "non_ac_sleeper",
  "ac_seater",
  "non_ac_seater",
  "tempo_traveller",
  "mini_bus",
  "luxury_coach",
  "other",
] as const;

export const BUS_TYPE_LABELS: Record<(typeof BUS_TYPES)[number], string> = {
  volvo_multiaxle: "Volvo Multi-Axle",
  ac_sleeper: "AC Sleeper",
  non_ac_sleeper: "Non-AC Sleeper",
  ac_seater: "AC Seater",
  non_ac_seater: "Non-AC Seater",
  tempo_traveller: "Tempo Traveller",
  mini_bus: "Mini Bus (20-30 Seats)",
  luxury_coach: "Luxury Coach",
  other: "Other Transport",
};

export const BUS_STATUSES = ["active", "maintenance", "inactive"] as const;
export const BUS_STATUS_LABELS: Record<(typeof BUS_STATUSES)[number], string> = {
  active: "Active / Available",
  maintenance: "Under Maintenance",
  inactive: "Inactive",
};

export const HOTEL_PROPERTY_TYPES = [
  "hotel",
  "resort",
  "homestay",
  "villa",
  "heritage_hotel",
  "guest_house",
  "camp",
] as const;

export const HOTEL_PROPERTY_TYPE_LABELS: Record<(typeof HOTEL_PROPERTY_TYPES)[number], string> = {
  hotel: "Hotel",
  resort: "Resort",
  homestay: "Homestay",
  villa: "Villa / Cottage",
  heritage_hotel: "Heritage Hotel / Haveli",
  guest_house: "Guest House / B&B",
  camp: "Camp / Tent Stay",
};

export const MEAL_PLANS = ["EP", "CP", "MAP", "AP"] as const;
export const MEAL_PLAN_LABELS: Record<(typeof MEAL_PLANS)[number], string> = {
  EP: "EP (European Plan - Room Only)",
  CP: "CP (Continental Plan - Breakfast)",
  MAP: "MAP (Modified American Plan - Breakfast & Dinner)",
  AP: "AP (American Plan - All 3 Meals)",
};

export const COMMON_BUS_AMENITIES = [
  "AC",
  "Free WiFi",
  "Mobile Charging Ports",
  "Pushback Seats",
  "Blanket & Pillow",
  "Water Bottle",
  "Reading Lights",
  "GPS Tracking",
  "Emergency Exit",
  "TV / Sound System",
  "First Aid Kit",
  "Luggage Storage",
] as const;

export const COMMON_HOTEL_AMENITIES = [
  "Free Wi-Fi",
  "Swimming Pool",
  "In-house Restaurant",
  "Free Parking",
  "24/7 Room Service",
  "Power Backup",
  "Conference / Banquet Hall",
  "Spa & Wellness",
  "Gym / Fitness Center",
  "Bar & Lounge",
  "Airport Shuttle",
  "CCTV Security",
  "Elevator / Lift",
  "Kids Play Area",
] as const;

export const COMMON_ROOM_TYPES = [
  "Standard Room",
  "Deluxe Room",
  "Super Deluxe Room",
  "Executive Room",
  "Suite",
  "Family Cottage",
  "Dormitory / Bunk Beds",
] as const;

export const PERMIT_TYPES = [
  "all_india",
  "state_tourist",
  "contract_carriage",
  "national_permit",
  "other",
] as const;

export const PERMIT_TYPE_LABELS: Record<(typeof PERMIT_TYPES)[number], string> = {
  all_india: "All India Tourist Permit (AITP)",
  state_tourist: "State Tourist Permit",
  contract_carriage: "Contract Carriage Permit",
  national_permit: "National Goods/Passenger Permit",
  other: "Other Permit",
};

export const PAYMENT_TERMS = [
  "immediate",
  "advance_100",
  "advance_50_completion",
  "credit_15",
  "credit_30",
  "weekly",
  "monthly",
] as const;

export const PAYMENT_TERMS_LABELS: Record<(typeof PAYMENT_TERMS)[number], string> = {
  immediate: "Immediate / Due on receipt",
  advance_100: "100% Advance",
  advance_50_completion: "50% Advance & Balance on trip finish",
  credit_15: "15 Days Credit",
  credit_30: "30 Days Credit",
  weekly: "Weekly settlement",
  monthly: "Monthly billing cycle",
};

/* Format validation helpers */
const optionalStr = (max: number) => z.string().trim().max(max, `Max ${max} characters`);

export const phoneValidator = (required = false) => {
  const schema = z.string().trim().max(20, "Max 20 characters");
  if (required) {
    return schema
      .min(7, "Phone number is too short")
      .refine((v) => /^\+?[0-9\s-]{7,20}$/.test(v), "Enter a valid phone number (e.g. +91 9876543210)");
  }
  return schema.refine((v) => v === "" || /^\+?[0-9\s-]{7,20}$/.test(v), "Enter a valid phone number");
};

export const emailValidator = (required = false) => {
  const schema = z.string().trim().max(100, "Max 100 characters");
  if (required) {
    return schema.min(1, "Email is required").email("Enter a valid email address");
  }
  return schema.refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address");
};

export const gstinValidator = optionalStr(15).refine(
  (v) => v === "" || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(v),
  "Enter a valid 15-digit GSTIN (e.g. 29ABCDE1234F1Z5)",
);

export const panValidator = optionalStr(10).refine(
  (v) => v === "" || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(v),
  "Enter a valid 10-character PAN (e.g. ABCDE1234F)",
);

export const ifscValidator = optionalStr(11).refine(
  (v) => v === "" || /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v),
  "Enter a valid 11-character IFSC code (e.g. HDFC0001234)",
);

export const dateStringValidator = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use YYYY-MM-DD date format");

/* Individual Bus Schema */
export const busDetailSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  registrationNumber: z
    .string()
    .trim()
    .min(3, "Bus registration number is required (e.g. DL 01 AB 1234)")
    .max(25, "Max 25 characters")
    .transform((v) => v.toUpperCase()),
  busType: z.enum(BUS_TYPES).default("ac_sleeper"),
  seatingCapacity: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "Seat capacity must be at least 1")
    .max(120, "Seat capacity cannot exceed 120"),
  makeModel: optionalStr(60),
  amenities: z.array(z.string()).default([]),
  driverName: optionalStr(80),
  driverPhone: phoneValidator(false),
  permitType: z.enum(PERMIT_TYPES).default("all_india"),
  fitnessExpiryDate: dateStringValidator.default(""),
  insuranceExpiryDate: dateStringValidator.default(""),
  status: z.enum(BUS_STATUSES).default("active"),
});

export type BusDetailFormValues = z.infer<typeof busDetailSchema>;

/* Travels Specific Schema */
export const travelsDetailsSchema = z.object({
  operatingRoutes: z.array(z.string()).default([]),
  fleetTypes: z.array(z.string()).default([]),
  buses: z.array(busDetailSchema).default([]),
  totalBusCount: z.coerce.number().int().min(0).default(0),
  totalSeatCapacity: z.coerce.number().int().min(0).default(0),
  emergencyContact: phoneValidator(false).default(""),
});

/* Hotel Specific Schema */
export const hotelDetailsSchema = z.object({
  propertyType: z.enum(HOTEL_PROPERTY_TYPES).default("hotel"),
  starRating: z.coerce.number().int().min(0).max(5).default(0),
  totalRooms: z.coerce.number().int().min(0).max(5000).default(0),
  roomTypes: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  checkInTime: optionalStr(30).default("12:00 PM"),
  checkOutTime: optionalStr(30).default("11:00 AM"),
  mealPlans: z.array(z.enum(MEAL_PLANS)).default([]),
  cancellationPolicy: optionalStr(500).default(""),
  childPolicy: optionalStr(500).default(""),
  reservationEmail: emailValidator(false).default(""),
  frontDeskPhone: phoneValidator(false).default(""),
  tariffRange: optionalStr(60).default(""),
});

/* Complete Vendor Form Schema */
export const vendorFormSchema = z
  .object({
    type: z.enum(VENDOR_TYPES, {
      message: "Please select a vendor type (Travels or Hotel)",
    }),
    name: z.string().trim().min(2, "Vendor name is too short (min 2 chars)").max(120, "Max 120 characters"),
    tradeName: optionalStr(120).default(""),
    status: z.enum(VENDOR_STATUSES).default("active"),

    // Contact details
    contactPerson: z.string().trim().min(2, "Primary contact person is required").max(80, "Max 80 characters"),
    designation: optionalStr(60).default(""),
    phone: phoneValidator(true),
    alternatePhone: phoneValidator(false).default(""),
    email: emailValidator(true),

    // Location
    address: z.string().trim().min(3, "Address is required").max(300, "Max 300 characters"),
    city: z.string().trim().min(2, "City is required").max(80, "Max 80 characters"),
    state: z.string().trim().min(2, "State is required").max(80, "Max 80 characters"),
    pincode: optionalStr(12).default(""),
    destination: z.string().trim().min(2, "Destination / Region is required").max(100, "Max 100 characters"),
    locationUrl: optionalStr(300).refine((v) => v === "" || /^https?:\/\//.test(v), "Enter a valid URL (starting with http:// or https://)").default(""),

    // Business & Financial
    gstin: gstinValidator.default(""),
    pan: panValidator.default(""),
    bankName: optionalStr(80).default(""),
    accountNumber: optionalStr(40).default(""),
    accountHolderName: optionalStr(100).default(""),
    ifscCode: ifscValidator.default(""),
    upiId: optionalStr(60).default(""),
    paymentTerms: z.enum(PAYMENT_TERMS).default("immediate"),
    currency: z.enum(CURRENCY_CODES).default("INR"),

    // Contracts & Notes
    contractStartDate: dateStringValidator.default(""),
    contractEndDate: dateStringValidator.default(""),
    notes: optionalStr(1000).default(""),

    // Nested specifics
    travelsDetails: travelsDetailsSchema.optional(),
    hotelDetails: hotelDetailsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    // Cross-field validations
    if (data.contractStartDate && data.contractEndDate && data.contractEndDate < data.contractStartDate) {
      ctx.addIssue({
        code: "custom",
        path: ["contractEndDate"],
        message: "Contract end date cannot be earlier than start date",
      });
    }

    if (data.type === "travels") {
      if (!data.travelsDetails) {
        ctx.addIssue({
          code: "custom",
          path: ["travelsDetails"],
          message: "Travels vendor details are required",
        });
      }
    } else if (data.type === "hotel") {
      if (!data.hotelDetails) {
        ctx.addIssue({
          code: "custom",
          path: ["hotelDetails"],
          message: "Hotel vendor details are required",
        });
      }
    }
  });

export type VendorFormValues = z.infer<typeof vendorFormSchema>;
