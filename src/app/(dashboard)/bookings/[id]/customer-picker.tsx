"use client";
import { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { fetchCustomers } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/types/models";

export function CustomerPicker({
  takenIds, onPick, onNew,
}: {
  takenIds: string[];
  onPick: (c: Customer) => void;
  onNew: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let stale = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const page = await fetchCustomers(term);
      if (!stale) {
        setResults(page.items);
        setLoading(false);
      }
    }, 300);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [term]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          autoFocus
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search existing customer by name or phone…"
          className="pl-9"
        />
      </div>

      {term.length >= 2 && (
        <div className="max-h-48 overflow-y-auto rounded-md border">
          {results.length === 0 ? (
            <p className="text-muted-foreground p-3 text-sm">
              {loading ? "Searching…" : "No customer found."}
            </p>
          ) : (
            results.map((c) => {
              const taken = takenIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={taken}
                  onClick={() => onPick(c)}
                  className="hover:bg-secondary flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {taken ? "Already in this booking" : c.phone || c.email || "—"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={onNew}>
        <UserPlus className="mr-1 size-4" /> New customer
      </Button>
    </div>
  );
}