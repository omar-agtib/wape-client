import { type ReactNode, type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}
const padMap = { none: "", sm: "p-3", md: "p-5", lg: "p-6" };

export function Card({
  children,
  className,
  padding = "md",
  hover = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border",
        padMap[padding],
        hover &&
          "hover:shadow-md hover:border-border/80 transition-all duration-200 cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}
export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
    </div>
  );
}
