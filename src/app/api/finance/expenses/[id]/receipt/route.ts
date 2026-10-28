import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentUser } from "@/lib/auth/session";
import { getExpense } from "@/lib/data/expenses";
import { createInvoiceStorageConfig, invoiceObjectStorageError } from "@/lib/r2/invoice-storage";

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || !["admin", "manager"].includes(user.role)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const expense = await getExpense(id);
  if (!expense?.receipt || !ALLOWED_CONTENT_TYPES.has(expense.receipt.contentType)) {
    return Response.json({ error: "Receipt not found" }, { status: 404 });
  }
  if (!expense.receipt.objectPath.startsWith(`finance-expenses/${expense.createdBy}/`)) {
    return Response.json({ error: "Receipt not found" }, { status: 404 });
  }

  const storage = createInvoiceStorageConfig();
  if (!storage.ok) return Response.json({ error: storage.error }, { status: 503 });

  try {
    const result = await storage.client.send(new GetObjectCommand({
      Bucket: storage.bucketName,
      Key: expense.receipt.objectPath,
    }));
    if (!result.Body) {
      return Response.json({ error: "Receipt contents are unavailable" }, { status: 404 });
    }
    const contents = await result.Body.transformToByteArray();
    const body = new ArrayBuffer(contents.byteLength);
    new Uint8Array(body).set(contents);
    return new Response(body, {
      headers: {
        "Content-Type": expense.receipt.contentType,
        "Content-Length": String(contents.byteLength),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(expense.receipt.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Expense receipt download failed:", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json({ error: invoiceObjectStorageError(error) }, { status: 502 });
  } finally {
    storage.client.destroy();
  }
}
