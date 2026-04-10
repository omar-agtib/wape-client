import { type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

type KPIColor =
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "muted";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: KPIColor;
  subtitle?: string;
  trend?: { value: number; label: string };
}

const colorMap: Record<KPIColor, { bg: string; icon: string; text: string }> = {
  primary: { bg: "bg-primary/10", icon: "text-primary", text: "text-primary" },
  success: { bg: "bg-success/10", icon: "text-success", text: "text-success" },
  warning: { bg: "bg-warning/10", icon: "text-warning", text: "text-warning" },
  destructive: {
    bg: "bg-destructive/10",
    icon: "text-destructive",
    text: "text-destructive",
  },
  info: { bg: "bg-info/10", icon: "text-info", text: "text-info" },
  muted: {
    bg: "bg-muted",
    icon: "text-muted-foreground",
    text: "text-muted-foreground",
  },
};

export default function KPICard({
  title,
  value,
  icon: Icon,
  color = "primary",
  subtitle,
  trend,
}: KPICardProps) {
  const colors = colorMap[color];

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground truncate">
          {title}
        </p>
        <div className={cn("p-2 rounded-lg shrink-0", colors.bg)}>
          <Icon className={cn("w-4 h-4", colors.icon)} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
        {trend && (
          <p
            className={cn(
              "text-xs font-medium mt-1",
              trend.value >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
            {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
