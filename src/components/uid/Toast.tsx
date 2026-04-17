import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type ToastVariant = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
}

// ── Config ────────────────────────────────────────────────────────────────────
const CONFIG: Record<
  ToastVariant,
  { icon: ReactNode; classes: string; iconClass: string }
> = {
  success: {
    icon: <CheckCircle className="w-5 h-5 shrink-0" />,
    classes: "border-success/30 bg-card",
    iconClass: "text-success",
  },
  error: {
    icon: <XCircle className="w-5 h-5 shrink-0" />,
    classes: "border-destructive/30 bg-card",
    iconClass: "text-destructive",
  },
  warning: {
    icon: <AlertCircle className="w-5 h-5 shrink-0" />,
    classes: "border-warning/30 bg-card",
    iconClass: "text-warning",
  },
  info: {
    icon: <Info className="w-5 h-5 shrink-0" />,
    classes: "border-info/30 bg-card",
    iconClass: "text-info",
  },
};

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [{ ...opts, id }, ...prev].slice(0, 5));
      setTimeout(() => dismiss(id), opts.duration ?? 4000);
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, message?: string) =>
      toast({ variant: "success", title, message }),
    [toast],
  );
  const error = useCallback(
    (title: string, message?: string) =>
      toast({ variant: "error", title, message, duration: 6000 }),
    [toast],
  );
  const warning = useCallback(
    (title: string, message?: string) =>
      toast({ variant: "warning", title, message }),
    [toast],
  );
  const info = useCallback(
    (title: string, message?: string) =>
      toast({ variant: "info", title, message }),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => {
          const { icon, classes, iconClass } = CONFIG[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border shadow-lg",
                "pointer-events-auto",
                "animate-in slide-in-from-right-full duration-300",
                classes,
              )}
            >
              <span className={iconClass}>{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t.title}
                </p>
                {t.message && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
