"use client";

import Link from "next/link";
import { Building2, Bus, Hotel, Plus, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Vendor } from "@/types/models";
import { VendorsTable } from "./vendors-table";

type Props = {
  vendors: Vendor[];
  stats: {
    total: number;
    travels: number;
    hotel: number;
    totalBuses: number;
    totalRooms: number;
  };
  canManage: boolean;
};

export function VendorsView({ vendors, stats, canManage }: Props) {
  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Total Vendors</p>
              <h3 className="text-2xl font-bold tracking-tight">{stats.total}</h3>
              <p className="text-muted-foreground text-xs">
                {stats.travels} travels • {stats.hotel} hotels
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 shadow-xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Bus className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Travels Fleet</p>
              <h3 className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                {stats.totalBuses}
              </h3>
              <p className="text-muted-foreground text-xs">
                Buses registered across {stats.travels} travels partners
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 shadow-xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Hotel className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Hotel Partners</p>
              <h3 className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {stats.hotel}
              </h3>
              <p className="text-muted-foreground text-xs">
                {stats.totalRooms} total rooms mapped
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 shadow-xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="size-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Active Partners</p>
              <h3 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {vendors.filter((v) => v.status === "active").length}
              </h3>
              <p className="text-muted-foreground text-xs">
                Available for bookings & packages
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <VendorsTable vendors={vendors} canManage={canManage} />
    </div>
  );
}
