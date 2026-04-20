import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, CheckCircle2, Building2, HardHat, CreditCard, Search, X, } from "lucide-react";
import { financeService, contactsService, projectsService, } from "@/services/wape.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormDialog from "@/components/shared/FormDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const defaultCreateSub = {
    subcontractorId: "",
    projectId: "",
    contractAmount: 0,
    currency: "MAD",
    notes: "",
};
const defaultPaySub = {
    amount: 0,
    paymentMethod: "bank_transfer",
    transactionReference: "",
};
function fmt(amount, currency = "MAD") {
    if (amount == null)
        return "—";
    return `${amount.toLocaleString()} ${currency}`;
}
const METHOD_LABELS = {
    credit_card: "Credit Card",
    bank_transfer: "Bank Transfer",
    check: "Check",
    cash: "Cash",
};
const TYPE_ICONS = {
    subscription: CreditCard,
    supplier: Building2,
    subcontractor: HardHat,
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("transactions");
    const [typeFilter, setTypeFilter] = useState("all");
    const [showCreateSub, setShowCreateSub] = useState(false);
    const [showPaySub, setShowPaySub] = useState(false);
    const [selectedSub, setSelectedSub] = useState(null);
    const [createSubForm, setCreateSubForm] = useState(defaultCreateSub);
    const [paySubForm, setPaySubForm] = useState(defaultPaySub);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: transactionsData, isLoading: loadingTx } = useQuery({
        queryKey: ["transactions", typeFilter],
        queryFn: () => financeService.listTransactions({
            limit: 100,
            paymentType: typeFilter !== "all"
                ? typeFilter
                : undefined,
        }),
    });
    const { data: subPaymentsData, isLoading: loadingSub } = useQuery({
        queryKey: ["subcontractor-payments"],
        queryFn: () => financeService.listSubcontractorPayments({ limit: 100 }),
    });
    const { data: subcontractorsData } = useQuery({
        queryKey: ["subcontractors"],
        queryFn: () => contactsService.listSubcontractors({ limit: 100 }),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const transactions = useMemo(() => (transactionsData?.items ?? []), [transactionsData]);
    const subPayments = (subPaymentsData?.items ?? []);
    const subcontractors = (subcontractorsData?.items ?? []);
    const projects = (projectsData?.items ?? []);
    // ── Mutations
    const createSubMutation = useMutation({
        mutationFn: (data) => financeService.createSubcontractorPayment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subcontractor-payments"] });
            setShowCreateSub(false);
            setCreateSubForm(defaultCreateSub);
        },
    });
    const paySubMutation = useMutation({
        mutationFn: ({ id, body }) => financeService.paySubcontractor(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subcontractor-payments"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            setShowPaySub(false);
            setSelectedSub(null);
            setPaySubForm(defaultPaySub);
        },
    });
    const validateTxMutation = useMutation({
        mutationFn: (id) => financeService.validateTransaction(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    });
    // ── Helpers
    const getSubcontractorName = (id) => subcontractors.find((s) => s.id === id)?.legalName ?? "—";
    const getProjectName = (id) => projects.find((p) => p.id === id)?.name ?? "—";
    const openPaySub = (p) => {
        setSelectedSub(p);
        setPaySubForm({
            amount: p.remaining ?? p.contractAmount ?? 0,
            paymentMethod: "bank_transfer",
            transactionReference: "",
        });
        setShowPaySub(true);
    };
    // ── Filtered transactions
    const filteredTx = useMemo(() => transactions.filter((t) => {
        if (!search)
            return true;
        const q = search.toLowerCase();
        return (t.transactionReference?.toLowerCase().includes(q) ||
            t.paymentType?.toLowerCase().includes(q));
    }), [transactions, search]);
    // ── Export CSV
    const exportCSV = () => {
        const rows = [
            ["ID", "Type", "Amount", "Method", "Status", "Reference", "Date"],
            ...filteredTx.map((t) => [
                t.id?.slice(-8),
                t.paymentType ?? "—",
                `${t.amount ?? 0} ${t.currency ?? "MAD"}`,
                METHOD_LABELS[t.paymentMethod ?? ""] ?? "—",
                t.status ?? "—",
                t.transactionReference ?? "—",
                t.createdAt ? format(new Date(t.createdAt), "yyyy-MM-dd") : "—",
            ]),
        ];
        const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    // ── Render
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Transactions & Payments" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Finance \u2192 Payments" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "gap-1.5 text-xs", onClick: exportCSV, children: [_jsx(Download, { className: "w-3.5 h-3.5" }), " CSV"] }), _jsx(Button, { size: "sm", className: "gap-1.5", onClick: () => setShowCreateSub(true), children: "New Subcontractor Payment" })] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "transactions", children: ["Transactions (", transactions.length, ")"] }), _jsxs(TabsTrigger, { value: "subcontractors", children: ["Subcontractor Payments (", subPayments.length, ")"] })] }), _jsxs(TabsContent, { value: "transactions", className: "mt-4 space-y-4", children: [_jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [_jsxs("div", { className: "relative flex-1 min-w-44", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search by reference or type\u2026", className: "pl-9", value: search, onChange: (e) => setSearch(e.target.value) })] }), _jsxs(Select, { value: typeFilter, onValueChange: setTypeFilter, children: [_jsx(SelectTrigger, { className: "w-40 bg-card", children: _jsx(SelectValue, { placeholder: "All types" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), _jsx(SelectItem, { value: "subscription", children: "Subscription" }), _jsx(SelectItem, { value: "supplier", children: "Supplier" }), _jsx(SelectItem, { value: "subcontractor", children: "Subcontractor" })] })] }), (search || typeFilter !== "all") && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => {
                                            setSearch("");
                                            setTypeFilter("all");
                                        }, children: [_jsx(X, { className: "w-3 h-3 mr-1" }), " Clear"] }))] }), _jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-border bg-muted/30", children: [
                                                            "ID",
                                                            "Type",
                                                            "Amount",
                                                            "Method",
                                                            "Status",
                                                            "Reference",
                                                            "Date",
                                                            "",
                                                        ].map((h) => (_jsx("th", { className: "text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap", children: h }, h))) }) }), _jsxs("tbody", { children: [loadingTx && (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "text-center py-10 text-muted-foreground", children: "Loading\u2026" }) })), !loadingTx && filteredTx.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "text-center py-10 text-muted-foreground", children: "No transactions found" }) })), filteredTx.map((t) => {
                                                            const TypeIcon = TYPE_ICONS[t.paymentType ?? ""] ?? CreditCard;
                                                            return (_jsxs("tr", { className: "border-b border-border/50 hover:bg-muted/20 transition-colors", children: [_jsx("td", { className: "px-4 py-3 font-mono text-xs text-muted-foreground", children: t.id?.slice(-8) }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(TypeIcon, { className: "w-3.5 h-3.5 text-muted-foreground" }), _jsx("span", { className: "text-xs capitalize", children: t.paymentType })] }) }), _jsx("td", { className: "px-4 py-3 font-semibold", children: fmt(t.amount, t.currency) }), _jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: METHOD_LABELS[t.paymentMethod ?? ""] ?? "—" }), _jsx("td", { className: "px-4 py-3", children: _jsx(StatusBadge, { status: t.status ?? "pending" }) }), _jsx("td", { className: "px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate", children: t.transactionReference ?? "—" }), _jsx("td", { className: "px-4 py-3 text-xs whitespace-nowrap", children: t.createdAt
                                                                            ? format(new Date(t.createdAt), "MMM d, yyyy")
                                                                            : "—" }), _jsx("td", { className: "px-4 py-3", children: t.status === "pending" && (_jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-xs gap-1 text-success border-success/30", onClick: () => validateTxMutation.mutate(t.id), disabled: validateTxMutation.isPending, children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), " Validate"] })) })] }, t.id));
                                                        })] })] }) }) }) })] }), _jsx(TabsContent, { value: "subcontractors", className: "mt-4", children: _jsx(Card, { children: _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsx("tr", { className: "border-b border-border bg-muted/30", children: [
                                                        "Subcontractor",
                                                        "Project",
                                                        "Contract",
                                                        "Paid",
                                                        "Remaining",
                                                        "Status",
                                                        "",
                                                    ].map((h) => (_jsx("th", { className: "text-left px-4 py-3 text-xs font-semibold text-muted-foreground", children: h }, h))) }) }), _jsxs("tbody", { children: [loadingSub && (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "text-center py-10 text-muted-foreground", children: "Loading\u2026" }) })), !loadingSub && subPayments.length === 0 && (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "text-center py-10 text-muted-foreground", children: "No subcontractor payments yet" }) })), subPayments.map((p) => (_jsxs("tr", { className: "border-b border-border/50 hover:bg-muted/20 transition-colors", children: [_jsx("td", { className: "px-4 py-3 font-medium", children: getSubcontractorName(p.subcontractorId) }), _jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground", children: getProjectName(p.projectId) }), _jsx("td", { className: "px-4 py-3 font-semibold", children: fmt(p.contractAmount, p.currency) }), _jsx("td", { className: "px-4 py-3 text-success font-medium", children: fmt(p.amountPaid, p.currency) }), _jsx("td", { className: "px-4 py-3 text-warning font-medium", children: fmt(p.remaining, p.currency) }), _jsx("td", { className: "px-4 py-3", children: _jsx(StatusBadge, { status: p.status ?? "pending" }) }), _jsx("td", { className: "px-4 py-3", children: p.status !== "paid" && (_jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-xs gap-1 text-success border-success/30", onClick: () => openPaySub(p), children: [_jsx(CheckCircle2, { className: "w-3 h-3" }), " Pay"] })) })] }, p.id)))] })] }) }) }) }) })] }), _jsx(FormDialog, { open: showCreateSub, onOpenChange: setShowCreateSub, title: "New Subcontractor Payment", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Subcontractor *" }), _jsxs(Select, { value: createSubForm.subcontractorId, onValueChange: (v) => setCreateSubForm({ ...createSubForm, subcontractorId: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select subcontractor" }) }), _jsx(SelectContent, { children: subcontractors.map((s) => (_jsx(SelectItem, { value: s.id, children: s.legalName }, s.id))) })] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Project *" }), _jsxs(Select, { value: createSubForm.projectId, onValueChange: (v) => setCreateSubForm({ ...createSubForm, projectId: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select project" }) }), _jsx(SelectContent, { children: projects.map((p) => (_jsx(SelectItem, { value: p.id, children: p.name }, p.id))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Contract Amount *" }), _jsx(Input, { type: "number", min: 0, value: createSubForm.contractAmount || "", onChange: (e) => setCreateSubForm({
                                        ...createSubForm,
                                        contractAmount: parseFloat(e.target.value) || 0,
                                    }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Currency" }), _jsxs(Select, { value: createSubForm.currency, onValueChange: (v) => setCreateSubForm({ ...createSubForm, currency: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "MAD", children: "MAD" }), _jsx(SelectItem, { value: "EUR", children: "EUR" }), _jsx(SelectItem, { value: "USD", children: "USD" })] })] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Notes" }), _jsx(Textarea, { value: createSubForm.notes, onChange: (e) => setCreateSubForm({ ...createSubForm, notes: e.target.value }) })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowCreateSub(false), children: "Cancel" }), _jsx(Button, { onClick: () => createSubMutation.mutate({
                                        subcontractorId: createSubForm.subcontractorId,
                                        projectId: createSubForm.projectId,
                                        contractAmount: createSubForm.contractAmount,
                                        currency: createSubForm.currency || undefined,
                                        notes: createSubForm.notes || undefined,
                                    }), disabled: createSubMutation.isPending ||
                                        !createSubForm.subcontractorId ||
                                        !createSubForm.projectId ||
                                        !createSubForm.contractAmount, children: createSubMutation.isPending ? "Saving..." : "Create" })] })] }) }), _jsx(FormDialog, { open: showPaySub, onOpenChange: setShowPaySub, title: `Pay — ${getSubcontractorName(selectedSub?.subcontractorId)}`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-3 rounded-lg bg-muted/30 grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Contract:" }), " ", _jsx("span", { className: "font-medium", children: fmt(selectedSub?.contractAmount, selectedSub?.currency) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Paid:" }), " ", _jsx("span", { className: "font-medium text-success", children: fmt(selectedSub?.amountPaid, selectedSub?.currency) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("span", { className: "text-muted-foreground", children: "Remaining:" }), " ", _jsx("span", { className: "font-bold text-warning", children: fmt(selectedSub?.remaining, selectedSub?.currency) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Amount to Pay *" }), _jsx(Input, { type: "number", min: 0, value: paySubForm.amount || "", onChange: (e) => setPaySubForm({
                                        ...paySubForm,
                                        amount: parseFloat(e.target.value) || 0,
                                    }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Payment Method *" }), _jsxs(Select, { value: paySubForm.paymentMethod, onValueChange: (v) => setPaySubForm({
                                        ...paySubForm,
                                        paymentMethod: v,
                                    }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "bank_transfer", children: "Bank Transfer" }), _jsx(SelectItem, { value: "check", children: "Check" }), _jsx(SelectItem, { value: "cash", children: "Cash" }), _jsx(SelectItem, { value: "credit_card", children: "Credit Card" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Transaction Reference" }), _jsx(Input, { value: paySubForm.transactionReference, onChange: (e) => setPaySubForm({
                                        ...paySubForm,
                                        transactionReference: e.target.value,
                                    }), placeholder: "Bank ref, check number\u2026" })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowPaySub(false), children: "Cancel" }), _jsx(Button, { onClick: () => paySubMutation.mutate({
                                        id: selectedSub.id,
                                        body: {
                                            amount: paySubForm.amount,
                                            paymentMethod: paySubForm.paymentMethod,
                                            transactionReference: paySubForm.transactionReference || undefined,
                                        },
                                    }), disabled: paySubMutation.isPending || !paySubForm.amount, children: paySubMutation.isPending ? "Processing..." : "Confirm Payment" })] })] }) })] }));
}
