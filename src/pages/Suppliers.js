import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Eye, Upload, X, ExternalLink } from "lucide-react";
import { contactsService, purchaseOrdersService, uploadService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
const defaultForm = {
    legalName: "",
    ifNumber: "",
    iceNumber: "",
    email: "",
    phone: "",
    address: "",
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function SuppliersPage() {
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [viewingSupplier, setViewingSupplier] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [pendingDocs, setPendingDocs] = useState([]);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: suppliersData, isLoading } = useQuery({
        queryKey: ["suppliers"],
        queryFn: () => contactsService.listSuppliers({ limit: 100 }),
    });
    const { data: ordersData } = useQuery({
        queryKey: ["purchase-orders"],
        queryFn: () => purchaseOrdersService.list({ limit: 100 }),
    });
    const { data: viewingDocsData } = useQuery({
        queryKey: ["contact-docs", viewingSupplier?.id],
        queryFn: () => contactsService.listDocuments(viewingSupplier.id),
        enabled: !!viewingSupplier?.id,
    });
    const suppliers = suppliersData?.items ?? [];
    const purchaseOrders = (ordersData?.items ?? []);
    const viewingDocs = (viewingDocsData ?? []);
    // ── Mutations
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            let contact;
            if (editing) {
                const payload = {
                    legalName: data.legalName || undefined,
                    ifNumber: data.ifNumber || undefined,
                    iceNumber: data.iceNumber || undefined,
                    email: data.email || undefined,
                    phone: data.phone || undefined,
                    address: data.address || undefined,
                };
                contact = await contactsService.update(editing.id, payload);
            }
            else {
                const payload = {
                    contactType: "supplier",
                    legalName: data.legalName,
                    ifNumber: data.ifNumber || undefined,
                    iceNumber: data.iceNumber || undefined,
                    email: data.email || undefined,
                    phone: data.phone || undefined,
                    address: data.address || undefined,
                };
                contact = await contactsService.create(payload);
            }
            for (const doc of pendingDocs) {
                await contactsService.addDocument(contact.id, doc);
            }
            return contact;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            setShowForm(false);
            setEditing(null);
            setPendingDocs([]);
        },
    });
    // ── Helpers
    const openForm = (supplier) => {
        setEditing(supplier ?? null);
        setPendingDocs([]);
        setForm(supplier
            ? {
                legalName: supplier.legalName ?? "",
                ifNumber: supplier.ifNumber ?? "",
                iceNumber: supplier.iceNumber ?? "",
                email: supplier.email ?? "",
                phone: supplier.phone ?? "",
                address: supplier.address ?? "",
            }
            : defaultForm);
        setShowForm(true);
    };
    const handleUploadDoc = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        try {
            const result = await uploadService.file(file, "contact-documents");
            const fileUrl = result.secureUrl ?? "";
            setPendingDocs((prev) => [
                ...prev,
                { documentName: file.name, documentType: "other", fileUrl },
            ]);
        }
        finally {
            setUploading(false);
        }
    };
    const filtered = suppliers.filter((s) => !search || s.legalName?.toLowerCase().includes(search.toLowerCase()));
    const supplierOrders = viewingSupplier
        ? purchaseOrders.filter((o) => o.supplierId === viewingSupplier.id)
        : [];
    // ── Columns
    const columns = [
        {
            header: "Supplier",
            cell: (row) => (_jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.legalName }), _jsx("p", { className: "text-xs text-muted-foreground", children: row.iceNumber ?? "—" })] })),
        },
        {
            header: "Email / Phone",
            cell: (row) => (_jsxs("div", { className: "text-xs space-y-0.5", children: [row.email && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Mail, { className: "w-3 h-3 text-muted-foreground" }), row.email] })), row.phone && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Phone, { className: "w-3 h-3 text-muted-foreground" }), row.phone] }))] })),
        },
        {
            header: "IF / ICE",
            cell: (row) => (_jsxs("div", { className: "text-xs space-y-0.5", children: [row.ifNumber && (_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "IF:" }), " ", row.ifNumber] })), row.iceNumber && (_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "ICE:" }), " ", row.iceNumber] }))] })),
        },
        {
            header: "Orders",
            cell: (row) => {
                const count = purchaseOrders.filter((o) => o.supplierId === row.id).length;
                return (_jsxs(Badge, { variant: "outline", className: "text-xs", children: [count, " POs"] }));
            },
        },
        {
            header: "",
            cell: (row) => (_jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setViewingSupplier(row), children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: () => openForm(row), children: "Edit" })] })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(PageHeader, { title: "Suppliers", subtitle: `${suppliers.length} suppliers`, onAdd: () => openForm(), addLabel: "New Supplier", searchValue: search, onSearch: setSearch }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), viewingSupplier && (_jsx(FormDialog, { open: !!viewingSupplier, onOpenChange: () => setViewingSupplier(null), title: `Supplier: ${viewingSupplier.legalName}`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "IF:" }), " ", _jsx("span", { className: "font-medium", children: viewingSupplier.ifNumber ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "ICE:" }), " ", _jsx("span", { className: "font-medium", children: viewingSupplier.iceNumber ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Email:" }), " ", _jsx("span", { className: "font-medium", children: viewingSupplier.email ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Phone:" }), " ", _jsx("span", { className: "font-medium", children: viewingSupplier.phone ?? "—" })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("span", { className: "text-muted-foreground", children: "Address:" }), " ", _jsx("span", { className: "font-medium", children: viewingSupplier.address ?? "—" })] })] }), viewingDocs.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-semibold text-sm mb-2", children: ["Documents (", viewingDocs.length, ")"] }), _jsx("div", { className: "space-y-1", children: viewingDocs.map((doc, i) => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded bg-muted/30 text-xs", children: [_jsx("span", { className: "flex-1 truncate", children: doc.documentName ?? doc.name }), doc.fileUrl && (_jsx("a", { href: doc.fileUrl, target: "_blank", rel: "noopener noreferrer", children: _jsx(ExternalLink, { className: "w-3 h-3 text-primary" }) }))] }, i))) })] })), _jsxs("div", { children: [_jsxs("h4", { className: "font-semibold text-sm mb-2", children: ["Purchase Orders (", supplierOrders.length, ")"] }), supplierOrders.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No purchase orders." })) : (_jsx("div", { className: "space-y-2", children: supplierOrders.map((o) => (_jsxs("div", { className: "flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm", children: [_jsxs("span", { className: "font-medium", children: ["PO-", o.id.slice(-6).toUpperCase()] }), _jsx(StatusBadge, { status: o.status })] }, o.id))) }))] })] }) })), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: editing ? "Edit Supplier" : "New Supplier", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Legal Name *" }), _jsx(Input, { value: form.legalName, onChange: (e) => setForm({ ...form, legalName: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "IF (Fiscal Identifier)" }), _jsx(Input, { value: form.ifNumber, onChange: (e) => setForm({ ...form, ifNumber: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "ICE (Company ID)" }), _jsx(Input, { value: form.iceNumber, onChange: (e) => setForm({ ...form, iceNumber: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Email" }), _jsx(Input, { type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Phone" }), _jsx(Input, { value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Address" }), _jsx(Input, { value: form.address, onChange: (e) => setForm({ ...form, address: e.target.value }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { className: "mb-1 block", children: "Documents" }), _jsxs("label", { className: "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground w-fit", children: [_jsx(Upload, { className: "w-4 h-4" }), uploading ? "Uploading..." : "Upload document", _jsx("input", { type: "file", className: "hidden", onChange: handleUploadDoc, disabled: uploading })] }), _jsx("div", { className: "mt-2 space-y-1", children: pendingDocs.map((doc, i) => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded bg-muted/30 text-xs", children: [_jsx("span", { className: "flex-1 truncate", children: doc.documentName }), _jsx(X, { className: "w-3 h-3 cursor-pointer text-muted-foreground", onClick: () => setPendingDocs((prev) => prev.filter((_, idx) => idx !== i)) })] }, i))) })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => saveMutation.mutate(form), disabled: saveMutation.isPending || !form.legalName, children: saveMutation.isPending ? "Saving..." : "Save Supplier" })] })] }) })] }));
}
