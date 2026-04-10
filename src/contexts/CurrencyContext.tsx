import { createContext, useContext, useState, type ReactNode } from "react";

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "MAD", symbol: "MAD", label: "Dirham Marocain", locale: "fr-MA" },
  { code: "USD", symbol: "$", label: "Dollar Américain", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "Euro", locale: "fr-FR" },
  { code: "GBP", symbol: "£", label: "Livre Sterling", locale: "en-GB" },
];

interface CurrencyContextValue {
  currency: string;
  setCurrency: (code: string) => void;
  currentCurrency: CurrencyOption;
  CURRENCIES: CurrencyOption[];
  format: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

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
      value={{ currency, setCurrency, currentCurrency, CURRENCIES, format }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx)
    throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}
