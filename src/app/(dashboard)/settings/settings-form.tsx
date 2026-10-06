"use client";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { saveSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CURRENCIES, CURRENCY_CODES } from "@/lib/finance/currency";
import { settingsSchema, type AppSettings } from "@/lib/validators/settings";

const FOREIGN = CURRENCY_CODES.filter((c) => c !== "INR");

function parsePresets(text: string) {
  const nums = text.split(",").map((s) => Number(s.trim())).filter((n) => s_ok(n));
  return [...new Set(nums)].sort((a, b) => a - b);
}
const s_ok = (n: number) => Number.isFinite(n) && n >= 0 && n <= 100;

export function SettingsForm({ initial }: { initial: AppSettings }) {
  const [pending, startTransition] = useTransition();
  const [presetsText, setPresetsText] = useState(initial.gst.presets.join(", "));

  const {
    register, control, handleSubmit, reset,
    formState: { errors },
  } = useForm<AppSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });

  function onSubmit(values: AppSettings) {
    startTransition(async () => {
      const payload = {
        ...values,
        gst: { ...values.gst, presets: parsePresets(presetsText) },
      };
      const res = await saveSettings(payload);
      if (res.ok) {
        toast.success("Settings saved");
        reset(payload);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      {/* Business */}
      <Card>
        <CardHeader>
          <CardTitle>Business details</CardTitle>
          <CardDescription>Printed on invoices.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bname">Business name</Label>
            <Input id="bname" {...register("business.name")} />
            {errors.business?.name && <p className="text-destructive text-xs">Required</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="btag">Tagline</Label>
            <Input id="btag" {...register("business.tagline")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN</Label>
            <Input id="gstin" maxLength={15} className="uppercase" {...register("business.gstin")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="baddr">Address</Label>
            <Textarea id="baddr" rows={3} {...register("business.address")} />
          </div>
        </CardContent>
      </Card>

      {/* GST */}
      <Card>
        <CardHeader>
          <CardTitle>GST</CardTitle>
          <CardDescription>
            These are defaults. Each invoice copies them and can override them,
            and changing them here never alters existing invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Charge GST by default</p>
              <p className="text-muted-foreground text-xs">New invoices start with GST on or off.</p>
            </div>
            <Controller
              control={control}
              name="gst.enabled"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gstrate">Default rate (%)</Label>
              <Input
                id="gstrate"
                type="number"
                step="0.01"
                {...register("gst.defaultRatePercent", { valueAsNumber: true })}
              />
              {errors.gst?.defaultRatePercent && (
                <p className="text-destructive text-xs">Enter 0 to 100</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tax mode</Label>
              <Controller
                control={control}
                name="gst.mode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exclusive">Exclusive (added on top)</SelectItem>
                      <SelectItem value="inclusive">Inclusive (already in price)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="presets">Quick-pick rates (%), comma separated</Label>
              <Input
                id="presets"
                value={presetsText}
                onChange={(e) => setPresetsText(e.target.value)}
                placeholder="0, 5, 12, 18"
              />
              <p className="text-muted-foreground text-xs">Shown as one-click options when creating an invoice.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FX */}
      <Card>
        <CardHeader>
          <CardTitle>Currency conversion</CardTitle>
          <CardDescription>
            Default rates, in INR per 1 unit. Each payment or expense freezes the rate
            it used, so updating these never changes past records. You can override the
            rate on any single transaction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FOREIGN.map((code) => (
              <div key={code} className="space-y-2">
                <Label htmlFor={`rate-${code}`}>
                  1 {code} <span className="text-muted-foreground">({CURRENCIES[code].name})</span>
                </Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">₹</span>
                  <Input
                    id={`rate-${code}`}
                    type="number"
                    step="0.0001"
                    className="pl-7"
                    {...register(`fx.rates.${code}`, { valueAsNumber: true })}
                  />
                </div>
                {errors.fx?.rates?.[code] && (
                  <p className="text-destructive text-xs">Enter a rate above 0</p>
                )}
              </div>
            ))}
          </div>

          <div className="max-w-xs space-y-2">
            <Label htmlFor="fee">Default conversion / bank charge (%)</Label>
            <Input
              id="fee"
              type="number"
              step="0.01"
              {...register("fx.defaultFeePercent", { valueAsNumber: true })}
            />
            <p className="text-muted-foreground text-xs">
              Applied to foreign-currency transactions. Can be overridden per transaction.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}