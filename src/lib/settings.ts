import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/validators/settings";

export async function getSettings(): Promise<AppSettings> {
  const snap = await adminDb.collection("settings").doc("app").get();
  const d = snap.data() ?? {};
  return {
    business: { ...DEFAULT_SETTINGS.business, ...d.business },
    gst: { ...DEFAULT_SETTINGS.gst, ...d.gst },
    fx: { ...DEFAULT_SETTINGS.fx, ...d.fx },
  };
}