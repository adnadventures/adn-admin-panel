"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Plus, Search, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { deleteCustomer, fetchCustomers } from "@/actions/customers";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { CustomersPage } from "@/lib/data/customers";
import type { Role } from "@/types/roles";
import type { Customer } from "@/types/models";
import { CustomerFormDialog } from "./customer-form";

export function CustomersView({ initial, role }: { initial: CustomersPage; role: Role }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState(initial.items);
  const [next, setNext] = useState(initial.nextCursor);
  const [loading, startLoad] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const canDelete = role === "admin" || role === "manager";

  const load = useCallback((query: string, cursor?: string | null, append = false) => {
    startLoad(async () => {
      const page = await fetchCustomers(query, cursor);
      setItems((prev) => (append ? [...prev, ...page.items] : page.items));
      setNext(page.nextCursor);
    });
  }, []);

  // Debounced search; skip the first run because the server already sent page 1
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or phone…"
            className="pl-9"
          />
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="mr-2 size-4" /> Add customer
        </Button>
      </div>

      <div className="bg-card overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>ID proofs</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                  {loading ? "Loading…" : q ? "No customers match your search." : "No customers yet. Add your first one."}
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/customers/${c.id}`} className="flex items-center gap-2 font-medium hover:underline">
                      <User className="text-muted-foreground size-4" /> {c.name}
                    </Link>
                  </TableCell>
                  <TableCell>{c.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email || "—"}</TableCell>
                  <TableCell>{c.country || "—"}</TableCell>
                  <TableCell>
                    {c.idDocs.length ? (
                      <Badge variant="secondary">{c.idDocs.length} on file</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Row actions"
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/customers/${c.id}`)}>
                          <User className="mr-2 size-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditing(c); setFormOpen(true); }}>
                          <Pencil className="mr-2 size-4" /> Edit
                        </DropdownMenuItem>
                        {canDelete && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(c)}
                          >
                            <Trash2 className="mr-2 size-4" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{items.length} shown</span>
        {next && (
          <Button variant="outline" disabled={loading} onClick={() => load(q, next, true)}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        )}
      </div>

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
        onSaved={() => load(q)}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this customer?"
        description={`"${deleting?.name ?? ""}" will be removed from the list. Past bookings and invoices keep their history.`}
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteCustomer(deleting.id);
          if (res.ok) { toast.success("Customer deleted"); load(q); }
          else toast.error(res.error);
        }}
      />
    </div>
  );
}