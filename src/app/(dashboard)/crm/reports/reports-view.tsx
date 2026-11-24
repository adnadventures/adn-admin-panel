"use client";

import {
  BarChart2,
  TrendingUp,
  Award,
  Users,
  Target,
  PieChart,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { CrmDashboardStats } from "@/types/crm";

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ReportsView({ stats }: { stats: CrmDashboardStats }) {
  const winRate =
    stats.wonDeals + stats.lostDeals > 0
      ? Math.round((stats.wonDeals / (stats.wonDeals + stats.lostDeals)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-lg font-bold text-foreground">Sales & CRM Analytics Reports</h2>
        <p className="text-xs text-muted-foreground">
          Comprehensive performance evaluation and funnel analytics
        </p>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Pipeline Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatRupees(stats.pipelineValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.openDeals} deals in progress</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Closed Won Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupees(stats.wonRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.wonDeals} won deals</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Win / Loss Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{winRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.wonDeals} Won • {stats.lostDeals} Lost
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Lead Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">{stats.totalLeads} Total Prospects</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stage Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Pipeline Funnel Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              Value and count of deals residing in each pipeline phase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.dealsByStage.map((st) => {
              const totalVal = stats.pipelineValue + stats.wonRevenue;
              const pct = totalVal > 0 ? Math.round((st.value / totalVal) * 100) : 0;

              return (
                <div key={st.stage} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span>{st.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {st.count} deals • {formatRupees(st.value)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(pct, st.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
              Sales Representative Performance
            </CardTitle>
            <CardDescription className="text-xs">
              Revenue achieved per sales representative
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.performanceByOwner.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No closed-won deals recorded yet.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {stats.performanceByOwner.map((perf, idx) => (
                  <div
                    key={perf.owner}
                    className="flex items-center justify-between border-b border-border/40 pb-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-foreground">{perf.owner}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {perf.dealsWon} Deals Closed Won
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupees(perf.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
