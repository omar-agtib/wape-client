import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Package } from "lucide-react";
import { receptionsService, purchaseOrdersService, personnelService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const STATUS_COLORS = {
    pending: "bg-warning/10 text-warning border-warning/20",
    partial: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    complete: "bg-success/10 text-success border-success/20",
    received: "bg-success/10 text-success border-success/20",
};
const STATUS_LABELS = {
    pending: "Pending Reception",
    partial: "Partial Reception",
    complete: "Reception Completed",
    received: "Received",
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function ReceptionPage() {
    const [search, setSearch] = useState("");
    const [showReceiveForm, setShowReceiveForm] = useState(false);
    const [selectedReception, setSelectedReception] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [receiveForm, setReceiveForm] = useState({
        receptionId: "",
        receivedQuantity: 0,
        notes: "",
        receivedBy: "",
    });
    const queryClient = useQueryClient();
    // ── Queries
    const { data: receptionsData, isLoading } = useQuery({
        queryKey: ["receptions"],
        queryFn: () => receptionsService.list({ limit: 100 }),
    });
    const { data: purchaseOrdersData } = useQuery({
        queryKey: ["purchase-orders"],
        queryFn: () => purchaseOrdersService.list({ limit: 100 }),
    });
    const { data: personnelData } = useQuery({
        queryKey: ["personnel"],
        queryFn: () => personnelService.list({ limit: 100 }),
    });
    const personnelList = (personnelData?.items ?? []);
    const receptions = (receptionsData?.items ?? []);
    const purchaseOrders = (purchaseOrdersData?.items ?? []);
    // ── Mutations
    const receiveMutation = useMutation({
        mutationFn: ({ id, body, }) => receptionsService.receive(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["receptions"] });
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            setShowReceiveForm(false);
            setSelectedReception(null);
            setSelectedItem(null);
        },
    });
    // ── Helpers
    const openReceiveForm = (reception, item) => {
        setSelectedReception(reception);
        setSelectedItem(item ?? null);
        setReceiveForm({
            receptionId: item?.id ?? reception.id,
            receivedQuantity: item?.remainingQuantity ?? 0,
            notes: "",
            receivedBy: "",
        });
        setShowReceiveForm(true);
    };
    const getPORef = (poId) => {
        const po = purchaseOrders.find((p) => p.id === poId);
        return po ? `PO-${po.id.slice(-6).toUpperCase()}` : (poId ?? "—");
    };
    // ── Filtering
    const filtered = receptions.filter((r) => !search ||
        r.purchaseOrderId?.toLowerCase().includes(search.toLowerCase()) ||
        r.id?.toLowerCase().includes(search.toLowerCase()));
    // ── Columns
    const columns = [
        {
            header: "Reception",
            cell: (row) => (_jsxs("div", { children: [_jsxs("p", { className: "font-medium text-foreground", children: ["REC-", row.id?.slice(-6).toUpperCase()] }), _jsx("p", { className: "text-xs text-muted-foreground", children: getPORef(row.purchaseOrderId) })] })),
        },
        {
            header: "Date",
            cell: (row) => row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "—",
        },
        {
            header: "Items",
            cell: (row) => (_jsxs("span", { className: "text-xs", children: [row.items?.length ?? 0, " articles"] })),
        },
        {
            header: "Status",
            cell: (row) => (_jsx(Badge, { variant: "outline", className: `text-xs ${STATUS_COLORS[row.status ?? ""] ?? ""}`, children: STATUS_LABELS[row.status ?? ""] ?? row.status ?? "—" })),
        },
        {
            header: "",
            cell: (row) => row.status !== "completed" && row.status !== "received" ? (_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: () => openReceiveForm(row), children: "Process" })) : (_jsx("span", { className: "text-xs text-success font-medium", children: "Done" })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(PageHeader, { title: "Reception", subtitle: `${receptions.length} receptions`, searchValue: search, onSearch: setSearch }), receptions.length === 0 && !isLoading && (_jsxs("div", { className: "p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground text-center", children: ["Receptions are created automatically when a Purchase Order is confirmed. Go to", " ", _jsx("a", { href: "/purchase-orders", className: "text-primary underline", children: "Purchase Orders" }), " ", "and click Confirm to generate receptions."] })), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), _jsx(FormDialog, { open: showReceiveForm, onOpenChange: setShowReceiveForm, title: selectedReception
                    ? `Process Reception — REC-${selectedReception.id?.slice(-6).toUpperCase()}`
                    : "Process Reception", children: _jsxs("div", { className: "space-y-4", children: [selectedReception?.items && selectedReception.items.length > 0 && (_jsxs("div", { children: [_jsx(Label, { className: "mb-2 block", children: "Reception Lines" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2", children: [_jsx("span", { className: "col-span-5", children: "Article" }), _jsx("span", { className: "col-span-3", children: "Ordered" }), _jsx("span", { className: "col-span-4", children: "Received" })] }), selectedReception.items.map((item) => (_jsxs("div", { className: "grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/30", children: [_jsxs("span", { className: "col-span-5 text-sm flex items-center gap-1", children: [_jsx(Package, { className: "w-3 h-3 text-muted-foreground" }), item.articleName ?? item.articleId] }), _jsx("span", { className: "col-span-3 text-sm font-medium", children: item.orderedQuantity ?? "—" }), _jsx("span", { className: "col-span-3 text-sm text-success font-medium", children: item.receivedQuantity ?? 0 }), item.status !== "complete" && (_jsx(Button, { variant: "ghost", size: "sm", className: "col-span-1 h-6 text-xs p-1", onClick: () => openReceiveForm(selectedReception, item), children: "\u2713" }))] }, item.id)))] })] })), _jsxs("div", { children: [_jsxs(Label, { children: ["Received Quantity", selectedItem ? ` for ${selectedItem.articleName}` : "", "*"] }), _jsx(Input, { type: "number", min: 0, value: receiveForm.receivedQuantity, onChange: (e) => setReceiveForm({
                                        ...receiveForm,
                                        receivedQuantity: parseFloat(e.target.value) || 0,
                                    }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Notes" }), _jsx(Textarea, { value: receiveForm.notes, onChange: (e) => setReceiveForm({ ...receiveForm, notes: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Received By" }), _jsxs(Select, { value: receiveForm.receivedBy, onValueChange: (v) => setReceiveForm({ ...receiveForm, receivedBy: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select person" }) }), _jsx(SelectContent, { children: personnelList.map((p) => (_jsx(SelectItem, { value: p.id, children: p.fullName }, p.id))) })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowReceiveForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => receiveMutation.mutate({
                                        id: receiveForm.receptionId,
                                        body: {
                                            receivedQuantity: receiveForm.receivedQuantity,
                                            notes: receiveForm.notes,
                                            receivedBy: receiveForm.receivedBy,
                                        },
                                    }), disabled: receiveMutation.isPending || receiveForm.receivedQuantity <= 0, children: receiveMutation.isPending
                                        ? "Processing..."
                                        : "Validate Reception" })] })] }) })] }));
}
