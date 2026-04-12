import React, { useState, useRef, useEffect, type ReactNode } from "react";
import { Search, X, Filter, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

// ── Dropdown Menu ─────────────────────────────────────────────────────────────
export interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ElementType;
  variant?: "default" | "danger";
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  align = "right",
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute top-full mt-1.5 z-50 min-w-[160px] bg-card border border-border",
            "rounded-xl shadow-xl overflow-hidden py-1",
            "animate-in fade-in-0 zoom-in-95 duration-150",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {items.map((item) => {
            if (item.divider)
              return (
                <div key={item.key} className="my-1 border-t border-border" />
              );
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors",
                  item.variant === "danger"
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-muted",
                  item.disabled && "opacity-40 cursor-not-allowed",
                )}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Search Input ──────────────────────────────────────────────────────────────
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  autoFocus,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="
          w-full h-9 pl-9 pr-9 rounded-lg border border-input bg-background
          text-sm text-foreground placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          transition-all duration-150
        "
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
interface FilterOption {
  value: string;
  label: string;
}
interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  filters?: FilterConfig[];
  values?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onReset?: () => void;
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({
  search,
  filters = [],
  values = {},
  onFilterChange,
  onReset,
  actions,
  className,
}: FilterBarProps) {
  const hasActiveFilters =
    Object.values(values).some(Boolean) || (search?.value ?? "") !== "";
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {search && (
          <SearchInput
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
            className="flex-1 min-w-48"
          />
        )}

        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 h-9 px-3 rounded-lg border text-sm font-medium transition-colors",
              showFilters || hasActiveFilters
                ? "border-primary text-primary bg-primary/5"
                : "border-input text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        )}

        {hasActiveFilters && onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>

      {/* Filter dropdowns */}
      {showFilters && filters.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap p-3 bg-muted/30 rounded-xl border border-border">
          {filters.map((f) => (
            <div key={f.key} className="relative">
              <select
                value={values[f.key] ?? ""}
                onChange={(e) => onFilterChange?.(f.key, e.target.value)}
                className="
                  h-8 pl-3 pr-8 rounded-lg border border-input bg-background
                  text-xs text-foreground appearance-none cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-ring
                "
              >
                <option value="">{f.label}: All</option>
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
