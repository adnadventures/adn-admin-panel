"use client";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/validators/package";
import type { PackageStatus } from "@/types/models";

const VARIANT = { active: "default", draft: "secondary", archived: "outline" } as const;

export function StatusBadge({ status }: { status: PackageStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}