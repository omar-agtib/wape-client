import { useState, type ReactNode } from "react";
import { CURRENCIES } from "@/constants/currency";
import { CurrencyContext } from "@/contexts/currency/CurrencyContext";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(
    () => localStorage.getItem("wape_currency") ?? "MAD",
  );

  const setCurrency = (code: string) => {
    localStorage.setItem("wape_currency", code);
    setCurrencyState(code);
  };

  const currentCurrency =
    CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];

  const format = (amount: number) =>
    new Intl.NumberFormat(currentCurrency.locale, {
      style: "currency",
      currency: currentCurrency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency, currentCurrency, format }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
