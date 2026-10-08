import { Badge } from "@/components/ui/badge";
import { displayStatus } from "@/lib/booking-utils";
import type { Booking } from "@/types/models";

const VARIANT = {
  open: "default", full: "secondary", closed: "outline", completed: "secondary", cancelled: "destructive",
} as const;

export function BookingStatusBadge({ b }: { b: Booking }) {
  const s = displayStatus(b);
  return <Badge variant={VARIANT[s.key]}>{s.label}</Badge>;
}