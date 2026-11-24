"use server";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/auth/session";
import { settingsSchema } from "@/lib/validators/settings";

export async function saveSettings(input: unknown) {
  const user = await requireUser(["admin"]);

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid settings" };

  await adminDb.collection("settings").doc("app").set({
    ...parsed.data,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.uid,
  });

  // Audit trail: rate and tax changes matter for finance
  await adminDb.collection("auditLogs").add({
    action: "settings.update",
    entity: "settings",
    entityId: "app",
    by: user.uid,
    byEmail: user.email,
    at: FieldValue.serverTimestamp(),
    after: parsed.data,
  });

  revalidatePath("/settings");
  return { ok: true as const };
}