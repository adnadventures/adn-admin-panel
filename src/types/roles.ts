export const ROLES = ["admin", "manager", "staff"] as const;
export type Role = (typeof ROLES)[number];

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
  role: Role;
};