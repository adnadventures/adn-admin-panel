"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePackage, setPackageStatus } from "@/actions/packages";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import type { PackageStatus, TravelPackage } from "@/types/models";

export function PackageActions({ pkg }: { pkg: TravelPackage }) {
  const router = useRouter();
  const [delOpen, setDelOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function change(status: PackageStatus) {
    startTransition(async () => {
      const res = await setPackageStatus(pkg.id, status);
      if (res.ok) toast.success("Status updated");
      else toast.error(res.error);
    });
  }

  return (
    <>
      <Link href={`/packages/${pkg.id}/edit`} className={buttonVariants({ variant: "outline" })}>
        <Pencil className="mr-2 size-4" /> Edit
      </Link>

      {pkg.status === "active" ? (
        <Button variant="outline" disabled={pending} onClick={() => change("archived")}>
          <Archive className="mr-2 size-4" /> Archive
        </Button>
      ) : (
        <Button variant="outline" disabled={pending} onClick={() => change("active")}>
          <CheckCircle2 className="mr-2 size-4" /> Activate
        </Button>
      )}

      <Button variant="destructive" onClick={() => setDelOpen(true)}>
        <Trash2 className="mr-2 size-4" /> Delete
      </Button>

      <ConfirmDialog
        open={delOpen}
        onOpenChange={setDelOpen}
        title="Delete this package?"
        description="If bookings use it, archive it instead."
        onConfirm={async () => {
          const res = await deletePackage(pkg.id);
          if (res.ok) { toast.success("Package deleted"); router.replace("/packages"); }
          else toast.error(res.error);
        }}
      />
    </>
  );
}