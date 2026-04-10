import { cn } from "../../lib/utils";

type BadgeVariant =
  // Project / Task status
  | "planned"
  | "on_progress"
  | "completed"
  // Tool status
  | "available"
  | "in_use"
  | "maintenance"
  | "retired"
  // Invoice status
  | "pending_validation"
  | "validated"
  | "paid"
  // PO status
  | "draft"
  | "confirmed"
  | "partial"
  // NC status
  | "open"
  | "in_review"
  | "closed"
  // Payment status
  | "pending"
  | "partially_paid"
  | "overdue"
  // Generic
  | string;

interface StatusBadgeProps {
  status: BadgeVariant;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  // Project / Task
  planned: { label: "Planned", classes: "bg-muted text-muted-foreground" },
  on_progress: { label: "In Progress", classes: "bg-primary/15 text-primary" },
  completed: { label: "Completed", classes: "bg-success/15 text-success" },
  // Tools
  available: { label: "Available", classes: "bg-success/15 text-success" },
  in_use: { label: "In Use", classes: "bg-primary/15 text-primary" },
  maintenance: { label: "Maintenance", classes: "bg-warning/15 text-warning" },
  retired: { label: "Retired", classes: "bg-muted text-muted-foreground" },
  // Invoices
  pending_validation: {
    label: "Pending",
    classes: "bg-warning/15 text-warning",
  },
  validated: { label: "Validated", classes: "bg-info/15 text-info" },
  paid: { label: "Paid", classes: "bg-success/15 text-success" },
  // PO
  draft: { label: "Draft", classes: "bg-muted text-muted-foreground" },
  confirmed: { label: "Confirmed", classes: "bg-primary/15 text-primary" },
  partial: { label: "Partial", classes: "bg-warning/15 text-warning" },
  // NC
  open: { label: "Open", classes: "bg-destructive/15 text-destructive" },
  in_review: { label: "In Review", classes: "bg-warning/15 text-warning" },
  closed: { label: "Closed", classes: "bg-success/15 text-success" },
  // Payment
  pending: { label: "Pending", classes: "bg-warning/15 text-warning" },
  partially_paid: { label: "Partial", classes: "bg-info/15 text-info" },
  overdue: { label: "Overdue", classes: "bg-destructive/15 text-destructive" },
  // Attachment
  invoiced: { label: "Invoiced", classes: "bg-info/15 text-info" },
  // Subscription
  active: { label: "Active", classes: "bg-success/15 text-success" },
  expired: { label: "Expired", classes: "bg-destructive/15 text-destructive" },
  cancelled: { label: "Cancelled", classes: "bg-muted text-muted-foreground" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    classes: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize",
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
