import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Plus, Upload } from "lucide-react";
import { toolsService, personnelService, uploadService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const defaultToolForm = {
    name: "",
    category: "other",
    serialNumber: "",
    photoUrl: "",
    status: "available",
};
const defaultMovForm = {
    movementType: "OUT",
    responsibleId: "",
    notes: "",
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function Tools() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [showMovementForm, setShowMovementForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [selectedToolId, setSelectedToolId] = useState("");
    const [form, setForm] = useState(defaultToolForm);
    const [movForm, setMovForm] = useState(defaultMovForm);
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: toolsData, isLoading } = useQuery({
        queryKey: ["tools"],
        queryFn: () => toolsService.list({ limit: 100 }),
    });
    const { data: personnelData } = useQuery({
        queryKey: ["personnel"],
        queryFn: () => personnelService.list({ limit: 100 }),
    });
    // Movements for selected tool (only loaded when movement form is open)
    const { data: movementsData } = useQuery({
        queryKey: ["tool-movements", selectedToolId],
        queryFn: () => toolsService.listMovements(selectedToolId, { limit: 20 }),
        enabled: !!selectedToolId,
    });
    const toolsList = toolsData?.items ?? [];
    const personnelList = (personnelData?.items ?? []);
    const movements = (movementsData?.items ?? []);
    // ── Mutations
    const saveMutation = useMutation({
        mutationFn: (data) => editing
            ? toolsService.update(editing.id, data)
            : toolsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tools"] });
            setShowForm(false);
            setEditing(null);
        },
    });
    const movementMutation = useMutation({
        mutationFn: (data) => toolsService.addMovement(selectedToolId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tools"] });
            queryClient.invalidateQueries({
                queryKey: ["tool-movements", selectedToolId],
            });
            setShowMovementForm(false);
            setMovForm(defaultMovForm);
            setSelectedToolId("");
        },
    });
    // ── Helpers
    const openForm = (tool) => {
        setEditing(tool ?? null);
        setForm(tool
            ? {
                name: tool.name ?? "",
                category: tool.category ?? "other",
                serialNumber: tool.serialNumber ?? "",
                photoUrl: tool.photoUrl ?? "",
                status: tool.status ?? "available",
            }
            : defaultToolForm);
        setShowForm(true);
    };
    const openMovementForm = (toolId) => {
        setSelectedToolId(toolId ?? "");
        setMovForm(defaultMovForm);
        setShowMovementForm(true);
    };
    const handleUploadPhoto = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        try {
            const result = await uploadService.image(file, "nc-images");
            setForm((f) => ({
                ...f,
                photoUrl: result.secureUrl ?? "",
            }));
        }
        finally {
            setUploading(false);
        }
    };
    const handleSaveTool = () => {
        if (editing) {
            const payload = {
                name: form.name || undefined,
                category: form.category,
                serialNumber: form.serialNumber || undefined,
                photoUrl: form.photoUrl || undefined,
            };
            saveMutation.mutate(payload);
        }
        else {
            const payload = {
                name: form.name,
                category: form.category,
                serialNumber: form.serialNumber || undefined,
                photoUrl: form.photoUrl || undefined,
            };
            saveMutation.mutate(payload);
        }
    };
    const handleSaveMovement = () => {
        const payload = {
            movementType: movForm.movementType,
            responsibleId: movForm.responsibleId,
            notes: movForm.notes || undefined,
        };
        movementMutation.mutate(payload);
    };
    // ── Filtering
    const filtered = toolsList.filter((t) => {
        const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || t.status === statusFilter;
        return matchSearch && matchStatus;
    });
    // ── Columns
    const columns = [
        {
            header: "Tool",
            cell: (row) => (_jsxs("div", { className: "flex items-center gap-3", children: [row.photoUrl ? (_jsx("img", { src: row.photoUrl, className: "w-10 h-10 rounded-lg object-cover border border-border shrink-0", alt: row.name })) : (_jsx("div", { className: "w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground text-xs", children: "No photo" })), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: row.serialNumber })] })] })),
        },
        {
            header: "Category",
            cell: (row) => (_jsx("span", { className: "capitalize text-xs", children: row.category?.replace("_", " ") })),
        },
        {
            header: "Status",
            cell: (row) => _jsx(StatusBadge, { status: row.status }),
        },
        {
            header: "",
            cell: (row) => (_jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: () => openForm(row), children: "Edit" }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: () => openMovementForm(row.id), children: "Move" })] })),
        },
    ];
    const movementColumns = [
        {
            header: "Type",
            cell: (row) => (_jsxs(Badge, { variant: "outline", className: `text-xs ${row.movementType === "OUT"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-success/10 text-success"}`, children: [row.movementType === "OUT" ? (_jsx(ArrowRight, { className: "w-3 h-3 inline mr-1" })) : (_jsx(ArrowLeft, { className: "w-3 h-3 inline mr-1" })), row.movementType] })),
        },
        {
            header: "Notes",
            cell: (row) => (_jsx("span", { className: "text-xs text-muted-foreground", children: row.notes ?? "—" })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(PageHeader, { title: "Tools & Equipment", subtitle: `${toolsList.length} items`, onAdd: () => openForm(), addLabel: "New Tool", searchValue: search, onSearch: setSearch, children: [_jsxs(Select, { value: statusFilter, onValueChange: (v) => setStatusFilter(v), children: [_jsx(SelectTrigger, { className: "w-36 bg-card", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "available", children: "Available" }), _jsx(SelectItem, { value: "in_use", children: "In Use" }), _jsx(SelectItem, { value: "maintenance", children: "Maintenance" }), _jsx(SelectItem, { value: "retired", children: "Retired" })] })] }), _jsxs(Button, { variant: "outline", onClick: () => openMovementForm(), children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), " Tool Movement"] })] }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), selectedToolId && movements.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide", children: "Recent Movements" }), _jsx(DataTable, { columns: movementColumns, data: movements })] })), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: editing ? "Edit Tool" : "New Tool", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Tool Name *" }), _jsx(Input, { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Tool Photo" }), _jsxs("label", { className: "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground w-fit", children: [_jsx(Upload, { className: "w-4 h-4" }), uploading
                                            ? "Uploading..."
                                            : form.photoUrl
                                                ? "Replace photo"
                                                : "Upload photo", _jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: handleUploadPhoto, disabled: uploading })] }), form.photoUrl && (_jsx("img", { src: form.photoUrl, className: "mt-2 w-24 h-24 rounded-lg object-cover border border-border", alt: "Tool preview" }))] }), _jsxs("div", { children: [_jsx(Label, { children: "Category" }), _jsxs(Select, { value: form.category, onValueChange: (v) => setForm({ ...form, category: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "hand_tools", children: "Hand Tools" }), _jsx(SelectItem, { value: "power_tools", children: "Power Tools" }), _jsx(SelectItem, { value: "heavy_equipment", children: "Heavy Equipment" }), _jsx(SelectItem, { value: "safety_equipment", children: "Safety Equipment" }), _jsx(SelectItem, { value: "measurement", children: "Measurement" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] })] }), _jsxs("div", { className: editing ? "col-span-2" : "", children: [_jsx(Label, { children: "Serial Number" }), _jsx(Input, { value: form.serialNumber, onChange: (e) => setForm({ ...form, serialNumber: e.target.value }) })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { onClick: handleSaveTool, disabled: saveMutation.isPending || !form.name, children: saveMutation.isPending ? "Saving..." : "Save" })] })] }) }), _jsx(FormDialog, { open: showMovementForm, onOpenChange: setShowMovementForm, title: "New Tool Movement", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Tool *" }), _jsxs(Select, { value: selectedToolId, onValueChange: setSelectedToolId, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select tool" }) }), _jsx(SelectContent, { children: toolsList.map((t) => (_jsxs(SelectItem, { value: t.id, children: [t.name, _jsxs("span", { className: "ml-2 text-xs text-muted-foreground capitalize", children: ["(", t.status, ")"] })] }, t.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Movement Type *" }), _jsxs(Select, { value: movForm.movementType, onValueChange: (v) => setMovForm({ ...movForm, movementType: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "OUT", children: "OUT \u2014 Dispatched" }), _jsx(SelectItem, { value: "IN", children: "IN \u2014 Returned" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Responsible Person *" }), _jsxs(Select, { value: movForm.responsibleId, onValueChange: (v) => setMovForm({ ...movForm, responsibleId: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select person" }) }), _jsx(SelectContent, { children: personnelList.map((p) => (_jsx(SelectItem, { value: p.id, children: p.fullName }, p.id))) })] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Notes" }), _jsx(Textarea, { value: movForm.notes, onChange: (e) => setMovForm({ ...movForm, notes: e.target.value }) })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowMovementForm(false), children: "Cancel" }), _jsx(Button, { onClick: handleSaveMovement, disabled: movementMutation.isPending ||
                                        !selectedToolId ||
                                        !movForm.responsibleId, children: movementMutation.isPending ? "Saving..." : "Save Movement" })] })] }) })] }));
}
