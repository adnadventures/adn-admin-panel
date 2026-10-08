"use client";
import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Search, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { cancelMember } from "@/actions/members";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CATEGORY_LABEL, GENDER_LABEL, blockReason } from "@/lib/booking-utils";
import { formatMoney } from "@/lib/finance/currency";
import type { Booking, Member } from "@/types/models";
import { MemberDialog } from "./member-dialog";
import Link from "next/link";

export function MembersPanel({
    booking, members, sources, canManage,
}: {
    booking: Booking;
    members: Member[];
    sources: { id: string; name: string }[];
    canManage: boolean;
}) {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Member | null>(null);
    const [cancelling, setCancelling] = useState<Member | null>(null);

    const reason = blockReason(booking);
    const locked = booking.status === "completed" || booking.status === "cancelled";
    const term = q.trim().toLowerCase();
    const shown = members.filter((m) => !term || m.searchName.includes(term) || m.phone.includes(term));

    return (
        <Card className="mt-4">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle>Members ({booking.memberCount})</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                    {reason && <span className="text-muted-foreground text-xs">{reason}</span>}
                    <Button disabled={!!reason} onClick={() => { setEditing(null); setOpen(true); }}>
                        <Plus className="mr-2 size-4" /> Add member
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {members.length > 8 && (
                    <div className="relative max-w-xs">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members…" className="pl-9" />
                    </div>
                )}

                <div className="overflow-x-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="w-12" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shown.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                                        {members.length === 0 ? "No members yet. Add the first one." : "No members match."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shown.map((m) => {
                                    const cancelled = m.status === "cancelled";
                                    return (
                                        <TableRow key={m.id} className={cancelled ? "opacity-50" : undefined}>
                                            <TableCell className="font-medium">
                                                {m.customerId ? (
                                                    <Link href={`/customers/${m.customerId}`} className={cancelled ? "line-through" : "hover:underline"}>
                                                        {m.name}
                                                    </Link>
                                                ) : (
                                                    <span className={cancelled ? "line-through" : undefined}>{m.name}</span>
                                                )}
                                                {cancelled && <Badge variant="outline" className="ml-2">Cancelled</Badge>}
                                            </TableCell>
                                            <TableCell>{GENDER_LABEL[m.gender]}</TableCell>
                                            <TableCell>
                                                {CATEGORY_LABEL[m.category]}
                                                {m.age !== null && <span className="text-muted-foreground"> · {m.age}</span>}
                                            </TableCell>
                                            <TableCell>{m.phone || "—"}</TableCell>
                                            <TableCell>{m.sourceName}</TableCell>
                                            <TableCell className="text-right">
                                                {formatMoney(m.price, booking.currency)}
                                                {m.priceOverridden && !cancelled && (
                                                    <Badge variant="secondary" className="ml-2">Custom</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {!cancelled && !locked && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            aria-label="Member actions"
                                                            className={buttonVariants({ variant: "ghost", size: "icon" })}
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => { setEditing(m); setOpen(true); }}>
                                                                <Pencil className="mr-2 size-4" /> Edit
                                                            </DropdownMenuItem>
                                                            {canManage && (
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => setCancelling(m)}
                                                                >
                                                                    <UserMinus className="mr-2 size-4" /> Cancel member
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <MemberDialog
                open={open}
                onOpenChange={setOpen}
                booking={booking}
                sources={sources}
                member={editing}
                takenIds={members
                    .filter((m) => m.status === "active" && m.customerId)
                    .map((m) => m.customerId as string)}
            />

            <ConfirmDialog
                open={!!cancelling}
                onOpenChange={(o) => !o && setCancelling(null)}
                title="Cancel this member?"
                description={`"${cancelling?.name ?? ""}" will be removed from the headcount and total, which frees a slot. The record stays for history.`}
                confirmLabel="Cancel member"
                onConfirm={async () => {
                    if (!cancelling) return;
                    const res = await cancelMember(booking.id, cancelling.id);
                    if (res.ok) toast.success("Member cancelled");
                    else toast.error(res.error);
                }}
            />
        </Card>
    );
}