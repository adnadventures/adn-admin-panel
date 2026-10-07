import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/auth/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const idToken = body?.idToken as string | undefined;
  if (!idToken) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Only users with an assigned role may log in
    if (!decoded.role) {
      return NextResponse.json({ error: "No role assigned" }, { status: 403 });
    }

    // Only accept a fresh sign-in (within 5 minutes)
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Stale sign-in" }, { status: 401 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_MS / 1000,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}