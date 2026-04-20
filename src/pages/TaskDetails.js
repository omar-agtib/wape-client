import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Users, Package, Wrench, TrendingUp } from "lucide-react";
import { tasksService, projectsService } from "@/services/wape.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/shared/StatusBadge";
// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(amount, currency = "MAD") {
    return `${amount.toLocaleString()} ${currency}`;
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function TaskDetails() {
    const { id: taskId } = useParams();
    // ── Task
    const { data: task, isLoading } = useQuery({
        queryKey: ["task", taskId],
        queryFn: () => tasksService.get(taskId),
        enabled: !!taskId,
    });
    // ── Task sub-resources
    const { data: taskPersonnel = [] } = useQuery({
        queryKey: ["task-personnel", taskId],
        queryFn: () => tasksService.listPersonnel(taskId),
        enabled: !!taskId,
    });
    const { data: taskArticles = [] } = useQuery({
        queryKey: ["task-articles", taskId],
        queryFn: () => tasksService.listArticles(taskId),
        enabled: !!taskId,
    });
    const { data: taskTools = [] } = useQuery({
        queryKey: ["task-tools", taskId],
        queryFn: () => tasksService.listTools(taskId),
        enabled: !!taskId,
    });
    // ── Parent project (for name display)
    const { data: project } = useQuery({
        queryKey: ["project", task?.projectId],
        queryFn: () => projectsService.get(task.projectId),
        enabled: !!task?.projectId,
    });
    const personnel = taskPersonnel;
    const articles = taskArticles;
    const tools = taskTools;
    // ── Loading / not found
    if (isLoading) {
        return (_jsx("div", { className: "text-center py-12 text-muted-foreground", children: "Loading..." }));
    }
    if (!task) {
        return (_jsx("div", { className: "text-center py-12 text-muted-foreground", children: "Task not found." }));
    }
    // ── Cost estimates from sub-resources
    const personnelCost = personnel.reduce((sum, p) => {
        const rate = p.personnel?.costPerHour ?? 0;
        return sum + rate * (p.plannedHours ?? 0);
    }, 0);
    const articlesCost = articles.reduce((sum, a) => {
        const price = a.article?.unitPrice ?? 0;
        return sum + price * (a.plannedQuantity ?? 0);
    }, 0);
    const totalEstimated = task.estimatedCost ?? personnelCost + articlesCost;
    const totalActual = task.actualCost ?? 0;
    // ── Render
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/tasks", children: _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-xl font-bold text-foreground", children: task.name }), project && (_jsx("p", { className: "text-sm text-muted-foreground", children: project.name }))] }), _jsx(StatusBadge, { status: task.status })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Details" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Start:" }), _jsx("span", { className: "font-medium ml-2", children: task.startDate
                                                                    ? format(new Date(task.startDate), "MMM d, yyyy")
                                                                    : "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "End:" }), _jsx("span", { className: "font-medium ml-2", children: task.endDate
                                                                    ? format(new Date(task.endDate), "MMM d, yyyy")
                                                                    : "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Progress:" }), _jsxs("span", { className: "font-medium ml-2", children: [task.progress ?? 0, "%"] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Currency:" }), _jsx("span", { className: "font-medium ml-2", children: task.currency })] })] }), _jsx("div", { className: "mt-4", children: _jsx(Progress, { value: task.progress ?? 0, className: "h-2" }) }), task.description && (_jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: task.description }))] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), " Cost Summary"] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsxs("div", { className: "p-4 rounded-lg bg-primary/5", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Estimated" }), _jsx("p", { className: "text-xl font-bold text-primary", children: fmt(totalEstimated, task.currency) })] }), _jsxs("div", { className: "p-4 rounded-lg bg-warning/5", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Actual" }), _jsx("p", { className: "text-xl font-bold text-warning", children: fmt(totalActual, task.currency) })] }), _jsxs("div", { className: `p-4 rounded-lg ${totalActual <= totalEstimated
                                                            ? "bg-success/5"
                                                            : "bg-destructive/5"}`, children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Variance" }), _jsx("p", { className: `text-xl font-bold ${totalActual <= totalEstimated
                                                                    ? "text-success"
                                                                    : "text-destructive"}`, children: fmt(totalEstimated - totalActual, task.currency) })] })] }), (personnelCost > 0 || articlesCost > 0) && (_jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-3 rounded-lg bg-muted/30 text-center", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Personnel" }), _jsx("p", { className: "text-sm font-semibold", children: fmt(personnelCost, task.currency) })] }), _jsxs("div", { className: "p-3 rounded-lg bg-muted/30 text-center", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Materials" }), _jsx("p", { className: "text-sm font-semibold", children: fmt(articlesCost, task.currency) })] })] }))] })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4" }), " Personnel (", personnel.length, ")"] }) }), _jsx(CardContent, { children: personnel.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "None assigned" })) : (_jsx("div", { className: "space-y-2", children: personnel.map((p) => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded-lg bg-muted/30", children: [_jsx("div", { className: "w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary", children: p.personnel?.fullName?.[0] ?? "?" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: p.personnel?.fullName ?? p.personnelId }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [p.plannedHours, "h", p.personnel?.role ? ` · ${p.personnel.role}` : ""] })] })] }, p.id))) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(Package, { className: "w-4 h-4" }), " Materials (", articles.length, ")"] }) }), _jsx(CardContent, { children: articles.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "None assigned" })) : (_jsx("div", { className: "space-y-2", children: articles.map((a) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg bg-muted/30", children: [_jsx("span", { className: "text-sm", children: a.article?.name ?? a.articleId }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["qty: ", a.plannedQuantity, " ", a.article?.unit ? `${a.article.unit}` : ""] })] }, a.id))) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(Wrench, { className: "w-4 h-4" }), " Tools (", tools.length, ")"] }) }), _jsx(CardContent, { children: tools.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "None assigned" })) : (_jsx("div", { className: "space-y-2", children: tools.map((t) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg bg-muted/30", children: [_jsx("p", { className: "text-sm", children: t.tool?.name ?? t.toolId }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [t.plannedDays, "d"] })] }, t.id))) })) })] })] })] })] }));
}
