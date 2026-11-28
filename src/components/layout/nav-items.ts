import type { ModuleKey, Role, SessionUser } from "@/types/roles";

export type NavItem = {
  label: string;
  href: string;
  roles: Role[];
  module: ModuleKey | null;
};

const ALL: Role[] = ["admin", "manager", "staff"];
const MGMT: Role[] = ["admin", "manager"];

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", roles: ALL, module: "dashboard" },
  { label: "Bookings", href: "/bookings", roles: ALL, module: "bookings" },
  { label: "Packages", href: "/packages", roles: ALL, module: "packages" },
  { label: "Package Builder", href: "/package-builder", roles: ALL, module: "package-builder" },
  { label: "Customers", href: "/customers", roles: ALL, module: "customers" },
  { label: "Vendors", href: "/vendors", roles: MGMT, module: "vendors" },
  { label: "CRM", href: "/crm", roles: ALL, module: "crm" },
  { label: "Order Sources", href: "/order-sources", roles: MGMT, module: "order-sources" },
  { label: "Invoices", href: "/invoices", roles: ALL, module: "invoices" },
  { label: "Finance", href: "/finance", roles: MGMT, module: "finance" },
  { label: "Company Expenses", href: "/company-expenses", roles: MGMT, module: "finance" },
  { label: "Analytics", href: "/analytics", roles: MGMT, module: "analytics" },
  { label: "Targets", href: "/targets", roles: [...MGMT, "employee"], module: "targets" },
  { label: "Settings", href: "/settings", roles: ["admin"], module: null },
];

export function canAccessNavItem(user: Pick<SessionUser, "role" | "modules">, item: NavItem) {
  if (user.role === "employee") {
    return item.module !== null && user.modules?.includes(item.module) === true;
  }
  return item.roles.includes(user.role);
}

export function canAccessModule(
  user: Pick<SessionUser, "role" | "modules">,
  module: ModuleKey,
) {
  const item = NAV_ITEMS.find((navItem) => navItem.module === module);
  return item ? canAccessNavItem(user, item) : false;
}

export function getDefaultPath(user: Pick<SessionUser, "role" | "modules">) {
  return NAV_ITEMS.find((item) => canAccessNavItem(user, item))?.href ?? "/login";
}
