import { useContext } from "react";
import { CurrencyContext } from "@/contexts/currency/CurrencyContext";
export function useCurrency() {
    const ctx = useContext(CurrencyContext);
    if (!ctx) {
        throw new Error("useCurrency must be used inside <CurrencyProvider>");
    }
    return ctx;
}
