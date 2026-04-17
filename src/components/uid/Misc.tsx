import React, { type ReactNode } from "react";
import { cn, getInitials } from "../../lib/utils";

// ── Tabs ──────────────────────────────────────────────────────────────────────
interface TabItem {
  key: string;
  label: string;
  icon?: React.ElementType;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
  variant?: "underline" | "pills";
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  className,
}: TabsProps) {
  if (variant === "pills") {
    return (
      <div
        className={cn(
          "flex items-center gap-1 p-1 bg-muted rounded-xl w-fit",
          className,
        )}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && onChange(tab.key)}
              disabled={tab.disabled}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                tab.disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-bold",
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted-foreground/20 text-muted-foreground",
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-end gap-0 border-b border-border", className)}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && onChange(tab.key)}
            disabled={tab.disabled}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-150",
              "border-b-2 -mb-px",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              tab.disabled && "opacity-40 cursor-not-allowed",
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  active
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
const avatarSizes: Record<AvatarSize, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden",
        avatarSizes[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-primary select-none">
          {name ? getInitials(name) : "?"}
        </span>
      )}
    </div>
  );
}

// ── Progress ──────────────────────────────────────────────────────────────────
interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "destructive";
  className?: string;
}

const progressColors = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};
const progressSizes = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  size = "md",
  color,
  className,
}: ProgressProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const autoColor =
    pct >= 100 ? "destructive" : pct >= 80 ? "warning" : "primary";
  const barColor = progressColors[color ?? autoColor];

  return (
    <div className={cn("w-full space-y-1", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-xs font-semibold text-foreground">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full bg-muted rounded-full overflow-hidden",
          progressSizes[size],
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            barColor,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string;
}
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse bg-muted rounded-md", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="h-10 bg-muted/50 border-b border-border px-4 flex items-center gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 px-4 flex items-center gap-4 border-b border-border/50 last:border-0"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              className="h-4 flex-1"
              style={{ opacity: 1 - j * 0.15 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      {icon && (
        <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
interface DividerProps {
  label?: string;
  className?: string;
}
export function Divider({ label, className }: DividerProps) {
  if (!label) return <hr className={cn("border-border", className)} />;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 border-t border-border" />
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}
