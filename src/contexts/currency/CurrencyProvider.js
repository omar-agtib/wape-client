import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { CURRENCIES } from "@/constants/currency";
import { CurrencyContext } from "@/contexts/currency/CurrencyContext";
export function CurrencyProvider({ children }) {
    const [currency, setCurrencyState] = useState(() => localStorage.getItem("wape_currency") ?? "MAD");
    const setCurrency = (code) => {
        localStorage.setItem("wape_currency", code);
        setCurrencyState(code);
    };
    const currentCurrency = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
    const format = (amount) => new Intl.NumberFormat(currentCurrency.locale, {
        style: "currency",
        currency: currentCurrency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
    return (_jsx(CurrencyContext.Provider, { value: { currency, setCurrency, currentCurrency, format }, children: children }));
}
