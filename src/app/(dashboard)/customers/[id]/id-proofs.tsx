"use client";
import { useEffect, useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { revealCustomerId } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { ID_TYPES } from "@/lib/validators/customer";
import type { CustomerIdDoc } from "@/types/models";

function Row({ customerId, doc, canReveal }: { customerId: string; doc: CustomerIdDoc; canReveal: boolean }) {
  const [number, setNumber] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Auto-hide after 15 seconds
  useEffect(() => {
    if (!number) return;
    const t = setTimeout(() => setNumber(null), 15000);
    return () => clearTimeout(t);
  }, [number]);

  function reveal() {
    startTransition(async () => {
      const res = await revealCustomerId(customerId, doc.id);
      if (res.ok) setNumber(res.number);
      else toast.error(res.error);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <div>
        <p className="text-muted-foreground text-xs">{ID_TYPES[doc.type]}</p>
        <p className="font-mono text-sm tracking-wider">{number ?? `•••• ${doc.last4}`}</p>
      </div>
      {canReveal &&
        (number ? (
          <Button variant="ghost" size="sm" onClick={() => setNumber(null)}>
            <EyeOff className="mr-1 size-4" /> Hide
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled={pending} onClick={reveal}>
            <Eye className="mr-1 size-4" /> {pending ? "…" : "Reveal"}
          </Button>
        ))}
    </div>
  );
}

export function IdProofs({
  customerId, docs, canReveal,
}: { customerId: string; docs: CustomerIdDoc[]; canReveal: boolean }) {
  if (docs.length === 0) return <p className="text-muted-foreground text-sm">No ID proofs on file.</p>;
  return (
    <div className="space-y-2">
      {docs.map((d) => <Row key={d.id} customerId={customerId} doc={d} canReveal={canReveal} />)}
      {canReveal && <p className="text-muted-foreground pt-1 text-xs">Each reveal is recorded in the audit log.</p>}
    </div>
  );
}