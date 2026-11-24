import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export function createVendorStorageConfig(preferBucket?: string) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint =
    process.env.R2_ENDPOINT ||
    `https://${accountId}.r2.cloudflarestorage.com`;
  const accessKeyId =
    process.env.R2_VENDORS_ACCESS_KEY_ID ||
    process.env.R2_ACCESS_KEY_ID ||
    process.env.R2_INVOICE_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.R2_VENDORS_SECRET_ACCESS_KEY ||
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.R2_INVOICE_SECRET_ACCESS_KEY;
  const bucket =
    preferBucket || process.env.R2_VENDORS_BUCKET_NAME || "vendors";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials in environment variables");
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket };
}

export async function uploadVendorImageToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  vendorType: "travels" | "hotel"
): Promise<{ objectKey: string; url: string }> {
  const primaryBucket = process.env.R2_VENDORS_BUCKET_NAME || "vendors";
  const { client } = createVendorStorageConfig();

  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const randomStr = Math.random().toString(36).substring(2, 8);
  const relativeKey = `${vendorType}/${timestamp}-${randomStr}-${safeName}`;

  try {
    // Attempt 1: Upload to primary bucket
    await client.send(
      new PutObjectCommand({
        Bucket: primaryBucket,
        Key: relativeKey,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    const url = `/api/vendors/images?key=${encodeURIComponent(relativeKey)}`;
    return { objectKey: relativeKey, url };
  } catch (err: unknown) {
    const isAccessDenied =
      err &&
      typeof err === "object" &&
      ("name" in err && (err as { name: string }).name === "AccessDenied" ||
        "message" in err && String((err as { message: string }).message).includes("Access Denied"));

    // Fallback: If primary bucket is not accessible with current credentials, use configured bucket under vendors/
    if (
      isAccessDenied &&
      process.env.R2_INVOICE_BUCKET_NAME &&
      primaryBucket !== process.env.R2_INVOICE_BUCKET_NAME
    ) {
      const fallbackBucket = process.env.R2_INVOICE_BUCKET_NAME;
      const fallbackKey = `vendors/${relativeKey}`;

      await client.send(
        new PutObjectCommand({
          Bucket: fallbackBucket,
          Key: fallbackKey,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );

      const url = `/api/vendors/images?key=${encodeURIComponent(fallbackKey)}`;
      return { objectKey: fallbackKey, url };
    }

    throw err;
  }
}

export async function getVendorImageFromR2(
  objectKey: string
): Promise<{ body: any; contentType: string }> {
  const { client } = createVendorStorageConfig();
  const primaryBucket = objectKey.startsWith("vendors/") && process.env.R2_INVOICE_BUCKET_NAME
    ? process.env.R2_INVOICE_BUCKET_NAME
    : (process.env.R2_VENDORS_BUCKET_NAME || "vendors");

  try {
    const res = await client.send(
      new GetObjectCommand({
        Bucket: primaryBucket,
        Key: objectKey,
      })
    );
    return {
      body: res.Body,
      contentType: res.ContentType || "image/jpeg",
    };
  } catch (err: unknown) {
    // Fallback attempt with the other bucket
    if (
      process.env.R2_INVOICE_BUCKET_NAME &&
      primaryBucket !== process.env.R2_INVOICE_BUCKET_NAME
    ) {
      const altKey = objectKey.startsWith("vendors/") ? objectKey : `vendors/${objectKey}`;
      const res = await client.send(
        new GetObjectCommand({
          Bucket: process.env.R2_INVOICE_BUCKET_NAME,
          Key: altKey,
        })
      );
      return {
        body: res.Body,
        contentType: res.ContentType || "image/jpeg",
      };
    }
    throw err;
  }
}

export async function deleteVendorImageFromR2(
  objectKey: string
): Promise<void> {
  const { client } = createVendorStorageConfig();
  const bucket =
    objectKey.startsWith("vendors/") && process.env.R2_INVOICE_BUCKET_NAME
      ? process.env.R2_INVOICE_BUCKET_NAME
      : (process.env.R2_VENDORS_BUCKET_NAME || "vendors");

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      })
    );
  } catch {
    // Try alternate bucket if available
    if (
      process.env.R2_INVOICE_BUCKET_NAME &&
      bucket !== process.env.R2_INVOICE_BUCKET_NAME
    ) {
      const altKey = objectKey.startsWith("vendors/")
        ? objectKey
        : `vendors/${objectKey}`;
      await client
        .send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_INVOICE_BUCKET_NAME,
            Key: altKey,
          })
        )
        .catch(() => {});
    }
  }
}
