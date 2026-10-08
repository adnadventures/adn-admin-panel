import { slotInfo } from "@/lib/booking-utils";
import type { Booking } from "@/types/models";

export function SlotMeter({ b }: { b: Booking }) {
  const s = slotInfo(b);
  const target = b.maxPersons > 0 ? b.maxPersons : b.minPersons;
  const pct = Math.min(100, Math.round((b.memberCount / target) * 100));

  return (
    <div className="min-w-44 space-y-1">
      <div className="flex justify-between gap-3 text-xs">
        <span className="font-medium">{s.main}</span>
        <span className="text-muted-foreground">
          {b.memberCount} / {b.maxPersons > 0 ? b.maxPersons : `${b.minPersons} min`}
        </span>
      </div>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
        <div className="bg-brand-gradient h-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-muted-foreground text-xs">{s.note}</p>
    </div>
  );
}