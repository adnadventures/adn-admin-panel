"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CURRENCIES, formatMoney, type CurrencyCode } from "@/lib/finance/currency";
import { formatDate } from "@/lib/format";

type ReportBooking = {
  id: string;
  bookingNo: string;
  title: string;
  travelStart: string;
  currency: CurrencyCode;
  status: string;
  revenue: number;
  packageCost: number | null;
  bookingExpenses: number | null;
};

type Props = {
  bookings: ReportBooking[];
  today: string;
};

type Totals = {
  revenue: number;
  expenses: number;
  profit: number;
  unavailable: boolean;
  bookingCount: number;
};

const day = (value: string) => value.slice(0, 10);
const within = (value: string, start: string, end: string) =>
  day(value) >= start && day(value) <= end;

function currentMonth(today: string) {
  const date = new Date(`${today}T00:00:00.000Z`);
  return {
    start: `${today.slice(0, 7)}-01`,
    end: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0))
      .toISOString()
      .slice(0, 10),
  };
}

function SummaryCard({
  title,
  amount,
  currency,
  description,
  unavailable,
}: {
  title: string;
  amount: number;
  currency: CurrencyCode;
  description: string;
  unavailable?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-xl">
          {unavailable ? "Unavailable — check exchange rates" : formatMoney(amount, currency)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

export function FinanceDashboard({ bookings, today }: Props) {
  const [range, setRange] = useState(() => currentMonth(today));
  const validRange = Boolean(range.start && range.end && range.start <= range.end);
  const selectedBookings = validRange
    ? bookings.filter((booking) =>
      booking.status !== "cancelled" && within(booking.travelStart, range.start, range.end),
    )
    : [];
  const totalsByCurrency = new Map<CurrencyCode, Totals>();

  for (const booking of selectedBookings) {
    const totals = totalsByCurrency.get(booking.currency) ?? {
      revenue: 0,
      expenses: 0,
      profit: 0,
      unavailable: false,
      bookingCount: 0,
    };
    totals.revenue += booking.revenue;
    totals.bookingCount++;

    if (booking.packageCost === null || booking.bookingExpenses === null) {
      totals.unavailable = true;
    } else {
      const expenses = booking.packageCost + booking.bookingExpenses;
      totals.expenses += expenses;
      totals.profit += booking.revenue - expenses;
    }
    totalsByCurrency.set(booking.currency, totals);
  }

  const currencies = Array.from(totalsByCurrency.keys()).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reporting period</CardTitle>
          <CardDescription>
            Filter bookings by travel start date. Cancelled bookings are excluded; currency totals stay separate.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="finance-start">From</Label>
            <Input
              id="finance-start"
              type="date"
              value={range.start}
              onChange={(event) => setRange((current) => ({ ...current, start: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="finance-end">To</Label>
            <Input
              id="finance-end"
              type="date"
              value={range.end}
              onChange={(event) => setRange((current) => ({ ...current, end: event.target.value }))}
            />
          </div>
          {!validRange && (
            <p className="text-destructive text-sm sm:col-span-2">Choose a valid date range.</p>
          )}
        </CardContent>
      </Card>

      {currencies.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            No bookings in this travel date range.
          </CardContent>
        </Card>
      ) : currencies.map((currency) => {
        const totals = totalsByCurrency.get(currency)!;
        const unavailable = totals.unavailable;
        return (
          <section key={currency} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {currency} · {CURRENCIES[currency].name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryCard
                title="Booking revenue"
                amount={totals.revenue}
                currency={currency}
                description={`Total from ${totals.bookingCount} booking${totals.bookingCount === 1 ? "" : "s"} in this period.`}
              />
              <SummaryCard
                title="Total expenses"
                amount={totals.expenses}
                currency={currency}
                unavailable={unavailable}
                description="Package costs multiplied by active members, plus expenses recorded in each booking."
              />
              <SummaryCard
                title="Profit"
                amount={totals.profit}
                currency={currency}
                unavailable={unavailable}
                description="Booking revenue minus total expenses."
              />
            </div>
          </section>
        );
      })}

      {selectedBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bookings in this period</CardTitle>
            <CardDescription>Revenue, expenses, and profit for each booking.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Booking</th>
                  <th className="py-2 pr-3 font-medium">Travel date</th>
                  <th className="py-2 pr-3 font-medium">Currency</th>
                  <th className="py-2 pr-3 text-right font-medium">Revenue</th>
                  <th className="py-2 pr-3 text-right font-medium">Expenses</th>
                  <th className="py-2 text-right font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {selectedBookings.map((booking) => {
                  const expenses = booking.packageCost === null || booking.bookingExpenses === null
                    ? null
                    : booking.packageCost + booking.bookingExpenses;
                  return (
                    <tr key={booking.id} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-medium">
                        {booking.title}
                        <span className="text-muted-foreground block text-xs">{booking.bookingNo}</span>
                      </td>
                      <td className="py-3 pr-3">{formatDate(booking.travelStart)}</td>
                      <td className="py-3 pr-3">{booking.currency}</td>
                      <td className="py-3 pr-3 text-right">{formatMoney(booking.revenue, booking.currency)}</td>
                      <td className="py-3 pr-3 text-right">
                        {expenses === null ? "Unavailable" : formatMoney(expenses, booking.currency)}
                      </td>
                      <td className="py-3 text-right">
                        {expenses === null ? "Unavailable" : formatMoney(booking.revenue - expenses, booking.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
