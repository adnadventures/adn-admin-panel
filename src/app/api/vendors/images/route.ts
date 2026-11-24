import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  deleteVendorImageFromR2,
  getVendorImageFromR2,
  uploadVendorImageToR2,
} from "@/lib/r2/vendor-storage";
import type { VendorImage } from "@/types/models";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }

    const { body, contentType } = await getVendorImageFromR2(key);

    if (!body) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const stream = body.transformToWebStream();

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    console.error("Vendor image fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const vendorType =
      (formData.get("vendorType") as "travels" | "hotel") || "travels";

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { objectKey, url } = await uploadVendorImageToR2(
      buffer,
      file.name,
      file.type,
      vendorType
    );

    const image: VendorImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      objectKey,
      url,
      size: file.size,
      contentType: file.type,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({ ok: true, image });
  } catch (error: unknown) {
    console.error("Vendor image upload API error:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to upload image";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { ok: false, error: "Missing key parameter" },
        { status: 400 }
      );
    }

    await deleteVendorImageFromR2(key);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Vendor image delete API error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
