"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useFieldArray,
  useForm,
  useWatch,
  type UseFormSetValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Bus,
  Check,
  FileText,
  Hotel,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  createVendor,
  deleteVendorImageAction,
  updateVendor,
} from "@/actions/vendors";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BUS_STATUSES,
  BUS_STATUS_LABELS,
  BUS_TYPES,
  BUS_TYPE_LABELS,
  COMMON_BUS_AMENITIES,
  COMMON_HOTEL_AMENITIES,
  COMMON_ROOM_TYPES,
  HOTEL_PROPERTY_TYPES,
  HOTEL_PROPERTY_TYPE_LABELS,
  MEAL_PLANS,
  MEAL_PLAN_LABELS,
  PERMIT_TYPES,
  PERMIT_TYPE_LABELS,
  VENDOR_STATUSES,
  VENDOR_STATUS_LABELS,
  VENDOR_TYPES,
  VENDOR_TYPE_LABELS,
  vendorFormSchema,
  type BusDetailFormValues,
  type VendorFormValues,
} from "@/lib/validators/vendor";
import type { Vendor, VendorImage } from "@/types/models";
import { DestinationAutocomplete } from "./destination-autocomplete";
import { VendorImageUploader } from "./vendor-image-uploader";
import { BusImageUploader } from "./bus-image-uploader";

const selectClass =
  "border-input bg-background h-10 w-full rounded-md border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

const Err = ({ m }: { m?: string }) =>
  m ? <p className="text-destructive text-xs font-medium">{m}</p> : null;

