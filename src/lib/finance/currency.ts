export const BASE_CURRENCY = "INR" as const;

// Add more as needed. All of these use 2 decimal places.
export const CURRENCIES = {
  INR: { name: "Indian Rupee", symbol: "₹" },
  USD: { name: "US Dollar", symbol: "$" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  AED: { name: "UAE Dirham", symbol: "AED" },
  SGD: { name: "Singapore Dollar", symbol: "S$" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

// Money is always stored as integers in minor units (paise / cents)
export const toMinor = (major: number) => Math.round(major * 100);
export const fromMinor = (minor: number) => minor / 100;

export function formatMoney(minor: number, currency: CurrencyCode = "INR") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
  }).format(minor / 100);
}

export const percentToBps = (percent: number) => Math.round(percent * 100); // 18 → 1800
export const bpsToPercent = (bps: number) => bps / 100;