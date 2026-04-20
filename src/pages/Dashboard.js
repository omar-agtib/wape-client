import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, } from "recharts";
import { FolderKanban, CheckSquare, Users, Package, AlertTriangle, DollarSign, ArrowRight, Clock, TrendingUp, } from "lucide-react";
import { projectsService } from "@/services/wape.service";
import { tasksService } from "@/services/wape.service";
import { personnelService } from "@/services/wape.service";
import { articlesService } from "@/services/wape.service";
import { ncService } from "@/services/wape.service";
import { financeService } from "@/services/wape.service";
import KPICard from "@/components/shared/KPICard";
import StatusBadge from "@/components/shared/StatusBadge";
import { createPageUrl } from "@/lib/utils";
const CHART_COLORS = [
    "hsl(221,83%,53%)",
    "hsl(142,71%,45%)",
    "hsl(38,92%,50%)",
    "hsl(0,84%,60%)",
    "hsl(199,89%,48%)",
];
const TOOLTIP_STYLE = {
    borderRadius: "8px",
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--card))",
    color: "hsl(var(--foreground))",
};
export default function Dashboard() {
    // ── Data fetching ─────────────────────────────────────────────────────────
    const { data: projectsData } = useQuery({
        queryKey: ["projects", "dashboard"],
        queryFn: () => projectsService.list(),
    });
    const { data: tasksData } = useQuery({
        queryKey: ["tasks", "dashboard"],
        queryFn: () => tasksService.list(),
    });
    const { data: personnelData } = useQuery({
        queryKey: ["personnel", "dashboard"],
        queryFn: () => personnelService.list(),
    });
    const { data: articlesData } = useQuery({
        queryKey: ["articles", "dashboard"],
        queryFn: () => articlesService.list(),
    });
    const { data: ncsData } = useQuery({
        queryKey: ["ncs", "dashboard"],
        queryFn: () => ncService.list(),
    });
    const { data: financeDashboard } = useQuery({
        queryKey: ["finance", "dashboard"],
        queryFn: () => financeService.dashboard(),
    });
    // ── Aggregations ────────────────────────────────────────────────────────────
    const projects = projectsData?.items ?? [];
    const tasks = tasksData?.items ?? [];
    const personnel = personnelData?.items ?? [];
    const articles = articlesData?.items ?? [];
    const ncs = ncsData?.items ?? [];
    const activeProjects = projects.filter((p) => p.status === "on_progress").length;
    const tasksInProgress = tasks.filter((t) => t.status === "on_progress").length;
    const totalPersonnel = personnel.length;
    // Stock alerts: articles where availableQuantity is 0 or very low
    const stockAlerts = articles.filter((a) => a.availableQuantity === 0).length;
    const openNCs = ncs.filter((nc) => nc.status === "open" || nc.status === "in_review").length;
    // Budget usage from finance dashboard
    const totalBudget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);
    const totalSpent = projects.reduce((s, p) => s + (p.financeSnapshot?.totalSpent ?? 0), 0);
    const budgetUsage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    // ── Chart data ──────────────────────────────────────────────────────────────
    // Project progress chart
    const projectProgress = projects.slice(0, 6).map((p) => ({
        name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
        progress: p.progress ?? 0,
    }));
    // Task status distribution
    const taskStatuses = [
        {
            name: "Planned",
            value: tasks.filter((t) => t.status === "planned").length,
        },
        {
            name: "In Progress",
            value: tasks.filter((t) => t.status === "on_progress").length,
        },
        {
            name: "Completed",
            value: tasks.filter((t) => t.status === "completed").length,
        },
    ].filter((s) => s.value > 0);
    // NC status distribution
    const ncStatuses = [
        { name: "Open", value: ncs.filter((nc) => nc.status === "open").length },
        {
            name: "In Review",
            value: ncs.filter((nc) => nc.status === "in_review").length,
        },
        {
            name: "Closed",
            value: ncs.filter((nc) => nc.status === "closed").length,
        },
    ].filter((s) => s.value > 0);
    // Monthly payment chart from finance dashboard
    const monthlyChart = financeDashboard?.monthlyChart ?? [];
    // Recent tasks
    const recentTasks = tasks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    // ── Render ──────────────────────────────────────────────────────────────────
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4", children: [_jsx(KPICard, { title: "Active Projects", value: activeProjects, icon: FolderKanban, color: "primary", subtitle: `${projects.length} total` }), _jsx(KPICard, { title: "Tasks In Progress", value: tasksInProgress, icon: CheckSquare, color: "warning", subtitle: `${tasks.length} total` }), _jsx(KPICard, { title: "Personnel", value: totalPersonnel, icon: Users, color: "success" }), _jsx(KPICard, { title: "Stock Alerts", value: stockAlerts, icon: Package, color: stockAlerts > 0 ? "destructive" : "success", subtitle: "Out of stock articles" }), _jsx(KPICard, { title: "Open NC", value: openNCs, icon: AlertTriangle, color: openNCs > 0 ? "warning" : "success", subtitle: "Non-conformities" }), _jsx(KPICard, { title: "Budget Usage", value: `${budgetUsage}%`, icon: DollarSign, color: budgetUsage >= 100
                            ? "destructive"
                            : budgetUsage >= 80
                                ? "warning"
                                : "info", subtitle: "Across all projects" })] }), financeDashboard && (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
                    {
                        label: "Payments this month",
                        value: financeDashboard.kpis.totalPaymentsThisMonth,
                        color: "bg-primary/10 text-primary",
                    },
                    {
                        label: "Pending supplier",
                        value: financeDashboard.kpis.pendingSupplierAmount,
                        color: "bg-warning/10 text-warning",
                    },
                    {
                        label: "Pending subcontractor",
                        value: financeDashboard.kpis.pendingSubcontractorAmount,
                        color: "bg-info/10 text-info",
                    },
                    {
                        label: "Overdue payments",
                        value: financeDashboard.kpis.overduePayments,
                        color: financeDashboard.kpis.overduePayments > 0
                            ? "bg-destructive/10 text-destructive"
                            : "bg-success/10 text-success",
                    },
                ].map(({ label, value, color }) => (_jsxs("div", { className: "bg-card rounded-xl border border-border p-4", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: label }), _jsx("p", { className: `text-xl font-bold mt-1 ${color.split(" ")[1]}`, children: typeof value === "number" && value > 100
                                ? new Intl.NumberFormat("fr-MA").format(value)
                                : value })] }, label))) })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-card rounded-xl border border-border p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Project Progress" }), _jsxs(Link, { to: createPageUrl("Projects"), className: "text-xs text-primary hover:underline flex items-center gap-1", children: ["View all ", _jsx(ArrowRight, { className: "w-3 h-3" })] })] }), projectProgress.length === 0 ? (_jsx("div", { className: "h-48 flex items-center justify-center", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "No projects yet" }) })) : (_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: projectProgress, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "name", tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { domain: [0, 100], tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" }), _jsx(Tooltip, { contentStyle: TOOLTIP_STYLE, formatter: (v) => [`${Number(v)}%`, "Progress"] }), _jsx(Bar, { dataKey: "progress", fill: CHART_COLORS[0], radius: [4, 4, 0, 0] })] }) }))] }), _jsxs("div", { className: "bg-card rounded-xl border border-border p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Monthly Payments" }), _jsxs(Link, { to: createPageUrl("Finance"), className: "text-xs text-primary hover:underline flex items-center gap-1", children: ["Finance ", _jsx(ArrowRight, { className: "w-3 h-3" })] })] }), monthlyChart.length === 0 ? (_jsx("div", { className: "h-48 flex items-center justify-center", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "No payment data yet" }) })) : (_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(BarChart, { data: monthlyChart, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" }), _jsx(Tooltip, { contentStyle: TOOLTIP_STYLE, formatter: (v) => [
                                                new Intl.NumberFormat("fr-MA").format(Number(v)),
                                                "Amount",
                                            ] }), _jsx(Bar, { dataKey: "total", fill: CHART_COLORS[1], radius: [4, 4, 0, 0] })] }) }))] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-card rounded-xl border border-border p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Task Distribution" }), _jsxs(Link, { to: createPageUrl("Tasks"), className: "text-xs text-primary hover:underline flex items-center gap-1", children: ["View all ", _jsx(ArrowRight, { className: "w-3 h-3" })] })] }), taskStatuses.length === 0 ? (_jsx("div", { className: "h-48 flex items-center justify-center", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "No tasks yet" }) })) : (_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: taskStatuses, cx: "50%", cy: "50%", outerRadius: 80, dataKey: "value", label: ({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`, labelLine: false, children: taskStatuses.map((_, i) => (_jsx(Cell, { fill: CHART_COLORS[i % CHART_COLORS.length] }, i))) }), _jsx(Tooltip, { contentStyle: TOOLTIP_STYLE })] }) }))] }), _jsxs("div", { className: "bg-card rounded-xl border border-border p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Non-Conformities" }), _jsxs(Link, { to: createPageUrl("NonConformities"), className: "text-xs text-primary hover:underline flex items-center gap-1", children: ["View all ", _jsx(ArrowRight, { className: "w-3 h-3" })] })] }), ncStatuses.length === 0 ? (_jsx("div", { className: "h-48 flex items-center justify-center", children: _jsx("p", { className: "text-sm text-muted-foreground", children: "No non-conformities reported" }) })) : (_jsx(ResponsiveContainer, { width: "100%", height: 220, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: ncStatuses, cx: "50%", cy: "50%", outerRadius: 80, dataKey: "value", label: ({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`, labelLine: false, children: ncStatuses.map((_, i) => (_jsx(Cell, { fill: CHART_COLORS[i % CHART_COLORS.length] }, i))) }), _jsx(Tooltip, { contentStyle: TOOLTIP_STYLE }), _jsx(Legend, {})] }) }))] })] }), _jsxs("div", { className: "bg-card rounded-xl border border-border p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-foreground", children: "Recent Activity" }), _jsxs(Link, { to: createPageUrl("Tasks"), className: "text-xs text-primary hover:underline flex items-center gap-1", children: ["View all ", _jsx(ArrowRight, { className: "w-3 h-3" })] })] }), _jsxs("div", { className: "space-y-2", children: [recentTasks.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: "No recent activity" })), recentTasks.map((task) => (_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0", children: _jsx(CheckSquare, { className: "w-4 h-4 text-primary" }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-foreground truncate", children: task.name }), _jsx("p", { className: "text-xs text-muted-foreground truncate", children: task.projectId })] })] }), _jsxs("div", { className: "flex items-center gap-3 shrink-0 ml-4", children: [_jsx(StatusBadge, { status: task.status }), _jsxs("span", { className: "text-xs text-muted-foreground hidden sm:flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), task.createdAt
                                                        ? format(new Date(task.createdAt), "MMM d")
                                                        : ""] })] })] }, task.id)))] })] }), _jsx("div", { className: "bg-muted/30 border border-border rounded-xl p-5", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-muted-foreground shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-foreground", children: "Planned modules" }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["The following modules are planned for upcoming sprints:", " ", _jsx("span", { className: "font-medium", children: "Pointage (Attendance tracking)" }), ", ", _jsx("span", { className: "font-medium", children: "Expenses" }), ",", " ", _jsx("span", { className: "font-medium", children: "Plans (Site plans)" }), ",", " ", _jsx("span", { className: "font-medium", children: "Communication" }), ",", " ", _jsx("span", { className: "font-medium", children: "Reporting" }), "."] })] })] }) })] }));
}
