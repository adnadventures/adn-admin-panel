"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES, formatMoney, type CurrencyCode } from "@/lib/finance/currency";
import { formatDate } from "@/lib/format";
import type { BookingStatus } from "@/types/models";

type ReportBooking = {
  id: string;
  bookingNo: string;
  title: string;
  destination: string;
  packageName: string;
  travelStart: string;
  travelEnd: string;
  currency: CurrencyCode;
  status: BookingStatus;
  memberCount: number;
  totalAmount: number;
};

type Props = {
  bookings: ReportBooking[];
  today: string;
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  open: "Open",
  closed: "Closed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  open: "bg-emerald-500",
  closed: "bg-amber-500",
  completed: "bg-sky-500",
  cancelled: "bg-rose-500",
};

function yearRange(today: string) {
  const year = today.slice(0, 4);
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
        </div>
        <span className="text-muted-foreground rounded-md border p-2">{icon}</span>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

export function BookingsAnalytics({ bookings, today }: Props) {
  const initialRange = useMemo(() => yearRange(today), [today]);
  const [start, setStart] = useState(initialRange.start);
  const [end, setEnd] = useState(initialRange.end);
  const validRange = Boolean(start && end && start <= end);

  const filtered = validRange
    ? bookings.filter((booking) => booking.travelStart >= start && booking.travelStart <= end)
    : [];
  const statusCounts: Record<BookingStatus, number> = {
    open: 0,
    closed: 0,
    completed: 0,
    cancelled: 0,
  };
  const destinationCounts = new Map<string, number>();
  const revenueByCurrency = new Map<CurrencyCode, number>();
  let members = 0;

  for (const booking of filtered) {
    statusCounts[booking.status]++;
    if (booking.status !== "cancelled") {
      members += booking.memberCount;
      revenueByCurrency.set(
        booking.currency,
        (revenueByCurrency.get(booking.currency) ?? 0) + booking.totalAmount,
      );
    }
    if (booking.destination) {
      destinationCounts.set(
        booking.destination,
        (destinationCounts.get(booking.destination) ?? 0) + 1,
      );
    }
  }

  const activeCount = statusCounts.open + statusCounts.closed;
  const destinations = Array.from(destinationCounts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 6);
  const currencies = Array.from(revenueByCurrency.keys()).sort((a, b) => a.localeCompare(b));
  const maxDestinationCount = destinations[0]?.count ?? 0;
  const sortedBookings = [...filtered].sort((a, b) => a.travelStart.localeCompare(b.travelStart));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reporting period</CardTitle>
          <CardDescription>
            Bookings are grouped by their travel start date. Revenue and active members exclude cancelled bookings.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="analytics-start">From</Label>
            <Input
              id="analytics-start"
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="analytics-end">To</Label>
            <Input
              id="analytics-end"
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
            />
          </div>
          {!validRange && (
            <p className="text-destructive text-sm sm:col-span-2">Choose a valid date range.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total bookings"
          value={String(filtered.length)}
          description="All bookings starting in this period, including cancelled."
          icon={<CalendarDays className="size-4" />}
        />
        <MetricCard
          title="Open bookings"
          value={String(activeCount)}
          description={`${statusCounts.open} open · ${statusCounts.closed} closed`}
          icon={<ArrowUpRight className="size-4" />}
        />
        <MetricCard
          title="Completed bookings"
          value={String(statusCounts.completed)}
          description={`${statusCounts.cancelled} cancelled in this period`}
          icon={<ArrowDownRight className="size-4" />}
        />
        <MetricCard
          title="Active travelers"
          value={String(members)}
          description="Members in non-cancelled bookings."
          icon={<Users className="size-4" />}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking revenue</CardTitle>
            <CardDescription>Revenue from non-cancelled bookings, grouped by currency.</CardDescription>
          </CardHeader>
          <CardContent>
            {currencies.length === 0 ? (
              <p className="text-muted-foreground text-sm">No booking revenue in this period.</p>
            ) : (
              <ul className="divide-y">
                {currencies.map((currency) => (
                  <li key={currency} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-sm">{currency} · {CURRENCIES[currency].name}</span>
                    <strong>{formatMoney(revenueByCurrency.get(currency)!, currency)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking status</CardTitle>
            <CardDescription>Status distribution for bookings in the selected travel period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["open", "closed", "completed", "cancelled"] as const).map((status) => {
              const count = statusCounts[status];
              const percent = filtered.length ? (count / filtered.length) * 100 : 0;
              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{STATUS_LABELS[status]}</span>
                    <span className="text-muted-foreground">{count} · {Math.round(percent)}%</span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div className={`${STATUS_STYLES[status]} h-full rounded-full`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top destinations</CardTitle>
            <CardDescription>Ranked by number of bookings starting in this period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {destinations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No destination data in this period.</p>
            ) : destinations.map(({ name, count }) => (
              <div key={name} className="space-y-1.5">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{name}</span>
                  <span className="text-muted-foreground shrink-0">{count} booking{count === 1 ? "" : "s"}</span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(count / maxDestinationCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings in this period</CardTitle>
            <CardDescription>View individual booking details and travel dates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedBookings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No bookings in this period.</p>
            ) : sortedBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-md border p-3 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{booking.title}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {booking.bookingNo} · {booking.destination || booking.packageName}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {formatDate(booking.travelStart)} – {formatDate(booking.travelEnd)}
                  </span>
                </span>
                <Badge variant={booking.status === "cancelled" ? "destructive" : "outline"}>
                  {STATUS_LABELS[booking.status]}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
