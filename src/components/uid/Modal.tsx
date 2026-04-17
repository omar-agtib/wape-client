import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";
const sizeMap: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw]",
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
  footer,
  closeOnOverlay = true,
  className,
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative w-full bg-card rounded-2xl shadow-2xl border border-border",
          "flex flex-col max-h-[90vh]",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          sizeMap[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
            <div>
              {title && (
                <h2 className="text-base font-semibold text-foreground">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-4 shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  loading?: boolean;
}

export function Confirm({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmProps) {
  const btnClass = {
    danger:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  }[variant];

  return (
    <Modal open={open} onClose={onClose} size="sm" closeOnOverlay={!loading}>
      <div className="text-center space-y-3 py-2">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center mx-auto",
            variant === "danger"
              ? "bg-destructive/10"
              : variant === "warning"
                ? "bg-warning/10"
                : "bg-primary/10",
          )}
        >
          <span className="text-2xl">
            {variant === "danger" ? "⚠️" : variant === "warning" ? "🔔" : "❓"}
          </span>
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 h-10 px-4 rounded-lg border border-input text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "flex-1 h-10 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2",
            btnClass,
          )}
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          )}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
