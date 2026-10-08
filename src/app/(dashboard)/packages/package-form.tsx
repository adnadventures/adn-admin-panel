"use client";
import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Control, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPackage, updatePackage } from "@/actions/packages";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, CURRENCY_CODES, formatMoney, fromMinor, toMinor } from "@/lib/finance/currency";
import {
  BASIS_LABEL, PACKAGE_STATUSES, PRICE_BASES, STATUS_LABEL,
  packageFormSchema, type PackageFormValues,
} from "@/lib/validators/package";
import type { TravelPackage } from "@/types/models";

const selectClass = "border-input bg-background h-9 w-full rounded-md border px-2 text-sm";

// Turns raw zod "expected number" messages (empty number field) into something friendly
const msg = (m?: string) => (m && /expected|nan/i.test(m) ? "Enter a valid number" : m);
const Err = ({ m }: { m?: string }) =>
  m ? <p className="text-destructive text-xs">{msg(m)}</p> : null;

/* ---------- simple string list (inclusions / exclusions) ---------- */
function ListField({
  control, register, name, title, description, placeholder,
}: {
  control: Control<PackageFormValues>;
  register: UseFormRegister<PackageFormValues>;
  name: "inclusions" | "exclusions";
  title: string;
  description: string;
  placeholder: string;
}) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="flex gap-2">
            <Input
              placeholder={placeholder}
              autoComplete="off"
              {...register(`${name}.${i}.value`)}
              onKeyDown={(e) => {
                // Enter adds the next row instead of submitting the form
                if (e.key === "Enter") {
                  e.preventDefault();
                  append({ value: "" });
                }
              }}
            />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(i)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button" variant="outline" size="sm"
          disabled={fields.length >= 30}
          onClick={() => append({ value: "" })}
        >
          <Plus className="mr-1 size-4" /> Add
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------- main form ---------- */
export function PackageForm({
  pkg, rates,
}: { pkg: TravelPackage | null; rates: Record<string, number> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register, control, handleSubmit,
    formState: { errors },
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: pkg?.name ?? "",
      destination: pkg?.destination ?? "",
      days: pkg?.days ?? 3,
      nights: pkg?.nights ?? 2,
      currency: pkg?.price.currency ?? "INR",
      price: pkg ? fromMinor(pkg.price.amount) : 0,
      priceBasis: pkg?.priceBasis ?? "per_person",
      status: pkg?.status ?? "draft",
      inclusions: (pkg?.inclusions ?? []).map((value) => ({ value })),
      exclusions: (pkg?.exclusions ?? []).map((value) => ({ value })),
      itinerary: (pkg?.itinerary ?? []).map(({ title, description }) => ({ title, description })),
    },
  });

  const itin = useFieldArray({ control, name: "itinerary" });
  const currency = useWatch({ control, name: "currency" });
  const price = useWatch({ control, name: "price" });

  const rate = rates[currency];
  const showApprox = currency !== "INR" && rate && Number.isFinite(price) && price > 0;

  function onSubmit(v: PackageFormValues) {
    startTransition(async () => {
      const payload = {
        ...v,
        inclusions: v.inclusions.map((x) => x.value).filter(Boolean),
        exclusions: v.exclusions.map((x) => x.value).filter(Boolean),
      };
      const res = pkg ? await updatePackage(pkg.id, payload) : await createPackage(payload);
      if (res.ok) {
        toast.success(pkg ? "Package updated" : "Package created");
        router.push(`/packages/${res.id}`);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      {/* Basics */}
      <Card>
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Package name</Label>
            <Input id="name" autoFocus placeholder="e.g. Magical Bali Escape" {...register("name")} />
            <Err m={errors.name?.message} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="destination">Destination</Label>
            <Input id="destination" placeholder="e.g. Bali, Indonesia" {...register("destination")} />
            <Err m={errors.destination?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="days">Days</Label>
            <Input id="days" type="number" min={1} {...register("days", { valueAsNumber: true })} />
            <Err m={errors.days?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nights">Nights</Label>
            <Input id="nights" type="number" min={0} {...register("nights", { valueAsNumber: true })} />
            <Err m={errors.nights?.message} />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing and status</CardTitle>
          <CardDescription>
            This is the starting price. A booking can still be agreed at a different amount.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select id="currency" className={selectClass} {...register("currency")}>
              {CURRENCY_CODES.map((c) => (
                <option key={c} value={c}>{c} ({CURRENCIES[c].name})</option>
              ))}
            </select>
            <Err m={errors.currency?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" step="0.01" min={0} {...register("price", { valueAsNumber: true })} />
            <Err m={errors.price?.message} />
            {showApprox && (
              <p className="text-muted-foreground text-xs">
                ≈ {formatMoney(Math.round(toMinor(price) * rate), "INR")} at your default rate
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="basis">Price is</Label>
            <select id="basis" className={selectClass} {...register("priceBasis")}>
              {PRICE_BASES.map((b) => <option key={b} value={b}>{BASIS_LABEL[b]}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" className={selectClass} {...register("status")}>
              {PACKAGE_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <p className="text-muted-foreground text-xs">Only Active packages can be booked.</p>
          </div>
        </CardContent>
      </Card>

      <ListField
        control={control} register={register} name="inclusions"
        title="Inclusions" description="What the price covers. Press Enter to add the next line."
        placeholder="e.g. Airport transfers"
      />
      <ListField
        control={control} register={register} name="exclusions"
        title="Exclusions" description="What the customer pays for separately."
        placeholder="e.g. Flights, visa fees"
      />

      {/* Itinerary */}
      <Card>
        <CardHeader>
          <CardTitle>Itinerary</CardTitle>
          <CardDescription>Day-by-day plan. Day numbers follow the order below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {itin.fields.map((f, i) => (
            <div key={f.id} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Day {i + 1}</p>
                <div className="flex">
                  <Button type="button" variant="ghost" size="icon" aria-label="Move up"
                    disabled={i === 0} onClick={() => itin.move(i, i - 1)}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Move down"
                    disabled={i === itin.fields.length - 1} onClick={() => itin.move(i, i + 1)}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove day"
                    onClick={() => itin.remove(i)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <Input placeholder="Title, e.g. Arrival and Ubud tour" {...register(`itinerary.${i}.title`)} />
              <Err m={errors.itinerary?.[i]?.title?.message} />
              <Textarea rows={3} placeholder="What happens on this day…" {...register(`itinerary.${i}.description`)} />
              <Err m={errors.itinerary?.[i]?.description?.message} />
            </div>
          ))}
          <Button
            type="button" variant="outline" size="sm"
            disabled={itin.fields.length >= 60}
            onClick={() => itin.append({ title: "", description: "" })}
          >
            <Plus className="mr-1 size-4" /> Add day
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : pkg ? "Save changes" : "Create package"}
        </Button>
        <Link
          href={pkg ? `/packages/${pkg.id}` : "/packages"}
          className={buttonVariants({ variant: "outline" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}