import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from "recharts";
import { FolderKanban, CheckSquare, Users, Package, AlertTriangle, TrendingUp, } from "lucide-react";
import { reportingService, projectsService, tasksService, personnelService, toolsService, ncService, } from "@/services/wape.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { Progress } from "@/components/ui/progress";
// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ title, value, icon: Icon, color, }) {
    const colorMap = {
        primary: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        info: "bg-blue-500/10 text-blue-600",
    };
    return (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx("div", { className: `p-2 rounded-lg shrink-0 ${colorMap[color] ?? colorMap.primary}`, children: _jsx(Icon, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: title }), _jsx("p", { className: "text-xl font-bold", children: value })] })] }) }));
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function ReportingPage() {
    // ── Queries — use reportingService dedicated endpoints
    const { data: overviewData } = useQuery({
        queryKey: ["reporting-overview"],
        queryFn: () => reportingService.overview(),
    });
    const { data: reportingFinanceData } = useQuery({
        queryKey: ["reporting-finance"],
        queryFn: () => reportingService.finance(6),
    });
    // ── Fallback queries for project health table
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const { data: tasksData } = useQuery({
        queryKey: ["tasks"],
        queryFn: () => tasksService.list({ limit: 100 }),
    });
    const { data: personnelData } = useQuery({
        queryKey: ["personnel"],
        queryFn: () => personnelService.list({ limit: 100 }),
    });
    const { data: toolsData } = useQuery({
        queryKey: ["tools"],
        queryFn: () => toolsService.list({ limit: 100 }),
    });
    const { data: ncsData } = useQuery({
        queryKey: ["ncs"],
        queryFn: () => ncService.list({ limit: 100 }),
    });
    const projects = (projectsData?.items ?? []);
    const tasks = (tasksData?.items ?? []);
    const tools = (toolsData?.items ?? []);
    const ncs = (ncsData?.items ?? []);
    const overview = overviewData;
    // ── Task status chart — use real backend statuses
    const tasksByStatus = ["planned", "on_progress", "completed"].map((s) => ({
        name: s === "on_progress"
            ? "In Progress"
            : s.charAt(0).toUpperCase() + s.slice(1),
        count: tasks.filter((t) => t.status === s).length,
    }));
    // ── NC by severity chart
    const ncsBySeverity = ["low", "medium", "high", "critical"]
        .map((s) => ({
        name: s.charAt(0).toUpperCase() + s.slice(1),
        open: ncs.filter((nc) => nc.severity === s && nc.status !== "closed")
            .length,
        closed: ncs.filter((nc) => nc.severity === s && nc.status === "closed")
            .length,
    }))
        .filter((s) => s.open > 0 || s.closed > 0);
    // ── Finance chart from reporting endpoint
    const financeData = reportingFinanceData?.monthly ?? [];
    // ── KPI values — prefer reporting overview, fallback to local counts
    const kpis = {
        projects: overview?.totalProjects ?? projects.length,
        tasks: overview?.totalTasks ?? tasks.length,
        personnel: overview?.totalPersonnel ?? personnelData?.items?.length ?? 0,
        tools: tools.filter((t) => t.status === "available").length,
        openNcs: ncs.filter((nc) => nc.status === "open").length,
        budgetConsumed: overview?.budgetConsumedPercent != null
            ? `${Math.round(overview.budgetConsumedPercent)}%`
            : "N/A",
    };
    // ── Render
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4", children: [_jsx(KPICard, { title: "Projects", value: kpis.projects, icon: FolderKanban, color: "primary" }), _jsx(KPICard, { title: "Tasks", value: kpis.tasks, icon: CheckSquare, color: "info" }), _jsx(KPICard, { title: "Personnel", value: kpis.personnel, icon: Users, color: "success" }), _jsx(KPICard, { title: "Available Tools", value: kpis.tools, icon: Package, color: "warning" }), _jsx(KPICard, { title: "Open NCs", value: kpis.openNcs, icon: AlertTriangle, color: "destructive" }), _jsx(KPICard, { title: "Budget Used", value: kpis.budgetConsumed, icon: TrendingUp, color: "info" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Task Distribution by Status" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: tasksByStatus, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "name", tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))", allowDecimals: false }), _jsx(Tooltip, { contentStyle: {
                                                    borderRadius: 8,
                                                    border: "1px solid hsl(var(--border))",
                                                    background: "hsl(var(--card))",
                                                } }), _jsx(Bar, { dataKey: "count", fill: "hsl(221,83%,53%)", radius: [4, 4, 0, 0], name: "Tasks" })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Non Conformities by Severity" }) }), _jsx(CardContent, { children: ncsBySeverity.length === 0 ? (_jsx("p", { className: "text-center text-muted-foreground text-sm py-16", children: "No non-conformities recorded" })) : (_jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: ncsBySeverity, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "name", tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))", allowDecimals: false }), _jsx(Tooltip, { contentStyle: {
                                                    borderRadius: 8,
                                                    border: "1px solid hsl(var(--border))",
                                                    background: "hsl(var(--card))",
                                                } }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "open", fill: "hsl(0,84%,60%)", radius: [4, 4, 0, 0], name: "Open" }), _jsx(Bar, { dataKey: "closed", fill: "hsl(142,71%,45%)", radius: [4, 4, 0, 0], name: "Closed" })] }) })) })] })] }), financeData.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Financial Overview \u2014 Last 6 Months" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: financeData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "hsl(var(--border))" }), _jsx(XAxis, { dataKey: "month", tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" }), _jsx(YAxis, { tick: { fontSize: 11 }, stroke: "hsl(var(--muted-foreground))" }), _jsx(Tooltip, { contentStyle: {
                                            borderRadius: 8,
                                            border: "1px solid hsl(var(--border))",
                                            background: "hsl(var(--card))",
                                        } }), _jsx(Legend, {}), _jsx(Bar, { dataKey: "spent", fill: "hsl(0,84%,60%)", radius: [4, 4, 0, 0], name: "Spent" }), _jsx(Bar, { dataKey: "budget", fill: "hsl(221,83%,53%)", radius: [4, 4, 0, 0], name: "Budget" })] }) }) })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Project Health Overview" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3", children: [projects.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No projects" })), projects.map((p) => {
                                    const ptasks = tasks.filter((t) => t.projectId === p.id);
                                    const pncs = ncs.filter((nc) => nc.projectId === p.id && nc.status === "open").length;
                                    return (_jsxs("div", { className: "p-4 rounded-lg border border-border bg-card/50", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "font-medium text-sm", children: p.name }), _jsx(StatusBadge, { status: p.status })] }), _jsxs("div", { className: "flex items-center gap-4 text-xs text-muted-foreground", children: [_jsxs("span", { children: [ptasks.length, " tasks"] }), _jsxs("span", { className: pncs > 0 ? "text-destructive font-medium" : "", children: [pncs, " open NCs"] }), _jsxs("span", { children: [p.budget?.toLocaleString(), " ", p.currency ?? "MAD"] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs text-muted-foreground w-20", children: "Progress" }), _jsx(Progress, { value: p.progress ?? 0, className: "h-1.5 flex-1" }), _jsxs("span", { className: "text-xs font-medium w-10 text-right", children: [p.progress ?? 0, "%"] })] })] }, p.id));
                                })] }) })] })] }));
}
