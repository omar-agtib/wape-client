import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCIES } from "@/constants/currency";
export default function CurrencyInput({ value, onChange, currency: currencyProp, onCurrencyChange, className = "", }) {
    const { currency: globalCurrency } = useCurrency();
    const activeCurrency = currencyProp || globalCurrency;
    return (_jsxs("div", { className: `flex gap-1 ${className}`, children: [_jsxs(Select, { value: activeCurrency, onValueChange: onCurrencyChange || (() => { }), children: [_jsx(SelectTrigger, { className: "w-20 shrink-0 h-9 text-xs", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: CURRENCIES.map((c) => (_jsx(SelectItem, { value: c.code, children: c.code }, c.code))) })] }), _jsx(Input, { type: "number", value: value || "", onChange: (e) => onChange(parseFloat(e.target.value) || 0), className: "flex-1 h-9" })] }));
}