export function VendorForm({ vendor }: { vendor: Vendor | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isEditing = Boolean(vendor);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema) as any,
    defaultValues: {
      type: vendor?.type ?? "travels",
      name: vendor?.name ?? "",
      tradeName: vendor?.tradeName ?? "",
      status: vendor?.status ?? "active",

      // Contact
      contactPerson: vendor?.contactPerson ?? "",
      designation: vendor?.designation ?? "",
      phone: vendor?.phone ?? "",
      alternatePhone: vendor?.alternatePhone ?? "",
      email: vendor?.email ?? "",

      // Location
      address: vendor?.address ?? "",
      state: vendor?.state ?? "",
      pincode: vendor?.pincode ?? "",
      destination: vendor?.destination ?? "",
      locationUrl: vendor?.locationUrl ?? "",

      // Images
      images: vendor?.images ?? [],
      imageUrls: vendor?.imageUrls ?? [],

      // Category Details
      travelsDetails: {
        operatingRoutes: vendor?.travelsDetails?.operatingRoutes ?? [],
        fleetTypes: vendor?.travelsDetails?.fleetTypes ?? [],
        buses: (vendor?.travelsDetails?.buses ?? []).map((bus) => {
          const busImgs =
            bus.images && bus.images.length > 0
              ? bus.images
              : bus.image
                ? [bus.image]
                : [];
          const busImgUrls =
            bus.imageUrls && bus.imageUrls.length > 0
              ? bus.imageUrls
              : bus.imageUrl
                ? [bus.imageUrl]
                : busImgs.map((i) => i.url);

          return {
            id: bus.id,
            registrationNumber: bus.registrationNumber,
            busType: (bus.busType as BusDetailFormValues["busType"]) || "ac_sleeper",
            seatingCapacity: bus.seatingCapacity,
            makeModel: bus.makeModel ?? "",
            amenities: bus.amenities ?? [],
            driverName: bus.driverName ?? "",
            driverPhone: bus.driverPhone ?? "",
            permitType: (bus.permitType as BusDetailFormValues["permitType"]) || "all_india",
            status: bus.status ?? "active",
            images: busImgs,
            imageUrls: busImgUrls,
            image: busImgs[0] ?? null,
            imageUrl: busImgUrls[0] ?? "",
          };
        }),
        totalBusCount: vendor?.travelsDetails?.totalBusCount ?? 0,
        totalSeatCapacity: vendor?.travelsDetails?.totalSeatCapacity ?? 0,
        emergencyContact: vendor?.travelsDetails?.emergencyContact ?? "",
      },

      hotelDetails: {
        propertyType: vendor?.hotelDetails?.propertyType ?? "hotel",
        starRating: vendor?.hotelDetails?.starRating ?? 0,
        totalRooms: vendor?.hotelDetails?.totalRooms ?? 0,
        roomTypes: vendor?.hotelDetails?.roomTypes ?? [],
        amenities: vendor?.hotelDetails?.amenities ?? [],
        checkInTime: vendor?.hotelDetails?.checkInTime ?? "12:00 PM",
        checkOutTime: vendor?.hotelDetails?.checkOutTime ?? "11:00 AM",
        mealPlans: ((vendor?.hotelDetails as any)?.mealPlans ?? []) as any,
        cancellationPolicy: vendor?.hotelDetails?.cancellationPolicy ?? "",
        childPolicy: vendor?.hotelDetails?.childPolicy ?? "",
        tariffRange: vendor?.hotelDetails?.tariffRange ?? "",
      },
    },
  });

  const selectedType = useWatch({ control, name: "type" });
  const watchedImages = (useWatch({ control, name: "images" }) as VendorImage[]) || [];
  const watchedDestination = useWatch({ control, name: "destination" }) || "";

  // Watch buses array to automatically compute total buses & total seat capacity
  const watchedBuses = useWatch({
    control,
    name: "travelsDetails.buses",
  });

  const watchedRoomTypes = useWatch({
    control,
    name: "hotelDetails.roomTypes",
  }) || [];

  const watchedHotelAmenities = useWatch({
    control,
    name: "hotelDetails.amenities",
  }) || [];

  const watchedMealPlans = useWatch({
    control,
    name: "hotelDetails.mealPlans",
  }) || [];

  const computedTotalBuses = watchedBuses?.length ?? 0;
  const computedTotalSeats =
    watchedBuses?.reduce(
      (sum, b) => sum + (Number(b?.seatingCapacity) || 0),
      0,
    ) ?? 0;

  useEffect(() => {
    if (selectedType === "travels") {
      setValue("travelsDetails.totalBusCount", computedTotalBuses);
      setValue("travelsDetails.totalSeatCapacity", computedTotalSeats);
    }
  }, [selectedType, computedTotalBuses, computedTotalSeats, setValue]);

  const {
    fields: busFields,
    append: appendBus,
    remove: removeBus,
  } = useFieldArray({
    control,
    name: "travelsDetails.buses",
  });

  function onSubmit(values: VendorFormValues) {
    startTransition(async () => {
      try {
        const payload: VendorFormValues = {
          ...values,
          travelsDetails:
            values.type === "travels" && values.travelsDetails
              ? {
                  ...values.travelsDetails,
                  operatingRoutes: values.travelsDetails.operatingRoutes ?? [],
                  fleetTypes: values.travelsDetails.fleetTypes ?? [],
                  buses: values.travelsDetails.buses ?? [],
                  emergencyContact: values.travelsDetails.emergencyContact ?? "",
                  totalBusCount: values.travelsDetails.buses?.length ?? 0,
                  totalSeatCapacity:
                    values.travelsDetails.buses?.reduce(
                      (acc, b) => acc + (Number(b.seatingCapacity) || 0),
                      0,
                    ) ?? 0,
                }
              : undefined,
          hotelDetails: values.type === "hotel" ? values.hotelDetails : undefined,
        };

        const result = isEditing && vendor
          ? await updateVendor(vendor.id, payload)
          : await createVendor(payload);

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success(
          isEditing
            ? "Vendor updated successfully"
            : "Vendor created successfully",
        );
        router.push(`/vendors/${result.id}`);
        router.refresh();
      } catch (error) {
        console.error("Vendor save error:", error);
        toast.error("An unexpected error occurred while saving the vendor.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1. VENDOR TYPE SELECTION CARD */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Vendor Category & Type</CardTitle>
              <CardDescription>
                Select the vendor category. The form will dynamically configure all necessary fields.
              </CardDescription>
            </div>
            {isEditing && (
              <span className="text-muted-foreground text-xs font-medium">
                Editing: {vendor?.name}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vendor-type" className="font-semibold text-base">
                Vendor Type <span className="text-destructive">*</span>
              </Label>
              <select
                id="vendor-type"
                className={selectClass}
                {...register("type")}
              >
                {VENDOR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {VENDOR_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <Err m={errors.type?.message} />
              <p className="text-muted-foreground text-xs">
                Switching between Travels and Hotel dynamically loads relevant business fields and validation rules.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-status" className="font-semibold text-base">
                Status <span className="text-destructive">*</span>
              </Label>
              <select
                id="vendor-status"
                className={selectClass}
                {...register("status")}
              >
                {VENDOR_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {VENDOR_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <Err m={errors.status?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. GENERAL VENDOR & CONTACT INFORMATION */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="text-primary size-5" />
            General & Contact Information
          </CardTitle>
          <CardDescription>
            Basic organization profile, primary point of contact, and communication channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">
                {selectedType === "travels" ? "Travels / Fleet Company Name" : "Hotel / Property Name"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vendor-name"
                placeholder={
                  selectedType === "travels"
                    ? "e.g. Royal Himalayan Travels"
                    : "e.g. Grand Riverfront Luxury Resort"
                }
                {...register("name")}
              />
              <Err m={errors.name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-tradeName">Brand / Trade Name (Optional)</Label>
              <Input
                id="vendor-tradeName"
                placeholder="e.g. Royal Travels / Taj Group"
                {...register("tradeName")}
              />
              <Err m={errors.tradeName?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vendor-contactPerson">
                Primary Contact Person <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vendor-contactPerson"
                placeholder="e.g. Rajesh Sharma"
                {...register("contactPerson")}
              />
              <Err m={errors.contactPerson?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-designation">Designation / Role</Label>
              <Input
                id="vendor-designation"
                placeholder="e.g. Managing Director / GM"
                {...register("designation")}
              />
              <Err m={errors.designation?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-email">
                Primary Email
              </Label>
              <Input
                id="vendor-email"
                type="email"
                placeholder="vendor@example.com"
                {...register("email")}
              />
              <Err m={errors.email?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vendor-phone">
                Primary Mobile Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vendor-phone"
                type="tel"
                placeholder="+91 9876543210"
                {...register("phone")}
              />
              <Err m={errors.phone?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-alternatePhone">Alternate Phone / Landline</Label>
              <Input
                id="vendor-alternatePhone"
                type="tel"
                placeholder="+91 11 23456789"
                {...register("alternatePhone")}
              />
              <Err m={errors.alternatePhone?.message} />
            </div>

            {selectedType === "travels" && (
              <div className="space-y-2">
                <Label htmlFor="travels-emergencyContact">24x7 Breakdown / Emergency Helpline</Label>
                <Input
                  id="travels-emergencyContact"
                  type="tel"
                  placeholder="+91 9999988888"
                  {...register("travelsDetails.emergencyContact")}
                />
                <Err m={errors.travelsDetails?.emergencyContact?.message} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. LOCATION & REGION */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="text-primary size-5" />
            Location & Operating Destination
          </CardTitle>
          <CardDescription>
            Address, state, and primary tourism destination mapping for package integration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor-address">
              Street / Property Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vendor-address"
              placeholder="e.g. Near Mall Road, Opp. Tourist Information Centre"
              {...register("address")}
            />
            <Err m={errors.address?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vendor-state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vendor-state"
                placeholder="e.g. Himachal Pradesh"
                {...register("state")}
              />
              <Err m={errors.state?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-pincode">PIN / Postal Code</Label>
              <Input
                id="vendor-pincode"
                placeholder="e.g. 175131"
                {...register("pincode")}
              />
              <Err m={errors.pincode?.message} />
            </div>

            <div className="space-y-2">
              <DestinationAutocomplete
                value={watchedDestination}
                onChange={(dest: string) =>
                  setValue("destination", dest, { shouldValidate: true })
                }
                error={errors.destination?.message}
                label="Primary Destination"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor-locationUrl">Google Maps / Location Link (Optional)</Label>
            <Input
              id="vendor-locationUrl"
              placeholder="https://maps.google.com/?q=..."
              {...register("locationUrl")}
            />
            <Err m={errors.locationUrl?.message} />
          </div>
        </CardContent>
      </Card>

      {/* 4. DYNAMIC CATEGORY SECTION */}
      {selectedType === "travels" ? (
        /* ==================== TRAVELS VENDOR SPECIFIC FORM ==================== */
        <div className="space-y-6">
          {/* BUS MANAGEMENT SECTION */}
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl text-blue-900 dark:text-blue-100">
                    <Bus className="size-6 text-blue-600 dark:text-blue-400" />
                    Fleet & Bus Management
                  </CardTitle>
                  <CardDescription>
                    Add and manage individual buses in this vendor&apos;s fleet. Capacity and counts auto-calculate in real time.
                  </CardDescription>
                </div>
                {/* AUTO CALCULATED METRICS */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-xs">
                    <Bus className="size-4 text-primary" />
                    <div>
                      <p className="text-muted-foreground text-xs">Total Buses</p>
                      <p className="text-base font-bold text-foreground">
                        {computedTotalBuses}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 shadow-xs">
                    <Users className="size-4 text-emerald-600" />
                    <div>
                      <p className="text-muted-foreground text-xs">Total Seat Capacity</p>
                      <p className="text-base font-bold text-emerald-600">
                        {computedTotalSeats} seats
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* BUSES LIST */}
              {busFields.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-blue-200 dark:border-blue-900/50 bg-background/50 p-8 text-center">
                  <Bus className="size-10 text-muted-foreground/60" />
                  <p className="mt-2 font-medium">No buses registered yet</p>
                  <p className="text-muted-foreground text-xs max-w-sm">
                    Click &quot;Add Bus&quot; below to add buses with registration numbers, seating capacities, and amenities.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() =>
                      appendBus({
                        id: `bus-${Date.now()}`,
                        registrationNumber: "",
                        busType: "ac_sleeper",
                        seatingCapacity: 40,
                        makeModel: "",
                        amenities: ["AC", "Mobile Charging Ports", "Emergency Exit"],
                        driverName: "",
                        driverPhone: "",
                        permitType: "all_india",
                        status: "active",
                        images: [],
                        imageUrls: [],
                        image: null,
                        imageUrl: "",
                      })
                    }
                  >
                    <Plus className="size-4" /> Add First Bus
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {busFields.map((field, index) => {
                    const busErrors = errors.travelsDetails?.buses?.[index];

                    return (
                      <Card key={field.id} className="relative border-border shadow-xs">
                        <CardHeader className="bg-muted/40 pb-3 pt-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {index + 1}
                              </span>
                              <h4 className="font-semibold text-sm">
                                Bus #{index + 1}
                              </h4>
                              {watchedBuses?.[index]?.registrationNumber && (
                                <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono font-medium">
                                  {watchedBuses[index].registrationNumber}
                                </span>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                const busToRemove = watchedBuses?.[index];
                                const keysToDelete = [
                                  ...(busToRemove?.images?.map((i) => i.objectKey) || []),
                                  busToRemove?.image?.objectKey,
                                ].filter((k): k is string => Boolean(k));

                                keysToDelete.forEach((key) => {
                                  fetch(`/api/vendors/images?key=${encodeURIComponent(key)}`, {
                                    method: "DELETE",
                                  }).catch(() => deleteVendorImageAction(key));
                                });
                                removeBus(index);
                              }}
                            >
                              <Trash2 className="size-4 mr-1" /> Remove
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label htmlFor={`bus-${index}-reg`}>
                                Registration No. <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id={`bus-${index}-reg`}
                                placeholder="e.g. DL 01 AB 1234"
                                className="font-mono uppercase"
                                {...register(
                                  `travelsDetails.buses.${index}.registrationNumber`,
                                )}
                              />
                              <Err m={busErrors?.registrationNumber?.message} />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`bus-${index}-type`}>
                                Bus Category / Type <span className="text-destructive">*</span>
                              </Label>
                              <select
                                id={`bus-${index}-type`}
                                className={selectClass}
                                {...register(`travelsDetails.buses.${index}.busType`)}
                              >
                                {BUS_TYPES.map((bt) => (
                                  <option key={bt} value={bt}>
                                    {BUS_TYPE_LABELS[bt]}
                                  </option>
                                ))}
                              </select>
                              <Err m={busErrors?.busType?.message} />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`bus-${index}-cap`}>
                                Seating Capacity <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id={`bus-${index}-cap`}
                                type="number"
                                min={1}
                                max={120}
                                placeholder="e.g. 40"
                                {...register(
                                  `travelsDetails.buses.${index}.seatingCapacity`,
                                )}
                              />
                              <Err m={busErrors?.seatingCapacity?.message} />
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label htmlFor={`bus-${index}-make`}>Make & Model</Label>
                              <Input
                                id={`bus-${index}-make`}
                                placeholder="e.g. Volvo 9600 / BharatBenz"
                                {...register(`travelsDetails.buses.${index}.makeModel`)}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`bus-${index}-permit`}>Permit Type</Label>
                              <select
                                id={`bus-${index}-permit`}
                                className={selectClass}
                                {...register(
                                  `travelsDetails.buses.${index}.permitType`,
                                )}
                              >
                                {PERMIT_TYPES.map((pt) => (
                                  <option key={pt} value={pt}>
                                    {PERMIT_TYPE_LABELS[pt]}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`bus-${index}-status`}>Operational Status</Label>
                              <select
                                id={`bus-${index}-status`}
                                className={selectClass}
                                {...register(`travelsDetails.buses.${index}.status`)}
                              >
                                {BUS_STATUSES.map((st) => (
                                  <option key={st} value={st}>
                                    {BUS_STATUS_LABELS[st]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`bus-${index}-driver`}>Assigned Driver Name</Label>
                              <Input
                                id={`bus-${index}-driver`}
                                placeholder="Driver name"
                                {...register(
                                  `travelsDetails.buses.${index}.driverName`,
                                )}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`bus-${index}-driverPhone`}>Driver Mobile</Label>
                              <Input
                                id={`bus-${index}-driverPhone`}
                                type="tel"
                                placeholder="+91 9876543210"
                                {...register(
                                  `travelsDetails.buses.${index}.driverPhone`,
                                )}
                              />
                            </div>
                          </div>

                          {/* Bus Amenities Toggles */}
                          <div className="space-y-2">
                            <Label className="text-xs font-semibold">Bus Amenities</Label>
                            <div className="flex flex-wrap gap-2">
                              {COMMON_BUS_AMENITIES.map((amenity) => {
                                const currentAmenities =
                                  watchedBuses?.[index]?.amenities || [];
                                const isChecked = currentAmenities.includes(amenity);

                                return (
                                  <button
                                    key={amenity}
                                    type="button"
                                    onClick={() => {
                                      const next = isChecked
                                        ? currentAmenities.filter((a) => a !== amenity)
                                        : [...currentAmenities, amenity];
                                      setValue(
                                        `travelsDetails.buses.${index}.amenities`,
                                        next,
                                      );
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                      isChecked
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                    }`}
                                  >
                                    {isChecked && <Check className="size-3" />}
                                    {amenity}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Individual Bus Image Upload */}
                          <div className="pt-3 border-t border-border/60">
                            <BusImageUploader
                              busIndex={index}
                              busNumber={
                                watchedBuses?.[index]?.registrationNumber ||
                                `Bus #${index + 1}`
                              }
                              images={
                                watchedBuses?.[index]?.images &&
                                watchedBuses[index].images.length > 0
                                  ? watchedBuses[index].images
                                  : watchedBuses?.[index]?.image
                                    ? [watchedBuses[index].image!]
                                    : []
                              }
                              imageUrls={
                                watchedBuses?.[index]?.imageUrls &&
                                watchedBuses[index].imageUrls.length > 0
                                  ? watchedBuses[index].imageUrls
                                  : watchedBuses?.[index]?.imageUrl
                                    ? [watchedBuses[index].imageUrl!]
                                    : []
                              }
                              onChange={(imgs, imgUrls) => {
                                setValue(
                                  `travelsDetails.buses.${index}.images`,
                                  imgs,
                                  { shouldValidate: true }
                                );
                                setValue(
                                  `travelsDetails.buses.${index}.imageUrls`,
                                  imgUrls,
                                  { shouldValidate: true }
                                );
                                setValue(
                                  `travelsDetails.buses.${index}.image`,
                                  imgs[0] || null,
                                  { shouldValidate: true }
                                );
                                setValue(
                                  `travelsDetails.buses.${index}.imageUrl`,
                                  imgUrls[0] || "",
                                  { shouldValidate: true }
                                );
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-dashed py-6"
                    onClick={() =>
                      appendBus({
                        id: `bus-${Date.now()}-${busFields.length}`,
                        registrationNumber: "",
                        busType: "ac_sleeper",
                        seatingCapacity: 40,
                        makeModel: "",
                        amenities: ["AC", "Mobile Charging Ports", "Emergency Exit"],
                        driverName: "",
                        driverPhone: "",
                        permitType: "all_india",
                        status: "active",
                        images: [],
                        imageUrls: [],
                        image: null,
                        imageUrl: "",
                      })
                    }
                  >
                    <Plus className="size-4" /> Add Another Bus
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ==================== HOTEL VENDOR SPECIFIC FORM ==================== */
        <div className="space-y-6">
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-purple-900 dark:text-purple-100">
                <Hotel className="size-6 text-purple-600 dark:text-purple-400" />
                Hotel & Property Specifications
              </CardTitle>
              <CardDescription>
                Room inventory, accommodation categories, amenities, meal plans, and check-in/out policies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel-propType">
                    Property Type <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="hotel-propType"
                    className={selectClass}
                    {...register("hotelDetails.propertyType")}
                  >
                    {HOTEL_PROPERTY_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {HOTEL_PROPERTY_TYPE_LABELS[pt]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hotel-starRating">Star Rating</Label>
                  <select
                    id="hotel-starRating"
                    className={selectClass}
                    {...register("hotelDetails.starRating")}
                  >
                    <option value={0}>Unrated / Boutique</option>
                    <option value={1}>1 Star</option>
                    <option value={2}>2 Star</option>
                    <option value={3}>3 Star</option>
                    <option value={4}>4 Star</option>
                    <option value={5}>5 Star Luxury</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hotel-totalRooms">Total Available Rooms</Label>
                  <Input
                    id="hotel-totalRooms"
                    type="number"
                    min={0}
                    placeholder="e.g. 45"
                    {...register("hotelDetails.totalRooms")}
                  />
                  <Err m={errors.hotelDetails?.totalRooms?.message} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hotel-tariff">Tariff / Rack Rate Range</Label>
                  <Input
                    id="hotel-tariff"
                    placeholder="e.g. ₹2,500 - ₹6,000 / night"
                    {...register("hotelDetails.tariffRange")}
                  />
                </div>
              </div>

              {/* Room Categories */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm">Room Categories Available</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ROOM_TYPES.map((roomType) => {
                    const currentRooms = watchedRoomTypes || [];
                    const isChecked = currentRooms.includes(roomType);

                    return (
                      <button
                        key={roomType}
                        type="button"
                        onClick={() => {
                          const next = isChecked
                            ? currentRooms.filter((r) => r !== roomType)
                            : [...currentRooms, roomType];
                          setValue("hotelDetails.roomTypes", next);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          isChecked
                            ? "bg-purple-600 text-white shadow-xs"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {isChecked && <Check className="size-3" />}
                        {roomType}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hotel Amenities */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm">Property Amenities & Facilities</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_HOTEL_AMENITIES.map((amenity) => {
                    const currentAmenities = watchedHotelAmenities || [];
                    const isChecked = currentAmenities.includes(amenity);

                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => {
                          const next = isChecked
                            ? currentAmenities.filter((a) => a !== amenity)
                            : [...currentAmenities, amenity];
                          setValue("hotelDetails.amenities", next);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          isChecked
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {isChecked && <Check className="size-3" />}
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Meal Plans */}
              <div className="space-y-2">
                <Label className="font-semibold text-sm">Meal Plans Offered</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MEAL_PLANS.map((plan) => {
                    const currentPlans = watchedMealPlans || [];
                    const isChecked = currentPlans.includes(plan);

                    return (
                      <label
                        key={plan}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          isChecked
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...currentPlans, plan]
                              : currentPlans.filter((p) => p !== plan);
                            setValue("hotelDetails.mealPlans", next);
                          }}
                          className="size-4 rounded text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-medium">{MEAL_PLAN_LABELS[plan]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Timings & Policies */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hotel-checkIn">Check-in Time</Label>
                  <Input
                    id="hotel-checkIn"
                    placeholder="e.g. 12:00 PM"
                    {...register("hotelDetails.checkInTime")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hotel-checkOut">Check-out Time</Label>
                  <Input
                    id="hotel-checkOut"
                    placeholder="e.g. 11:00 AM"
                    {...register("hotelDetails.checkOutTime")}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hotel-childPolicy">Child & Extra Bed Policy</Label>
                  <Textarea
                    id="hotel-childPolicy"
                    rows={2}
                    placeholder="e.g. Children below 5 stay free without extra mattress. Children 5-11 charged ₹800/night."
                    {...register("hotelDetails.childPolicy")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hotel-cancellationPolicy">Cancellation & Refund Policy</Label>
                  <Textarea
                    id="hotel-cancellationPolicy"
                    rows={2}
                    placeholder="e.g. Free cancellation up to 48 hours prior to check-in. 1 night charge afterwards."
                    {...register("hotelDetails.cancellationPolicy")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HOTEL PROPERTY IMAGES */}
          <VendorImageUploader
            vendorType="hotel"
            initialImages={watchedImages}
            onChange={(imgs: VendorImage[]) => {
              setValue("images", imgs, { shouldValidate: true });
              setValue("imageUrls", imgs.map((i: VendorImage) => i.url));
            }}
          />
        </div>
      )}

      {/* FORM SUBMISSION BAR */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href={vendor ? `/vendors/${vendor.id}` : "/vendors"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending} className="min-w-36">
          {pending
            ? "Saving Vendor…"
            : isEditing
              ? "Update Vendor"
              : "Create Vendor"}
        </Button>
      </div>
    </form>
  );
}
