import { type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// ── Page Header ───────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean | string; // true = go back, string = go to path
  actions?: ReactNode;
  tabs?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
  tabs,
  className,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof back === "string") navigate(back);
    else navigate(-1);
  };

  return (
    <div className={cn("space-y-1 mb-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          {back && (
            <button
              onClick={handleBack}
              className="mt-0.5 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
      {tabs && <div className="mt-4">{tabs}</div>}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Stat Row (for detail pages) ───────────────────────────────────────────────
interface StatItem {
  label: string;
  value: ReactNode;
}
interface StatRowProps {
  items: StatItem[];
  cols?: 2 | 3 | 4;
  className?: string;
}

export function StatRow({ items, cols = 4, className }: StatRowProps) {
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[cols];
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-px bg-border rounded-xl overflow-hidden border border-border",
        colClass,
        className,
      )}
    >
      {items.map(({ label, value }) => (
        <div key={label} className="bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Detail Row (label: value inside a card) ───────────────────────────────────
interface DetailRowProps {
  items: { label: string; value: ReactNode }[];
  className?: string;
}
export function DetailList({ items, className }: DetailRowProps) {
  return (
    <div className={cn("divide-y divide-border", className)}>
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="flex items-start justify-between py-3 gap-4"
        >
          <span className="text-sm text-muted-foreground shrink-0 w-40">
            {label}
          </span>
          <span className="text-sm text-foreground font-medium text-right">
            {value ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Loading overlay ───────────────────────────────────────────────────────────
export function LoadingOverlay({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}
export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading data.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
        <span className="text-2xl">⚠️</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-8 px-4 rounded-lg border border-input text-sm text-foreground hover:bg-muted transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
