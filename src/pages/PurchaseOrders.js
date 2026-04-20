import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { X, Package } from "lucide-react";
import { purchaseOrdersService, projectsService, articlesService, contactsService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const defaultForm = {
    supplierId: "",
    projectId: "",
    currency: "MAD",
    notes: "",
    lines: [],
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function PurchaseOrders() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: ordersData, isLoading } = useQuery({
        queryKey: ["purchase-orders"],
        queryFn: () => purchaseOrdersService.list({ limit: 100 }),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const { data: articlesData } = useQuery({
        queryKey: ["articles"],
        queryFn: () => articlesService.list({ limit: 100 }),
    });
    const { data: suppliersData } = useQuery({
        queryKey: ["suppliers"],
        queryFn: () => contactsService.listSuppliers({ limit: 100 }),
    });
    const orders = ordersData?.items ?? [];
    const projects = (projectsData?.items ?? []);
    const articles = (articlesData?.items ?? []);
    const suppliers = (suppliersData?.items ?? []);
    // ── Mutations
    const saveMutation = useMutation({
        mutationFn: (data) => purchaseOrdersService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            setShowForm(false);
            setForm(defaultForm);
        },
    });
    const confirmMutation = useMutation({
        mutationFn: (id) => purchaseOrdersService.confirm(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        },
    });
    // ── Line helpers
    const addLine = (item) => {
        const id = String(item.id);
        if (form.lines.some((l) => l.articleId === id))
            return;
        const found = articles.find((a) => a.id === id);
        setForm((f) => ({
            ...f,
            lines: [
                ...f.lines,
                {
                    articleId: id,
                    articleName: found?.name ?? item.label,
                    orderedQuantity: 1,
                    unitPrice: found?.unitPrice ?? 0,
                    currency: f.currency || undefined,
                },
            ],
        }));
    };
    const updateLine = (idx, field, val) => {
        const lines = [...form.lines];
        lines[idx] = { ...lines[idx], [field]: parseFloat(val) || 0 };
        setForm((f) => ({ ...f, lines }));
    };
    const removeLine = (idx) => {
        setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
    };
    const totalAmount = form.lines.reduce((s, l) => s + (l.orderedQuantity ?? 0) * (l.unitPrice ?? 0), 0);
    const handleSave = () => {
        const payload = {
            supplierId: form.supplierId,
            projectId: form.projectId || undefined,
            currency: form.currency || undefined,
            notes: form.notes || undefined,
            lines: form.lines.map((l) => ({
                articleId: l.articleId,
                orderedQuantity: l.orderedQuantity,
                unitPrice: l.unitPrice,
                currency: l.currency,
            })),
        };
        saveMutation.mutate(payload);
    };
    // ── Filtering
    const filtered = orders.filter((o) => {
        const matchSearch = !search ||
            o.supplierId?.toLowerCase().includes(search.toLowerCase()) ||
            o.id?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || o.status === statusFilter;
        return matchSearch && matchStatus;
    });
    // ── Columns
    const columns = [
        {
            header: "Order",
            cell: (row) => (_jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.orderNumber }), _jsx("p", { className: "text-xs text-muted-foreground", children: suppliers.find((s) => s.id === row.supplierId)?.legalName ?? "—" })] })),
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
            header: "Status",
            cell: (row) => _jsx(StatusBadge, { status: row.status }),
        },
        {
            header: "",
            cell: (row) => row.status === "draft" ? (_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: () => confirmMutation.mutate(row.id), disabled: confirmMutation.isPending, children: "Confirm" })) : null,
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(PageHeader, { title: "Purchase Orders", subtitle: `${orders.length} orders`, onAdd: () => {
                    setForm(defaultForm);
                    setShowForm(true);
                }, addLabel: "New Order", searchValue: search, onSearch: setSearch, children: _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { className: "w-40 bg-card", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "pending", children: "Pending" }), _jsx(SelectItem, { value: "confirmed", children: "Confirmed" }), _jsx(SelectItem, { value: "partially_received", children: "Partially Received" }), _jsx(SelectItem, { value: "received", children: "Received" }), _jsx(SelectItem, { value: "cancelled", children: "Cancelled" })] })] }) }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: "New Purchase Order", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Supplier *" }), _jsxs(Select, { value: form.supplierId, onValueChange: (v) => setForm({ ...form, supplierId: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select supplier" }) }), _jsx(SelectContent, { children: suppliers.map((s) => (_jsx(SelectItem, { value: s.id, children: s.legalName }, s.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Project" }), _jsxs(Select, { value: form.projectId, onValueChange: (v) => setForm({ ...form, projectId: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select project (optional)" }) }), _jsx(SelectContent, { children: projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Currency" }), _jsxs(Select, { value: form.currency, onValueChange: (v) => setForm({ ...form, currency: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "MAD", children: "MAD" }), _jsx(SelectItem, { value: "EUR", children: "EUR" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] })] })] }), _jsxs("div", { children: [_jsx(Label, { className: "mb-2 block", children: "Order Lines *" }), _jsx(SearchableSelect, { items: articles.map((a) => ({ id: a.id, label: a.name })), onSelect: addLine, placeholder: "Add article..." }), form.lines.length > 0 && (_jsxs("div", { className: "mt-3 space-y-2", children: [_jsxs("div", { className: "grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2", children: [_jsx("span", { className: "col-span-4", children: "Article" }), _jsx("span", { className: "col-span-3", children: "Qty" }), _jsx("span", { className: "col-span-3", children: "Unit Price" }), _jsx("span", { className: "col-span-1", children: "Total" })] }), form.lines.map((line, i) => (_jsxs("div", { className: "grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/30", children: [_jsxs("span", { className: "col-span-4 text-sm flex items-center gap-1.5", children: [_jsx(Package, { className: "w-3.5 h-3.5 text-muted-foreground shrink-0" }), line.articleName] }), _jsx(Input, { type: "number", min: 1, className: "col-span-3 h-7 text-xs", value: line.orderedQuantity, onChange: (e) => updateLine(i, "orderedQuantity", e.target.value) }), _jsx(Input, { type: "number", min: 0, className: "col-span-3 h-7 text-xs", value: line.unitPrice, onChange: (e) => updateLine(i, "unitPrice", e.target.value) }), _jsx("span", { className: "col-span-1 text-xs font-semibold", children: ((line.orderedQuantity ?? 0) * (line.unitPrice ?? 0)).toFixed(0) }), _jsx(X, { className: "w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-destructive", onClick: () => removeLine(i) })] }, line.articleId))), _jsxs("div", { className: "text-right text-sm font-bold pt-2 pr-2", children: ["Total: ", totalAmount.toLocaleString(), " ", form.currency] })] }))] }), _jsxs("div", { children: [_jsx(Label, { children: "Notes" }), _jsx(Textarea, { value: form.notes, onChange: (e) => setForm({ ...form, notes: e.target.value }) })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: saveMutation.isPending ||
                                        !form.supplierId ||
                                        form.lines.length === 0, children: saveMutation.isPending ? "Saving..." : "Save Order" })] })] }) })] }));
}
