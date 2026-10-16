"use client";
import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createBooking, updateBooking } from "@/actions/bookings";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, formatMoney, fromMinor } from "@/lib/finance/currency";
import { pricePerPerson } from "@/lib/finance/pricing";
import { bookingInputSchema, type BookingInput } from "@/lib/validators/booking";
import type { Booking, TravelPackage } from "@/types/models";

const selectClass = "border-input bg-background h-9 w-full rounded-md border px-2 text-sm";
const msg = (m?: string) => (m && /expected|nan/i.test(m) ? "Enter a valid number" : m);
const Err = ({ m }: { m?: string }) => (m ? <p className="text-destructive text-xs">{msg(m)}</p> : null);

export function BookingForm({
  packages, booking, defaultCloseDate = "",
}: { packages: TravelPackage[]; booking: Booking | null; defaultCloseDate?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register, control, handleSubmit, setValue, getValues,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingInputSchema),
    defaultValues: booking
      ? {
          packageId: booking.packageId,
          title: booking.title,
          travelStart: booking.travelStart,
          travelEnd: booking.travelEnd,
          closeDate: booking.closeDate,
          minPersons: booking.maxPersons > 0 ? booking.maxPersons : booking.minPersons,
          maxPersons: booking.maxPersons > 0 ? booking.maxPersons : booking.minPersons,
          adultPrice: fromMinor(booking.rates.adult),
          childPrice: fromMinor(booking.rates.child),
          seniorPrice: fromMinor(booking.rates.senior),
          repriceExisting: false,
          notes: booking.notes,
        }
      : {
          packageId: "", title: "", travelStart: "", travelEnd: "", closeDate: defaultCloseDate,
          minPersons: 1, maxPersons: 0, adultPrice: 0, childPrice: 0, seniorPrice: 0,
          repriceExisting: false, notes: "",
        },
  });

  const pid = useWatch({ control, name: "packageId" });
  const pkg = packages.find((p) => p.id === pid);
  const currency = booking?.currency ?? pkg?.price.currency ?? "INR";
  const symbol = CURRENCIES[currency].symbol;

  function onPackageChange(id: string) {
    const p = packages.find((x) => x.id === id);
    if (!p) return;
    const persons = p.maxPersons > 0 ? p.maxPersons : p.minPersons;
    const adult = fromMinor(pricePerPerson(p.priceTiers, persons));
    setValue("minPersons", persons);
    setValue("maxPersons", persons);
    setValue("adultPrice", adult);
    setValue("childPrice", adult);
    setValue("seniorPrice", adult);
    if (!getValues("title")) setValue("title", p.name);
  }

  function onSubmit(v: BookingInput) {
    startTransition(async () => {
      const input = { ...v, maxPersons: v.minPersons };
      const res = booking
        ? await updateBooking(booking.id, input)
        : await createBooking(input);
      if (res.ok) {
        toast.success(booking ? "Booking updated" : "Booking created");
        router.push(`/bookings/${res.id}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader><CardTitle>Trip</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="packageId">Package</Label>
            {booking ? (
              <p className="text-sm font-medium">{booking.packageName}</p>
            ) : (
              <>
                <select
                  id="packageId" className={selectClass}
                  {...register("packageId", { onChange: (e) => onPackageChange(e.target.value) })}
                >
                  <option value="">Select an Active package</option>
                  {packages.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.destination})</option>)}
                </select>
                <Err m={errors.packageId?.message} />
              </>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Booking title</Label>
            <Input id="title" placeholder="e.g. Bali, 12 Nov batch" {...register("title")} />
            <Err m={errors.title?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="travelStart">Travel starts</Label>
            <Input id="travelStart" type="date" {...register("travelStart")} />
            <Err m={errors.travelStart?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="travelEnd">Travel ends</Label>
            <Input id="travelEnd" type="date" {...register("travelEnd")} />
            <Err m={errors.travelEnd?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="closeDate">Booking closes on</Label>
            <Input id="closeDate" type="date" {...register("closeDate")} />
            <p className="text-muted-foreground text-xs">Members can be added until the end of this day.</p>
            <Err m={errors.closeDate?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Group size</CardTitle>
          <CardDescription>Set the number of persons for this booking.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="minPersons">Number of persons</Label>
            <Input id="minPersons" type="number" min={1} {...register("minPersons", { valueAsNumber: true })} />
            <Err m={errors.minPersons?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rates per person ({currency})</CardTitle>
          <CardDescription>
            A new member gets the rate for their category, and you can still change it per member.
            {pkg && pkg.priceTiers.length > 1 && (
              <>
                {" "}Package group rates:{" "}
                {pkg.priceTiers.map((t) => `${t.fromPersons}+ at ${formatMoney(t.amount, pkg.price.currency)}`).join(", ")}.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["adultPrice", "Adult"],
              ["childPrice", "Child"],
              ["seniorPrice", "Senior citizen"],
            ] as const
          ).map(([name, label]) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={name}>{label} ({symbol})</Label>
              <Input id={name} type="number" step="0.01" min={0} {...register(name, { valueAsNumber: true })} />
              <Err m={errors[name]?.message} />
            </div>
          ))}

          {booking && (
            <label className="flex items-start gap-2 text-sm sm:col-span-3">
              <input type="checkbox" className="mt-1" {...register("repriceExisting")} />
              <span>
                Also apply new rates to existing members who don&apos;t have a custom price.
                <span className="text-muted-foreground block text-xs">
                  Members with an edited price keep it.
                </span>
              </span>
            </label>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={3} {...register("notes")} />
          <Err m={errors.notes?.message} />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button className="w-full sm:w-auto" type="submit" disabled={pending}>
          {pending ? "Saving…" : booking ? "Save changes" : "Create booking"}
        </Button>
        <Link
          href={booking ? `/bookings/${booking.id}` : "/bookings"}
          className={buttonVariants({ variant: "outline", className: "w-full sm:w-auto" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}