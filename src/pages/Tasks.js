import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { Eye, BarChart2, List, Kanban } from "lucide-react";
import { tasksService, projectsService, personnelService, articlesService, toolsService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import TaskForm from "@/components/tasks/TaskForm";
import GanttChart from "@/components/tasks/GanttChart";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// ── Component ─────────────────────────────────────────────────────────────────
export default function Tasks() {
    const [searchParams] = useSearchParams();
    const projectFilter = searchParams.get("projectId") ?? "all";
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [view, setView] = useState("list");
    const queryClient = useQueryClient();
    // ── Queries
    const { data: tasksData, isLoading } = useQuery({
        queryKey: ["tasks"],
        queryFn: () => tasksService.list({ limit: 100 }),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const { data: personnelData } = useQuery({
        queryKey: ["personnel"],
        queryFn: () => personnelService.list({ limit: 100 }),
    });
    const { data: articlesData } = useQuery({
        queryKey: ["articles"],
        queryFn: () => articlesService.list({ limit: 100 }),
    });
    const { data: toolsData } = useQuery({
        queryKey: ["tools"],
        queryFn: () => toolsService.list({ limit: 100 }),
    });
    const tasks = tasksData?.items ?? [];
    const projects = projectsData?.items ?? [];
    const personnel = personnelData?.items ?? [];
    const articles = articlesData?.items ?? [];
    const tools = (toolsData?.items ?? []);
    // ── Status change mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => tasksService.changeStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
    });
    // ── Save (create / update) mutation
    const saveMutation = useMutation({
        mutationFn: (data) => editing
            ? tasksService.update(editing.id, data)
            : tasksService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setShowForm(false);
            setEditing(null);
        },
    });
    // ── Helpers
    const openForm = (task) => {
        setEditing(task ?? null);
        setShowForm(true);
    };
    // ── Client-side filtering
    const filtered = tasks.filter((t) => {
        const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || t.status === statusFilter;
        const matchProject = projectFilter === "all" || t.projectId === projectFilter;
        return matchSearch && matchStatus && matchProject;
    });
    // ── Table columns
    const columns = [
        {
            header: "Task",
            cell: (row) => {
                const project = projects.find((p) => p.id === row.projectId);
                return (_jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: project?.name ?? "No project" })] }));
            },
        },
        {
            header: "Duration",
            cell: (row) => (_jsxs("span", { className: "text-xs", children: [row.startDate ? format(new Date(row.startDate), "MMM d") : "—", " → ", row.endDate ? format(new Date(row.endDate), "MMM d") : "—"] })),
        },
        {
            header: "Status",
            cell: (row) => _jsx(StatusBadge, { status: row.status }),
        },
        {
            header: "Est. Cost",
            cell: (row) => row.estimatedCost ? (_jsxs("span", { className: "text-xs font-semibold text-warning", children: [row.estimatedCost.toLocaleString(), " ", row.currency] })) : (_jsx("span", { className: "text-xs text-muted-foreground", children: "\u2014" })),
        },
        {
            header: "Progress",
            cell: (row) => (_jsxs("span", { className: "text-xs text-muted-foreground", children: [row.progress ?? 0, "%"] })),
        },
        {
            header: "",
            cell: (row) => (_jsxs("div", { className: "flex gap-1", children: [_jsx(Link, { to: `/tasks/${row.id}`, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: _jsx(Eye, { className: "w-4 h-4" }) }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: (e) => {
                            e.stopPropagation();
                            openForm(row);
                        }, children: "Edit" })] })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(PageHeader, { title: "Tasks", subtitle: `${tasks.length} total tasks`, onAdd: () => openForm(), addLabel: "New Task", searchValue: search, onSearch: setSearch, children: [_jsxs(Select, { value: statusFilter, onValueChange: (v) => setStatusFilter(v), children: [_jsx(SelectTrigger, { className: "w-32 bg-card", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "planned", children: "Planned" }), _jsx(SelectItem, { value: "on_progress", children: "In Progress" }), _jsx(SelectItem, { value: "completed", children: "Completed" })] })] }), _jsxs("div", { className: "flex border border-border rounded-md overflow-hidden", children: [_jsx(Button, { variant: view === "list" ? "default" : "ghost", size: "sm", className: "h-9 rounded-none gap-1", onClick: () => setView("list"), children: _jsx(List, { className: "w-4 h-4" }) }), _jsxs(Button, { variant: view === "kanban" ? "default" : "ghost", size: "sm", className: "h-9 rounded-none gap-1", onClick: () => setView("kanban"), children: [_jsx(Kanban, { className: "w-4 h-4" }), " Kanban"] }), _jsxs(Button, { variant: view === "gantt" ? "default" : "ghost", size: "sm", className: "h-9 rounded-none gap-1", onClick: () => setView("gantt"), children: [_jsx(BarChart2, { className: "w-4 h-4" }), " Gantt"] })] })] }), view === "list" && (_jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading })), view === "kanban" && (_jsx(KanbanBoard, { tasks: filtered, onStatusChange: (id, status) => updateStatusMutation.mutate({ id, status: status }), onEdit: openForm })), view === "gantt" && (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Gantt Chart \u2014 Project Timeline" }) }), _jsx(CardContent, { children: _jsx(GanttChart, { tasks: filtered, personnel: personnel, tools: tools, articles: articles }) })] })), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: editing ? "Edit Task" : "New Task", children: _jsx(TaskForm, { task: editing, projects: projects, onSave: (data) => saveMutation.mutate(data), onCancel: () => setShowForm(false), saving: saveMutation.isPending }) })] }));
}
