import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Bus, Hotel, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireModule } from "@/lib/auth/session";
import { canEditAssignedModules, canManageAssignedModules } from "@/types/roles";
import { CATEGORY_LABEL, GENDER_LABEL } from "@/lib/booking-utils";
import { getBooking, listMembers } from "@/lib/data/bookings";
import { listExpensesForBooking } from "@/lib/data/expenses";
import { listOrderSources } from "@/lib/data/order-sources";
import { getPackage } from "@/lib/data/packages";
import { formatMoney } from "@/lib/finance/currency";
import { convertMoneyEntryAmount } from "@/lib/finance/fx";
import { pricePerPerson } from "@/lib/finance/pricing";
import { formatDate, todayIST } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import type { CurrencyCode } from "@/lib/finance/currency";
import type { BookingVendorSummary, Gender } from "@/types/models";
import { SlotMeter } from "../slot-meter";
import { BookingStatusBadge } from "../status-badge";
import { BookingActions } from "./booking-actions";
import { MembersPanel } from "./members-panel";
import { BookingExpensesPanel } from "./booking-expenses-panel";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function BookingProfitability({
  revenue,
  memberCount,
  currency,
  packageCostConfigured,
  packageCostPerMember,
  bookingExpenses,
}: {
  revenue: number;
  memberCount: number;
  currency: CurrencyCode;
  packageCostConfigured: boolean;
  packageCostPerMember: number | null;
  bookingExpenses: number | null;
}) {
  const packageCost = !packageCostConfigured
    ? 0
    : packageCostPerMember === null ? null : packageCostPerMember * memberCount;
  const totalExpenses = packageCost === null || bookingExpenses === null
    ? null
    : packageCost + bookingExpenses;
  const profit = totalExpenses === null ? null : revenue - totalExpenses;
  const formatTotal = (amount: number | null) =>
    amount === null ? "Unavailable — check exchange rates" : formatMoney(amount, currency);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Booking profitability</CardTitle>
        <p className="text-muted-foreground text-sm">
          Revenue minus total expenses.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <Field label="Total revenue">
          <span className="font-semibold">{formatTotal(revenue)}</span>
        </Field>
        <Field label="Total expenses">
          <span className="font-semibold">{formatTotal(totalExpenses)}</span>
        </Field>
        <Field label="Profit">
          <span className={`font-semibold ${profit !== null && profit < 0 ? "text-destructive" : ""}`}>
            {formatTotal(profit)}
          </span>
        </Field>
      </CardContent>
    </Card>
  );
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireModule("bookings");
  const canManageBookings = canManageAssignedModules(user);
  const { id } = await params;
  const booking = await getBooking(id);
  if (!booking) notFound();

  const [members, sources, pkg, expenses, settings] = await Promise.all([
    listMembers(id),
    listOrderSources(),
    getPackage(booking.packageId),
    user.role === "admin" || user.role === "manager" ? listExpensesForBooking(id) : Promise.resolve([]),
    user.role === "admin" || user.role === "manager" ? getSettings() : Promise.resolve(null),
  ]);

  const active = members.filter((m) => m.status === "active");
  const gender: Record<Gender, number> = { male: 0, female: 0, other: 0 };
  active.forEach((m) => gender[m.gender]++);

  // Does the package's group rate for today's headcount differ from this booking's adult rate?
  const pkgRate =
    pkg && pkg.price.currency === booking.currency
      ? pricePerPerson(pkg.priceTiers, Math.max(booking.memberCount, booking.minPersons))
      : null;
  const rateMismatch = pkgRate !== null && pkgRate !== booking.rates.adult;
  const packageCostPerMember = pkg?.cost && settings
    ? convertMoneyEntryAmount(pkg.cost, booking.currency, settings.fx.rates) ?? null
    : null;
  const bookingExpenses = expenses.reduce<number | null>((total, expense) => {
    if (total === null || !settings) return null;
    const converted = convertMoneyEntryAmount(expense.money, booking.currency, settings.fx.rates);
    return converted === undefined ? null : total + converted;
  }, 0);

  return (
    <>
      <PageHeader
        title={booking.title}
        description={`${booking.bookingNo} · ${booking.packageName} · ${booking.destination}`}
        actions={canManageBookings ? <BookingActions booking={booking} /> : undefined}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Booked person">{booking.contactName || "—"}</Field>
            <Field label="Status"><BookingStatusBadge b={booking} /></Field>
            <Field label="Slots"><SlotMeter b={booking} /></Field>
            <Field label="Travel">
              {formatDate(booking.travelStart)} – {formatDate(booking.travelEnd)}
            </Field>
            <Field label="Members can be added until">
              {formatDate(booking.closeDate)} <span className="text-muted-foreground">(end of day)</span>
            </Field>
            <Field label="Total of member prices">
              <span className="font-semibold">{formatMoney(booking.totalAmount, booking.currency)}</span>
            </Field>
            {booking.notes && <Field label="Notes"><span className="whitespace-pre-line">{booking.notes}</span></Field>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Rates and mix</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ul className="space-y-1">
              {(["adult", "child", "senior"] as const).map((c) => (
                <li key={c} className="flex justify-between">
                  <span>{CATEGORY_LABEL[c]} <span className="text-muted-foreground">× {booking.counts[c]}</span></span>
                  <span className="font-medium">{formatMoney(booking.rates[c], booking.currency)}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground border-t pt-3 text-xs">
              {(["male", "female", "other"] as const)
                .filter((g) => gender[g] > 0 || g !== "other")
                .map((g) => `${GENDER_LABEL[g]} ${gender[g]}`)
                .join(" · ")}
            </p>
            {rateMismatch && (
              <p className="rounded-md bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                The package&apos;s group rate for {Math.max(booking.memberCount, booking.minPersons)} persons is{" "}
                {formatMoney(pkgRate!, booking.currency)}, but this booking charges{" "}
                {formatMoney(booking.rates.adult, booking.currency)} for adults. Edit the booking to change it.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {booking.vendors && booking.vendors.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="size-4 text-primary" /> Assigned Trip Vendors & Partners
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  Travels (fleet & buses) and Hotel accommodation partners confirmed for this booking.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {booking.vendors.length} {booking.vendors.length === 1 ? "Vendor" : "Vendors"}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {booking.vendors.map((v: BookingVendorSummary) => (
                <div
                  key={v.id}
                  className="rounded-lg border border-border bg-card p-3.5 space-y-2 shadow-2xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <Link
                        href={`/vendors/${v.id}`}
                        className="font-semibold text-sm hover:underline text-foreground line-clamp-1"
                      >
                        {v.name}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          v.type === "travels"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : "bg-purple-500/10 text-purple-700 dark:text-purple-300"
                        }`}
                      >
                        {v.type === "travels" ? (
                          <>
                            <Bus className="size-3" /> Travels
                          </>
                        ) : (
                          <>
                            <Hotel className="size-3" /> Hotel
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span className="font-medium text-foreground">{v.destination}</span>
                    </div>
                    {v.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3.5 shrink-0" />
                        <span>{v.phone}</span>
                        {v.contactPerson && (
                          <span className="truncate">({v.contactPerson})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {v.imageUrls && v.imageUrls.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {v.imageUrls.slice(0, 3).map((img: string, i: number) => (
                        <div
                          key={img || i}
                          className="size-9 shrink-0 overflow-hidden rounded-md border border-border bg-muted/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={v.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/50 text-right">
                    <Link
                      href={`/vendors/${v.id}`}
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View Vendor Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(user.role === "admin" || user.role === "manager") && (
        <BookingProfitability
          revenue={booking.totalAmount}
          memberCount={booking.memberCount}
          currency={booking.currency}
          packageCostConfigured={Boolean(pkg?.cost)}
          packageCostPerMember={packageCostPerMember}
          bookingExpenses={bookingExpenses}
        />
      )}

      <MembersPanel
        booking={booking}
        members={members}
        sources={sources.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }))}
        canManage={canManageBookings}
        canEdit={canEditAssignedModules(user)}
      />
      {(user.role === "admin" || user.role === "manager") && (
        <BookingExpensesPanel
          bookingId={id}
          currency={booking.currency}
          expenses={expenses}
          today={todayIST()}
        />
      )}
    </>
  );
}