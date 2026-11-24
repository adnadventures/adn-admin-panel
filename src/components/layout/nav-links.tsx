"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  Megaphone,
  Package,
  ReceiptText,
  Settings,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/roles";
import { canAccessNavItem, NAV_ITEMS } from "./nav-items";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/": LayoutDashboard,
  "/bookings": CalendarCheck,
  "/packages": Package,
  "/customers": Users,
  "/vendors": Building2,
  "/crm": Briefcase,
  "/order-sources": Megaphone,
  "/invoices": FileText,
  "/finance": Wallet,
  "/company-expenses": ReceiptText,
  "/analytics": BarChart3,
  "/targets": Target,
  "/settings": Settings,
};

export function NavLinks({ user, onNavigate }: { user: SessionUser; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {NAV_ITEMS.filter((item) => canAccessNavItem(user, item)).map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              active
                ? "bg-secondary text-foreground shadow-sm ring-1 ring-border/70"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}