"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteInvoice } from "@/actions/invoices";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Invoice } from "@/types/models";
import { InvoicePdfButton } from "../invoice-pdf-button";

export function InvoiceActions({
  invoice,
  canManage,
  showAttachments = false,
  showControls = true,
}: {
  invoice: Invoice;
  canManage: boolean;
  showAttachments?: boolean;
  showControls?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function removeInvoice() {
    startTransition(async () => {
      const result = await deleteInvoice(invoice.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Invoice deleted");
      router.replace("/invoices");
      router.refresh();
    });
  }

  return (
    <>
      {showControls && <div className="flex flex-wrap gap-2">
        <InvoicePdfButton
          invoiceNo={invoice.invoiceNo}
          invoiceId={invoice.id}
          attachments={invoice.attachments}
        />
        {canManage && (
          <>
            <Link className={buttonVariants({ variant: "outline" })} href={`/invoices/${invoice.id}/edit`}>
              <Pencil className="mr-2 size-4" /> Edit
            </Link>
            <Button variant="destructive" disabled={pending} onClick={() => setConfirmOpen(true)}>
              <Trash2 className="mr-2 size-4" /> Delete
            </Button>
          </>
        )}
      </div>}
      {showAttachments && invoice.attachments.length > 0 && <div className="space-y-2">
        {invoice.attachments.map((attachment) => (
          <a
            key={attachment.id}
            href={`/api/invoices/${invoice.id}/attachments/${attachment.id}`}
            className="flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            <Download className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{attachment.name}</span>
          </a>
        ))}
      </div>}
      {showControls && canManage && <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this invoice?"
        description="The invoice will be removed from the invoice list. This action cannot be undone."
        confirmLabel="Delete invoice"
        onConfirm={removeInvoice}
      />}
    </>
  );
}
