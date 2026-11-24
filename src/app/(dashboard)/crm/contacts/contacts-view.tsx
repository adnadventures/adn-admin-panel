"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  Edit,
  Trash2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { contactSchema, type ContactInput } from "@/lib/validators/crm";
import { createCrmContact, updateCrmContact, deleteCrmContact } from "@/actions/crm";
import type { CrmContact } from "@/types/crm";

export function ContactsView({ initialContacts }: { initialContacts: CrmContact[] }) {
  const [contacts, setContacts] = useState<CrmContact[]>(initialContacts);
  const [search, setSearch] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CrmContact | null>(null);
  const [formData, setFormData] = useState<ContactInput>({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    phone: "",
    accountName: "",
    department: "",
    address: "",
    city: "",
    country: "India",
    leadSource: "Website",
    assignedTo: "",
    assignedToName: "Admin",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filtered = contacts.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.phone?.includes(s) ||
      c.accountName?.toLowerCase().includes(s)
    );
  });

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData({
      firstName: "",
      lastName: "",
      title: "",
      email: "",
      phone: "",
      accountName: "",
      department: "",
      address: "",
      city: "",
      country: "India",
      leadSource: "Website",
      assignedTo: "",
      assignedToName: "Admin",
      notes: "",
    });
    setErrorMsg("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (c: CrmContact) => {
    setEditingContact(c);
    setFormData({
      firstName: c.firstName,
      lastName: c.lastName || "",
      title: c.title || "",
      email: c.email || "",
      phone: c.phone,
      accountName: c.accountName || "",
      department: c.department || "",
      address: c.address || "",
      city: c.city || "",
      country: c.country || "India",
      leadSource: c.leadSource || "Website",
      assignedTo: c.assignedTo || "",
      assignedToName: c.assignedToName || "Admin",
      notes: c.notes || "",
    });
    setErrorMsg("");
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (editingContact) {
        const res = await updateCrmContact(editingContact.id, formData);
        if (!res.ok) {
          setErrorMsg(res.error);
        } else {
          const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ");
          setContacts((prev) =>
            prev.map((c) =>
              c.id === editingContact.id ? { ...c, ...formData, name: fullName } : c
            )
          );
          setIsDialogOpen(false);
        }
      } else {
        const res = await createCrmContact(formData);
        if (!res.ok) {
          setErrorMsg(res.error);
        } else {
          const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ");
          const newDoc: CrmContact = {
            id: res.id || Date.now().toString(),
            ...formData,
            name: fullName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: "user",
            updatedBy: "user",
            isDeleted: false,
          };
          setContacts((prev) => [newDoc, ...prev]);
          setIsDialogOpen(false);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    const res = await deleteCrmContact(id);
    if (res.ok) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Button onClick={handleOpenCreate} size="sm" className="shrink-0 gap-1.5">
          <Plus className="size-4" />
          Add Contact
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Contact Name</th>
              <th className="px-4 py-3">Account / Company</th>
              <th className="px-4 py-3">Title & Dept</th>
              <th className="px-4 py-3">Communication</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Assigned Owner</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  No contacts found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div>{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">Source: {c.leadSource || "Website"}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.accountName ? (
                      <span className="flex items-center gap-1">
                        <Building className="size-3 text-muted-foreground" />
                        {c.accountName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>{c.title || "—"}</div>
                    <div className="text-[11px] text-muted-foreground">{c.department || "—"}</div>
                  </td>
                  <td className="px-4 py-3 space-y-0.5">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="size-3" />
                      <span>{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <Mail className="size-3" />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {c.city ? `${c.city}, ${c.country}` : c.country || "India"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.assignedToName || "Admin"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(c)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                        className="h-7 w-7 p-0 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add New Contact"}</DialogTitle>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-2 text-xs text-destructive font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-foreground">First Name *</label>
                <Input
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Last Name</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Phone *</label>
                <Input
                  required
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="contact@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Account / Company</label>
                <Input
                  placeholder="e.g. Acme Corp"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Job Title</label>
                <Input
                  placeholder="Director of Operations"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <label className="font-medium text-foreground">Assigned Owner</label>
                <Input
                  value={formData.assignedToName}
                  onChange={(e) => setFormData({ ...formData, assignedToName: e.target.value })}
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground">Notes</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs text-foreground outline-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingContact ? "Update" : "Save Contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
