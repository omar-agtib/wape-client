import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";
import { CURRENCIES } from "@/constants/currency";

interface CurrencyInputProps {
  value: number | string;
  onChange: (val: number) => void;
  currency?: string;
  onCurrencyChange?: (code: string) => void;
  className?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  currency: currencyProp,
  onCurrencyChange,
  className = "",
}: CurrencyInputProps) {
  const { currency: globalCurrency } = useCurrency();
  const activeCurrency = currencyProp || globalCurrency;
  return (
    <div className={`flex gap-1 ${className}`}>
      <Select
        value={activeCurrency}
        onValueChange={onCurrencyChange || (() => {})}
      >
        <SelectTrigger className="w-20 shrink-0 h-9 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="flex-1 h-9"
      />
    </div>
  );
}
