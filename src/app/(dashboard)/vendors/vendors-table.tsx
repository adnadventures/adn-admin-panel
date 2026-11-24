"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Bus,
  Edit,
  Eye,
  Hotel,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { deleteVendor, setVendorStatus } from "@/actions/vendors";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Vendor, VendorStatus, VendorType } from "@/types/models";
import { VendorStatusBadge, VendorTypeBadge } from "./status-badge";

type Props = {
  vendors: Vendor[];
  canManage: boolean;
};

export function VendorsTable({ vendors, canManage }: Props) {
  const router = useRouter();
  const [filterType, setFilterType] = useState<"all" | VendorType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | VendorStatus>("all");
  const [search, setSearch] = useState("");
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [busy, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (filterType !== "all" && v.type !== filterType) return false;
      if (filterStatus !== "all" && v.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = v.name.toLowerCase().includes(q);
        const matchTrade = v.tradeName?.toLowerCase().includes(q);
        const matchContact = v.contactPerson.toLowerCase().includes(q);
        const matchPhone = v.phone.includes(q);
        const matchCity = v.city.toLowerCase().includes(q);
        const matchDest = v.destination.toLowerCase().includes(q);
        if (
          !matchName &&
          !matchTrade &&
          !matchContact &&
          !matchPhone &&
          !matchCity &&
          !matchDest
        ) {
          return false;
        }
      }
      return true;
    });
  }, [vendors, filterType, filterStatus, search]);

  function handleStatusChange(v: Vendor, status: VendorStatus) {
    startTransition(async () => {
      const res = await setVendorStatus(v.id, status);
      if (res.ok) {
        toast.success(`Marked vendor as ${status}`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleDelete(v: Vendor) {
    startTransition(async () => {
      const res = await deleteVendor(v.id);
      if (res.ok) {
        toast.success("Vendor deleted successfully");
        setDeletingVendor(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Controls & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, contact, phone, city…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Vendor Type Filter */}
          <div className="inline-flex rounded-md border border-input p-0.5 bg-background">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`rounded-sm px-3 py-1 text-xs font-medium transition-colors ${
                filterType === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setFilterType("travels")}
              className={`inline-flex items-center gap-1 rounded-sm px-3 py-1 text-xs font-medium transition-colors ${
                filterType === "travels"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bus className="size-3" /> Travels
            </button>
            <button
              type="button"
              onClick={() => setFilterType("hotel")}
              className={`inline-flex items-center gap-1 rounded-sm px-3 py-1 text-xs font-medium transition-colors ${
                filterType === "hotel"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Hotel className="size-3" /> Hotel
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "all" | VendorStatus)}
            className="border-input bg-background h-8 rounded-md border px-2 text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>

          {canManage && (
            <Link
              href="/vendors/new"
              className={buttonVariants({ size: "sm", className: "gap-1" })}
            >
              <Plus className="size-4" /> Add Vendor
            </Link>
          )}
        </div>
      </div>

      {/* Vendors Table Card */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border/80 text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Vendor / Entity</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Location & Dest.</th>
                  <th className="px-4 py-3">Inventory / Fleet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <Building2 className="mx-auto size-8 opacity-40 mb-2" />
                      <p className="font-medium">No vendors found</p>
                      <p className="text-xs">
                        {search
                          ? "Try adjusting your search query or filters"
                          : "Get started by adding your first Travels or Hotel vendor"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/vendors/${v.id}`}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {v.name}
                        </Link>
                        {v.tradeName && (
                          <p className="text-muted-foreground text-xs">{v.tradeName}</p>
                        )}
                        {v.gstin && (
                          <p className="text-muted-foreground text-xs font-mono">
                            GST: {v.gstin}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <VendorTypeBadge type={v.type} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{v.contactPerson}</p>
                        <p className="text-muted-foreground text-xs">{v.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground shrink-0" />
                          <span>{v.destination}</span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {v.city}, {v.state}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {v.type === "travels" ? (
                          <div>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {v.travelsDetails?.totalBusCount ?? 0} buses
                            </span>
                            <p className="text-muted-foreground text-xs">
                              {v.travelsDetails?.totalSeatCapacity ?? 0} total seats
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="font-medium text-purple-600 dark:text-purple-400">
                              {v.hotelDetails?.totalRooms ?? 0} rooms
                            </span>
                            <p className="text-muted-foreground text-xs">
                              {v.hotelDetails?.propertyType
                                ? v.hotelDetails.propertyType.replace("_", " ")
                                : "Hotel"}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <VendorStatusBadge status={v.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label="Actions"
                            className={buttonVariants({
                              variant: "ghost",
                              size: "icon",
                              className: "size-8",
                            })}
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => router.push(`/vendors/${v.id}`)}
                              className="gap-2"
                            >
                              <Eye className="size-4" /> View Details
                            </DropdownMenuItem>
                            {canManage && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/vendors/${v.id}/edit`)}
                                  className="gap-2"
                                >
                                  <Edit className="size-4" /> Edit Vendor
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {v.status !== "active" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(v, "active")}
                                  >
                                    Mark as Active
                                  </DropdownMenuItem>
                                )}
                                {v.status !== "inactive" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(v, "inactive")}
                                  >
                                    Mark as Inactive
                                  </DropdownMenuItem>
                                )}
                                {v.status !== "blocked" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(v, "blocked")}
                                  >
                                    Block Vendor
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeletingVendor(v)}
                                >
                                  <Trash2 className="size-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deletingVendor && (
        <ConfirmDialog
          open={Boolean(deletingVendor)}
          onOpenChange={(open) => !open && setDeletingVendor(null)}
          title={`Delete ${deletingVendor.name}?`}
          description="Are you sure you want to remove this vendor? This action is archived and audited in the system logs."
          confirmLabel="Delete Vendor"
          onConfirm={() => handleDelete(deletingVendor)}
        />
      )}
    </div>
  );
}
