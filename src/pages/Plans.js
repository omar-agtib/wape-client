import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink, Upload, Eye } from "lucide-react";
import { plansService, projectsService, uploadService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const defaultForm = {
    nom: "",
    projetId: "",
    categorie: "architectural",
    reference: "",
    description: "",
    fileUrl: "",
    fileType: "pdf",
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function PlansPage() {
    const [search, setSearch] = useState("");
    const [projectFilter, setProjectFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [uploading, setUploading] = useState(false);
    const [previewPlan, setPreviewPlan] = useState(null);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: plansData, isLoading } = useQuery({
        queryKey: ["plans"],
        queryFn: () => plansService.list({ limit: 100 }),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const plans = (plansData?.items ??
        []);
    const projects = (projectsData?.items ?? []);
    // ── Mutations
    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (editing) {
                return plansService.update(editing.id, {
                    nom: data.nom,
                    categorie: data.categorie,
                    reference: data.reference || undefined,
                    description: data.description || undefined,
                });
            }
            else {
                return plansService.create({
                    projetId: data.projetId,
                    nom: data.nom,
                    categorie: data.categorie,
                    fileUrl: data.fileUrl,
                    fileType: data.fileType,
                    reference: data.reference || undefined,
                    description: data.description || undefined,
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["plans"] });
            setShowForm(false);
            setEditing(null);
        },
    });
    const newVersionMutation = useMutation({
        mutationFn: ({ id, fileUrl, fileType, }) => plansService.nouvelleVersion(id, { fileUrl, fileType }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
    });
    // ── Helpers
    const openForm = (plan) => {
        setEditing(plan ?? null);
        setForm(plan
            ? {
                nom: plan.nom ?? plan.name ?? "",
                projetId: plan.projetId ?? plan.projectId ?? "",
                categorie: plan.categorie ?? "architectural",
                reference: plan.reference ?? "",
                description: plan.description ?? "",
                fileUrl: plan.fileUrl ?? "",
                fileType: plan.fileType ?? "pdf",
            }
            : defaultForm);
        setShowForm(true);
    };
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        try {
            const result = await uploadService.image(file, "nc-plans");
            const fileUrl = result.secureUrl ?? "";
            const fileType = file.name.split(".").pop()?.toLowerCase() ?? "png";
            setForm((f) => ({ ...f, fileUrl, fileType }));
            // If editing, create new version automatically
            if (editing) {
                await newVersionMutation.mutateAsync({
                    id: editing.id,
                    fileUrl,
                    fileType,
                });
            }
        }
        finally {
            setUploading(false);
        }
    };
    // ── Filtering
    const filtered = plans.filter((p) => {
        const matchSearch = !search ||
            (p.nom ?? p.name ?? "").toLowerCase().includes(search.toLowerCase());
        const matchProj = projectFilter === "all" ||
            p.projetId === projectFilter ||
            p.projectId === projectFilter;
        return matchSearch && matchProj;
    });
    const getProjectName = (plan) => {
        const proj = projects.find((p) => p.id === plan.projetId || p.id === plan.projectId);
        return proj?.name ?? "—";
    };
    // ── Columns
    const columns = [
        {
            header: "Name",
            cell: (row) => (_jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.nom ?? row.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: row.reference ? `Ref: ${row.reference}` : (row.categorie ?? "") })] })),
        },
        {
            header: "Project",
            cell: (row) => (_jsx("span", { className: "text-xs text-muted-foreground", children: getProjectName(row) })),
        },
        {
            header: "Category",
            cell: (row) => (_jsx(Badge, { variant: "outline", className: "text-xs capitalize", children: row.categorie?.replace(/_/g, " ") ?? "—" })),
        },
        {
            header: "Date",
            cell: (row) => row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "—",
        },
        {
            header: "File",
            cell: (row) => row.fileUrl ? (_jsx("a", { href: row.fileUrl, target: "_blank", rel: "noopener noreferrer", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs gap-1 text-primary", children: [_jsx(ExternalLink, { className: "w-3 h-3" }), " Open"] }) })) : ("—"),
        },
        {
            header: "",
            cell: (row) => (_jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setPreviewPlan(row), children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: () => openForm(row), children: "Edit" })] })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(PageHeader, { title: "Plans", subtitle: `${plans.length} plans`, onAdd: () => openForm(), addLabel: "Upload Plan", searchValue: search, onSearch: setSearch, children: _jsxs(Select, { value: projectFilter, onValueChange: setProjectFilter, children: [_jsx(SelectTrigger, { className: "w-40 bg-card", children: _jsx(SelectValue, { placeholder: "All Projects" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Projects" }), projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id)))] })] }) }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), previewPlan && (_jsx(FormDialog, { open: !!previewPlan, onOpenChange: () => setPreviewPlan(null), title: previewPlan.nom ?? previewPlan.name ?? "Plan", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Project:" }), " ", _jsx("span", { className: "font-medium", children: getProjectName(previewPlan) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Category:" }), " ", _jsx("span", { className: "font-medium capitalize", children: previewPlan.categorie?.replace(/_/g, " ") ?? "—" })] }), previewPlan.reference && (_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Reference:" }), " ", _jsx("span", { className: "font-medium", children: previewPlan.reference })] })), previewPlan.createdAt && (_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Date:" }), " ", _jsx("span", { className: "font-medium", children: format(new Date(previewPlan.createdAt), "MMM d, yyyy") })] }))] }), previewPlan.description && (_jsx("p", { className: "text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg", children: previewPlan.description })), previewPlan.fileUrl && (_jsx("div", { className: "rounded-lg border border-border overflow-hidden", children: previewPlan.fileType === "image" ||
                                /\.(jpg|jpeg|png|webp)$/i.test(previewPlan.fileUrl) ? (_jsx("img", { src: previewPlan.fileUrl, className: "w-full max-h-96 object-contain", alt: previewPlan.nom ?? "Plan" })) : (_jsxs("div", { className: "p-6 text-center bg-muted/20", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-3", children: "Preview not available for this file type." }), _jsx("a", { href: previewPlan.fileUrl, target: "_blank", rel: "noopener noreferrer", children: _jsxs(Button, { variant: "outline", className: "gap-2", children: [_jsx(ExternalLink, { className: "w-4 h-4" }), " Open in new tab"] }) })] })) }))] }) })), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: editing ? "Edit Plan" : "Upload Plan", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Plan Name *" }), _jsx(Input, { value: form.nom, onChange: (e) => setForm({ ...form, nom: e.target.value }) })] }), !editing && (_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Project *" }), _jsxs(Select, { value: form.projetId, onValueChange: (v) => setForm({ ...form, projetId: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select project" }) }), _jsx(SelectContent, { children: projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id))) })] })] })), _jsxs("div", { children: [_jsx(Label, { children: "Category" }), _jsxs(Select, { value: form.categorie, onValueChange: (v) => setForm({ ...form, categorie: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "architectural", children: "Architectural" }), _jsx(SelectItem, { value: "structural", children: "Structural" }), _jsx(SelectItem, { value: "electrical", children: "Electrical" }), _jsx(SelectItem, { value: "plumbing", children: "Plumbing" }), _jsx(SelectItem, { value: "hvac", children: "HVAC" }), _jsx(SelectItem, { value: "landscape", children: "Landscape" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Reference" }), _jsx(Input, { value: form.reference, onChange: (e) => setForm({ ...form, reference: e.target.value }), placeholder: "e.g. PLN-001" })] }), _jsxs("div", { className: "col-span-2", children: [_jsxs(Label, { children: ["File ", editing ? "(upload to create new version)" : "*"] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("label", { className: "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground", children: [_jsx(Upload, { className: "w-4 h-4" }), uploading
                                                    ? "Uploading..."
                                                    : form.fileUrl
                                                        ? "Replace file"
                                                        : "Upload file", _jsx("input", { type: "file", className: "hidden", accept: ".jpg,.jpeg,.png,.webp", onChange: handleFileUpload, disabled: uploading })] }), form.fileUrl && (_jsxs("a", { href: form.fileUrl, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-primary hover:underline flex items-center gap-1", children: [_jsx(ExternalLink, { className: "w-3 h-3" }), " View"] }))] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Description" }), _jsx(Textarea, { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }) })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => saveMutation.mutate(form), disabled: saveMutation.isPending ||
                                        !form.nom ||
                                        (!editing && (!form.projetId || !form.fileUrl)), children: saveMutation.isPending ? "Saving..." : "Save" })] })] }) })] }));
}
