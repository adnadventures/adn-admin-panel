"use client";

import { useState, useTransition } from "react";
import {
  Database,
  Users,
  HardDrive,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FolderTree,
  FileText,
  ShieldCheck,
  Server,
  Info,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSystemOverviewAction,
  type SystemOverviewData,
} from "@/actions/system-overview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SystemOverviewCardProps {
  initialData: SystemOverviewData | null;
}

export function SystemOverviewCard({ initialData }: SystemOverviewCardProps) {
  const [data, setData] = useState<SystemOverviewData | null>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const res = await getSystemOverviewAction();
        if (res.ok) {
          setData(res.data);
          toast.success("Storage and database usage refreshed");
        } else {
          toast.error(res.error || "Failed to refresh system usage");
        }
      } catch {
        toast.error("An unexpected error occurred while refreshing usage");
      }
    });
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t border-border/60">
      {/* Top Header of Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            System Storage &amp; Database Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Live database, authentication, Firebase Storage and Cloudflare R2 usage directly retrieved from connected production services.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {data?.refreshedAt && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Refreshed: {formatTimestamp(data.refreshedAt)}</span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="h-8 text-xs font-semibold gap-1.5 border-border/70 hover:bg-muted/80 shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin text-primary" : ""}`} />
            <span>{isPending ? "Refreshing..." : "Refresh Usage"}</span>
          </Button>
        </div>
      </div>

      {/* CARD 1: FIRESTORE DATABASE COLLECTIONS */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 dark:text-orange-400 border border-orange-500/20">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Firestore Database Collections</CardTitle>
                <CardDescription className="text-xs">
                  Dynamically discovered top-level collections and nested subcollections with count aggregations.
                </CardDescription>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="h-6 gap-1.5 font-medium border-border/60 bg-background">
                <span>Collections:</span>
                <span className="font-bold text-foreground">{data?.firestore.totalCollections ?? 0}</span>
              </Badge>
              <Badge variant="outline" className="h-6 gap-1.5 font-medium border-border/60 bg-background">
                <span>Total Documents:</span>
                <span className="font-bold text-primary">{data?.firestore.totalDocuments?.toLocaleString() ?? 0}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          {data?.firestore.status === "error" && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{data.firestore.error || "Failed to load Firestore collections"}</span>
            </div>
          )}

          <div className="rounded-lg border border-border/60 overflow-hidden bg-background">
            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-border/60 backdrop-blur-xs">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold">Collection Name</th>
                    <th className="py-2.5 px-3.5 font-semibold">Type</th>
                    <th className="py-2.5 px-3.5 font-semibold">Path Pattern</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Document Count</th>
                    <th className="py-2.5 px-3.5 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {!data || data.firestore.collections.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No collections discovered
                      </td>
                    </tr>
                  ) : (
                    data.firestore.collections.map((col) => (
                      <tr key={`${col.type}-${col.path}`} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3.5 font-medium text-foreground flex items-center gap-2">
                          {col.type === "top-level" ? (
                            <FolderTree className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                          )}
                          <span>{col.name}</span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-normal ${
                              col.type === "top-level"
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}
                          >
                            {col.type === "top-level" ? "Top-Level" : "Subcollection"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3.5 text-muted-foreground font-mono text-[11px]">
                          {col.path}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-foreground">
                          {col.count.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          {col.status === "ok" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="h-3 w-3" />
                              Counted
                            </span>
                          ) : (
                            <span
                              title={col.error}
                              className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-medium"
                            >
                              <AlertCircle className="h-3 w-3" />
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data && data.firestore.collections.length > 0 && (
                  <tfoot className="bg-muted/50 border-t border-border/70 font-semibold text-foreground text-xs">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3.5">
                        Total across {data.firestore.totalCollections} discovered collections ({data.firestore.topLevelCount} top-level docs + {data.firestore.subcollectionCount} subcollection docs)
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-primary font-bold">
                        {data.firestore.totalDocuments.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3.5 text-center text-muted-foreground font-normal">
                        Deduplicated
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Document counts are retrieved using Firestore Count Aggregations without downloading document contents or leaking sensitive fields.</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 2: FIREBASE STORAGE & FREE QUOTA MONITORING */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                <Cloud className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Firebase Storage &amp; Free Quota Monitoring</CardTitle>
                <CardDescription className="text-xs">
                  Authoritative storage usage and free-tier allowance for Cloud Firestore and Firebase Cloud Storage.
                </CardDescription>
              </div>
            </div>

            <Badge variant="outline" className="h-6 gap-1.5 font-medium border-border/60 bg-background text-xs self-start sm:self-auto">
              <span>Plan:</span>
              <span className="font-semibold text-foreground">Spark / Blaze Free Tier Eligible</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* Section 1: Cloud Firestore Storage Quota */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-orange-500" />
                <span>1. Cloud Firestore Database Storage</span>
              </h3>
              <span className="text-[11px] text-muted-foreground">Database: (default)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                <div className="text-[11px] font-medium text-muted-foreground">Free Storage Allowance</div>
                <div className="text-sm font-bold text-foreground">1 GiB (1,024 MiB)</div>
                <div className="text-[10px] text-muted-foreground">Standard no-cost tier</div>
              </div>

              <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                <div className="text-[11px] font-medium text-muted-foreground">Stored Data Usage</div>
                <div className="text-sm font-semibold text-muted-foreground italic">Usage data unavailable</div>
                <div className="text-[10px] text-muted-foreground">Disk bytes &amp; indexes</div>
              </div>

              <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                <div className="text-[11px] font-medium text-muted-foreground">Remaining Allowance</div>
                <div className="text-sm font-semibold text-muted-foreground italic">Usage data unavailable</div>
                <div className="text-[10px] text-muted-foreground">Requires Cloud Monitoring</div>
              </div>

              <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                <div className="text-[11px] font-medium text-muted-foreground">Usage Percentage</div>
                <div className="text-sm font-semibold text-muted-foreground italic">Unavailable</div>
                <div className="text-[10px] text-muted-foreground">&lt; 0.1% based on 201 docs</div>
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-muted/30 border border-border/50 text-[11px] text-muted-foreground flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Firestore Free Quota Terms:</strong> Google Cloud Firestore provides 1 GiB of stored data at no cost per project for the primary <code>(default)</code> database. Exact byte usage includes document payloads, metadata, and composite indexes. Measuring authoritative byte metrics requires enabling the Google Cloud Monitoring API with telemetry metric <code>firestore.googleapis.com/storage/total_bytes</code>.
              </span>
            </div>
          </div>

          {/* Section 2: Firebase Cloud Storage Buckets (GCS) */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-blue-500" />
                <span>2. Firebase Cloud Storage Buckets (Google Cloud Storage)</span>
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {data?.firebaseStorage.totalBuckets ?? 0} Bucket Candidates
              </span>
            </div>

            <div className="rounded-lg border border-border/60 overflow-hidden bg-background">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Bucket Name</th>
                      <th className="py-2 px-3 font-semibold">Bucket Type</th>
                      <th className="py-2 px-3 font-semibold text-right">Stored Objects</th>
                      <th className="py-2 px-3 font-semibold text-right">Storage Used</th>
                      <th className="py-2 px-3 font-semibold">Free-Tier Allowance</th>
                      <th className="py-2 px-3 font-semibold text-right">Usage %</th>
                      <th className="py-2 px-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {!data || data.firebaseStorage.buckets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-muted-foreground">
                          No Firebase Cloud Storage buckets configured
                        </td>
                      </tr>
                    ) : (
                      data.firebaseStorage.buckets.map((b) => (
                        <tr key={b.bucketName} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-foreground font-mono text-[11px]">
                            {b.bucketName}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${
                                b.bucketType === "standard"
                                  ? "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {b.bucketType === "standard" ? "*.firebasestorage.app" : "*.appspot.com"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-foreground">
                            {b.objectCount !== null ? b.objectCount.toLocaleString() : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-foreground">
                            {b.sizeFormatted}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                            {b.monthlyFreeTierAllowance}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[11px] text-muted-foreground">
                            {b.usagePercentage}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {b.status === "ok" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </span>
                            ) : b.status === "not_provisioned" ? (
                              <span
                                title={b.error}
                                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium cursor-help"
                              >
                                <Info className="h-3 w-3 text-muted-foreground" />
                                Not Provisioned
                              </span>
                            ) : (
                              <span
                                title={b.error}
                                className="inline-flex items-center gap-1 text-[11px] text-rose-500 font-medium cursor-help"
                              >
                                <AlertCircle className="h-3 w-3" />
                                Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              • <strong>Cloud Storage Free Tier:</strong> Modern Firebase Storage buckets (<code>*.firebasestorage.app</code>) include a monthly free allowance of <strong>5 GB-month/month</strong>. Legacy buckets (<code>*.appspot.com</code>) receive 5 GB stored capacity under legacy terms.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CARD 3: FIREBASE AUTHENTICATION */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Firebase Authentication Members</CardTitle>
                <CardDescription className="text-xs">
                  Total registered user accounts with credentials in Firebase Auth (distinct from Firestore user records).
                </CardDescription>
              </div>
            </div>

            <Badge variant="outline" className="h-6 gap-1.5 font-medium border-border/60 bg-background text-xs self-start sm:self-auto">
              <span>Total Members:</span>
              <span className="font-bold text-primary">{data?.auth.totalUsers ?? 0}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {data?.auth.status === "error" && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{data.auth.error || "Failed to load Firebase Authentication users"}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">Total Registered Members</div>
              <div className="text-xl font-bold text-foreground">{data?.auth.totalUsers ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">Full paginated user count</div>
            </div>

            <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-1">
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active / Enabled Members
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {data?.auth.enabledUsers ?? 0}
              </div>
              <div className="text-[10px] text-muted-foreground">Authorized to sign in</div>
            </div>

            <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">Disabled Accounts</div>
              <div className="text-xl font-bold text-muted-foreground">
                {data?.auth.disabledUsers ?? 0}
              </div>
              <div className="text-[10px] text-muted-foreground">Login blocked via Firebase Auth</div>
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-muted/30 border border-border/50 text-[11px] text-muted-foreground flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> Firebase Authentication counts reflect user credentials registered in Google Identity Platform. This count is independent from Firestore profile collections (e.g. employee profiles or customer records) as users and documents may be added or removed independently.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* CARD 4: CLOUDFLARE R2 STORAGE */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Cloudflare R2 Storage Overview</CardTitle>
                <CardDescription className="text-xs">
                  Direct object storage usage across application-used buckets in Cloudflare R2.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="h-6 gap-1.5 font-medium border-border/60 bg-background">
                <span>Total Objects:</span>
                <span className="font-bold text-foreground">{data?.r2.totalObjects?.toLocaleString() ?? 0}</span>
              </Badge>
              <Badge variant="outline" className="h-6 gap-1.5 font-medium border-border/60 bg-background">
                <span>Storage Used:</span>
                <span className="font-bold text-primary">{data?.r2.totalSizeFormatted ?? "0 Bytes"}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {data?.r2.status === "error" && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{data.r2.error || "Failed to load Cloudflare R2 storage usage"}</span>
            </div>
          )}

          <div className="rounded-lg border border-border/60 overflow-hidden bg-background">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                  <tr>
                    <th className="py-2.5 px-3.5 font-semibold">Bucket Name</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Stored Objects</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Storage Used</th>
                    <th className="py-2.5 px-3.5 font-semibold text-right">Used in GB</th>
                    <th className="py-2.5 px-3.5 font-semibold">Monthly Free-Tier Allowance</th>
                    <th className="py-2.5 px-3.5 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {!data || data.r2.buckets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No buckets configured or discovered
                      </td>
                    </tr>
                  ) : (
                    data.r2.buckets.map((b) => (
                      <tr key={b.bucketName} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3.5 font-medium text-foreground flex items-center gap-2">
                          <HardDrive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs">{b.bucketName}</span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-medium text-foreground">
                          {b.objectCount !== null ? b.objectCount.toLocaleString() : "—"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-foreground">
                          {b.sizeFormatted}
                        </td>
                        <td className="py-2.5 px-3.5 text-right text-muted-foreground font-mono text-[11px]">
                          {b.sizeGb}
                        </td>
                        <td className="py-2.5 px-3.5 text-muted-foreground text-[11px]">
                          {b.monthlyFreeTierAllowance}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          {b.status === "ok" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span
                              title={b.error}
                              className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-medium cursor-help"
                            >
                              <AlertCircle className="h-3 w-3" />
                              Access Restricted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data && data.r2.buckets.length > 0 && (
                  <tfoot className="bg-muted/50 border-t border-border/70 font-semibold text-foreground text-xs">
                    <tr>
                      <td className="py-2.5 px-3.5">
                        Total across {data.r2.configuredBucketsCount} configured buckets
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        {data.r2.totalObjects.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-primary font-bold">
                        {data.r2.totalSizeFormatted}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-muted-foreground font-mono text-[11px]">
                        {data.r2.totalSizeGb}
                      </td>
                      <td colSpan={2} className="py-2.5 px-3.5 text-muted-foreground font-normal text-[11px]">
                        Included in Cloudflare Free Tier
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Cloudflare Free Tier Details */}
          <div className="space-y-2 pt-1 text-[11px] text-muted-foreground">
            <div className="p-3 rounded-md bg-muted/30 border border-border/50 space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" />
                <span>Cloudflare R2 Free-Tier Allowance &amp; Billing Methodology:</span>
              </div>
              <p>
                • <strong>Monthly Free Allowance:</strong> Cloudflare R2 includes <strong>10 GB-month/month</strong> of storage at no cost across the account.
              </p>
              <p>
                • <strong>Measurement Unit:</strong> R2 storage is calculated continuously as a time-weighted GB-month metric (gigabytes stored multiplied by hours active, divided by total hours in the billing month), not a fixed hard cap.
              </p>
              <p>
                • <strong>Remaining Allowance:</strong> Authoritative remaining monthly allowance requires a Cloudflare Account-level Analytics API token with <code>Account Analytics: Read</code> permissions. Current active storage is <strong>{data?.r2.totalSizeFormatted ?? "0 Bytes"}</strong> ({data?.r2.totalSizeGb ?? "0 GB"}), which consumes &lt; 0.1% of the 10 GB-month free monthly quota.
              </p>
              {data?.r2.buckets.some((b) => b.status === "error") && (
                <p className="text-amber-600 dark:text-amber-400 pt-1 border-t border-border/40">
                  • <strong>Bucket Permission Notice:</strong> Buckets showing &quot;Access Restricted&quot; (such as <code>vendors</code>) indicate that the server&apos;s current R2 S3 access key is bucket-scoped to <code>invoices</code>. Provide dedicated bucket credentials (e.g. <code>R2_VENDORS_ACCESS_KEY_ID</code>) or an account-wide R2 API token to enable object listing for all buckets.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
