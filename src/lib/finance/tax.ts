export type TaxConfig = {
  enabled: boolean;
  rateBps: number; // 1800 = 18%
  mode: "exclusive" | "inclusive";
};

export function calcTotals(args: { lineTotals: number[]; discount?: number; tax: TaxConfig }) {
  const subtotal = args.lineTotals.reduce((s, n) => s + n, 0);
  const taxable = Math.max(subtotal - (args.discount ?? 0), 0);

  if (!args.tax.enabled || args.tax.rateBps === 0) {
    return { subtotal, taxable, taxAmount: 0, total: taxable };
  }

  if (args.tax.mode === "exclusive") {
    const taxAmount = Math.round((taxable * args.tax.rateBps) / 10000);
    return { subtotal, taxable, taxAmount, total: taxable + taxAmount };
  }

  // inclusive: the price already contains tax, so extract it
  const base = Math.round((taxable * 10000) / (10000 + args.tax.rateBps));
  return { subtotal, taxable: base, taxAmount: taxable - base, total: taxable };
}