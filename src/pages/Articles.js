import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Eye } from "lucide-react";
import { articlesService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FormDialog from "@/components/shared/FormDialog";
import BarcodeDisplay from "@/components/articles/BarcodeDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const defaultForm = {
    name: "",
    category: "",
    unit: "piece",
    unitPrice: 0,
    currency: "MAD",
    initialStock: 0,
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function Articles() {
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: articlesData, isLoading } = useQuery({
        queryKey: ["articles"],
        queryFn: () => articlesService.list({ limit: 100 }),
    });
    const articlesList = articlesData?.items ?? [];
    // ── Mutations
    const saveMutation = useMutation({
        mutationFn: (data) => editing
            ? articlesService.update(editing.id, data)
            : articlesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["articles"] });
            setShowForm(false);
            setEditing(null);
        },
    });
    // ── Helpers
    const openForm = (article) => {
        setEditing(article ?? null);
        setForm(article
            ? {
                name: article.name ?? "",
                category: article.category ?? "",
                unit: article.unit ?? "piece",
                unitPrice: article.unitPrice ?? 0,
                currency: article.currency ?? "MAD",
                initialStock: article.stockQuantity ?? 0,
            }
            : defaultForm);
        setShowForm(true);
    };
    const handleSave = () => {
        if (editing) {
            const payload = {
                name: form.name || undefined,
                category: form.category || undefined,
                unit: form.unit || undefined,
                unitPrice: form.unitPrice,
                currency: form.currency || undefined,
            };
            saveMutation.mutate(payload);
        }
        else {
            const payload = {
                name: form.name,
                category: form.category,
                unit: form.unit || undefined,
                unitPrice: form.unitPrice,
                currency: form.currency || undefined,
                initialStock: form.initialStock || undefined,
            };
            saveMutation.mutate(payload);
        }
    };
    // ── Filtering
    const filtered = articlesList.filter((a) => !search ||
        a.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.category?.toLowerCase().includes(search.toLowerCase()));
    // ── Low stock check
    const isLowStock = (article) => (article.stockQuantity ?? 0) <= 0;
    // ── Columns
    const columns = [
        {
            header: "Article",
            cell: (row) => (_jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: row.category })] })),
        },
        {
            header: "Unit",
            cell: (row) => (_jsx("span", { className: "text-xs", children: row.unit ?? "—" })),
        },
        {
            header: "Unit Price",
            cell: (row) => (_jsxs("span", { className: "text-xs font-medium", children: [row.unitPrice?.toLocaleString(), " ", row.currency ?? "MAD"] })),
        },
        {
            header: "Stock",
            cell: (row) => {
                const low = isLowStock(row);
                return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `font-semibold ${low ? "text-destructive" : "text-foreground"}`, children: row.stockQuantity ?? 0 }), low && _jsx(AlertTriangle, { className: "w-3 h-3 text-destructive" })] }));
            },
        },
        {
            header: "Status",
            cell: (row) => {
                const low = isLowStock(row);
                return low ? (_jsx(Badge, { variant: "outline", className: "bg-destructive/10 text-destructive border-destructive/20 text-xs", children: "Low Stock" })) : (_jsx(Badge, { variant: "outline", className: "bg-success/10 text-success border-success/20 text-xs", children: "OK" }));
            },
        },
        {
            header: "",
            cell: (row) => (_jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setShowDetail(row), children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: () => openForm(row), children: "Edit" })] })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(PageHeader, { title: "Articles", subtitle: `${articlesList.length} articles`, onAdd: () => openForm(), addLabel: "New Article", searchValue: search, onSearch: setSearch }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), showDetail && (_jsx(FormDialog, { open: !!showDetail, onOpenChange: () => setShowDetail(null), title: showDetail.name, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-4 rounded-lg bg-muted/30 text-center", children: [_jsx("p", { className: "text-xs text-muted-foreground mb-2", children: "Barcode" }), _jsx(BarcodeDisplay, { barcodeId: showDetail.barcodeId, articleName: showDetail.name, showDownload: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-3 rounded-lg bg-success/10 border border-success/20 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-success", children: showDetail.stockQuantity ?? 0 }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Current Stock" })] }), _jsxs("div", { className: "p-3 rounded-lg bg-primary/10 border border-primary/20 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-primary", children: showDetail.unitPrice?.toLocaleString() ?? 0 }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: ["Unit Price (", showDetail.currency ?? "MAD", ")"] })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Category:" }), " ", _jsx("span", { className: "font-medium", children: showDetail.category ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Unit:" }), " ", _jsx("span", { className: "font-medium", children: showDetail.unit ?? "—" })] })] })] }) })), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: editing ? "Edit Article" : "New Article", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Article Name *" }), _jsx(Input, { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Category *" }), _jsx(Input, { value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), placeholder: "e.g. Cement, Steel, Timber" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Unit" }), _jsxs(Select, { value: form.unit, onValueChange: (v) => setForm({ ...form, unit: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "piece", children: "Piece" }), _jsx(SelectItem, { value: "kg", children: "Kg" }), _jsx(SelectItem, { value: "m", children: "Meter" }), _jsx(SelectItem, { value: "m2", children: "m\u00B2" }), _jsx(SelectItem, { value: "m3", children: "m\u00B3" }), _jsx(SelectItem, { value: "litre", children: "Litre" }), _jsx(SelectItem, { value: "box", children: "Box" }), _jsx(SelectItem, { value: "pallet", children: "Pallet" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Unit Price *" }), _jsx(Input, { type: "number", min: 0, value: form.unitPrice, onChange: (e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Currency" }), _jsxs(Select, { value: form.currency, onValueChange: (v) => setForm({ ...form, currency: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "MAD", children: "MAD" }), _jsx(SelectItem, { value: "EUR", children: "EUR" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] })] }), !editing && (_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Initial Stock" }), _jsx(Input, { type: "number", min: 0, value: form.initialStock, onChange: (e) => setForm({
                                        ...form,
                                        initialStock: parseFloat(e.target.value) || 0,
                                    }) })] })), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: saveMutation.isPending || !form.name || !form.category, children: saveMutation.isPending ? "Saving..." : "Save" })] })] }) })] }));
}
