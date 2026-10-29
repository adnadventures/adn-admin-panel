"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCustomer } from "@/actions/customers";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/types/models";
import type { Role } from "@/types/roles";
import { CustomerFormDialog } from "../customer-form";

export function CustomerActions({ customer, role }: { customer: Customer; role: Role }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="mr-2 size-4" /> Edit
      </Button>
      {(role === "admin" || role === "manager") && (
        <Button variant="destructive" onClick={() => setDelOpen(true)}>
          <Trash2 className="mr-2 size-4" /> Delete
        </Button>
      )}

      <CustomerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        onSaved={() => router.refresh()}
      />
      <ConfirmDialog
        open={delOpen}
        onOpenChange={setDelOpen}
        title="Delete this customer?"
        description="Past bookings and invoices keep their history."
        onConfirm={async () => {
          const res = await deleteCustomer(customer.id);
          if (res.ok) { toast.success("Customer deleted"); router.replace("/customers"); }
          else toast.error(res.error);
        }}
      />
    </>
  );
}