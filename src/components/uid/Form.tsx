import {
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type InputHTMLAttributes,
  forwardRef,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

// ── Select ────────────────────────────────────────────────────────────────────
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, options, placeholder, className, id, ...props },
    ref,
  ) => (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full h-10 pl-3 pr-9 rounded-lg border border-input bg-background",
            "text-sm text-foreground appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-150",
            error && "border-destructive focus:ring-destructive",
            !props.value && "text-muted-foreground",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          ⚠ {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  ),
);
Select.displayName = "Select";

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "w-full min-h-[100px] px-3 py-2.5 rounded-lg border border-input bg-background",
          "text-sm text-foreground placeholder:text-muted-foreground resize-y",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
          error && "border-destructive focus:ring-destructive",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">⚠ {error}</p>}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  ),
);
Textarea.displayName = "Textarea";

// ── Checkbox ──────────────────────────────────────────────────────────────────
interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, id, ...props }, ref) => (
    <div className="flex items-start gap-3">
      <div className="relative mt-0.5 shrink-0">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className="sr-only peer"
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "flex w-5 h-5 rounded-md border-2 border-input bg-background cursor-pointer",
            "transition-all duration-150",
            "peer-checked:bg-primary peer-checked:border-primary",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            error && "border-destructive",
            className,
          )}
        >
          <svg
            className="w-3 h-3 m-auto text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity"
            viewBox="0 0 12 12"
            fill="none"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </label>
      </div>
      {(label || description) && (
        <div>
          {label && (
            <label
              htmlFor={id}
              className="block text-sm font-medium text-foreground cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
          {error && (
            <p className="text-xs text-destructive mt-0.5">⚠ {error}</p>
          )}
        </div>
      )}
    </div>
  ),
);
Checkbox.displayName = "Checkbox";

// ── Radio Group ───────────────────────────────────────────────────────────────
interface RadioOption {
  value: string;
  label: string;
  description?: string;
}
interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  label?: string;
  error?: string;
  inline?: boolean;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  label,
  error,
  inline = false,
}: RadioGroupProps) {
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <div className={cn(inline ? "flex flex-wrap gap-4" : "space-y-2")}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-start gap-3 cursor-pointer group"
          >
            <div className="relative mt-0.5 shrink-0">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150",
                  value === opt.value
                    ? "border-primary"
                    : "border-input group-hover:border-primary/50",
                )}
              >
                {value === opt.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-foreground">
                {opt.label}
              </span>
              {opt.description && (
                <p className="text-xs text-muted-foreground">
                  {opt.description}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">⚠ {error}</p>}
    </div>
  );
}

// ── Date Input ────────────────────────────────────────────────────────────────
interface DateInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        type="date"
        id={id}
        className={cn(
          "w-full h-10 px-3 rounded-lg border border-input bg-background",
          "text-sm text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
          error && "border-destructive focus:ring-destructive",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">⚠ {error}</p>}
    </div>
  ),
);
DateInput.displayName = "DateInput";

// ── Number Input ──────────────────────────────────────────────────────────────
interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, error, prefix, suffix, className, id, ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-sm text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type="number"
          id={id}
          className={cn(
            "w-full h-10 rounded-lg border border-input bg-background",
            "text-sm text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
            prefix ? "pl-8" : "pl-3",
            suffix ? "pr-12" : "pr-3",
            error && "border-destructive focus:ring-destructive",
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-sm text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-destructive">⚠ {error}</p>}
    </div>
  ),
);
NumberInput.displayName = "NumberInput";
