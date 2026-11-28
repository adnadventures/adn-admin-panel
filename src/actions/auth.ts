"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";

export type ResolveEmailResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

/**
 * Resolves a login identifier (username or email) to the registered Firebase Auth email.
 * - If identifier contains '@', it is treated as an email directly.
 * - If identifier is a username, it looks up in Firestore "usernames" collection first.
 * - If not in Firestore, it dynamically checks Firebase Auth users by customClaims.username,
 *   displayName, or email-prefix (case-insensitive), and backfills the mapping.
 */
export async function resolveLoginEmail(identifier: string): Promise<ResolveEmailResult> {
  const trimmed = identifier?.trim();
  if (!trimmed) {
    return { ok: false, error: "Please enter your username or email" };
  }

  // 1. Direct email pattern
  if (trimmed.includes("@")) {
    return { ok: true, email: trimmed.toLowerCase() };
  }

  const normalizedUsername = trimmed.toLowerCase();

  // 2. Direct lookup in Firestore "usernames" collection
  try {
    const userDoc = await adminDb.collection("usernames").doc(normalizedUsername).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      if (data?.email) {
        return { ok: true, email: String(data.email).toLowerCase() };
      }
    }
  } catch (err) {
    console.error("Error looking up username in Firestore:", err);
  }

  // 3. Fallback: Search in Firebase Auth accounts
  try {
    let pageToken: string | undefined;
    do {
      const page = await adminAuth.listUsers(1000, pageToken);
      for (const u of page.users) {
        const claimsUsername = (u.customClaims?.username as string | undefined)?.toLowerCase().trim();
        const displayName = u.displayName?.toLowerCase().trim();
        const emailPrefix = u.email?.split("@")[0]?.toLowerCase().trim();

        if (
          claimsUsername === normalizedUsername ||
          displayName === normalizedUsername ||
          emailPrefix === normalizedUsername
        ) {
          if (u.email) {
            const resolvedEmail = u.email.toLowerCase();
            // Cache in usernames collection for immediate lookup next time
            try {
              await adminDb.collection("usernames").doc(normalizedUsername).set({
                uid: u.uid,
                email: resolvedEmail,
                username: normalizedUsername,
                updatedAt: new Date().toISOString(),
              }, { merge: true });
            } catch {
              // Non-blocking cache write
            }
            return { ok: true, email: resolvedEmail };
          }
        }
      }
      pageToken = page.pageToken;
    } while (pageToken);
  } catch (err) {
    console.error("Error searching user in Firebase Auth:", err);
  }

  return {
    ok: false,
    error: `No account found for username "${trimmed}". Please check your username or enter your email address.`,
  };
}
