import { z } from "zod";

export const orderSourceSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60, "Max 60 characters"),
  active: z.boolean(),
  notes: z.string().trim().max(300, "Max 300 characters"),
});

export type OrderSourceInput = z.infer<typeof orderSourceSchema>;