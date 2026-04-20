import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Upload, X, List, Kanban } from "lucide-react";
import { ncService, projectsService, plansService, uploadService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import NCKanbanBoard from "@/components/nc/Nckanbanboard";
import PlanAnnotator from "@/components/nc/Planannotator";
import PlanViewer from "@/components/nc/Planviewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const defaultForm = {
    title: "",
    projectId: "",
    description: "",
    severity: "medium",
    location: "",
    deadline: "",
    planId: "",
};
const SEVERITY_COLORS = {
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    critical: "bg-red-100 text-red-700 border-red-200",
};
// ── Image Preview ─────────────────────────────────────────────────────────────
function ImagePreviewModal({ url, onClose, }) {
    if (!url)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80", onClick: onClose, children: _jsxs("div", { className: "relative max-w-4xl max-h-[90vh] p-2", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: "absolute top-0 right-0 bg-white/20 hover:bg-white/40 rounded-full p-1 m-1", onClick: onClose, children: _jsx(X, { className: "w-5 h-5 text-white" }) }), _jsx("img", { src: url, className: "max-w-full max-h-[85vh] object-contain rounded-lg", alt: "Preview" })] }) }));
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function NonConformitiesPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [uploading, setUploading] = useState(false);
    const [view, setView] = useState("list");
    const [previewImage, setPreviewImage] = useState(null);
    const [planViewerData, setPlanViewerData] = useState(null);
    const [pendingImages, setPendingImages] = useState([]);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: ncsData, isLoading } = useQuery({
        queryKey: ["ncs"],
        queryFn: () => ncService.list({ limit: 100 }),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const { data: plansData } = useQuery({
        queryKey: ["plans-by-project", form.projectId],
        queryFn: () => plansService.listByProjet(form.projectId),
        enabled: !!form.projectId,
    });
    const ncs = ncsData?.items ?? [];
    const projects = (projectsData?.items ?? []);
    const projectPlans = (plansData?.items ??
        []);
    const selectedPlan = projectPlans.find((p) => p.id === form.planId);
    const selectedPlanUrl = selectedPlan?.fileUrl ?? "";
    // ── Mutations
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => ncService.changeStatus(id, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ncs"] }),
    });
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            let nc;
            if (editing) {
                const payload = {
                    title: data.title || undefined,
                    description: data.description || undefined,
                    markerX: data.markerX,
                    markerY: data.markerY,
                    severity: data.severity,
                    location: data.location || undefined,
                    deadline: data.deadline || undefined,
                };
                nc = await ncService.update(editing.id, payload);
            }
            else {
                const payload = {
                    projectId: data.projectId,
                    title: data.title,
                    description: data.description,
                    markerX: data.markerX,
                    markerY: data.markerY,
                    severity: data.severity,
                    location: data.location || undefined,
                    deadline: data.deadline || undefined,
                };
                nc = await ncService.create(payload);
            }
            // Upload plan with marker
            if (selectedPlanUrl) {
                await ncService.uploadPlan(nc.id, {
                    planUrl: selectedPlanUrl,
                    markerX: data.markerX,
                    markerY: data.markerY,
                });
            }
            // Attach images
            for (const imageUrl of pendingImages) {
                await ncService.addImage(nc.id, imageUrl);
            }
            return nc;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ncs"] });
            setShowForm(false);
            setEditing(null);
            setPendingImages([]);
        },
    });
    // ── Helpers
    const openForm = (nc) => {
        setEditing(nc ?? null);
        setPendingImages([]);
        setForm(nc
            ? {
                title: nc.title ?? "",
                projectId: nc.projectId ?? "",
                description: nc.description ?? "",
                markerX: nc.markerX,
                markerY: nc.markerY,
                severity: nc.severity ?? "medium",
                location: nc.location ?? "",
                deadline: nc.deadline ?? "",
                planId: nc.planId ?? "",
            }
            : defaultForm);
        setShowForm(true);
    };
    const handleUploadPhotos = async (e) => {
        const files = Array.from(e.target.files ?? []);
        setUploading(true);
        try {
            for (const file of files) {
                const result = await uploadService.image(file, "nc-images");
                setPendingImages((prev) => [...prev, result.secureUrl ?? ""]);
            }
        }
        finally {
            setUploading(false);
        }
    };
    // ── Filtering
    const filtered = ncs.filter((nc) => {
        const matchSearch = !search || nc.title?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || nc.status === statusFilter;
        const matchSev = severityFilter === "all" || nc.severity === severityFilter;
        return matchSearch && matchStatus && matchSev;
    });
    // ── Columns
    const columns = [
        {
            header: "Title",
            cell: (row) => (_jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: row.location ?? "" })] })),
        },
        {
            header: "Project",
            cell: (row) => {
                const proj = projects.find((p) => p.id === row.projectId);
                return (_jsx("span", { className: "text-xs text-muted-foreground", children: proj?.name ?? "—" }));
            },
        },
        {
            header: "Severity",
            cell: (row) => {
                const sev = row.severity;
                return sev ? (_jsx(Badge, { variant: "outline", className: `text-xs capitalize ${SEVERITY_COLORS[sev] ?? ""}`, children: sev })) : (_jsx("span", { className: "text-xs text-muted-foreground", children: "\u2014" }));
            },
        },
        {
            header: "Status",
            cell: (row) => (_jsx(StatusBadge, { status: row.status ?? "open" })),
        },
        {
            header: "Deadline",
            cell: (row) => row.deadline ? format(new Date(row.deadline), "MMM d, yyyy") : "—",
        },
        {
            header: "",
            cell: (row) => (_jsxs("div", { className: "flex gap-1", children: [row.planUrl && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs text-primary", onClick: () => setPlanViewerData({ nc: row, planUrl: row.planUrl }), children: "View Plan" })), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: () => openForm(row), children: "Edit" })] })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(ImagePreviewModal, { url: previewImage, onClose: () => setPreviewImage(null) }), planViewerData && (_jsx(PlanViewer, { planUrl: planViewerData.planUrl, markerX: planViewerData.nc.markerX, markerY: planViewerData.nc.markerY, onClose: () => setPlanViewerData(null) })), _jsxs(PageHeader, { title: "Non Conformities", subtitle: `${ncs.filter((nc) => nc.status === "open").length} open`, onAdd: () => openForm(), addLabel: "New NC", searchValue: search, onSearch: setSearch, children: [_jsxs(Select, { value: statusFilter, onValueChange: (v) => setStatusFilter(v), children: [_jsx(SelectTrigger, { className: "w-36 bg-card", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "open", children: "Open" }), _jsx(SelectItem, { value: "in_review", children: "In Review" }), _jsx(SelectItem, { value: "closed", children: "Closed" })] })] }), _jsxs(Select, { value: severityFilter, onValueChange: (v) => setSeverityFilter(v), children: [_jsx(SelectTrigger, { className: "w-32 bg-card", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Severity" }), _jsx(SelectItem, { value: "low", children: "Low" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "critical", children: "Critical" })] })] }), _jsxs("div", { className: "flex border border-border rounded-md overflow-hidden", children: [_jsx(Button, { variant: view === "list" ? "default" : "ghost", size: "sm", className: "h-9 rounded-none", onClick: () => setView("list"), children: _jsx(List, { className: "w-4 h-4" }) }), _jsxs(Button, { variant: view === "kanban" ? "default" : "ghost", size: "sm", className: "h-9 rounded-none gap-1", onClick: () => setView("kanban"), children: [_jsx(Kanban, { className: "w-4 h-4" }), " Kanban"] })] })] }), view === "list" && (_jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading })), view === "kanban" && (_jsx(NCKanbanBoard, { ncs: filtered, onStatusChange: (id, status) => updateStatusMutation.mutate({ id, status }), onEdit: openForm })), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: editing ? "Edit Non Conformity" : "New Non Conformity", children: _jsxs("div", { className: "space-y-4 max-h-[75vh] overflow-y-auto pr-1", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Title *" }), _jsx(Input, { value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }) })] }), _jsxs("div", { children: [_jsxs(Label, { children: ["Project ", !editing && "*"] }), _jsxs(Select, { value: form.projectId, onValueChange: (v) => setForm({ ...form, projectId: v, planId: "" }), disabled: !!editing, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select project" }) }), _jsx(SelectContent, { children: projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Location" }), _jsx(Input, { value: form.location, onChange: (e) => setForm({ ...form, location: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Severity" }), _jsxs(Select, { value: form.severity, onValueChange: (v) => setForm({ ...form, severity: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "low", children: "Low" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "critical", children: "Critical" })] })] })] }), editing && (_jsxs("div", { children: [_jsx(Label, { children: "Status" }), _jsxs(Select, { value: editing.status ?? "open", onValueChange: (v) => updateStatusMutation.mutate({
                                                id: editing.id,
                                                status: v,
                                            }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "open", children: "Open" }), _jsx(SelectItem, { value: "in_review", children: "In Review" }), _jsx(SelectItem, { value: "closed", children: "Closed" })] })] })] })), _jsxs("div", { children: [_jsx(Label, { children: "Deadline" }), _jsx(Input, { type: "date", value: form.deadline, onChange: (e) => setForm({ ...form, deadline: e.target.value }) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Description *" }), _jsx(Textarea, { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { className: "mb-1 block", children: "Related Plan" }), form.projectId ? (_jsxs(Select, { value: form.planId, onValueChange: (v) => setForm({
                                        ...form,
                                        planId: v === "none" ? "" : v,
                                        markerX: undefined,
                                        markerY: undefined,
                                    }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select plan" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "No plan" }), projectPlans.map((pl) => (_jsx(SelectItem, { value: pl.id, children: pl.nom ?? pl.name }, pl.id)))] })] })) : (_jsx("p", { className: "text-xs text-muted-foreground", children: "Select a project first" })), form.planId && selectedPlanUrl && (_jsxs("div", { className: "mt-3", children: [_jsx(Label, { className: "text-xs text-muted-foreground mb-1 block", children: "Annotate Plan \u2014 mark the NC location" }), _jsx(PlanAnnotator, { planUrl: selectedPlanUrl, marker: form.markerX != null
                                                ? { x: form.markerX, y: form.markerY }
                                                : null, onChange: (marker) => setForm({ ...form, markerX: marker.x, markerY: marker.y }) })] }))] }), _jsxs("div", { children: [_jsx(Label, { className: "mb-1 block", children: "Photos" }), _jsxs("label", { className: "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground w-fit", children: [_jsx(Upload, { className: "w-4 h-4" }), uploading ? "Uploading..." : "Upload photos", _jsx("input", { type: "file", multiple: true, accept: "image/*", className: "hidden", onChange: handleUploadPhotos, disabled: uploading })] }), pendingImages.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: pendingImages.map((url, i) => (_jsxs("div", { className: "relative", children: [_jsx("img", { src: url, className: "w-16 h-16 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80", onClick: () => setPreviewImage(url), alt: `Photo ${i + 1}` }), _jsx("button", { className: "absolute -top-1 -right-1 bg-destructive rounded-full p-0.5", onClick: () => setPendingImages((prev) => prev.filter((_, idx) => idx !== i)), children: _jsx(X, { className: "w-2.5 h-2.5 text-white" }) })] }, i))) }))] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => saveMutation.mutate(form), disabled: saveMutation.isPending ||
                                        !form.title ||
                                        !form.description ||
                                        (!editing && !form.projectId), children: saveMutation.isPending ? "Saving..." : "Save & Notify" })] })] }) })] }));
}
