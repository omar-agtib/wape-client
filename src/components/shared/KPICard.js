import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
const colorMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
};
export default function KPICard({ title, value, icon: Icon, trend, trendLabel, color = "primary", subtitle, }) {
    return (_jsx(Card, { className: "p-5 hover:shadow-md transition-shadow", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-muted-foreground", children: title }), _jsx("p", { className: "text-2xl font-bold text-foreground", children: value }), subtitle && (_jsx("p", { className: "text-xs text-muted-foreground", children: subtitle })), trendLabel && (_jsxs("p", { className: cn("text-xs font-medium", trend !== undefined && trend > 0
                                ? "text-success"
                                : trend !== undefined && trend < 0
                                    ? "text-destructive"
                                    : "text-muted-foreground"), children: [trend !== undefined && trend > 0
                                    ? "↑"
                                    : trend !== undefined && trend < 0
                                        ? "↓"
                                        : "→", " ", trendLabel] }))] }), _jsx("div", { className: cn("p-3 rounded-xl", colorMap[color]), children: _jsx(Icon, { className: "w-5 h-5" }) })] }) }));
}
