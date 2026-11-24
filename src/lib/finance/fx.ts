import type { CurrencyCode } from "./currency";

/** Stores an original-currency amount and its exchange-rate snapshot. */
export type MoneyEntry = {
  currency: CurrencyCode;
  amount: number;       // minor units in the ORIGINAL currency
  rate: number;         // INR per 1 unit of that currency (1 for INR)
  rateSource: "base" | "default" | "manual";
  inrAmount: number;    // paise: amount × rate (this is what reports use)
  fxFeeInr: number;     // paise: bank / conversion charges
  netInrAmount: number; // paise: inrAmount − fxFeeInr
};

export function convertMinorAmount(amount: number, fromRateInr: number, toRateInr: number) {
  if (!Number.isFinite(amount) || !Number.isFinite(fromRateInr) || !Number.isFinite(toRateInr)
    || fromRateInr <= 0 || toRateInr <= 0) {
    throw new Error("Valid exchange rates are required to convert this amount");
  }
  return Math.round((amount * fromRateInr) / toRateInr);
}

export function convertMoneyEntryAmount(
  entry: MoneyEntry,
  currency: CurrencyCode,
  rates: Record<string, number>,
): number | undefined {
  if (entry.currency === currency) return entry.amount;
  const toRateInr = currency === "INR" ? 1 : rates[currency];
  if (!toRateInr) return undefined;
  return convertMinorAmount(entry.amount, entry.rate, toRateInr);
}

type BuildArgs = {
  currency: CurrencyCode;
  amount: number;                       // minor units
  rate?: number;                        // manual override
  fxFeeInr?: number;                    // manual flat fee override (paise)
  fxFeePercent?: number;                // manual % fee override
  defaultRates: Record<string, number>; // from settings
  defaultFeePercent: number;            // from settings
};

export function buildMoneyEntry(a: BuildArgs): MoneyEntry {
  if (a.currency === "INR") {
    return {
      currency: "INR",
      amount: a.amount,
      rate: 1,
      rateSource: "base",
      inrAmount: a.amount,
      fxFeeInr: 0,
      netInrAmount: a.amount,
    };
  }

  const rate = a.rate ?? a.defaultRates[a.currency];
  if (!rate || rate <= 0) throw new Error(`No exchange rate set for ${a.currency}`);

  const inrAmount = Math.round(a.amount * rate);
  const fxFeeInr =
    a.fxFeeInr ?? Math.round((inrAmount * (a.fxFeePercent ?? a.defaultFeePercent)) / 100);

  return {
    currency: a.currency,
    amount: a.amount,
    rate,
    rateSource: a.rate !== undefined ? "manual" : "default",
    inrAmount,
    fxFeeInr,
    netInrAmount: inrAmount - fxFeeInr,
  };
}