import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import CurrencyInput from "../components/shared/CurrencyInput";
import { projectsService, contactsService, } from "@/services/wape.service";
// ── Component ─────────────────────────────────────────────────────────────────
export default function Projects() {
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [form, setForm] = useState({});
    const queryClient = useQueryClient();
    // ── Queries
    const { data: projectsData, isLoading } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const { data: clientsData } = useQuery({
        queryKey: ["clients"],
        queryFn: () => contactsService.listClients({ limit: 100 }),
    });
    const projects = projectsData?.items ?? [];
    const clients = clientsData?.items ?? [];
    // ── Mutations
    const saveMutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                name: data.name,
                clientId: data.clientId || undefined,
                description: data.description || undefined,
                budget: data.budget ?? 0,
                currency: data.currency ?? "MAD",
                startDate: data.startDate,
                endDate: data.endDate,
                // status omitted — backend always starts as 'planned'
            };
            return editing
                ? projectsService.update(editing.id, payload)
                : projectsService.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            setShowForm(false);
            setEditing(null);
            setForm({});
        },
    });
    // ── Helpers
    const openForm = (project) => {
        if (project) {
            setEditing(project);
            setForm({
                name: project.name,
                clientId: project.clientId,
                description: project.description,
                budget: project.budget,
                currency: project.currency,
                startDate: project.startDate,
                endDate: project.endDate,
                // status intentionally omitted
            });
        }
        else {
            setEditing(null);
            setForm({ budget: 0, currency: "MAD" });
        }
        setShowForm(true);
    };
    const handleSave = () => {
        if (!form.name || !form.startDate || !form.endDate)
            return;
        saveMutation.mutate(form);
    };
    // ── Filtering (client-side on loaded page)
    const filtered = projects.filter((p) => {
        const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || p.status === statusFilter;
        return matchSearch && matchStatus;
    });
    // ── Table columns
    const columns = [
        {
            header: "Project",
            cell: (row) => (_jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.name }), row.clientId && (_jsx("p", { className: "text-xs text-muted-foreground", children: clients.find((c) => c.id === row.clientId)?.legalName ?? "—" }))] })),
        },
        {
            header: "Duration",
            cell: (row) => (_jsxs("span", { className: "text-xs", children: [row.startDate ? format(new Date(row.startDate), "MMM d, yy") : "—", " → ", row.endDate ? format(new Date(row.endDate), "MMM d, yy") : "—"] })),
        },
        {
            header: "Budget",
            cell: (row) => row.budget ? `${row.budget.toLocaleString()} ${row.currency}` : "—",
        },
        {
            header: "Status",
            cell: (row) => _jsx(StatusBadge, { status: row.status }),
        },
        {
            header: "Progress",
            cell: (row) => (_jsxs("div", { className: "flex items-center gap-2 min-w-[120px]", children: [_jsx(Progress, { value: row.progress ?? 0, className: "h-2 flex-1" }), _jsxs("span", { className: "text-xs font-medium text-muted-foreground w-8", children: [row.progress ?? 0, "%"] })] })),
        },
        {
            header: "",
            cell: (row) => (_jsxs("div", { className: "flex gap-1", children: [_jsx(Link, { to: `/projects/${row.id}`, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: _jsx(Eye, { className: "w-4 h-4" }) }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: (e) => {
                            e.stopPropagation();
                            openForm(row);
                        }, children: "Edit" })] })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(PageHeader, { title: "Projects", subtitle: `${projects.length} total projects`, onAdd: () => openForm(), addLabel: "New Project", searchValue: search, onSearch: setSearch, children: _jsxs(Select, { value: statusFilter, onValueChange: (v) => setStatusFilter(v), children: [_jsx(SelectTrigger, { className: "w-36 bg-card", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "planned", children: "Planned" }), _jsx(SelectItem, { value: "on_progress", children: "In Progress" }), _jsx(SelectItem, { value: "completed", children: "Completed" })] })] }) }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: editing ? "Edit Project" : "New Project", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Project Name *" }), _jsx(Input, { value: form.name ?? "", onChange: (e) => setForm({ ...form, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Client" }), _jsxs(Select, { value: form.clientId ?? "none", onValueChange: (v) => setForm({ ...form, clientId: v === "none" ? undefined : v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select client" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "No client" }), clients.map((c) => (_jsx(SelectItem, { value: c.id, children: c.legalName }, c.id)))] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Start Date *" }), _jsx(Input, { type: "date", value: form.startDate ?? "", onChange: (e) => setForm({ ...form, startDate: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "End Date *" }), _jsx(Input, { type: "date", value: form.endDate ?? "", onChange: (e) => setForm({ ...form, endDate: e.target.value }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Budget" }), _jsx(CurrencyInput, { value: form.budget ?? 0, onChange: (v) => setForm({ ...form, budget: v }), currency: form.currency ?? "MAD", onCurrencyChange: (c) => setForm({ ...form, currency: c }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Description" }), _jsx(Textarea, { value: form.description ?? "", onChange: (e) => setForm({ ...form, description: e.target.value }) })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: saveMutation.isPending ||
                                        !form.name ||
                                        !form.startDate ||
                                        !form.endDate, children: saveMutation.isPending ? "Saving..." : "Save Project" })] })] }) })] }));
}
