"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { requireUser } from "@/lib/auth/session";
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";

export interface FirestoreCollectionInfo {
  name: string;
  type: "top-level" | "subcollection";
  path: string;
  count: number;
  status: "ok" | "error";
  error?: string;
}

export interface FirestoreOverviewData {
  collections: FirestoreCollectionInfo[];
  totalCollections: number;
  totalDocuments: number;
  topLevelCount: number;
  subcollectionCount: number;
  status: "ok" | "error";
  error?: string;
}

export interface FirebaseAuthOverviewData {
  totalUsers: number;
  enabledUsers: number;
  disabledUsers: number;
  status: "ok" | "error";
  error?: string;
}

export interface FirestoreStorageUsageInfo {
  databaseId: string;
  projectId: string;
  freeTierAllowance: string;
  usedStorage: string;
  usedBytes: number | null;
  remainingAllowance: string;
  usagePercentage: string;
  billingPlan: string;
  status: "unavailable" | "ok" | "error";
  note: string;
  lastUpdated: string;
}

export interface FirebaseCloudStorageBucketInfo {
  bucketName: string;
  bucketType: "standard" | "legacy" | "custom";
  objectCount: number | null;
  totalBytes: number | null;
  sizeFormatted: string;
  sizeGb: string;
  monthlyFreeTierAllowance: string;
  remainingAllowance: string;
  usagePercentage: string;
  status: "ok" | "not_provisioned" | "error";
  lastUpdated: string;
  error?: string;
}

export interface FirebaseCloudStorageOverviewData {
  buckets: FirebaseCloudStorageBucketInfo[];
  totalBuckets: number;
  status: "ok" | "error";
  error?: string;
}

export interface R2BucketUsageInfo {
  bucketName: string;
  objectCount: number | null;
  totalBytes: number | null;
  sizeFormatted: string;
  sizeGb: string;
  monthlyFreeTierAllowance: string;
  remainingAllowance: string;
  status: "ok" | "error" | "unavailable";
  error?: string;
}

export interface R2OverviewData {
  buckets: R2BucketUsageInfo[];
  configuredBucketsCount: number;
  accessibleBucketsCount: number;
  totalObjects: number;
  totalBytes: number;
  totalSizeFormatted: string;
  totalSizeGb: string;
  monthlyFreeTierAllowance: string;
  status: "ok" | "error";
  error?: string;
}

export interface SystemOverviewData {
  firestore: FirestoreOverviewData;
  firestoreStorage: FirestoreStorageUsageInfo;
  firebaseStorage: FirebaseCloudStorageOverviewData;
  auth: FirebaseAuthOverviewData;
  r2: R2OverviewData;
  refreshedAt: string;
}

export type SystemOverviewResponse =
  | { ok: true; data: SystemOverviewData }
  | { ok: false; error: string };

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Discovers and counts all Firestore collections and nested subcollections.
 * Uses count aggregation queries for maximum performance and minimum read cost.
 */
