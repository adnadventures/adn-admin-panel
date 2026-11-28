"use client";

import Link from "next/link";
import { Target as TargetIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, type CurrencyCode } from "@/lib/finance/currency";
import { formatDate } from "@/lib/format";
import { targetPeriodLabel } from "@/lib/targets-period";
import type { TargetMetric, TargetProgress } from "@/types/models";

const METRIC_LABELS: Record<TargetMetric, string> = {
  bookings: "Bookings",
  completed_bookings: "Completed Bookings",
  revenue: "Revenue",
  profit: "Profit",
  customers: "New Customers",
  travelers: "Travelers",
};

function isMoneyMetric(metric: TargetMetric): boolean {
  return metric === "revenue" || metric === "profit";
}

function formatTargetVal(value: number, target: TargetProgress): string {
  if (isMoneyMetric(target.metric)) {
    const major = value / 100;
    const currency = (target.currency ?? "INR") as CurrencyCode;
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: major % 1 === 0 ? 0 : 2,
    }).format(major);
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

function getStatusBadge(target: TargetProgress) {
  switch (target.displayStatus) {
    case "completed":
      return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 text-[10px] font-semibold border-emerald-500/30 uppercase">Achieved</Badge>;
    case "expired":
      return <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-semibold uppercase">Expired</Badge>;
    case "paused":
      return <Badge variant="outline" className="border-muted-foreground/30 bg-muted text-muted-foreground text-[10px] font-semibold uppercase">Paused</Badge>;
    default:
      return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[10px] font-semibold uppercase">In Progress</Badge>;
  }
}

export function AdminMyTargetProgressCard({
  targets = [],
}: {
  targets?: TargetProgress[];
  today?: string;
  adminName?: string;
}) {
  // Filter active Admin targets
  const activeTargets = targets.filter(
    (t) => t.displayStatus !== "expired" && t.displayStatus !== "paused",
  );
  const candidateTargets = activeTargets.length > 0 ? activeTargets : targets.filter((t) => t.displayStatus !== "paused");
  // Display a maximum of THREE target records only on dashboard
  const displayTargets = candidateTargets.slice(0, 3);

  return (
    <Card className="border border-border/80 shadow-sm bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2.5 pt-3.5 px-4">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-amber-500/15 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
            <TargetIcon className="size-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              My Target Progress
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Your personal targets for this period.
            </p>
          </div>
        </div>
        <Link
          href="/targets?category=admin"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View All &rarr;
        </Link>
      </CardHeader>

      <CardContent className="px-4 pb-3.5 pt-1 space-y-3">
        {displayTargets.length === 0 ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            <p>No targets assigned to you yet.</p>
            <Link
              href="/targets"
              className="mt-1.5 inline-block text-xs font-medium text-primary hover:underline"
            >
              Set a target &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {displayTargets.map((target) => {
              const achieved = target.actualValue ?? 0;
              const percent = Math.round(target.progressPercent ?? 0);
              const cappedPercent = Math.min(100, Math.max(0, percent));
              const remaining = target.remainingValue ?? Math.max(0, target.targetValue - achieved);
              const isMoney = isMoneyMetric(target.metric);
              const targetType = `${METRIC_LABELS[target.metric]}${isMoney && target.currency ? ` (${target.currency})` : ""}`;
              const period = `${targetPeriodLabel(target.period)} · ${formatDate(target.startDate)} - ${formatDate(target.endDate)}`;

              return (
                <div key={target.id} className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  {/* Row 1: Target Name and Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-foreground truncate" title={target.name}>
                      {target.name}
                    </span>
                    {getStatusBadge(target)}
                  </div>

                  {/* Row 2: Target Type and Target Period */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground">
                    <span>{targetType}</span>
                    <span className="truncate max-w-[190px]" title={period}>{period}</span>
                  </div>

                  {/* Row 3: Achieved / Target Values and Remaining */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-muted-foreground">
                      Achieved: <strong className="text-foreground font-semibold">{formatTargetVal(achieved, target)}</strong> / {formatTargetVal(target.targetValue, target)}
                    </span>
                    <span className="font-semibold text-primary">{percent}%</span>
                  </div>

                  {/* Row 4: Progress Bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-600 transition-all duration-500"
                      style={{ width: `${cappedPercent}%` }}
                    />
                  </div>

                  {/* Row 5: Remaining Value */}
                  <div className="text-[10px] text-muted-foreground text-right">
                    {formatTargetVal(remaining, target)} remaining
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
