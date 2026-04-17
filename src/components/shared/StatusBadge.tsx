import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusKey =
  | "planning"
  | "in_progress"
  | "on_hold"
  | "completed"
  | "cancelled"
  | "todo"
  | "review"
  | "blocked"
  | "active"
  | "on_leave"
  | "inactive"
  | "available"
  | "in_use"
  | "maintenance"
  | "retired"
  | "open"
  | "resolved"
  | "closed"
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "critical";

const statusStyles: Record<StatusKey, string> = {
  planning: "bg-info/10 text-info border-info/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  on_hold: "bg-muted text-muted-foreground border-border",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  todo: "bg-muted text-muted-foreground border-border",
  review: "bg-info/10 text-info border-info/20",
  blocked: "bg-destructive/10 text-destructive border-destructive/20",
  active: "bg-success/10 text-success border-success/20",
  on_leave: "bg-warning/10 text-warning border-warning/20",
  inactive: "bg-muted text-muted-foreground border-border",
  available: "bg-success/10 text-success border-success/20",
  in_use: "bg-warning/10 text-warning border-warning/20",
  maintenance: "bg-info/10 text-info border-info/20",
  retired: "bg-muted text-muted-foreground border-border",
  open: "bg-destructive/10 text-destructive border-destructive/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-muted text-muted-foreground border-border",
  low: "bg-success/10 text-success border-success/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
};

interface StatusBadgeProps {
  status: StatusKey | string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = (status || "unknown").replace(/_/g, " ");
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize text-xs font-medium border",
        statusStyles[status as StatusKey] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {label}
    </Badge>
  );
}
