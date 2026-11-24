"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Bus,
  Calendar,
  Check,
  CreditCard,
  Edit,
  ExternalLink,
  Hotel,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BUS_STATUS_LABELS,
  BUS_TYPE_LABELS,
  HOTEL_PROPERTY_TYPE_LABELS,
  MEAL_PLAN_LABELS,
  PAYMENT_TERMS_LABELS,
  PERMIT_TYPE_LABELS,
} from "@/lib/validators/vendor";
import type { Vendor } from "@/types/models";
import { VendorStatusBadge, VendorTypeBadge } from "./status-badge";

type Props = {
  vendor: Vendor;
  canManage: boolean;
};

export function VendorDetailView({ vendor, canManage }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/vendors"
          className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1" })}
        >
          <ArrowLeft className="size-4" /> Back to Vendors
        </Link>
        {canManage && (
          <Link
            href={`/vendors/${vendor.id}/edit`}
            className={buttonVariants({ size: "sm", className: "gap-2" })}
          >
            <Edit className="size-4" /> Edit Vendor
          </Link>
        )}
      </div>

      {/* Profile Header Card */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{vendor.name}</h1>
                <VendorTypeBadge type={vendor.type} />
                <VendorStatusBadge status={vendor.status} />
              </div>
              {vendor.tradeName && (
                <p className="text-muted-foreground text-sm font-medium">
                  Trade / Brand Name: {vendor.tradeName}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-xs pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {vendor.city}, {vendor.state} (Dest: {vendor.destination})
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {vendor.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {vendor.email}
                </span>
              </div>
            </div>

            {/* Quick Summary Pill */}
            {vendor.type === "travels" && vendor.travelsDetails && (
              <div className="flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-blue-900 dark:text-blue-100">
                <Bus className="size-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Fleet Summary</p>
                  <p className="text-sm font-bold">
                    {vendor.travelsDetails.totalBusCount} Buses • {vendor.travelsDetails.totalSeatCapacity} Seats
                  </p>
                </div>
              </div>
            )}

            {vendor.type === "hotel" && vendor.hotelDetails && (
              <div className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-500/10 p-3 text-purple-900 dark:text-purple-100">
                <Hotel className="size-6 text-purple-600 dark:text-purple-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Inventory</p>
                  <p className="text-sm font-bold">
                    {vendor.hotelDetails.totalRooms || 0} Rooms •{" "}
                    {vendor.hotelDetails.starRating ? `${vendor.hotelDetails.starRating} Star` : "Boutique"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: General & Contact Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="size-4 text-primary" /> Contact Persons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Primary Contact</p>
                <p className="font-semibold">{vendor.contactPerson}</p>
                {vendor.designation && (
                  <p className="text-muted-foreground text-xs">{vendor.designation}</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Mobile Phone</p>
                <p className="font-medium">{vendor.phone}</p>
              </div>
              {vendor.alternatePhone && (
                <div>
                  <p className="text-muted-foreground text-xs">Alternate Phone</p>
                  <p className="font-medium">{vendor.alternatePhone}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs">Email Address</p>
                <p className="font-medium">{vendor.email}</p>
              </div>

              {vendor.type === "travels" && vendor.travelsDetails?.emergencyContact && (
                <div className="rounded-md bg-destructive/10 p-2 text-destructive text-xs">
                  <span className="font-semibold">24x7 Breakdown Helpline:</span>{" "}
                  {vendor.travelsDetails.emergencyContact}
                </div>
              )}

              {vendor.type === "hotel" && vendor.hotelDetails?.frontDeskPhone && (
                <div>
                  <p className="text-muted-foreground text-xs">Front Desk Phone</p>
                  <p className="font-medium">{vendor.hotelDetails.frontDeskPhone}</p>
                </div>
              )}

              {vendor.type === "hotel" && vendor.hotelDetails?.reservationEmail && (
                <div>
                  <p className="text-muted-foreground text-xs">Reservations Email</p>
                  <p className="font-medium">{vendor.hotelDetails.reservationEmail}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="size-4 text-primary" /> Location & Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Physical Address</p>
                <p className="font-medium">{vendor.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">City / Town</p>
                  <p className="font-medium">{vendor.city}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">State</p>
                  <p className="font-medium">{vendor.state}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">PIN Code</p>
                  <p className="font-medium">{vendor.pincode || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Destination Mapping</p>
                  <p className="font-medium">{vendor.destination}</p>
                </div>
              </div>
              {vendor.locationUrl && (
                <a
                  href={vendor.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                >
                  <ExternalLink className="size-3" /> View on Google Maps
                </a>
              )}
            </CardContent>
          </Card>

          {/* Business & Bank Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-4 text-primary" /> Tax & Settlement Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">GSTIN</p>
                  <p className="font-mono font-medium">{vendor.gstin || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">PAN</p>
                  <p className="font-mono font-medium">{vendor.pan || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Bank Name</p>
                <p className="font-medium">{vendor.bankName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Account Number</p>
                <p className="font-mono font-medium">{vendor.accountNumber || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Account Holder Name</p>
                <p className="font-medium">{vendor.accountHolderName || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">IFSC Code</p>
                  <p className="font-mono font-medium">{vendor.ifscCode || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">UPI ID</p>
                  <p className="font-medium">{vendor.upiId || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">Payment Terms</p>
                  <p className="font-medium">
                    {PAYMENT_TERMS_LABELS[vendor.paymentTerms as keyof typeof PAYMENT_TERMS_LABELS] ||
                      vendor.paymentTerms}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Currency</p>
                  <p className="font-medium">{vendor.currency}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Columns: Category Specifics (Fleet or Hotel Specs) */}
        <div className="space-y-6 lg:col-span-2">
          {vendor.type === "travels" && vendor.travelsDetails && (
            <Card className="border-blue-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-950 dark:text-blue-100">
                    <Bus className="size-5 text-blue-600 dark:text-blue-400" />
                    Bus Fleet Management ({vendor.travelsDetails.totalBusCount} Buses)
                  </CardTitle>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Total Capacity: {vendor.travelsDetails.totalSeatCapacity} Seats
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vendor.travelsDetails.buses.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    No individual buses have been added yet. Click &quot;Edit Vendor&quot; to configure fleet vehicles.
                  </p>
                ) : (
                  vendor.travelsDetails.buses.map((bus, idx) => (
                    <Card key={bus.id || idx} className="border-border/80">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base font-mono">
                              {bus.registrationNumber}
                            </span>
                            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                              {BUS_TYPE_LABELS[bus.busType as keyof typeof BUS_TYPE_LABELS] ||
                                bus.busType}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              {bus.seatingCapacity} Seats
                            </span>
                            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                              {BUS_STATUS_LABELS[bus.status as keyof typeof BUS_STATUS_LABELS] ||
                                bus.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Make / Model: </span>
                            <span className="font-medium">{bus.makeModel || "—"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Permit Type: </span>
                            <span className="font-medium">
                              {PERMIT_TYPE_LABELS[bus.permitType as keyof typeof PERMIT_TYPE_LABELS] ||
                                bus.permitType}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Driver: </span>
                            <span className="font-medium">
                              {bus.driverName
                                ? `${bus.driverName} (${bus.driverPhone || "No phone"})`
                                : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fitness Expiry: </span>
                            <span className="font-medium">
                              {bus.fitnessExpiryDate || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Insurance Expiry: </span>
                            <span className="font-medium">
                              {bus.insuranceExpiryDate || "—"}
                            </span>
                          </div>
                        </div>

                        {bus.amenities && bus.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {bus.amenities.map((amenity) => (
                              <span
                                key={amenity}
                                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                              >
                                <Check className="size-3 text-primary" /> {amenity}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {vendor.type === "hotel" && vendor.hotelDetails && (
            <Card className="border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-purple-950 dark:text-purple-100">
                  <Hotel className="size-5 text-purple-600 dark:text-purple-400" />
                  Hotel & Accommodation Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-4 rounded-lg bg-muted/40 p-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Property Type</p>
                    <p className="font-semibold text-sm">
                      {HOTEL_PROPERTY_TYPE_LABELS[
                        vendor.hotelDetails.propertyType as keyof typeof HOTEL_PROPERTY_TYPE_LABELS
                      ] || vendor.hotelDetails.propertyType}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Star Rating</p>
                    <p className="font-semibold text-sm">
                      {vendor.hotelDetails.starRating
                        ? `${vendor.hotelDetails.starRating} Star`
                        : "Unrated / Boutique"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Total Rooms</p>
                    <p className="font-semibold text-sm text-purple-600 dark:text-purple-400">
                      {vendor.hotelDetails.totalRooms || 0} Rooms
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tariff Range</p>
                    <p className="font-semibold text-sm">
                      {vendor.hotelDetails.tariffRange || "—"}
                    </p>
                  </div>
                </div>

                {/* Timings */}
                <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-border/80 p-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Standard Check-In</p>
                    <p className="font-semibold text-sm">{vendor.hotelDetails.checkInTime || "12:00 PM"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Standard Check-Out</p>
                    <p className="font-semibold text-sm">{vendor.hotelDetails.checkOutTime || "11:00 AM"}</p>
                  </div>
                </div>

                {/* Room Types */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Room Categories Available
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {vendor.hotelDetails.roomTypes && vendor.hotelDetails.roomTypes.length > 0 ? (
                      vendor.hotelDetails.roomTypes.map((rt) => (
                        <span
                          key={rt}
                          className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300"
                        >
                          {rt}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">No specific room types recorded</span>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Property Amenities & Facilities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {vendor.hotelDetails.amenities && vendor.hotelDetails.amenities.length > 0 ? (
                      vendor.hotelDetails.amenities.map((am) => (
                        <span
                          key={am}
                          className="inline-flex items-center gap-1 rounded bg-muted px-2.5 py-1 text-xs font-medium"
                        >
                          <Check className="size-3 text-primary" /> {am}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">No amenities selected</span>
                    )}
                  </div>
                </div>

                {/* Meal Plans */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Meal Plans
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {vendor.hotelDetails.mealPlans && vendor.hotelDetails.mealPlans.length > 0 ? (
                      vendor.hotelDetails.mealPlans.map((mp) => (
                        <span
                          key={mp}
                          className="rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary"
                        >
                          {MEAL_PLAN_LABELS[mp as keyof typeof MEAL_PLAN_LABELS] || mp}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-xs">No meal plans configured</span>
                    )}
                  </div>
                </div>

                {/* Policies */}
                {(vendor.hotelDetails.childPolicy || vendor.hotelDetails.cancellationPolicy) && (
                  <div className="grid gap-3 sm:grid-cols-2 pt-2">
                    {vendor.hotelDetails.childPolicy && (
                      <div className="rounded-lg border p-3 text-xs space-y-1">
                        <p className="font-semibold">Child & Extra Bed Policy</p>
                        <p className="text-muted-foreground">{vendor.hotelDetails.childPolicy}</p>
                      </div>
                    )}
                    {vendor.hotelDetails.cancellationPolicy && (
                      <div className="rounded-lg border p-3 text-xs space-y-1">
                        <p className="font-semibold">Cancellation Policy</p>
                        <p className="text-muted-foreground">{vendor.hotelDetails.cancellationPolicy}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Operational Notes & Contract Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4 text-primary" /> Contract Dates & Operational Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">Agreement Start Date</p>
                  <p className="font-medium">{vendor.contractStartDate || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Agreement End Date</p>
                  <p className="font-medium">{vendor.contractEndDate || "—"}</p>
                </div>
              </div>
              {vendor.notes && (
                <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                  <p className="font-semibold">Internal Notes & Specific Contract Terms</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{vendor.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
