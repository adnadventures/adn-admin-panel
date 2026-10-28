import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/finance/currency";

const date = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, "Choose a valid date");

export const expenseInputSchema = z.object({
  date,
  description: z.string().trim().min(2, "Enter an expense description").max(160),
  category: z.string().trim().min(2, "Enter a category").max(80),
  vendor: z.string().trim().max(120),
  bookingId: z.string().trim().min(1, "Choose a valid booking").optional(),
  amount: z.number().positive("Enter an amount above zero").max(1_000_000_000),
  currency: z.enum(CURRENCY_CODES),
  note: z.string().trim().max(1000),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
