import { GetObjectCommand } from "@aws-sdk/client-s3";
import { canAccessModule } from "@/components/layout/nav-items";
import { getInvoice } from "@/lib/data/invoices";
import { getCurrentUser } from "@/lib/auth/session";
import { createInvoiceStorageConfig, invoiceObjectStorageError } from "@/lib/r2/invoice-storage";

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessModule(user, "invoices")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, attachmentId } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) return Response.json({ error: "Invoice not found" }, { status: 404 });
  const attachment = invoice.attachments.find((item) => item.id === attachmentId);
  if (!attachment || !ALLOWED_CONTENT_TYPES.has(attachment.contentType)) {
    return Response.json({ error: "Attachment not found" }, { status: 404 });
  }

  if (!attachment.objectPath.startsWith("invoice-documents/")) {
    return Response.json({ error: "Attachment not found" }, { status: 404 });
  }
  const storage = createInvoiceStorageConfig();
  if (!storage.ok) return Response.json({ error: storage.error }, { status: 503 });

  try {
    const result = await storage.client.send(new GetObjectCommand({
      Bucket: storage.bucketName,
      Key: attachment.objectPath,
    }));
    if (!result.Body) {
      return Response.json({ error: "Attachment contents are unavailable" }, { status: 404 });
    }
    const contents = await result.Body.transformToByteArray();
    const body = new ArrayBuffer(contents.byteLength);
    new Uint8Array(body).set(contents);
    return new Response(body, {
      headers: {
        "Content-Type": attachment.contentType,
        "Content-Length": String(contents.byteLength),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Invoice attachment download failed:", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json({ error: invoiceObjectStorageError(error) }, { status: 502 });
  } finally {
    storage.client.destroy();
  }
}