async function getFirestoreOverview(): Promise<FirestoreOverviewData> {
  try {
    const rootCollections = await adminDb.listCollections();
    const result: FirestoreCollectionInfo[] = [];

    const subcollectionMap = new Map<string, { id: string; parentPath: string }>();

    let totalDocs = 0;
    let topLevelDocs = 0;
    let subDocs = 0;

    for (const col of rootCollections) {
      try {
        const countSnap = await col.count().get();
        const count = countSnap.data().count;
        topLevelDocs += count;
        result.push({
          name: col.id,
          type: "top-level",
          path: col.id,
          count,
          status: "ok",
        });

        // Sample up to 15 documents to discover any existing nested subcollections
        if (count > 0) {
          const sampleDocs = await col.select().limit(15).get();
          for (const doc of sampleDocs.docs) {
            try {
              const subs = await doc.ref.listCollections();
              for (const sub of subs) {
                if (!subcollectionMap.has(sub.id)) {
                  subcollectionMap.set(sub.id, {
                    id: sub.id,
                    parentPath: `${col.id}/{id}/${sub.id}`,
                  });
                }
              }
            } catch {
              // Ignore document-level listing errors
            }
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to count collection";
        result.push({
          name: col.id,
          type: "top-level",
          path: col.id,
          count: 0,
          status: "error",
          error: message,
        });
      }
    }

    // Process discovered nested subcollections via collectionGroup count aggregation
    for (const [subId, subInfo] of subcollectionMap.entries()) {
      try {
        const groupCountSnap = await adminDb.collectionGroup(subId).count().get();
        const count = groupCountSnap.data().count;
        subDocs += count;
        result.push({
          name: subId,
          type: "subcollection",
          path: subInfo.parentPath,
          count,
          status: "ok",
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to count subcollection";
        result.push({
          name: subId,
          type: "subcollection",
          path: subInfo.parentPath,
          count: 0,
          status: "error",
          error: message,
        });
      }
    }

    totalDocs = topLevelDocs + subDocs;

    // Sort alphabetically by type (top-level first) and name
    result.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "top-level" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return {
      collections: result,
      totalCollections: result.length,
      totalDocuments: totalDocs,
      topLevelCount: topLevelDocs,
      subcollectionCount: subDocs,
      status: "ok",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to discover Firestore collections";
    return {
      collections: [],
      totalCollections: 0,
      totalDocuments: 0,
      topLevelCount: 0,
      subcollectionCount: 0,
      status: "error",
      error: message,
    };
  }
}

/**
 * Retrieves total registered users, enabled users, and disabled users from Firebase Authentication.
 * Handles full pagination so counts are exact even for >1,000 members.
 */
async function getFirebaseAuthOverview(): Promise<FirebaseAuthOverviewData> {
  try {
    let totalUsers = 0;
    let enabledUsers = 0;
    let disabledUsers = 0;
    let pageToken: string | undefined = undefined;

    do {
      const listResult = await adminAuth.listUsers(1000, pageToken);
      totalUsers += listResult.users.length;
      for (const u of listResult.users) {
        if (u.disabled) {
          disabledUsers++;
        } else {
          enabledUsers++;
        }
      }
      pageToken = listResult.pageToken;
    } while (pageToken);

    return {
      totalUsers,
      enabledUsers,
      disabledUsers,
      status: "ok",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve Firebase Authentication users";
    return {
      totalUsers: 0,
      enabledUsers: 0,
      disabledUsers: 0,
      status: "error",
      error: message,
    };
  }
}

/**
 * Retrieves storage usage from Cloudflare R2 for all configured application buckets.
 */
async function getCloudflareR2Overview(): Promise<R2OverviewData> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

  const generalAccessKey =
    process.env.R2_ACCESS_KEY_ID || process.env.R2_INVOICE_ACCESS_KEY_ID;
  const generalSecretKey =
    process.env.R2_SECRET_ACCESS_KEY || process.env.R2_INVOICE_SECRET_ACCESS_KEY;

  if (!endpoint || (!generalAccessKey && !process.env.R2_VENDORS_ACCESS_KEY_ID)) {
    return {
      buckets: [],
      configuredBucketsCount: 0,
      accessibleBucketsCount: 0,
      totalObjects: 0,
      totalBytes: 0,
      totalSizeFormatted: "0 Bytes",
      totalSizeGb: "0.0000 GB",
      monthlyFreeTierAllowance: "10 GB-month / month",
      status: "error",
      error: "Cloudflare R2 is not configured in environment variables (missing R2_ENDPOINT or API keys)",
    };
  }

  // Identify all application buckets
  const bucketCandidates: string[] = [];

  // Attempt dynamic bucket listing if credentials allow ListAllMyBuckets
  if (generalAccessKey && generalSecretKey) {
    try {
      const s3 = new S3Client({
        region: "auto",
        endpoint,
        credentials: {
          accessKeyId: generalAccessKey,
          secretAccessKey: generalSecretKey,
        },
      });
      const listBuckets = await s3.send(new ListBucketsCommand({}));
      if (listBuckets.Buckets) {
        for (const b of listBuckets.Buckets) {
          if (b.Name) bucketCandidates.push(b.Name);
        }
      }
    } catch {
      // ListAllMyBuckets is often scoped down in R2 API tokens; continue with configured bucket names
    }
  }

  // Add all application-used buckets from configuration
  if (process.env.R2_INVOICE_BUCKET_NAME) {
    bucketCandidates.push(process.env.R2_INVOICE_BUCKET_NAME);
  }
  if (process.env.R2_VENDORS_BUCKET_NAME) {
    bucketCandidates.push(process.env.R2_VENDORS_BUCKET_NAME);
  }
  if (process.env.R2_BUCKET_NAME) {
    bucketCandidates.push(process.env.R2_BUCKET_NAME);
  }

  // Deduplicate buckets
  const uniqueBuckets = Array.from(new Set(bucketCandidates)).filter(Boolean);

  if (uniqueBuckets.length === 0) {
    return {
      buckets: [],
      configuredBucketsCount: 0,
      accessibleBucketsCount: 0,
      totalObjects: 0,
      totalBytes: 0,
      totalSizeFormatted: "0 Bytes",
      totalSizeGb: "0.0000 GB",
      monthlyFreeTierAllowance: "10 GB-month / month",
      status: "ok",
      error: "No R2 bucket names configured in environment variables",
    };
  }

  const bucketResults: R2BucketUsageInfo[] = [];
  let aggregateObjects = 0;
  let aggregateBytes = 0;
  let accessibleCount = 0;

  for (const bucket of uniqueBuckets) {
    // Choose appropriate credentials for this bucket
    let keyId = generalAccessKey;
    let secretKey = generalSecretKey;

    if (bucket === process.env.R2_VENDORS_BUCKET_NAME && process.env.R2_VENDORS_ACCESS_KEY_ID) {
      keyId = process.env.R2_VENDORS_ACCESS_KEY_ID;
      secretKey = process.env.R2_VENDORS_SECRET_ACCESS_KEY || generalSecretKey;
    } else if (bucket === process.env.R2_INVOICE_BUCKET_NAME && process.env.R2_INVOICE_ACCESS_KEY_ID) {
      keyId = process.env.R2_INVOICE_ACCESS_KEY_ID;
      secretKey = process.env.R2_INVOICE_SECRET_ACCESS_KEY || generalSecretKey;
    }

    if (!keyId || !secretKey) {
      bucketResults.push({
        bucketName: bucket,
        objectCount: null,
        totalBytes: null,
        sizeFormatted: "Unavailable",
        sizeGb: "Unavailable",
        monthlyFreeTierAllowance: "10 GB-month / month",
        remainingAllowance: "Usage data unavailable (missing bucket credentials)",
        status: "unavailable",
        error: "Missing access credentials for bucket",
      });
      continue;
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: keyId,
        secretAccessKey: secretKey,
      },
    });

    try {
      let count = 0;
      let bytes = 0;
      let continuationToken: string | undefined = undefined;

      do {
        const listRes: ListObjectsV2CommandOutput = await s3.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken,
          })
        );

        count += listRes.KeyCount || (listRes.Contents?.length ?? 0);
        if (listRes.Contents) {
          for (const obj of listRes.Contents) {
            bytes += obj.Size || 0;
          }
        }
        continuationToken = listRes.NextContinuationToken;
      } while (continuationToken);

      aggregateObjects += count;
      aggregateBytes += bytes;
      accessibleCount++;

      const gbNum = bytes / (1024 * 1024 * 1024);

      bucketResults.push({
        bucketName: bucket,
        objectCount: count,
        totalBytes: bytes,
        sizeFormatted: formatBytes(bytes),
        sizeGb: `${gbNum.toFixed(4)} GB`,
        monthlyFreeTierAllowance: "10 GB-month / month",
        remainingAllowance:
          "Usage data unavailable (requires Cloudflare Account Analytics API token with account:read permissions to calculate billable GB-month time-weighted average)",
        status: "ok",
      });
    } catch (err: unknown) {
      const errObj = err as { name?: string; message?: string };
      const isDenied =
        errObj?.name === "AccessDenied" ||
        errObj?.message?.includes("Access Denied");
      const errorMsg = isDenied
        ? "Access Denied: Current API credentials do not have permission for this bucket (R2_VENDORS_ACCESS_KEY_ID needed)"
        : errObj?.message || "Failed to list bucket objects";

      bucketResults.push({
        bucketName: bucket,
        objectCount: null,
        totalBytes: null,
        sizeFormatted: "Unavailable",
        sizeGb: "Unavailable",
        monthlyFreeTierAllowance: "10 GB-month / month",
        remainingAllowance: "Usage data unavailable (Access Denied)",
        status: "error",
        error: errorMsg,
      });
    }
  }

  const totalGbNum = aggregateBytes / (1024 * 1024 * 1024);

  return {
    buckets: bucketResults,
    configuredBucketsCount: uniqueBuckets.length,
    accessibleBucketsCount: accessibleCount,
    totalObjects: aggregateObjects,
    totalBytes: aggregateBytes,
    totalSizeFormatted: formatBytes(aggregateBytes),
    totalSizeGb: `${totalGbNum.toFixed(4)} GB`,
    monthlyFreeTierAllowance: "10 GB-month / month",
    status: "ok",
  };
}

