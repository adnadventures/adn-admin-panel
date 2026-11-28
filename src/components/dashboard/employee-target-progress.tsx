"use client";

import Link from "next/link";
import { Target, User, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurrencyCode } from "@/lib/finance/currency";
import type { TargetMetric, TargetProgress } from "@/types/models";

const EMPLOYEE_THEMES = [
  {
    avatarBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    percentColor: "text-blue-600 dark:text-blue-400",
    barColor: "bg-blue-600",
  },
  {
    avatarBg: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
    percentColor: "text-purple-600 dark:text-purple-400",
    barColor: "bg-purple-600",
  },
  {
    avatarBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    percentColor: "text-emerald-600 dark:text-emerald-400",
    barColor: "bg-emerald-600",
  },
  {
    avatarBg: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    percentColor: "text-amber-600 dark:text-amber-400",
    barColor: "bg-amber-500",
  },
  {
    avatarBg: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
    percentColor: "text-rose-600 dark:text-rose-400",
    barColor: "bg-rose-600",
  },
  {
    avatarBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
    percentColor: "text-indigo-600 dark:text-indigo-400",
    barColor: "bg-indigo-600",
  },
  {
    avatarBg: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400",
    percentColor: "text-cyan-600 dark:text-cyan-400",
    barColor: "bg-cyan-600",
  },
];

function isMoneyMetric(metric: TargetMetric): boolean {
  return metric === "revenue" || metric === "profit";
}

function formatAmount(value: number, isMoney: boolean, currency: CurrencyCode = "INR"): string {
  if (isMoney) {
    const major = value / 100;
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: major % 1 === 0 ? 0 : 2,
    }).format(major);
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

export type EmployeeTargetItem = {
  id: string;
  name: string;
  targetAmount: number;
  achievedAmount: number;
  percent: number;
  formattedTarget: string;
  formattedAchieved: string;
};

export function EmployeeTargetProgress({
  targets = [],
}: {
  targets?: TargetProgress[];
  today?: string;
  isManagement?: boolean;
  currentUserName?: string;
}) {
  // Filter for employee targets that are active or in current period
  // (ignore expired, paused, or admin targets)
  const employeeTargets = targets.filter(
    (t) => t.assignmentType !== "admin" && Boolean(t.employeeId || t.employeeName) && t.displayStatus !== "expired" && t.displayStatus !== "paused",
  );

  // If no in_progress targets found, fallback to any assigned non-paused employee targets
  const effectiveTargets = employeeTargets.length > 0
    ? employeeTargets
    : targets.filter((t) => t.assignmentType !== "admin" && Boolean(t.employeeId || t.employeeName) && t.status !== "paused");

  // Group by employee to aggregate if an employee has multiple active targets
  const employeeMap = new Map<string, {
    id: string;
    name: string;
    targets: TargetProgress[];
  }>();

  for (const t of effectiveTargets) {
    const key = t.employeeId || t.employeeName || "unknown";
    const existing = employeeMap.get(key);
    if (existing) {
      existing.targets.push(t);
    } else {
      employeeMap.set(key, {
        id: key,
        name: t.employeeName || "Employee",
        targets: [t],
      });
    }
  }

  const employeeList: EmployeeTargetItem[] = Array.from(employeeMap.values()).map((emp) => {
    // If multiple targets, calculate aggregated target and actuals
    const isMoney = emp.targets.some((t) => isMoneyMetric(t.metric));
    const currency = (emp.targets[0]?.currency ?? "INR") as CurrencyCode;

    const totalTarget = emp.targets.reduce((sum, t) => sum + (Number(t.targetValue) || 0), 0);
    const totalAchieved = emp.targets.reduce((sum, t) => sum + (Number(t.actualValue) || 0), 0);

    const percent = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

    return {
      id: emp.id,
      name: emp.name,
      targetAmount: totalTarget,
      achievedAmount: totalAchieved,
      percent,
      formattedTarget: formatAmount(totalTarget, isMoney, currency),
      formattedAchieved: formatAmount(totalAchieved, isMoney, currency),
    };
  });

  // Display a maximum of THREE employee records only on dashboard
  const displayedEmployees = employeeList.slice(0, 3);

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Users className="size-4" aria-hidden="true" />
          </span>
          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
            Employee Target Progress
          </CardTitle>
        </div>
        <Link
          href="/targets?category=employee"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View All &rarr;
        </Link>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {displayedEmployees.length === 0 ? (
          <div className="py-5 text-center text-xs text-muted-foreground">
            <p>No active employee targets assigned yet.</p>
            <Link
              href="/targets"
              className="mt-1.5 inline-block text-xs font-medium text-primary hover:underline"
            >
              Set employee targets &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {displayedEmployees.map((emp, index) => {
              const theme = EMPLOYEE_THEMES[index % EMPLOYEE_THEMES.length];
              const cappedPercent = Math.min(100, Math.max(0, emp.percent));

              return (
                <div key={emp.id} className="flex items-center gap-3">
                  {/* Left: Avatar with user icon */}
                  <div className={`grid size-9 shrink-0 place-items-center rounded-full ${theme.avatarBg}`}>
                    <User className="size-4" aria-hidden="true" />
                  </div>

                  {/* Middle / Right: Employee info and progress */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Line 1: Employee name & Achieved amount */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground truncate">{emp.name}</span>
                      <span className="font-bold text-foreground tracking-tight">{emp.formattedAchieved}</span>
                    </div>

                    {/* Line 2: Target & Percentage */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Target: {emp.formattedTarget}</span>
                      <span className={`font-semibold ${theme.percentColor}`}>({emp.percent}%)</span>
                    </div>

                    {/* Line 3: Progress Bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${theme.barColor}`}
                        style={{ width: `${cappedPercent}%` }}
                      />
                    </div>
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
