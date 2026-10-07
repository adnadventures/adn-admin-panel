import {
  BarChart3, CalendarCheck, FileText, LayoutDashboard, Megaphone,
  Package, Settings, Users, Wallet, type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types/roles";

export type NavItem = { label: string; href: string; icon: LucideIcon; roles: Role[] };

const ALL: Role[] = ["admin", "manager", "staff"];
const MGMT: Role[] = ["admin", "manager"];

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, roles: ALL },
  { label: "Bookings", href: "/bookings", icon: CalendarCheck, roles: ALL },
  { label: "Packages", href: "/packages", icon: Package, roles: ALL },
  { label: "Customers", href: "/customers", icon: Users, roles: ALL },
  { label: "Order Sources", href: "/order-sources", icon: Megaphone, roles: MGMT },
  { label: "Invoices", href: "/invoices", icon: FileText, roles: ALL },
  { label: "Finance", href: "/finance", icon: Wallet, roles: MGMT },
  { label: "Analytics", href: "/analytics", icon: BarChart3, roles: MGMT },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
];