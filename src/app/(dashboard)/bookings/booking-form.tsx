"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Bus,
  Check,
  Hotel,
  MapPin,
  Phone,
  Search,
  X,
} from "lucide-react";
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
import type { Booking, TravelPackage, Vendor, VendorImage } from "@/types/models";

const selectClass = "border-input bg-background h-9 w-full rounded-md border px-2 text-sm";
const msg = (m?: string) => (m && /expected|nan/i.test(m) ? "Enter a valid number" : m);
const Err = ({ m }: { m?: string }) => (m ? <p className="text-destructive text-xs">{msg(m)}</p> : null);

export function BookingForm({
  packages,
  booking,
  defaultCloseDate = "",
  vendors = [],
}: {
  packages: TravelPackage[];
  booking: Booking | null;
  defaultCloseDate?: string;
  vendors?: Vendor[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [destinationFilter, setDestinationFilter] = useState("");
  const [vendorTypeFilter, setVendorTypeFilter] = useState<"all" | "travels" | "hotel" | "selected">("all");

  const {
    register, control, handleSubmit, setValue, getValues,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingInputSchema) as Resolver<BookingInput>,
    defaultValues: booking
      ? {
          packageId: booking.packageId,
          title: booking.title,
          contactName: booking.contactName ?? "",
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
          vendorIds: booking.vendorIds ?? [],
        }
      : {
          packageId: "", title: "", contactName: "", travelStart: "", travelEnd: "", closeDate: defaultCloseDate,
          minPersons: 1, maxPersons: 0, adultPrice: 0, childPrice: 0, seniorPrice: 0,
          repriceExisting: false, notes: "",
          vendorIds: [],
        },
  });

  const pid = useWatch({ control, name: "packageId" });
  const watchedVendorIds = (useWatch({ control, name: "vendorIds" }) as string[]) || [];
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
    if (p.destination && !destinationFilter) {
      setDestinationFilter(p.destination);
    }
  }

  function toggleVendor(vendorId: string) {
    const isSelected = watchedVendorIds.includes(vendorId);
    const next = isSelected
      ? watchedVendorIds.filter((id) => id !== vendorId)
      : [...watchedVendorIds, vendorId];
    setValue("vendorIds", next, { shouldValidate: true });
  }

  // Filter vendors based on destination search and category
  const filteredVendors = vendors.filter((v) => {
    if (destinationFilter.trim()) {
      const match = v.destination?.toLowerCase().includes(destinationFilter.trim().toLowerCase());
      if (!match) return false;
    }
    if (vendorTypeFilter === "travels") return v.type === "travels";
    if (vendorTypeFilter === "hotel") return v.type === "hotel";
    if (vendorTypeFilter === "selected") return watchedVendorIds.includes(v.id);
    return true;
  });

  const selectedVendorObjects = vendors.filter((v) => watchedVendorIds.includes(v.id));

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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="contactName">Booked person name (required)</Label>
            <Input
              id="contactName"
              autoComplete="name"
              placeholder="Enter the booked person's full name"
              required
              {...register("contactName")}
            />
            <Err m={errors.contactName?.message} />
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

      {/* VENDOR SELECTION SECTION */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="text-primary size-5" />
                Trip Vendors & Partners
              </CardTitle>
              <CardDescription>
                Select Travels (fleet & buses) and Hotel service partners to assign to this trip.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {watchedVendorIds.length} {watchedVendorIds.length === 1 ? "vendor" : "vendors"} selected
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Vendors Quick Bar */}
          {selectedVendorObjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <span className="text-xs font-semibold text-foreground mr-1">Assigned to Trip:</span>
              {selectedVendorObjects.map((sv) => (
                <span
                  key={sv.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-background border border-primary/30 px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs"
                >
                  {sv.type === "travels" ? (
                    <Bus className="size-3 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Hotel className="size-3 text-purple-600 dark:text-purple-400" />
                  )}
                  {sv.name}
                  <span className="text-muted-foreground text-[10px]">({sv.destination})</span>
                  <button
                    type="button"
                    onClick={() => toggleVendor(sv.id)}
                    className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Destination Search & Category Filter Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search vendors by destination (e.g. Goa, Manali, Kashmir)..."
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs"
              />
              {destinationFilter && (
                <button
                  type="button"
                  onClick={() => setDestinationFilter("")}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setVendorTypeFilter("all")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  vendorTypeFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All ({vendors.length})
              </button>
              <button
                type="button"
                onClick={() => setVendorTypeFilter("travels")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  vendorTypeFilter === "travels"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Bus className="size-3" /> Travels
              </button>
              <button
                type="button"
                onClick={() => setVendorTypeFilter("hotel")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  vendorTypeFilter === "hotel"
                    ? "bg-purple-600 text-white shadow-2xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Hotel className="size-3" /> Hotel
              </button>
              <button
                type="button"
                onClick={() => setVendorTypeFilter("selected")}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  vendorTypeFilter === "selected"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Check className="size-3" /> Selected ({watchedVendorIds.length})
              </button>
            </div>
          </div>

          {/* Vendors Grid */}
          {filteredVendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <Building2 className="mx-auto size-10 opacity-40 mb-2" />
              <p className="font-semibold text-sm">No matching vendors found</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {destinationFilter
                  ? `No verified partners operating in "${destinationFilter}". Try clearing or broadening the destination filter.`
                  : "No active vendors available under the selected filter."}
              </p>
              {destinationFilter && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs"
                  onClick={() => setDestinationFilter("")}
                >
                  Clear Destination Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredVendors.map((v) => {
                const isSelected = watchedVendorIds.includes(v.id);
                const imageUrls =
                  v.images && v.images.length > 0
                    ? v.images.map((img: VendorImage) => img.url)
                    : v.imageUrls ?? [];

                return (
                  <div
                    key={v.id}
                    onClick={() => toggleVendor(v.id)}
                    className={`relative flex flex-col justify-between rounded-lg border p-4 cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Top line: Name & Category badge & checkbox */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                              {v.name}
                            </h4>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              v.type === "travels"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                : "bg-purple-500/10 text-purple-700 dark:text-purple-300"
                            }`}
                          >
                            {v.type === "travels" ? (
                              <>
                                <Bus className="size-3" /> Travels Partner
                              </>
                            ) : (
                              <>
                                <Hotel className="size-3" /> Hotel Property
                              </>
                            )}
                          </span>
                        </div>

                        {/* Checkbox indicator */}
                        <div
                          className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isSelected && <Check className="size-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Details: Destination & Contact */}
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          <span className="font-medium text-foreground">
                            {v.destination}
                          </span>
                          {v.state && <span>• {v.state}</span>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="size-3.5 shrink-0" />
                          <span>{v.phone}</span>
                          {v.contactPerson && (
                            <span className="truncate">({v.contactPerson})</span>
                          )}
                        </div>
                        {v.type === "travels" && v.travelsDetails && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Bus className="size-3 shrink-0" />
                            <span>
                              {v.travelsDetails.totalBusCount ?? 0} Buses •{" "}
                              {v.travelsDetails.totalSeatCapacity ?? 0} Seats
                            </span>
                          </div>
                        )}
                        {v.type === "hotel" && v.hotelDetails && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Hotel className="size-3 shrink-0" />
                            <span>
                              {v.hotelDetails.totalRooms ?? 0} Rooms •{" "}
                              {v.hotelDetails.starRating
                                ? `${v.hotelDetails.starRating} Star`
                                : "Boutique"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Image Thumbnails Preview */}
                      {imageUrls.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1">
                          {imageUrls.slice(0, 3).map((url, i) => (
                            <div
                              key={url || i}
                              className="size-10 shrink-0 overflow-hidden rounded-md border border-border bg-muted/40"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt="Vendor Preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                          {imageUrls.length > 3 && (
                            <span className="flex size-10 items-center justify-center rounded-md border border-border bg-muted text-[10px] font-medium text-muted-foreground">
                              +{imageUrls.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom select toggle */}
                    <div className="pt-3 border-t border-border/50 mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {isSelected ? "Assigned to trip" : "Click to select"}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        className="h-7 text-xs px-2.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVendor(v.id);
                        }}
                      >
                        {isSelected ? (
                          <>
                            <Check className="size-3 mr-1" /> Assigned
                          </>
                        ) : (
                          "Select"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
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