import React, { type ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { cn } from "../../lib/utils";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  { icon: ReactNode; classes: string }
> = {
  error: {
    icon: <XCircle className="w-5 h-5 shrink-0" />,
    classes: "bg-destructive/10 border-destructive/30 text-destructive",
  },
  success: {
    icon: <CheckCircle className="w-5 h-5 shrink-0" />,
    classes: "bg-success/10 border-success/30 text-success",
  },
  warning: {
    icon: <AlertCircle className="w-5 h-5 shrink-0" />,
    classes: "bg-warning/10 border-warning/30 text-warning",
  },
  info: {
    icon: <Info className="w-5 h-5 shrink-0" />,
    classes: "bg-info/10 border-info/30 text-info",
  },
};

export function Alert({
  variant = "info",
  title,
  message,
  onClose,
  className,
}: AlertProps) {
  const { icon, classes } = variantConfig[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3.5 text-sm",
        classes,
        className,
      )}
    >
      {icon}
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <p className={cn(title && "mt-0.5 opacity-90")}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
