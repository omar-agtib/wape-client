import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
export function PageHeader({ title, subtitle, back, actions, tabs, className, }) {
    const navigate = useNavigate();
    const handleBack = () => {
        if (typeof back === "string")
            navigate(back);
        else
            navigate(-1);
    };
    return (_jsxs("div", { className: cn("space-y-1 mb-6", className), children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex items-start gap-3 min-w-0", children: [back && (_jsx("button", { onClick: handleBack, className: "mt-0.5 p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0", children: _jsx(ArrowLeft, { className: "w-4 h-4" }) })), _jsxs("div", { className: "min-w-0", children: [_jsx("h1", { className: "text-xl font-bold text-foreground truncate", children: title }), subtitle && (_jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: subtitle }))] })] }), actions && (_jsx("div", { className: "flex items-center gap-2 shrink-0", children: actions }))] }), tabs && _jsx("div", { className: "mt-4", children: tabs })] }));
}
export function SectionHeader({ title, subtitle, action, className, }) {
    return (_jsxs("div", { className: cn("flex items-center justify-between mb-3", className), children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-foreground", children: title }), subtitle && (_jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: subtitle }))] }), action] }));
}
export function StatRow({ items, cols = 4, className }) {
    const colClass = {
        2: "sm:grid-cols-2",
        3: "sm:grid-cols-3",
        4: "sm:grid-cols-2 lg:grid-cols-4",
    }[cols];
    return (_jsx("div", { className: cn("grid grid-cols-1 gap-px bg-border rounded-xl overflow-hidden border border-border", colClass, className), children: items.map(({ label, value }) => (_jsxs("div", { className: "bg-card px-4 py-3", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: label }), _jsx("div", { className: "mt-1 text-sm font-semibold text-foreground", children: value })] }, label))) }));
}
export function DetailList({ items, className }) {
    return (_jsx("div", { className: cn("divide-y divide-border", className), children: items.map(({ label, value }) => (_jsxs("div", { className: "flex items-start justify-between py-3 gap-4", children: [_jsx("span", { className: "text-sm text-muted-foreground shrink-0 w-40", children: label }), _jsx("span", { className: "text-sm text-foreground font-medium text-right", children: value ?? "—" })] }, label))) }));
}
// ── Loading overlay ───────────────────────────────────────────────────────────
export function LoadingOverlay({ message = "Loading...", }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center py-24 gap-4", children: [_jsx("div", { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "text-sm text-muted-foreground", children: message })] }));
}
export function ErrorState({ title = "Something went wrong", message = "An error occurred while loading data.", onRetry, }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center py-16 gap-3 text-center", children: [_jsx("div", { className: "w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center", children: _jsx("span", { className: "text-2xl", children: "\u26A0\uFE0F" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-foreground", children: title }), _jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: message })] }), onRetry && (_jsx("button", { onClick: onRetry, className: "h-8 px-4 rounded-lg border border-input text-sm text-foreground hover:bg-muted transition-colors", children: "Try again" }))] }));
}
