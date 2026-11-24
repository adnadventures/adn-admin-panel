"use client";

import { Badge } from "@/components/ui/badge";
import type { VendorStatus, VendorType } from "@/types/models";
import {
  VENDOR_STATUS_LABELS,
  VENDOR_TYPE_LABELS,
} from "@/lib/validators/vendor";
import { Bus, Hotel } from "lucide-react";

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  switch (status) {
    case "active":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
        >
          ● {VENDOR_STATUS_LABELS[status]}
        </Badge>
      );
    case "inactive":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
        >
          {VENDOR_STATUS_LABELS[status]}
        </Badge>
      );
    case "blocked":
      return (
        <Badge
          variant="outline"
          className="border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium"
        >
          {VENDOR_STATUS_LABELS[status]}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export function VendorTypeBadge({ type }: { type: VendorType }) {
  if (type === "travels") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium"
      >
        <Bus className="size-3" />
        {VENDOR_TYPE_LABELS[type]}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1 border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400 font-medium"
    >
      <Hotel className="size-3" />
      {VENDOR_TYPE_LABELS[type]}
    </Badge>
  );
}
