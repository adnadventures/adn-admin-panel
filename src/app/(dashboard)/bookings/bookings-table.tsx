"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBooking } from "@/actions/bookings";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayStatus } from "@/lib/booking-utils";
import { formatMoney } from "@/lib/finance/currency";
import { formatDate } from "@/lib/format";
import type { Booking } from "@/types/models";
import { SlotMeter } from "./slot-meter";
import { BookingStatusBadge } from "./status-badge";

export function BookingsTable({ data, canManage }: { data: Booking[]; canManage: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<Booking | null>(null);

  const addButton = canManage ? (
    <Link href="/bookings/new" className={buttonVariants()}>
      <Plus className="mr-2 size-4" /> New booking
    </Link>
  ) : null;

  const columns: ColumnDef<Booking>[] = [
    {
      id: "booking",
      header: "Booking",
      accessorFn: (r) => `${r.bookingNo} ${r.title} ${r.contactName ?? ""} ${r.destination}`,
      cell: ({ row }) => (
        <div>
          <Link href={`/bookings/${row.original.id}`} className="font-medium hover:underline">
            {row.original.title}
          </Link>
          <p className="text-muted-foreground text-xs">
            {row.original.bookingNo} · {row.original.destination}
          </p>
          {row.original.contactName && (
            <p className="text-muted-foreground text-xs">Booked by {row.original.contactName}</p>
          )}
        </div>
      ),
    },
    {
      id: "travel",
      header: "Travel",
      accessorFn: (r) => r.travelStart,
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDate(row.original.travelStart)} – {formatDate(row.original.travelEnd)}
        </span>
      ),
    },
    {
      id: "closes",
      header: "Closes",
      accessorFn: (r) => r.closeDate,
      cell: ({ row }) => formatDate(row.original.closeDate),
    },
    {
      id: "slots",
      header: "Slots",
      accessorFn: (r) => r.memberCount,
      cell: ({ row }) => <SlotMeter b={row.original} />,
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (r) => displayStatus(r).label,
      cell: ({ row }) => <BookingStatusBadge b={row.original} />,
    },
    {
      id: "total",
      header: "Total",
      accessorFn: (r) => r.totalAmount,
      cell: ({ row }) => formatMoney(row.original.totalAmount, row.original.currency),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Row actions"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/bookings/${row.original.id}`)}>
              <Eye className="mr-2 size-4" /> Open
            </DropdownMenuItem>
            {canManage && (
              <>
                <DropdownMenuItem onClick={() => router.push(`/bookings/${row.original.id}/edit`)}>
                  <Pencil className="mr-2 size-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleting(row.original)}
                >
                  <Trash2 className="mr-2 size-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="font-medium">No bookings yet</p>
            <p className="text-muted-foreground max-w-sm text-sm">
              Create a booking for a package and travel dates, then add members as they join.
              You need at least one Active package.
            </p>
            {addButton}
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={columns} data={data} searchPlaceholder="Search bookings…" toolbar={addButton} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this booking?"
        description={`"${deleting?.title ?? ""}" will be removed. Bookings with members can't be deleted; cancel them instead.`}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteBooking(deleting.id);
          if (res.ok) toast.success("Booking deleted");
          else toast.error(res.error);
        }}
      />
    </>
  );
}