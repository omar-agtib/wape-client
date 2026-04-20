import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Upload, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { financeService, contactsService, projectsService, uploadService, } from "@/services/wape.service";
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
const defaultCreate = {
    supplierId: "",
    projectId: "",
    invoiceNumber: "",
    amount: 0,
    dueDate: "",
    currency: "MAD",
    notes: "",
    invoiceUrl: "",
};
const defaultPay = {
    amount: 0,
    paymentMethod: "bank_transfer",
    transactionReference: "",
};
function fmt(amount, currency = "MAD") {
    if (amount == null)
        return "—";
    return `${amount.toLocaleString()} ${currency}`;
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function ExpensesPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showPayForm, setShowPayForm] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [createForm, setCreateForm] = useState(defaultCreate);
    const [payForm, setPayForm] = useState(defaultPay);
    const [uploading, setUploading] = useState(false);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: paymentsData, isLoading } = useQuery({
        queryKey: ["supplier-payments"],
        queryFn: () => financeService.listSupplierPayments({ limit: 100 }),
    });
    const { data: suppliersData } = useQuery({
        queryKey: ["suppliers"],
        queryFn: () => contactsService.listSuppliers({ limit: 100 }),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const payments = (paymentsData?.items ?? []);
    const suppliers = (suppliersData?.items ?? []);
    const projects = (projectsData?.items ?? []);
    // ── Mutations
    const createMutation = useMutation({
        mutationFn: (data) => financeService.createSupplierPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
            setShowCreateForm(false);
            setCreateForm(defaultCreate);
        },
    });
    const payMutation = useMutation({
        mutationFn: ({ id, body }) => financeService.paySupplier(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
            setShowPayForm(false);
            setSelectedPayment(null);
            setPayForm(defaultPay);
        },
    });
    const attachInvoiceMutation = useMutation({
        mutationFn: ({ id, fileUrl }) => financeService.attachSupplierInvoice(id, fileUrl),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supplier-payments"] }),
    });
    // ── Helpers
    const getSupplierName = (id) => suppliers.find((s) => s.id === id)?.legalName ?? "—";
    const getProjectName = (id) => projects.find((p) => p.id === id)?.name ?? "—";
    const openPayDialog = (p) => {
        setSelectedPayment(p);
        setPayForm({
            amount: p.remaining ?? p.amount ?? 0,
            paymentMethod: "bank_transfer",
            transactionReference: "",
        });
        setShowPayForm(true);
    };
    const handleUploadInvoice = async (e, paymentId) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setUploading(true);
        try {
            const result = await uploadService.file(file, "supplier-invoices");
            const url = result.secureUrl ?? "";
            if (paymentId) {
                attachInvoiceMutation.mutate({ id: paymentId, fileUrl: url });
            }
            else {
                setCreateForm((f) => ({ ...f, invoiceUrl: url }));
            }
        }
        finally {
            setUploading(false);
        }
    };
    // ── Filtering
    const filtered = payments.filter((p) => {
        const matchSearch = !search ||
            getSupplierName(p.supplierId)
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            p.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || p.status === statusFilter;
        return matchSearch && matchStatus;
    });
    // ── Summary stats
    const totalAmount = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
    const totalPaid = payments.reduce((s, p) => s + (p.amountPaid ?? 0), 0);
    const pendingCount = payments.filter((p) => p.status === "pending").length;
    // ── Columns
    const columns = [
        {
            header: "Supplier",
            cell: (row) => (_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: getSupplierName(row.supplierId) }), _jsx("p", { className: "text-xs text-muted-foreground", children: row.invoiceNumber ?? "—" })] })),
        },
        {
            header: "Project",
            cell: (row) => (_jsx("span", { className: "text-xs text-muted-foreground", children: getProjectName(row.projectId) })),
        },
        {
            header: "Amount",
            cell: (row) => (_jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: fmt(row.amount, row.currency) }), (row.amountPaid ?? 0) > 0 && (_jsxs("p", { className: "text-xs text-success", children: ["Paid: ", fmt(row.amountPaid, row.currency)] })), (row.remaining ?? 0) > 0 && (_jsxs("p", { className: "text-xs text-warning", children: ["Remaining: ", fmt(row.remaining, row.currency)] }))] })),
        },
        {
            header: "Due Date",
            cell: (row) => row.dueDate ? format(new Date(row.dueDate), "MMM d, yyyy") : "—",
        },
        {
            header: "Status",
            cell: (row) => (_jsx(StatusBadge, { status: row.status ?? "pending" })),
        },
        {
            header: "Invoice",
            cell: (row) => row.invoiceUrl ? (_jsx("a", { href: row.invoiceUrl, target: "_blank", rel: "noopener noreferrer", children: _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs text-primary", children: "View" }) })) : (_jsxs("label", { className: "cursor-pointer text-xs text-muted-foreground hover:text-primary", children: ["Upload", _jsx("input", { type: "file", className: "hidden", accept: ".pdf,.jpg,.png", onChange: (e) => handleUploadInvoice(e, row.id), disabled: uploading })] })),
        },
        {
            header: "",
            cell: (row) => row.status !== "paid" ? (_jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-xs gap-1 text-success border-success/30", onClick: () => openPayDialog(row), children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), " Pay"] })) : (_jsx(Badge, { variant: "outline", className: "text-xs bg-success/10 text-success border-success/20", children: "Paid" })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "grid grid-cols-3 gap-4", children: [
                    {
                        label: "Total Invoiced",
                        value: fmt(totalAmount),
                        icon: AlertCircle,
                        color: "text-primary bg-primary/10",
                    },
                    {
                        label: "Total Paid",
                        value: fmt(totalPaid),
                        icon: CheckCircle2,
                        color: "text-success bg-success/10",
                    },
                    {
                        label: "Pending",
                        value: pendingCount,
                        icon: Clock,
                        color: "text-warning bg-warning/10",
                    },
                ].map(({ label, value, icon: Icon, color }) => (_jsxs("div", { className: "flex items-center gap-3 p-4 rounded-lg border border-border bg-card", children: [_jsx("div", { className: `p-2 rounded-lg ${color}`, children: _jsx(Icon, { className: "w-4 h-4" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: label }), _jsx("p", { className: "text-lg font-bold", children: value })] })] }, label))) }), _jsx(PageHeader, { title: "Supplier Payments", subtitle: `${payments.length} payments`, onAdd: () => setShowCreateForm(true), addLabel: "New Payment", searchValue: search, onSearch: setSearch, children: _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { className: "w-36 bg-card", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "pending", children: "Pending" }), _jsx(SelectItem, { value: "partial", children: "Partial" }), _jsx(SelectItem, { value: "paid", children: "Paid" }), _jsx(SelectItem, { value: "overdue", children: "Overdue" })] })] }) }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), _jsx(FormDialog, { open: showCreateForm, onOpenChange: setShowCreateForm, title: "New Supplier Payment", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Supplier *" }), _jsxs(Select, { value: createForm.supplierId, onValueChange: (v) => setCreateForm({ ...createForm, supplierId: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select supplier" }) }), _jsx(SelectContent, { children: suppliers.map((s) => (_jsx(SelectItem, { value: s.id, children: s.legalName }, s.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Project" }), _jsxs(Select, { value: createForm.projectId || "none", onValueChange: (v) => setCreateForm({
                                        ...createForm,
                                        projectId: v === "none" ? "" : v,
                                    }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "No project" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "No project" }), projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id)))] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Invoice Number *" }), _jsx(Input, { value: createForm.invoiceNumber, onChange: (e) => setCreateForm({ ...createForm, invoiceNumber: e.target.value }), placeholder: "INV-2026-001" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Amount *" }), _jsx(Input, { type: "number", min: 0, value: createForm.amount || "", onChange: (e) => setCreateForm({
                                        ...createForm,
                                        amount: parseFloat(e.target.value) || 0,
                                    }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Currency" }), _jsxs(Select, { value: createForm.currency, onValueChange: (v) => setCreateForm({ ...createForm, currency: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "MAD", children: "MAD" }), _jsx(SelectItem, { value: "EUR", children: "EUR" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Due Date *" }), _jsx(Input, { type: "date", value: createForm.dueDate, onChange: (e) => setCreateForm({ ...createForm, dueDate: e.target.value }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Invoice File (PDF)" }), _jsxs("label", { className: "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground w-fit", children: [_jsx(Upload, { className: "w-4 h-4" }), uploading
                                            ? "Uploading..."
                                            : createForm.invoiceUrl
                                                ? "Uploaded ✓"
                                                : "Upload invoice", _jsx("input", { type: "file", className: "hidden", accept: ".pdf,.jpg,.png", onChange: (e) => handleUploadInvoice(e), disabled: uploading })] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Notes" }), _jsx(Textarea, { value: createForm.notes, onChange: (e) => setCreateForm({ ...createForm, notes: e.target.value }) })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowCreateForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => createMutation.mutate({
                                        supplierId: createForm.supplierId,
                                        projectId: createForm.projectId || undefined,
                                        invoiceNumber: createForm.invoiceNumber,
                                        amount: createForm.amount,
                                        dueDate: createForm.dueDate,
                                        currency: createForm.currency || undefined,
                                        notes: createForm.notes || undefined,
                                    }), disabled: createMutation.isPending ||
                                        !createForm.supplierId ||
                                        !createForm.invoiceNumber ||
                                        !createForm.amount ||
                                        !createForm.dueDate, children: createMutation.isPending ? "Saving..." : "Create Payment" })] })] }) }), _jsx(FormDialog, { open: showPayForm, onOpenChange: setShowPayForm, title: `Pay — ${getSupplierName(selectedPayment?.supplierId)}`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-3 rounded-lg bg-muted/30 grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Invoice:" }), " ", _jsx("span", { className: "font-medium", children: selectedPayment?.invoiceNumber })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Total:" }), " ", _jsx("span", { className: "font-medium", children: fmt(selectedPayment?.amount, selectedPayment?.currency) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Already paid:" }), " ", _jsx("span", { className: "font-medium text-success", children: fmt(selectedPayment?.amountPaid, selectedPayment?.currency) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Remaining:" }), " ", _jsx("span", { className: "font-bold text-warning", children: fmt(selectedPayment?.remaining ?? selectedPayment?.amount, selectedPayment?.currency) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Amount to Pay *" }), _jsx(Input, { type: "number", min: 0, max: selectedPayment?.remaining ?? selectedPayment?.amount ?? 0, value: payForm.amount || "", onChange: (e) => setPayForm({
                                        ...payForm,
                                        amount: parseFloat(e.target.value) || 0,
                                    }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Payment Method *" }), _jsxs(Select, { value: payForm.paymentMethod, onValueChange: (v) => setPayForm({
                                        ...payForm,
                                        paymentMethod: v,
                                    }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "bank_transfer", children: "Bank Transfer" }), _jsx(SelectItem, { value: "check", children: "Check" }), _jsx(SelectItem, { value: "cash", children: "Cash" }), _jsx(SelectItem, { value: "credit_card", children: "Credit Card" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Transaction Reference" }), _jsx(Input, { value: payForm.transactionReference, onChange: (e) => setPayForm({ ...payForm, transactionReference: e.target.value }), placeholder: "Bank ref, check number\u2026" })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowPayForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => payMutation.mutate({
                                        id: selectedPayment.id,
                                        body: {
                                            amount: payForm.amount,
                                            paymentMethod: payForm.paymentMethod,
                                            transactionReference: payForm.transactionReference || undefined,
                                        },
                                    }), disabled: payMutation.isPending || !payForm.amount, children: payMutation.isPending ? "Processing..." : "Confirm Payment" })] })] }) })] }));
}
