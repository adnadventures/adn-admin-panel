"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Pencil, Trash2, Unlock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { deleteBooking, setBookingStatus } from "@/actions/bookings";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Booking, BookingStatus } from "@/types/models";

export function BookingActions({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const finished = booking.status === "completed" || booking.status === "cancelled";

  function change(status: BookingStatus) {
    startTransition(async () => {
      const res = await setBookingStatus(booking.id, status);
      if (res.ok) toast.success("Status updated");
      else toast.error(res.error);
    });
  }

  return (
    <>
      {!finished && (
        <Link href={`/bookings/${booking.id}/edit`} className={buttonVariants({ variant: "outline" })}>
          <Pencil className="mr-2 size-4" /> Edit
        </Link>
      )}
      {booking.status === "open" && (
        <Button variant="outline" disabled={pending} onClick={() => change("closed")}>
          <Lock className="mr-2 size-4" /> Close booking
        </Button>
      )}
      {booking.status === "closed" && (
        <Button variant="outline" disabled={pending} onClick={() => change("open")}>
          <Unlock className="mr-2 size-4" /> Reopen
        </Button>
      )}
      {!finished && (
        <Button variant="outline" disabled={pending} onClick={() => change("completed")}>
          <CheckCircle2 className="mr-2 size-4" /> Mark completed
        </Button>
      )}
      {!finished && (
        <Button variant="outline" onClick={() => setConfirm("cancel")}>
          <XCircle className="mr-2 size-4" /> Cancel booking
        </Button>
      )}
      {booking.memberCount === 0 && (
        <Button variant="destructive" onClick={() => setConfirm("delete")}>
          <Trash2 className="mr-2 size-4" /> Delete
        </Button>
      )}

      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Cancel this booking?"
        description="Members stay on record, but no more can be added. This can't be undone."
        confirmLabel="Cancel booking"
        onConfirm={async () => {
          const res = await setBookingStatus(booking.id, "cancelled");
          if (res.ok) toast.success("Booking cancelled");
          else toast.error(res.error);
        }}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Delete this booking?"
        description="It has no members, so it will simply be removed."
        onConfirm={async () => {
          const res = await deleteBooking(booking.id);
          if (res.ok) { toast.success("Booking deleted"); router.replace("/bookings"); }
          else toast.error(res.error);
        }}
      />
    </>
  );
}