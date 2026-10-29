import { getCurrentUser } from "@/lib/auth/session";
import { canAccessModule } from "@/components/layout/nav-items";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessModule(user, "packages")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const photoUrl = new URL(request.url).searchParams.get("url");
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!photoUrl || !publicBaseUrl) {
    return Response.json({ error: "Photo sharing is not configured" }, { status: 400 });
  }

  let base: URL;
  let photo: URL;
  try {
    base = new URL(publicBaseUrl);
    photo = new URL(photoUrl);
  } catch {
    return Response.json({ error: "Invalid photo URL" }, { status: 400 });
  }

  const allowedPath = `${base.pathname.replace(/\/+$/, "")}/package-images/`;
  if (
    base.protocol !== "https:"
    || base.username
    || base.password
    || base.search
    || base.hash
    || photo.origin !== base.origin
    || !photo.pathname.startsWith(allowedPath)
    || !/^package-images\/[0-9a-f-]+\.(jpg|png|webp)$/i.test(photo.pathname.slice(base.pathname.replace(/\/+$/, "").length + 1))
    || photo.search
    || photo.hash
  ) {
    return Response.json({ error: "Photo URL is outside the configured image bucket" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(photo, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error("Package photo fetch failed:", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Could not fetch photo from storage" }, { status: 502 });
  }
  if (!upstream.ok) {
    return Response.json({ error: "Could not fetch photo from storage" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  const contentLength = Number(upstream.headers.get("content-length"));
  if (!contentType || !ALLOWED_CONTENT_TYPES.has(contentType) || contentLength > MAX_IMAGE_SIZE) {
    return Response.json({ error: "Photo format or size is not supported" }, { status: 415 });
  }

  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_SIZE) {
    return Response.json({ error: "Photo format or size is not supported" }, { status: 415 });
  }

  return new Response(bytes, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
