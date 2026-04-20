import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Building2, HardHat, CreditCard, } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, } from "recharts";
import { financeService, projectsService } from "@/services/wape.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
// ── Constants ─────────────────────────────────────────────────────────────────
const COLORS = [
    "hsl(221,83%,53%)",
    "hsl(142,71%,45%)",
    "hsl(38,92%,50%)",
    "hsl(0,84%,60%)",
    "hsl(199,89%,48%)",
];
// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ title, value, subtitle, icon: Icon, color, }) {
    const colorMap = {
        primary: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        info: "bg-blue-500/10 text-blue-600",
        purple: "bg-purple-500/10 text-purple-600",
    };
    return (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-start gap-3", children: [_jsx("div", { className: `p-2 rounded-lg shrink-0 ${colorMap[color] ?? colorMap.primary}`, children: _jsx(Icon, { className: "w-5 h-5" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs text-muted-foreground truncate", children: title }), _jsx("p", { className: "text-xl font-bold leading-tight", children: value }), subtitle && (_jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: subtitle }))] })] }) }));
}
function fmt(amount, currency = "MAD") {
    if (amount == null)
        return "—";
    return `${amount.toLocaleString()} ${currency}`;
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function FinancePage() {
    const { data: dashboardRaw } = useQuery({
        queryKey: ["finance-dashboard"],
        queryFn: () => financeService.dashboard(),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const dashboard = dashboardRaw;
    const projects = (projectsData?.items ?? []);
    const currency = dashboard?.currency ?? "MAD";
    // KPI values from dashboard
    const totalBudget = dashboard?.totalBudget ?? 0;
    const totalSpent = dashboard?.totalSpent ?? 0;
    const remaining = dashboard?.remainingBudget ?? totalBudget - totalSpent;
    const usagePct = dashboard?.percentConsumed ??
        (totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0);
    // Monthly chart data
    const monthlyData = dashboard?.monthly ?? [];
    // Supplier vs subcontractor breakdown
    const supplierTotal = dashboard?.supplierPaymentsTotal ?? 0;
    const subcontractorTotal = dashboard?.subcontractorPaymentsTotal ?? 0;
    const subscriptionTotal = dashboard?.subscriptionTotal ?? 0;
    const pieData = [
        supplierTotal > 0 && { name: "Suppliers", value: supplierTotal },
        subcontractorTotal > 0 && {
            name: "Subcontractors",
            value: subcontractorTotal,
        },
        subscriptionTotal > 0 && {
            name: "Subscriptions",
            value: subscriptionTotal,
        },
    ].filter(Boolean);
    // Subscription status
    const subscription = dashboard?.subscription;
    // Per-project from dashboard or fallback
    const projectFinance = dashboard?.projects ??
        projects.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            budget: p.budget ?? 0,
            spent: 0,
            currency: p.currency ?? "MAD",
            percentConsumed: 0,
        }));
    return (_jsxs("div", { className: "space-y-6", children: [subscription &&
                subscription.status === "active" &&
                (subscription.daysUntilRenewal ?? 8) <= 7 && (_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), _jsxs("span", { children: ["Your subscription renews in", " ", _jsxs("strong", { children: [subscription.daysUntilRenewal, " days"] }), "."] })] })), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(KPICard, { title: "Total Budget", value: fmt(totalBudget, currency), icon: DollarSign, color: "primary", subtitle: `${projects.length} projects` }), _jsx(KPICard, { title: "Total Spent", value: fmt(totalSpent, currency), icon: TrendingDown, color: "warning" }), _jsx(KPICard, { title: "Remaining Budget", value: fmt(remaining, currency), icon: TrendingUp, color: remaining >= 0 ? "success" : "destructive", subtitle: remaining < 0 ? "Over budget!" : "Available" }), _jsx(KPICard, { title: "Budget Used", value: `${Math.round(usagePct)}%`, icon: AlertCircle, color: usagePct > 90
                            ? "destructive"
                            : usagePct > 70
                                ? "warning"
                                : "success", subtitle: `${100 - Math.round(usagePct)}% remaining` })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsx(Link, { to: "/finance/supplier-payments", children: _jsx(Card, { className: "hover:border-primary/40 transition-colors cursor-pointer", children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-blue-500/10 text-blue-600", children: _jsx(Building2, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Supplier Payments" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [fmt(supplierTotal, currency), " paid"] })] })] }) }) }), _jsx(Link, { to: "/finance/transactions", children: _jsx(Card, { className: "hover:border-primary/40 transition-colors cursor-pointer", children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-orange-500/10 text-orange-600", children: _jsx(HardHat, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Transactions" }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [fmt(subcontractorTotal, currency), " paid"] })] })] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx("div", { className: `p-2 rounded-lg ${subscription?.status === "active" ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"}`, children: _jsx(CreditCard, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Subscription" }), _jsx("p", { className: "text-xs text-muted-foreground", children: subscription ? (_jsx(Badge, { variant: "outline", className: "text-xs", children: subscription.status })) : ("No active plan") })] })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Monthly Spending \u2014 Last 6 Months" }) }), _jsx(CardContent, { children: monthlyData.length === 0 ? (_jsx("p", { className: "text-center text-muted-foreground text-sm py-16", children: "No financial data yet" })) : (_jsx(ResponsiveContainer, { width: "100%", height: 280, children: _jsxs(BarChart, { data: monthlyData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" }), _jsx(Tooltip, { contentStyle: {
                                                    borderRadius: 8,
                                                    border: "1px solid hsl(var(--border))",
                                                    background: "hsl(var(--card))",
                                                }, formatter: (v) => fmt(Number(v), currency) }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "budget", fill: "hsl(221,83%,53%)", name: "Budget", radius: [4, 4, 0, 0] }), _jsx(Bar, { dataKey: "spent", fill: "hsl(38,92%,50%)", name: "Spent", radius: [4, 4, 0, 0] })] }) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Spending by Category" }) }), _jsx(CardContent, { className: "flex justify-center", children: pieData.length === 0 ? (_jsx("p", { className: "text-center text-muted-foreground text-sm py-16", children: "No spending data yet" })) : (_jsx(ResponsiveContainer, { width: "100%", height: 280, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: pieData, cx: "50%", cy: "50%", outerRadius: 110, dataKey: "value", label: ({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`, labelLine: false, children: pieData.map((_, i) => (_jsx(Cell, { fill: COLORS[i % COLORS.length] }, i))) }), _jsx(Tooltip, { formatter: (v) => fmt(Number(v), currency) })] }) })) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Project Budget Breakdown" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [projectFinance.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No projects" })), projectFinance.map((p) => {
                                    const pct = p.percentConsumed ??
                                        ((p.budget ?? 0) > 0
                                            ? Math.round(((p.spent ?? 0) / (p.budget ?? 1)) * 100)
                                            : 0);
                                    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Link, { to: `/projects/${p.id}`, className: "text-sm font-medium hover:text-primary transition-colors", children: p.name }), p.status && _jsx(StatusBadge, { status: p.status })] }), _jsxs("div", { className: "text-right text-xs text-muted-foreground", children: [_jsx("span", { className: "text-warning font-semibold", children: fmt(p.spent, p.currency ?? currency) }), _jsxs("span", { children: [" / ", fmt(p.budget, p.currency ?? currency)] }), _jsxs("span", { className: `ml-2 font-bold ${pct > 100 ? "text-destructive" : pct > 80 ? "text-warning" : "text-success"}`, children: [pct, "%"] })] })] }), _jsx(Progress, { value: Math.min(pct, 100), className: `h-2 ${pct > 100 ? "[&>div]:bg-destructive" : pct > 80 ? "[&>div]:bg-warning" : ""}` })] }, p.id));
                                })] }) })] })] }));
}
