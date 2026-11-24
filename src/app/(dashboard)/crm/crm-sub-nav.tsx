"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Building,
  Briefcase,
  CalendarCheck,
  FileCheck,
  ShoppingCart,
  LifeBuoy,
  Megaphone,
  BarChart2,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CRM_TABS = [
  { label: "Dashboard", href: "/crm", icon: LayoutDashboard, exact: true },
  { label: "Leads", href: "/crm/leads", icon: UserPlus },
  { label: "Contacts", href: "/crm/contacts", icon: Users },
  { label: "Accounts", href: "/crm/accounts", icon: Building },
  { label: "Deals", href: "/crm/deals", icon: Briefcase },
  { label: "Activities", href: "/crm/activities", icon: CalendarCheck },
  { label: "Quotes", href: "/crm/quotes", icon: FileCheck },
  { label: "Orders", href: "/crm/orders", icon: ShoppingCart },
  { label: "Cases & Help", href: "/crm/cases", icon: LifeBuoy },
  { label: "Campaigns", href: "/crm/campaigns", icon: Megaphone },
  { label: "Reports", href: "/crm/reports", icon: BarChart2 },
  { label: "Settings", href: "/crm/settings", icon: Sliders },
];

export function CrmSubNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 space-y-3">
      {/* Top Banner / Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="size-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">CRM Suite</h1>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Live Hub
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enterprise Customer Relationship & Sales Pipeline Management
          </p>
        </div>
      </div>

      {/* Tabs / Sub-Navigation */}
      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <nav className="flex items-center gap-1.5 min-w-max border-b border-border/60 pb-2">
          {CRM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("size-3.5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
