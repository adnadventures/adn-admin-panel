import { z } from "zod";
import { CURRENCY_CODES, type CurrencyCode } from "@/lib/finance/currency";

export const PACKAGE_STATUSES = ["draft", "active", "archived"] as const;
export const packageStatusSchema = z.enum(PACKAGE_STATUSES);
export const STATUS_LABEL: Record<(typeof PACKAGE_STATUSES)[number], string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

export const PRICE_BASES = ["per_person", "per_booking"] as const;
export const BASIS_LABEL: Record<(typeof PRICE_BASES)[number], string> = {
  per_person: "Per person",
  per_booking: "Per booking (flat)",
};
export const BASIS_SHORT: Record<(typeof PRICE_BASES)[number], string> = {
  per_person: "/ person",
  per_booking: "/ booking",
};

const common = {
  name: z.string().trim().min(2, "Name is too short").max(80, "Max 80 characters"),
  destination: z.string().trim().min(2, "Enter a destination").max(80, "Max 80 characters"),
  days: z.number().int().min(1, "At least 1 day").max(60, "Max 60 days"),
  nights: z.number().int().min(0, "Cannot be negative").max(60, "Max 60 nights"),
  currency: z
    .string()
    .refine((c) => CURRENCY_CODES.includes(c as CurrencyCode), "Choose a currency"),
  price: z.number().min(0, "Price cannot be negative").max(1_000_000_000, "Price is too large"),
  priceBasis: z.enum(PRICE_BASES),
  status: packageStatusSchema,
};

const dayItem = z.object({
  title: z.string().trim().min(1, "Add a title for each day").max(100, "Max 100 characters"),
  description: z.string().trim().max(1000, "Max 1000 characters"),
});

const nightsRule = {
  check: (d: { days: number; nights: number }) => d.nights <= d.days,
  opts: { path: ["nights"], message: "Nights can't exceed days" },
};

/** What the form edits. Lists are objects so useFieldArray can manage them. */
export const packageFormSchema = z
  .object({
    ...common,
    inclusions: z.array(z.object({ value: z.string().trim().max(200, "Max 200 characters") })).max(30),
    exclusions: z.array(z.object({ value: z.string().trim().max(200, "Max 200 characters") })).max(30),
    itinerary: z.array(dayItem).max(60),
  })
  .refine(nightsRule.check, nightsRule.opts);
export type PackageFormValues = z.infer<typeof packageFormSchema>;

/** What the server action receives (plain string lists) */
export const packageInputSchema = z
  .object({
    ...common,
    inclusions: z.array(z.string().trim().min(1).max(200)).max(30),
    exclusions: z.array(z.string().trim().min(1).max(200)).max(30),
    itinerary: z.array(dayItem).max(60),
  })
  .refine(nightsRule.check, nightsRule.opts);
export type PackageInput = z.infer<typeof packageInputSchema>;