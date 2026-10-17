import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

type InvoiceStorageConfig =
  | { ok: true; client: S3Client; bucketName: string }
  | { ok: false; error: string };

export function createInvoiceStorageConfig(): InvoiceStorageConfig {
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT;
  const bucketName = process.env.R2_INVOICE_BUCKET_NAME;
  const accessKeyId = process.env.R2_INVOICE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_INVOICE_SECRET_ACCESS_KEY;
  const missing = [
    !accountId && "R2_ACCOUNT_ID",
    !endpoint && "R2_ENDPOINT",
    !bucketName && "R2_INVOICE_BUCKET_NAME",
    !accessKeyId && "R2_INVOICE_ACCESS_KEY_ID",
    !secretAccessKey && "R2_INVOICE_SECRET_ACCESS_KEY",
  ].filter((value): value is string => Boolean(value));

  if (missing.length) {
    return {
      ok: false,
      error: `Configure private invoice storage in the server environment: ${missing.join(", ")}.`,
    };
  }
  if (!accountId || !endpoint || !bucketName || !accessKeyId || !secretAccessKey) {
    return { ok: false, error: "Private invoice R2 storage is not fully configured." };
  }

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    return { ok: false, error: "R2_ENDPOINT must be a valid HTTPS Cloudflare R2 endpoint." };
  }
  if (
    endpointUrl.protocol !== "https:"
    || endpointUrl.hostname !== `${accountId}.r2.cloudflarestorage.com`
    || endpointUrl.pathname !== "/"
    || endpointUrl.search
    || endpointUrl.hash
  ) {
    return { ok: false, error: "R2_ENDPOINT must be your HTTPS Cloudflare R2 S3 endpoint." };
  }
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucketName)) {
    return { ok: false, error: "R2_INVOICE_BUCKET_NAME must be a valid private R2 bucket name." };
  }

  return {
    ok: true,
    bucketName,
    client: new S3Client({
      region: "auto",
      endpoint: endpointUrl.origin,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

export function invoiceObjectStorageError(error: unknown): string {
  const storageError = error as { name?: unknown; Code?: unknown; code?: unknown };
  const code = storageError?.Code ?? storageError?.code ?? storageError?.name;

  if (code === "NoSuchBucket" || code === "NotFound") {
    return "The private invoice R2 bucket was not found. Check R2_INVOICE_BUCKET_NAME.";
  }
  if (code === "AccessDenied" || code === "InvalidAccessKeyId" || code === "SignatureDoesNotMatch") {
    return "Cloudflare R2 denied access. Check that the invoice R2 credentials have read and write access to the private invoice bucket.";
  }
  return "Cloudflare R2 could not complete the invoice document request. Check the server logs and private bucket configuration.";
}
