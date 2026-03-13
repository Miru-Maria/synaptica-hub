import React, { createContext, useContext, useState } from "react";

export type Currency = "USD" | "EUR" | "RON";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (usdAmount: number) => string;
  formatRange: (usdLow: number, usdHigh: number) => string;
}

const rates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  RON: 4.6,
};

const symbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  RON: "RON ",
};

function round(n: number, currency: Currency): number {
  if (currency === "RON") return Math.round(n / 50) * 50;
  if (currency === "EUR") return Math.round(n / 10) * 10;
  return Math.round(n);
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  format: (n) => `$${n.toLocaleString("en-US")}`,
  formatRange: (lo, hi) => `$${lo.toLocaleString("en-US")} – $${hi.toLocaleString("en-US")}`,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("USD");

  const format = (usdAmount: number): string => {
    const converted = round(usdAmount * rates[currency], currency);
    return `${symbols[currency]}${converted.toLocaleString("en-US")}`;
  };

  const formatRange = (usdLow: number, usdHigh: number): string => {
    const lo = round(usdLow * rates[currency], currency);
    const hi = round(usdHigh * rates[currency], currency);
    return `${symbols[currency]}${lo.toLocaleString("en-US")} – ${symbols[currency]}${hi.toLocaleString("en-US")}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, formatRange }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
