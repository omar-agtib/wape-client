import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Calendar, DollarSign, CheckSquare, FileText, TrendingUp, AlertTriangle, } from "lucide-react";
import { projectsService, contactsService, documentsService, tasksService, } from "@/services/wape.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/shared/StatusBadge";
// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(amount, currency = "MAD") {
    return `${amount.toLocaleString()} ${currency}`;
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function ProjectDetails() {
    const { id: projectId } = useParams();
    // ── Project
    const { data: project, isLoading: loadingProject } = useQuery({
        queryKey: ["project", projectId],
        queryFn: () => projectsService.get(projectId),
        enabled: !!projectId,
    });
    // ── Finance snapshot (budget breakdown)
    const { data: finance } = useQuery({
        queryKey: ["project-finance", projectId],
        queryFn: () => projectsService.getFinance(projectId),
        enabled: !!projectId,
    });
    // ── Tasks for this project
    const { data: tasksData } = useQuery({
        queryKey: ["tasks"],
        queryFn: () => tasksService.list({ limit: 100, projectId }),
        enabled: !!projectId,
    });
    // ── Attachments (subcontractor work orders)
    // const { data: attachmentsData } = useQuery({
    //   queryKey: ["attachments"],
    //   queryFn: () => attachmentsService.list({ limit: 100 }),
    //   enabled: !!projectId,
    // });
    // // ── Purchase orders linked to project
    // const { data: purchaseOrdersData } = useQuery({
    //   queryKey: ["project-purchase-orders", projectId],
    //   queryFn: () => projectsService.getPurchaseOrders(projectId!),
    //   enabled: !!projectId,
    // });
    // ── Documents
    const { data: docsData } = useQuery({
        queryKey: ["documents", projectId],
        queryFn: () => documentsService.list({
            sourceType: "project",
            sourceId: projectId,
            limit: 20,
        }),
        enabled: !!projectId,
    });
    // ── Client name
    const { data: clientData } = useQuery({
        queryKey: ["contact", project?.clientId],
        queryFn: () => contactsService.get(project.clientId),
        enabled: !!project?.clientId,
    });
    const tasks = (tasksData?.items ?? []).filter((t) => t.projectId === projectId);
    const docs = docsData?.items ?? [];
    const financeSnap = finance ?? project?.financeSnapshot;
    if (loadingProject) {
        return (_jsx("div", { className: "text-center py-12 text-muted-foreground", children: "Loading..." }));
    }
    if (!project) {
        return (_jsx("div", { className: "text-center py-12 text-muted-foreground", children: "Project not found." }));
    }
    // ── Budget numbers from finance snapshot or project root
    const totalBudget = financeSnap?.totalBudget ?? project.budget ?? 0;
    const totalSpent = financeSnap?.totalSpent ?? 0;
    const remaining = financeSnap?.remainingBudget ?? totalBudget - totalSpent;
    const alertLevel = financeSnap?.alertLevel ?? "normal";
    const alertColors = {
        normal: "bg-success/5 text-success",
        warning: "bg-warning/5 text-warning",
        critical: "bg-destructive/5 text-destructive",
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/projects", children: _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-foreground", children: project.name }), clientData && (_jsx("p", { className: "text-sm text-muted-foreground", children: clientData.legalName }))] }), _jsx(StatusBadge, { status: project.status, className: "ml-auto" })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-primary/10", children: _jsx(Calendar, { className: "w-4 h-4 text-primary" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Start Date" }), _jsx("p", { className: "text-sm font-medium", children: project.startDate
                                                ? format(new Date(project.startDate), "MMM d, yyyy")
                                                : "—" })] })] }) }), _jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-success/10", children: _jsx(Calendar, { className: "w-4 h-4 text-success" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "End Date" }), _jsx("p", { className: "text-sm font-medium", children: project.endDate
                                                ? format(new Date(project.endDate), "MMM d, yyyy")
                                                : "—" })] })] }) }), _jsx(Card, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-warning/10", children: _jsx(DollarSign, { className: "w-4 h-4 text-warning" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Budget" }), _jsx("p", { className: "text-sm font-medium", children: fmt(project.budget, project.currency) })] })] }) }), _jsx(Card, { className: "p-4", children: _jsx("div", { className: "flex items-center gap-3 w-full", children: _jsxs("div", { className: "w-full", children: [_jsx("p", { className: "text-xs text-muted-foreground mb-1", children: "Progress" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: project.progress ?? 0, className: "h-2 flex-1 min-w-[100px]" }), _jsxs("span", { className: "text-sm font-bold", children: [project.progress ?? 0, "%"] })] })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), "Financial Overview", alertLevel !== "normal" && (_jsx(AlertTriangle, { className: `w-4 h-4 ${alertLevel === "critical"
                                        ? "text-destructive"
                                        : "text-warning"}` }))] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsxs("div", { className: "p-4 rounded-lg bg-primary/5", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Total Budget" }), _jsx("p", { className: "text-xl font-bold text-primary", children: fmt(totalBudget, project.currency) })] }), _jsxs("div", { className: "p-4 rounded-lg bg-warning/5", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Total Spent" }), _jsx("p", { className: "text-xl font-bold text-warning", children: fmt(totalSpent, project.currency) }), financeSnap?.percentConsumed !== undefined && (_jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [financeSnap.percentConsumed.toFixed(1), "% consumed"] }))] }), _jsxs("div", { className: `p-4 rounded-lg ${alertColors[alertLevel] ?? alertColors.normal}`, children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Remaining" }), _jsx("p", { className: "text-xl font-bold", children: fmt(remaining, project.currency) })] })] }), financeSnap?.breakdown && (_jsx("div", { className: "mt-4 grid grid-cols-3 gap-3", children: [
                                    ["Personnel", financeSnap.breakdown.personnel],
                                    ["Materials", financeSnap.breakdown.articles],
                                    ["Tools", financeSnap.breakdown.tools],
                                ].map(([label, val]) => (_jsxs("div", { className: "p-3 rounded-lg bg-muted/30 text-center", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: label }), _jsx("p", { className: "text-sm font-semibold", children: fmt(val, project.currency) })] }, label))) }))] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs(CardTitle, { className: "text-sm font-semibold", children: ["Tasks (", tasks.length, ")"] }), _jsx(Link, { to: `/tasks?projectId=${projectId}`, children: _jsx(Button, { variant: "outline", size: "sm", className: "text-xs", children: "View All" }) })] }), _jsx(CardContent, { children: tasks.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No tasks yet" })) : (_jsx("div", { className: "space-y-2", children: tasks.slice(0, 5).map((t) => (_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/30", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CheckSquare, { className: "w-4 h-4 text-muted-foreground" }), _jsxs("div", { children: [_jsx("span", { className: "text-sm font-medium", children: t.name }), t.estimatedCost ? (_jsxs("p", { className: "text-xs text-muted-foreground", children: ["Est. ", fmt(t.estimatedCost, t.currency)] })) : null] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-1 min-w-[80px]", children: [_jsx(Progress, { value: t.progress ?? 0, className: "h-1.5 w-14" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [t.progress ?? 0, "%"] })] }), _jsx(StatusBadge, { status: t.status })] })] }, t.id))) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold", children: ["Documents (", docs.length, ")"] }) }), _jsx(CardContent, { children: docs.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No documents" })) : (_jsx("div", { className: "space-y-2", children: docs.map((d) => (_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/30", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FileText, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-sm", children: d.documentName ?? "Document" })] }), d.fileUrl ? (_jsx("a", { href: d.fileUrl, target: "_blank", rel: "noreferrer", children: _jsx(Button, { variant: "ghost", size: "sm", className: "text-xs h-7", children: "Open" }) })) : null] }, d.id))) })) })] })] }));
}
