"use client";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createOrderSource, updateOrderSource } from "@/actions/order-sources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { orderSourceSchema, type OrderSourceInput } from "@/lib/validators/order-source";
import type { OrderSource } from "@/types/models";

export function OrderSourceForm({
  source,
  onDone,
}: {
  source: OrderSource | null;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const {
    register, control, handleSubmit,
    formState: { errors },
  } = useForm<OrderSourceInput>({
    resolver: zodResolver(orderSourceSchema),
    defaultValues: {
      name: source?.name ?? "",
      active: source?.active ?? true,
      notes: source?.notes ?? "",
    },
  });

  function onSubmit(values: OrderSourceInput) {
    startTransition(async () => {
      const res = source
        ? await updateOrderSource(source.id, values)
        : await createOrderSource(values);
      if (res.ok) {
        toast.success(source ? "Source updated" : "Source created");
        onDone();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoFocus {...register("name")} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
        {errors.notes && <p className="text-destructive text-xs">{errors.notes.message}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Active</p>
          <p className="text-muted-foreground text-xs">Inactive sources can&apos;t be picked on new bookings.</p>
        </div>
        <Controller
          control={control}
          name="active"
          render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button className="w-full sm:w-auto" type="submit" disabled={pending}>
          {pending ? "Saving…" : source ? "Save changes" : "Create source"}
        </Button>
      </div>
    </form>
  );
}