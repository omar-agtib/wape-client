import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { attachmentsService, tasksService, projectsService, contactsService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const defaultCreateForm = {
    projectId: "",
    subcontractorId: "",
    title: "",
    currency: "MAD",
    taskIds: [],
};
const defaultConfirmForm = {
    personnelCost: 0,
    articlesCost: 0,
    toolsCost: 0,
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function AttachmentsPage() {
    const [search, setSearch] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showConfirmForm, setShowConfirmForm] = useState(false);
    const [selectedAttachment, setSelectedAttachment] = useState(null);
    const [createForm, setCreateForm] = useState(defaultCreateForm);
    const [confirmForm, setConfirmForm] = useState(defaultConfirmForm);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: attachmentsData, isLoading } = useQuery({
        queryKey: ["attachments"],
        queryFn: () => attachmentsService.list({ limit: 100 }),
    });
    const { data: tasksData } = useQuery({
        queryKey: ["tasks"],
        queryFn: () => tasksService.list({ limit: 100 }),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const { data: subcontractorsData } = useQuery({
        queryKey: ["subcontractors"],
        queryFn: () => contactsService.listSubcontractors({ limit: 100 }),
    });
    const attachments = (attachmentsData?.items ?? []);
    const tasks = (tasksData?.items ?? []);
    const projects = (projectsData?.items ?? []);
    const subcontractors = (subcontractorsData?.items ?? []);
    // Only completed tasks can be in an attachment (RG03)
    const completedTasks = tasks.filter((t) => t.status === "completed");
    // Filter tasks by selected project
    const projectTasks = completedTasks.filter((t) => !createForm.projectId || t.projectId === createForm.projectId);
    // ── Mutations
    const createMutation = useMutation({
        mutationFn: (data) => attachmentsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attachments"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            setShowCreateForm(false);
            setCreateForm(defaultCreateForm);
        },
    });
    const confirmMutation = useMutation({
        mutationFn: ({ id, body, }) => attachmentsService.confirm(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attachments"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            setShowConfirmForm(false);
            setSelectedAttachment(null);
            setConfirmForm(defaultConfirmForm);
        },
    });
    // ── Helpers
    const toggleTaskId = (id) => {
        setCreateForm((f) => ({
            ...f,
            taskIds: f.taskIds.includes(id)
                ? f.taskIds.filter((t) => t !== id)
                : [...f.taskIds, id],
        }));
    };
    const openConfirmDialog = (att) => {
        setSelectedAttachment(att);
        setConfirmForm({
            personnelCost: att.personnelCost ?? 0,
            articlesCost: att.articlesCost ?? 0,
            toolsCost: att.toolsCost ?? 0,
        });
        setShowConfirmForm(true);
    };
    const getProjectName = (id) => projects.find((p) => p.id === id)?.name ?? id ?? "—";
    const getSubcontractorName = (id) => subcontractors.find((s) => s.id === id)?.legalName ?? "—";
    const totalConfirmCost = confirmForm.personnelCost +
        confirmForm.articlesCost +
        confirmForm.toolsCost;
    // ── Filtering
    const filtered = attachments.filter((a) => !search ||
        a.title?.toLowerCase().includes(search.toLowerCase()) ||
        getProjectName(a.projectId).toLowerCase().includes(search.toLowerCase()));
    // ── Columns
    const columns = [
        {
            header: "Title",
            cell: (row) => (_jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: getProjectName(row.projectId) })] })),
        },
        {
            header: "Tasks",
            cell: (row) => (_jsxs("span", { className: "text-xs", children: [row.taskIds?.length ?? 0, " tasks"] })),
        },
        {
            header: "Subcontractor",
            cell: (row) => row.subcontractorId ? (_jsx("span", { className: "text-xs", children: getSubcontractorName(row.subcontractorId) })) : (_jsx("span", { className: "text-xs text-muted-foreground", children: "Internal" })),
        },
        {
            header: "Status",
            cell: (row) => _jsx(StatusBadge, { status: row.status ?? "draft" }),
        },
        {
            header: "Currency",
            cell: (row) => (_jsx("span", { className: "text-xs", children: row.currency ?? "MAD" })),
        },
        {
            header: "Date",
            cell: (row) => row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "—",
        },
        {
            header: "",
            cell: (row) => (_jsxs("div", { className: "flex gap-1", children: [_jsx(Link, { to: `/attachments/${row.id}`, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: _jsx(Eye, { className: "w-4 h-4" }) }) }), (row.status === "draft" || row.status === "pending") && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs text-primary", onClick: () => openConfirmDialog(row), children: "Confirm" }))] })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(PageHeader, { title: "Attachments & Validation", subtitle: `${attachments.length} entries`, onAdd: () => setShowCreateForm(true), addLabel: "New Attachment", searchValue: search, onSearch: setSearch }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), _jsx(FormDialog, { open: showCreateForm, onOpenChange: setShowCreateForm, title: "New Attachment", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Title *" }), _jsx(Input, { value: createForm.title, onChange: (e) => setCreateForm({ ...createForm, title: e.target.value }), placeholder: "Ex: Fondations Bloc A \u2014 Lot 1" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Project *" }), _jsxs(Select, { value: createForm.projectId, onValueChange: (v) => setCreateForm({ ...createForm, projectId: v, taskIds: [] }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select project" }) }), _jsx(SelectContent, { children: projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Currency" }), _jsxs(Select, { value: createForm.currency, onValueChange: (v) => setCreateForm({ ...createForm, currency: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "MAD", children: "MAD" }), _jsx(SelectItem, { value: "EUR", children: "EUR" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Subcontractor (optional \u2014 triggers auto-invoice on confirm)" }), _jsxs(Select, { value: createForm.subcontractorId || "none", onValueChange: (v) => setCreateForm({
                                                ...createForm,
                                                subcontractorId: v === "none" ? "" : v,
                                            }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Internal (no subcontractor)" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "Internal \u2014 no subcontractor" }), subcontractors.map((s) => (_jsx(SelectItem, { value: s.id, children: s.legalName }, s.id)))] })] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "mb-2 block", children: "Completed Tasks * (only completed tasks can be attached \u2014 RG03)" }), !createForm.projectId ? (_jsx("p", { className: "text-xs text-muted-foreground", children: "Select a project first" })) : projectTasks.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground", children: "No completed tasks for this project yet" })) : (_jsx("div", { className: "space-y-1 max-h-48 overflow-y-auto border border-border rounded-lg p-2", children: projectTasks.map((t) => (_jsxs("label", { className: "flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: createForm.taskIds.includes(t.id), onChange: () => toggleTaskId(t.id), className: "rounded" }), _jsx("span", { className: "text-sm", children: t.name })] }, t.id))) })), createForm.taskIds.length > 0 && (_jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [createForm.taskIds.length, " task(s) selected"] }))] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowCreateForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => createMutation.mutate({
                                        projectId: createForm.projectId,
                                        subcontractorId: createForm.subcontractorId || undefined,
                                        title: createForm.title,
                                        currency: createForm.currency || undefined,
                                        taskIds: createForm.taskIds,
                                    }), disabled: createMutation.isPending ||
                                        !createForm.title ||
                                        !createForm.projectId ||
                                        createForm.taskIds.length === 0, children: createMutation.isPending ? "Saving..." : "Create Attachment" })] })] }) }), _jsx(FormDialog, { open: showConfirmForm, onOpenChange: setShowConfirmForm, title: `Confirm Attachment — ${selectedAttachment?.title ?? ""}`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm", children: [_jsx(Info, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-primary", children: "Confirmation calculates costs" }), _jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: selectedAttachment?.subcontractorId
                                                ? "An invoice will be auto-generated for the subcontractor."
                                                : "Enter the actual costs for this internal attachment." })] })] }), !selectedAttachment?.subcontractorId && (_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-xs", children: "Personnel Cost" }), _jsx(Input, { type: "number", min: 0, value: confirmForm.personnelCost, onChange: (e) => setConfirmForm({
                                                ...confirmForm,
                                                personnelCost: parseFloat(e.target.value) || 0,
                                            }) })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs", children: "Articles Cost" }), _jsx(Input, { type: "number", min: 0, value: confirmForm.articlesCost, onChange: (e) => setConfirmForm({
                                                ...confirmForm,
                                                articlesCost: parseFloat(e.target.value) || 0,
                                            }) })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs", children: "Tools Cost" }), _jsx(Input, { type: "number", min: 0, value: confirmForm.toolsCost, onChange: (e) => setConfirmForm({
                                                ...confirmForm,
                                                toolsCost: parseFloat(e.target.value) || 0,
                                            }) })] }), _jsxs("div", { className: "col-span-3 p-2 rounded-lg bg-muted/30 text-center", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Total" }), _jsxs("p", { className: "text-lg font-bold text-primary", children: [totalConfirmCost.toLocaleString(), " ", selectedAttachment?.currency ?? "MAD"] })] })] })), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowConfirmForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => confirmMutation.mutate({
                                        id: selectedAttachment.id,
                                        body: selectedAttachment?.subcontractorId
                                            ? undefined
                                            : {
                                                personnelCost: confirmForm.personnelCost,
                                                articlesCost: confirmForm.articlesCost,
                                                toolsCost: confirmForm.toolsCost,
                                            },
                                    }), disabled: confirmMutation.isPending, children: confirmMutation.isPending
                                        ? "Confirming..."
                                        : "Confirm & Validate" })] })] }) })] }));
}
