import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink, Upload, Eye, Download, FileText } from "lucide-react";
import { documentsService, projectsService, uploadService, } from "@/services/wape.service";
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
    documentName: "",
    sourceType: "project",
    sourceId: "",
    fileType: "other",
    fileUrl: "",
    fileSize: 0,
    description: "",
};
// ── Helpers ───────────────────────────────────────────────────────────────────
function isImage(url) {
    return !!url && /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}
function detectFileType(file) {
    if (file.type.startsWith("image/"))
        return "image";
    if (file.type === "application/pdf")
        return "pdf";
    if (file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        return "xlsx";
    if (file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        return "docx";
    return "other";
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sourceFilter, setSourceFilter] = useState("all");
    const [projectFilter, setProjectFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [uploading, setUploading] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: docsData, isLoading } = useQuery({
        queryKey: ["documents"],
        queryFn: () => documentsService.list({ limit: 100 }),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const documents = (docsData?.items ?? []);
    const projects = (projectsData?.items ?? []);
    // ── Mutations
    const saveMutation = useMutation({
        mutationFn: (data) => documentsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            setShowForm(false);
            setForm(defaultForm);
        },
    });
    // ── Helpers
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        try {
            const result = await uploadService.file(file, "documents");
            const fileUrl = result.secureUrl ?? "";
            setForm((f) => ({
                ...f,
                fileUrl,
                fileSize: file.size,
                fileType: detectFileType(file),
                documentName: f.documentName || file.name,
            }));
        }
        finally {
            setUploading(false);
        }
    };
    const handleSave = () => {
        const payload = {
            documentName: form.documentName,
            sourceType: form.sourceType,
            sourceId: form.sourceId,
            fileUrl: form.fileUrl,
            fileType: form.fileType,
            fileSize: form.fileSize,
            description: form.description || undefined,
        };
        saveMutation.mutate(payload);
    };
    // ── Filtering
    const filtered = documents.filter((d) => {
        const matchSearch = !search || d.documentName?.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "all" || d.fileType === typeFilter;
        const matchSource = sourceFilter === "all" || d.sourceType === sourceFilter;
        const matchProj = projectFilter === "all" || d.sourceId === projectFilter;
        return matchSearch && matchType && matchSource && matchProj;
    });
    // ── Columns
    const columns = [
        {
            header: "Name",
            cell: (row) => (_jsxs("div", { className: "flex items-center gap-2", children: [isImage(row.fileUrl) ? (_jsx("img", { src: row.fileUrl, className: "w-8 h-8 rounded object-cover border border-border shrink-0", alt: row.documentName })) : (_jsx("div", { className: "w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0", children: _jsx(FileText, { className: "w-4 h-4 text-muted-foreground" }) })), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.documentName }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [row.fileType ?? "—", row.fileSize ? ` • ${(row.fileSize / 1024).toFixed(0)} KB` : ""] })] })] })),
        },
        {
            header: "Source",
            cell: (row) => row.sourceType ? (_jsx(Badge, { variant: "outline", className: "text-xs capitalize", children: row.sourceType.replace(/_/g, " ") })) : (_jsx("span", { className: "text-muted-foreground text-xs", children: "\u2014" })),
        },
        {
            header: "Date",
            cell: (row) => row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "—",
        },
        {
            header: "",
            cell: (row) => (_jsx("div", { className: "flex gap-1", children: row.fileUrl && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setPreviewDoc(row), title: "Preview", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("a", { href: row.fileUrl, download: true, target: "_blank", rel: "noopener noreferrer", children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", title: "Download", children: _jsx(Download, { className: "w-4 h-4" }) }) })] })) })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(PageHeader, { title: "Documents", subtitle: `${documents.length} documents`, onAdd: () => {
                    setForm(defaultForm);
                    setShowForm(true);
                }, addLabel: "Add Document", searchValue: search, onSearch: setSearch, children: [_jsxs(Select, { value: sourceFilter, onValueChange: setSourceFilter, children: [_jsx(SelectTrigger, { className: "w-36 bg-card", children: _jsx(SelectValue, { placeholder: "All Sources" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Sources" }), _jsx(SelectItem, { value: "project", children: "Project" }), _jsx(SelectItem, { value: "task", children: "Task" }), _jsx(SelectItem, { value: "contact", children: "Contact" }), _jsx(SelectItem, { value: "nc", children: "Non Conformity" }), _jsx(SelectItem, { value: "purchase_order", children: "Purchase Order" }), _jsx(SelectItem, { value: "attachment", children: "Attachment" })] })] }), _jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [_jsx(SelectTrigger, { className: "w-36 bg-card", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), _jsx(SelectItem, { value: "pdf", children: "PDF" }), _jsx(SelectItem, { value: "image", children: "Image" }), _jsx(SelectItem, { value: "xlsx", children: "Excel" }), _jsx(SelectItem, { value: "docx", children: "Word" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] }), _jsxs(Select, { value: projectFilter, onValueChange: setProjectFilter, children: [_jsx(SelectTrigger, { className: "w-40 bg-card", children: _jsx(SelectValue, { placeholder: "All Projects" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Projects" }), projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id)))] })] })] }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), previewDoc && (_jsx(FormDialog, { open: !!previewDoc, onOpenChange: () => setPreviewDoc(null), title: previewDoc.documentName ?? "Document", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Type:" }), " ", _jsx("span", { className: "font-medium capitalize", children: previewDoc.fileType ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Source:" }), " ", _jsx("span", { className: "font-medium capitalize", children: previewDoc.sourceType?.replace(/_/g, " ") ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Size:" }), " ", _jsx("span", { className: "font-medium", children: previewDoc.fileSize
                                                ? `${(previewDoc.fileSize / 1024).toFixed(0)} KB`
                                                : "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Date:" }), " ", _jsx("span", { className: "font-medium", children: previewDoc.createdAt
                                                ? format(new Date(previewDoc.createdAt), "MMM d, yyyy")
                                                : "—" })] })] }), previewDoc.description && (_jsx("div", { className: "p-3 rounded-lg bg-muted/30 text-sm", children: previewDoc.description })), previewDoc.fileUrl && (_jsx("div", { className: "rounded-lg border border-border overflow-hidden", children: isImage(previewDoc.fileUrl) ? (_jsx("img", { src: previewDoc.fileUrl, className: "w-full max-h-96 object-contain", alt: previewDoc.documentName })) : (_jsxs("div", { className: "p-6 text-center bg-muted/20", children: [_jsx(FileText, { className: "w-12 h-12 text-muted-foreground mx-auto mb-3" }), _jsx("p", { className: "text-sm text-muted-foreground mb-3", children: "Preview not available for this file type." }), _jsx("a", { href: previewDoc.fileUrl, target: "_blank", rel: "noopener noreferrer", children: _jsxs(Button, { variant: "outline", className: "gap-2", children: [_jsx(ExternalLink, { className: "w-4 h-4" }), " Open in new tab"] }) })] })) })), _jsx("div", { className: "flex gap-2 justify-end", children: _jsx("a", { href: previewDoc.fileUrl, download: true, target: "_blank", rel: "noopener noreferrer", children: _jsxs(Button, { variant: "outline", className: "gap-2", children: [_jsx(Download, { className: "w-4 h-4" }), " Download"] }) }) })] }) })), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: "Add Document", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Document Name *" }), _jsx(Input, { value: form.documentName, onChange: (e) => setForm({ ...form, documentName: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Source Type *" }), _jsxs(Select, { value: form.sourceType, onValueChange: (v) => setForm({ ...form, sourceType: v, sourceId: "" }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "project", children: "Project" }), _jsx(SelectItem, { value: "task", children: "Task" }), _jsx(SelectItem, { value: "contact", children: "Contact" }), _jsx(SelectItem, { value: "nc", children: "Non Conformity" }), _jsx(SelectItem, { value: "purchase_order", children: "Purchase Order" }), _jsx(SelectItem, { value: "attachment", children: "Attachment" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: form.sourceType === "project" ? "Project *" : "Source ID *" }), form.sourceType === "project" ? (_jsxs(Select, { value: form.sourceId, onValueChange: (v) => setForm({ ...form, sourceId: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select project" }) }), _jsx(SelectContent, { children: projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id))) })] })) : (_jsx(Input, { value: form.sourceId, onChange: (e) => setForm({ ...form, sourceId: e.target.value }), placeholder: "UUID of the source record" }))] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "File *" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("label", { className: "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground", children: [_jsx(Upload, { className: "w-4 h-4" }), uploading
                                                    ? "Uploading..."
                                                    : form.fileUrl
                                                        ? "Replace file"
                                                        : "Upload file", _jsx("input", { type: "file", className: "hidden", onChange: handleFileUpload, disabled: uploading })] }), form.fileUrl && (_jsxs("a", { href: form.fileUrl, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-primary hover:underline flex items-center gap-1", children: [_jsx(ExternalLink, { className: "w-3 h-3" }), " View"] }))] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Description" }), _jsx(Textarea, { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }) })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: saveMutation.isPending ||
                                        !form.documentName ||
                                        !form.fileUrl ||
                                        !form.sourceId, children: saveMutation.isPending ? "Saving..." : "Save" })] })] }) })] }));
}
