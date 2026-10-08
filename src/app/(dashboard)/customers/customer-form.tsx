"use client";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createCustomer, updateCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ID_TYPES, ID_TYPE_KEYS, MAX_ID_DOCS, customerFormSchema, type CustomerFormValues,
} from "@/lib/validators/customer";
import type { Customer } from "@/types/models";

export function CustomerFormDialog({
  open, onOpenChange, customer, onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "New customer"}</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so the form resets every time */}
        {open && (
          <CustomerForm
            key={customer?.id ?? "new"}
            customer={customer}
            onDone={() => onOpenChange(false)}
            onSaved={onSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({
  customer, onDone, onSaved,
}: { customer: Customer | null; onDone: () => void; onSaved: () => void }) {
  const [pending, startTransition] = useTransition();
  const [kept, setKept] = useState(customer?.idDocs ?? []);

  const {
    register, control, handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      country: customer?.country ?? "India",
      address: customer?.address ?? "",
      notes: customer?.notes ?? "",
      newIdDocs: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "newIdDocs" });
  const idCount = kept.length + fields.length;

  function submit(values: CustomerFormValues, force = false) {
    startTransition(async () => {
      const payload = { ...values, keepIdDocIds: kept.map((k) => k.id) };
      const res = customer
        ? await updateCustomer(customer.id, payload, force)
        : await createCustomer(payload, force);

      if (res.ok) {
        toast.success(customer ? "Customer updated" : "Customer created");
        onSaved();
        onDone();
      } else if (res.duplicate) {
        toast.warning(res.error, {
          duration: 10000,
          action: { label: "Save anyway", onClick: () => submit(values, true) },
        });
      } else {
        toast.error(res.error);
      }
    });
  }

  const err = (msg?: string) => msg && <p className="text-destructive text-xs">{msg}</p>;

  return (
    <form onSubmit={handleSubmit((v) => submit(v))} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" autoFocus {...register("name")} />
        {err(errors.name?.message)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" {...register("phone")} />
          {err(errors.phone?.message)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {err(errors.email?.message)}
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register("country")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" rows={2} {...register("address")} />
        {err(errors.address?.message)}
      </div>

      {/* ID proofs */}
      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">ID proofs</p>
            <p className="text-muted-foreground text-xs">Encrypted when saved. Only the last 4 characters are shown afterwards.</p>
          </div>
          <Button
            type="button" variant="outline" size="sm"
            disabled={idCount >= MAX_ID_DOCS}
            onClick={() => append({ type: "aadhaar", number: "" })}
          >
            <Plus className="mr-1 size-4" /> Add
          </Button>
        </div>

        {kept.map((d) => (
          <div key={d.id} className="bg-muted flex items-center justify-between rounded-md px-3 py-2 text-sm">
            <span>{ID_TYPES[d.type]} •••• {d.last4}</span>
            <button
              type="button" aria-label="Remove ID proof"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setKept((k) => k.filter((x) => x.id !== d.id))}
            >
              <X className="size-4" />
            </button>
          </div>
        ))}

        {fields.map((f, i) => (
          <div key={f.id} className="space-y-1">
            <div className="flex gap-2">
              <select
                aria-label="ID type"
                className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                {...register(`newIdDocs.${i}.type`)}
              >
                {ID_TYPE_KEYS.map((k) => (
                  <option key={k} value={k}>{ID_TYPES[k]}</option>
                ))}
              </select>
              <Input placeholder="ID number" autoComplete="off" {...register(`newIdDocs.${i}.number`)} />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(i)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
            {err(errors.newIdDocs?.[i]?.number?.message)}
          </div>
        ))}

        {idCount === 0 && <p className="text-muted-foreground text-xs">No ID proofs added.</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} {...register("notes")} />
        {err(errors.notes?.message)}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>Cancel</Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : customer ? "Save changes" : "Create customer"}
        </Button>
      </div>
    </form>
  );
}