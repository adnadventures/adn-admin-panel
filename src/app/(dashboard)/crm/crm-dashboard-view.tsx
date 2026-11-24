"use client";

import Link from "next/link";
import {
  Users,
  Building,
  Briefcase,
  TrendingUp,
  Award,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Compass,
  PieChart,
  Target,
  DollarSign,
  Activity as ActivityIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { CrmDashboardStats } from "@/types/crm";

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CrmDashboardView({ stats }: { stats: CrmDashboardStats }) {
  return (
    <div className="space-y-6">
      {/* Top Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Compass className="size-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">Sales Command Center</span>
          <span className="text-xs text-muted-foreground">Overview & Pipeline Insights</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/crm/leads?new=true"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="size-3.5 mr-1" />
            New Lead
          </Link>
          <Link
            href="/crm/deals?new=true"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="size-3.5 mr-1" />
            New Deal
          </Link>
          <Link
            href="/crm/activities?new=true"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="size-3.5 mr-1" />
            Schedule Activity
          </Link>
          <Link
            href="/crm/quotes?new=true"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <Plus className="size-3.5 mr-1" />
            Create Quote
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pipeline Value */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pipeline Value
            </CardTitle>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatRupees(stats.pipelineValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span>{stats.openDeals} Active Deals in Pipeline</span>
            </p>
          </CardContent>
        </Card>

        {/* Won Revenue */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Closed Won Revenue
            </CardTitle>
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Award className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupees(stats.wonRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.wonDeals} deals won successfully
            </p>
          </CardContent>
        </Card>

        {/* Total Leads & Conversion */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Leads & Conversion
            </CardTitle>
            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Target className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{stats.conversionRate}%</span> Conversion Rate
            </p>
          </CardContent>
        </Card>

        {/* Activities Attention */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Follow-ups
            </CardTitle>
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.followUpsDue}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {stats.overdueActivities > 0 ? (
                <span className="text-destructive font-medium flex items-center gap-0.5">
                  <AlertCircle className="size-3" />
                  {stats.overdueActivities} Overdue
                </span>
              ) : (
                <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="size-3" />
                  All on schedule
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Counters Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/crm/leads"
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Users className="size-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{stats.totalLeads}</div>
            <div className="text-xs text-muted-foreground">Total Leads</div>
          </div>
        </Link>

        <Link
          href="/crm/contacts"
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex size-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="size-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{stats.totalContacts}</div>
            <div className="text-xs text-muted-foreground">Contacts</div>
          </div>
        </Link>

        <Link
          href="/crm/accounts"
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex size-9 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Building className="size-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{stats.totalAccounts}</div>
            <div className="text-xs text-muted-foreground">Accounts / Companies</div>
          </div>
        </Link>

        <Link
          href="/crm/deals"
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex size-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Briefcase className="size-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{stats.totalDeals}</div>
            <div className="text-xs text-muted-foreground">Total Deals ({stats.wonDeals} Won)</div>
          </div>
        </Link>
      </div>

      {/* Middle Grid: Pipeline Funnel Breakdown & Lead Sources */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pipeline Funnel Stages (2 Cols) */}
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Deal Pipeline Stages</CardTitle>
              <CardDescription className="text-xs">
                Active opportunities across sales funnel stages
              </CardDescription>
            </div>
            <Link
              href="/crm/deals"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Open Kanban
              <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.dealsByStage.map((st) => {
              const totalVal = stats.pipelineValue + stats.wonRevenue;
              const pct = totalVal > 0 ? Math.round((st.value / totalVal) * 100) : 0;

              return (
                <div key={st.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{st.label}</span>
                    <span className="text-muted-foreground font-mono">
                      {st.count} {st.count === 1 ? "deal" : "deals"} • {formatRupees(st.value)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.max(pct, st.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Lead Sources Distribution (1 Col) */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChart className="size-4 text-primary" />
              Lead Inflow Sources
            </CardTitle>
            <CardDescription className="text-xs">
              Where new business prospects originate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.leadsBySource.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground">
                <Users className="size-8 mb-2 opacity-30" />
                No lead source data yet. Create leads to populate.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.leadsBySource.map((s) => {
                  const pct =
                    stats.totalLeads > 0
                      ? Math.round((s.count / stats.totalLeads) * 100)
                      : 0;

                  return (
                    <div key={s.source} className="flex items-center justify-between text-xs border-b border-border/40 pb-2">
                      <span className="font-medium text-foreground">{s.source}</span>
                      <span className="font-mono text-muted-foreground">
                        {s.count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid: Recent Activities & Sales Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ActivityIcon className="size-4 text-primary" />
                Recent CRM Activities
              </CardTitle>
              <CardDescription className="text-xs">
                Scheduled meetings, follow-ups, calls, and tasks
              </CardDescription>
            </div>
            <Link
              href="/crm/activities"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View All
              <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground">
                <Calendar className="size-8 mb-2 opacity-30" />
                No activities scheduled yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-2.5 text-xs hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
                        <span className="capitalize text-muted-foreground font-normal">[{act.type}]:</span>
                        <span>{act.subject}</span>
                      </div>
                      <div className="text-muted-foreground mt-0.5 truncate text-[11px]">
                        Related to: <span className="font-medium text-foreground">{act.relatedToName}</span> • Due: {act.dueDate}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        act.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : act.status === "overdue"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {act.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Sales Performance */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="size-4 text-emerald-600 dark:text-emerald-400" />
                Sales Performance
              </CardTitle>
              <CardDescription className="text-xs">
                Won revenue & deals closed by sales team members
              </CardDescription>
            </div>
            <Link
              href="/crm/reports"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Full Reports
              <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats.performanceByOwner.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-muted-foreground">
                <DollarSign className="size-8 mb-2 opacity-30" />
                No closed-won deals recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.performanceByOwner.map((perf, idx) => (
                  <div
                    key={perf.owner}
                    className="flex items-center justify-between border-b border-border/40 pb-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-foreground">{perf.owner}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {perf.dealsWon} {perf.dealsWon === 1 ? "Deal Won" : "Deals Won"}
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
