"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MapPin, Plus } from "lucide-react";
import { getDestinationsAction, saveDestinationAction } from "@/actions/vendors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
};

export function DestinationAutocomplete({
  value,
  onChange,
  error,
  label = "Primary Destination",
  required = false,
  disabled = false,
}: Props) {
  const [destinations, setDestinations] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    getDestinationsAction()
      .then((data) => setDestinations(data))
      .catch((err) => console.error("Failed to load destinations:", err));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmed = inputValue.trim().toLowerCase();
  const filtered = destinations.filter((d) =>
    d.toLowerCase().includes(trimmed)
  );

  const exactMatch = destinations.some(
    (d) => d.toLowerCase() === trimmed
  );

  function handleSelect(dest: string) {
    setInputValue(dest);
    onChange(dest);
    setIsOpen(false);
    saveDestinationAction(dest).catch(console.error);
  }

  function handleCreateNew() {
    const trimmedVal = inputValue.trim();
    if (!trimmedVal) return;
    const formatted =
      trimmedVal.charAt(0).toUpperCase() + trimmedVal.slice(1);
    setDestinations((prev) =>
      prev.includes(formatted) ? prev : [...prev, formatted].sort()
    );
    handleSelect(formatted);
  }

  return (
    <div ref={containerRef} className="relative space-y-2">
      {label && (
        <Label htmlFor="dest-autocomplete">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="relative">
        <Input
          id="dest-autocomplete"
          type="text"
          disabled={disabled}
          placeholder="e.g. Goa / Manali / Kashmir"
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            onChange(val);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pr-8"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>

      {error && <p className="text-destructive text-xs font-medium">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md text-popover-foreground">
          {filtered.map((dest) => {
            const isSelected = dest.toLowerCase() === value.toLowerCase();
            return (
              <button
                key={dest}
                type="button"
                onClick={() => handleSelect(dest)}
                className={`flex w-full items-center justify-between rounded-sm px-2.5 py-1.5 text-xs text-left hover:bg-muted/70 transition-colors ${
                  isSelected ? "bg-primary/10 font-medium text-primary" : ""
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  {dest}
                </span>
                {isSelected && <Check className="size-3.5" />}
              </button>
            );
          })}

          {trimmed.length > 0 && !exactMatch && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="flex w-full items-center gap-1.5 rounded-sm px-2.5 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors border-t border-border mt-1"
            >
              <Plus className="size-3.5" />
              Add &quot;{inputValue.trim()}&quot; as new destination
            </button>
          )}

          {filtered.length === 0 && trimmed.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Type to search or add a destination...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
