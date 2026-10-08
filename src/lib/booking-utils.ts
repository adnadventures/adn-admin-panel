import { formatDate, todayIST } from "@/lib/format";
import type { AgeCategory, Booking, Gender } from "@/types/models";

export const HARD_LIMIT = 300; // members per booking

export const CATEGORY_LABEL: Record<AgeCategory, string> = {
  adult: "Adult", child: "Child", senior: "Senior citizen",
};
export const GENDER_LABEL: Record<Gender, string> = {
  male: "Male", female: "Female", other: "Other",
};

type B = Pick<Booking, "status" | "closeDate" | "memberCount" | "minPersons" | "maxPersons">;

/** Why new members can't be added right now, or null if they can */
export function blockReason(b: B, today = todayIST()): string | null {
  if (b.status !== "open") return `This booking is ${b.status}`;
  if (today > b.closeDate) return `Booking closed on ${formatDate(b.closeDate)}`;
  const cap = b.maxPersons > 0 ? b.maxPersons : HARD_LIMIT;
  if (b.memberCount >= cap) return "All slots are filled";
  return null;
}

export function slotInfo(b: B) {
  const need = Math.max(b.minPersons - b.memberCount, 0);
  if (b.maxPersons > 0) {
    const left = b.maxPersons - b.memberCount;
    return {
      main: left > 0 ? `${left} slot${left === 1 ? "" : "s"} left` : "Full",
      note: need > 0 ? `${need} more to reach minimum` : "Minimum reached",
    };
  }
  return {
    main: need > 0 ? `${need} more needed` : "Minimum reached",
    note: "No upper limit",
  };
}

export function displayStatus(b: B): { key: "open" | "full" | "closed" | "completed" | "cancelled"; label: string } {
  if (b.status !== "open") return { key: b.status, label: b.status[0].toUpperCase() + b.status.slice(1) };
  if (todayIST() > b.closeDate) return { key: "closed", label: "Closed" };
  if (b.maxPersons > 0 && b.memberCount >= b.maxPersons) return { key: "full", label: "Full" };
  return { key: "open", label: "Open" };
}