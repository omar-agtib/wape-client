import { createContext } from "react";
import type { CurrencyOption } from "@/types/currency";

export interface CurrencyContextValue {
  currency: string;
  setCurrency: (code: string) => void;
  currentCurrency: CurrencyOption;
  format: (amount: number) => string;
}

export const CurrencyContext = createContext<CurrencyContextValue | null>(null);