async function getFirestoreStorageOverview(): Promise<FirestoreStorageUsageInfo> {
  const projectId = process.env.FIREBASE_PROJECT_ID || "unknown";
  return {
    databaseId: "(default)",
    projectId,
    freeTierAllowance: "1 GiB (1,024 MiB)",
    usedStorage: "Usage data unavailable",
    usedBytes: null,
    remainingAllowance:
      "Usage data unavailable (requires Google Cloud Monitoring API with Metric 'firestore.googleapis.com/storage/total_bytes')",
    usagePercentage: "Unavailable",
    billingPlan: "Spark / Blaze Free-Tier Eligible (1 GiB quota)",
    status: "unavailable",
    note: "Firestore storage metrics including metadata and index overhead require Google Cloud Monitoring API telemetry. Live document counts are tracked under Firestore Collections.",
    lastUpdated: new Date().toISOString(),
  };
}

async function getFirebaseCloudStorageOverview(): Promise<FirebaseCloudStorageOverviewData> {
  const buckets: FirebaseCloudStorageBucketInfo[] = [];

  try {
    const storage = getStorage();
    const configuredBucket =
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      (process.env.FIREBASE_PROJECT_ID
        ? `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`
        : "");

    const bucketNames: string[] = [];

    // Attempt to list buckets from GCS via underlying storage client
    try {
      const gcs = storage.bucket().storage;
      const [gcsBuckets] = await gcs.getBuckets();
      if (gcsBuckets && gcsBuckets.length > 0) {
        for (const b of gcsBuckets) {
          if (b.name) bucketNames.push(b.name);
        }
      }
    } catch {
      // API or permission limitation
    }

    if (configuredBucket && !bucketNames.includes(configuredBucket)) {
      bucketNames.push(configuredBucket);
    }

    for (const bName of bucketNames) {
      const isLegacy = bName.endsWith(".appspot.com");
      const isNewStandard = bName.endsWith(".firebasestorage.app");
      const bucketType = isNewStandard ? "standard" : isLegacy ? "legacy" : "custom";
      const freeAllowance = isNewStandard
        ? "5 GB-month / month"
        : "5 GB (Legacy free tier)";

      try {
        const bucket = storage.bucket(bName);
        const [exists] = await bucket.exists();

        if (!exists) {
          buckets.push({
            bucketName: bName,
            bucketType,
            objectCount: 0,
            totalBytes: 0,
            sizeFormatted: "0 Bytes",
            sizeGb: "0.0000 GB",
            monthlyFreeTierAllowance: freeAllowance,
            remainingAllowance: freeAllowance,
            usagePercentage: "0.00%",
            status: "not_provisioned",
            lastUpdated: new Date().toISOString(),
            error:
              "Bucket not provisioned in Google Cloud Storage (Cloud Storage is not enabled in Firebase Console for this bucket name)",
          });
          continue;
        }

        const [files] = await bucket.getFiles({ maxResults: 1000 });
        let bytes = 0;
        for (const file of files) {
          bytes += Number(file.metadata.size || 0);
        }

        const gbUsed = bytes / (1024 * 1024 * 1024);
        const freeGb = 5;
        const pct = ((gbUsed / freeGb) * 100).toFixed(2);
        const remainingGb = Math.max(0, freeGb - gbUsed);

        buckets.push({
          bucketName: bName,
          bucketType,
          objectCount: files.length,
          totalBytes: bytes,
          sizeFormatted: formatBytes(bytes),
          sizeGb: `${gbUsed.toFixed(4)} GB`,
          monthlyFreeTierAllowance: freeAllowance,
          remainingAllowance: `${remainingGb.toFixed(4)} GB remaining`,
          usagePercentage: `${pct}%`,
          status: "ok",
          lastUpdated: new Date().toISOString(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to access bucket";
        buckets.push({
          bucketName: bName,
          bucketType,
          objectCount: null,
          totalBytes: null,
          sizeFormatted: "Unavailable",
          sizeGb: "Unavailable",
          monthlyFreeTierAllowance: freeAllowance,
          remainingAllowance: "Unavailable",
          usagePercentage: "Unavailable",
          status: "error",
          lastUpdated: new Date().toISOString(),
          error: message,
        });
      }
    }

    return {
      buckets,
      totalBuckets: buckets.length,
      status: "ok",
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to inspect Firebase Cloud Storage";
    return {
      buckets: [],
      totalBuckets: 0,
      status: "error",
      error: message,
    };
  }
}

/**
 * Privileged Server Action to retrieve the full System Overview.
 * Strictly requires admin role authentication.
 */
export async function getSystemOverviewAction(): Promise<SystemOverviewResponse> {
  try {
    await requireUser(["admin"]);

    const [firestore, firestoreStorage, firebaseStorage, auth, r2] = await Promise.all([
      getFirestoreOverview(),
      getFirestoreStorageOverview(),
      getFirebaseCloudStorageOverview(),
      getFirebaseAuthOverview(),
      getCloudflareR2Overview(),
    ]);

    return {
      ok: true,
      data: {
        firestore,
        firestoreStorage,
        firebaseStorage,
        auth,
        r2,
        refreshedAt: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load system overview";
    return {
      ok: false,
      error: message,
    };
  }
}
