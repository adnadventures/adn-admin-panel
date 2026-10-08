import type { PriceTier, TravelPackage } from "@/types/models";

/** Per-person price for a given tourist count. Tiers must be sorted ascending. */
export function pricePerPerson(tiers: PriceTier[], persons: number) {
  let amount = tiers[0].amount;
  for (const t of tiers) if (persons >= t.fromPersons) amount = t.amount;
  return amount;
}

type Priced = Pick<TravelPackage, "priceTiers" | "minPersons" | "maxPersons" | "price">;

export function quote(pkg: Priced, persons: number) {
  if (!Number.isInteger(persons) || persons < 1) {
    return { ok: false as const, error: "Enter the number of travellers" };
  }
  if (persons < pkg.minPersons) {
    return { ok: false as const, error: `This package needs at least ${pkg.minPersons} persons` };
  }
  if (pkg.maxPersons > 0 && persons > pkg.maxPersons) {
    return { ok: false as const, error: `This package allows at most ${pkg.maxPersons} persons` };
  }
  const perPerson = pricePerPerson(pkg.priceTiers, persons);
  return {
    ok: true as const,
    perPerson,
    total: perPerson * persons,
    currency: pkg.price.currency,
  };
}

export function personsLabel(p: Pick<TravelPackage, "minPersons" | "maxPersons">) {
  if (p.maxPersons === p.minPersons) return `${p.minPersons} ${p.minPersons === 1 ? "person" : "persons"}`;
  if (p.maxPersons === 0) return `${p.minPersons}+ persons`;
  return `${p.minPersons} to ${p.maxPersons} persons`;
}