import { z } from "zod";

export const ID_TYPE_KEYS = [
  "aadhaar", "pan", "passport", "voter_id", "driving_license", "other",
] as const;

export const ID_TYPES: Record<(typeof ID_TYPE_KEYS)[number], string> = {
  aadhaar: "Aadhaar",
  pan: "PAN",
  passport: "Passport",
  voter_id: "Voter ID",
  driving_license: "Driving Licence",
  other: "Other ID",
};

export const MAX_ID_DOCS = 5;

export const normalizeIdNumber = (raw: string) => raw.replace(/[\s-]/g, "").toUpperCase();

// Verhoeff checksum, used by Aadhaar
const D = [
  [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],
  [4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],
  [8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0],
];
const P = [
  [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8],
];
function verhoeff(num: string) {
  let c = 0;
  num.split("").reverse().map(Number).forEach((n, i) => { c = D[c][P[i % 8][n]]; });
  return c === 0;
}

/** Expects a normalized number. Returns an error message, or null if valid. */
export function validateIdNumber(type: (typeof ID_TYPE_KEYS)[number], n: string): string | null {
  switch (type) {
    case "aadhaar":
      return /^[2-9]\d{11}$/.test(n) && verhoeff(n) ? null : "Enter a valid 12-digit Aadhaar number";
    case "pan":
      return /^[A-Z]{5}\d{4}[A-Z]$/.test(n) ? null : "Enter a valid PAN (e.g. ABCDE1234F)";
    case "passport":
      return /^[A-Z0-9]{6,12}$/.test(n) ? null : "Enter a valid passport number";
    default:
      return /^[A-Z0-9/]{4,20}$/.test(n) ? null : "Enter a valid ID number (4 to 20 letters or digits)";
  }
}

const optional = (max: number) => z.string().trim().max(max, `Max ${max} characters`);

// Fields the form edits
export const customerFormSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Max 80 characters"),
  phone: optional(20).refine((v) => v === "" || /^\+?[0-9\s-]{7,20}$/.test(v), "Enter a valid phone number"),
  email: optional(100).refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email"),
  country: optional(60),
  address: optional(300),
  notes: optional(500),
  newIdDocs: z
    .array(z.object({ type: z.enum(ID_TYPE_KEYS), number: z.string().trim().min(1, "Enter the number") }))
    .max(MAX_ID_DOCS),
});
export type CustomerFormValues = z.infer<typeof customerFormSchema>;

// What the server action receives
export const customerInputSchema = customerFormSchema.extend({
  keepIdDocIds: z.array(z.string()),
});
export type CustomerInput = z.infer<typeof customerInputSchema>;