import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { stockService } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const TYPE_COLORS = {
    IN: "bg-success/10 text-success border-success/20",
    OUT: "bg-destructive/10 text-destructive border-destructive/20",
    RESERVED: "bg-warning/10 text-warning border-warning/20",
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function Stock() {
    const [search, setSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [showDetail, setShowDetail] = useState(null);
    // ── Query
    const { data: movementsData, isLoading } = useQuery({
        queryKey: ["stock-movements"],
        queryFn: () => stockService.movements({ limit: 100 }),
    });
    const movements = (movementsData?.items ?? []);
    // ── Filtering
    const filtered = movements.filter((m) => {
        const matchSearch = !search ||
            m.articleName?.toLowerCase().includes(search.toLowerCase()) ||
            m.projectName?.toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === "all" || m.movementType === typeFilter;
        const matchDate = !dateFilter ||
            m.date === dateFilter ||
            m.createdAt?.startsWith(dateFilter);
        return matchSearch && matchType && matchDate;
    });
    // ── Columns
    const columns = [
        {
            header: "Date",
            cell: (row) => {
                const d = row.date ?? row.createdAt;
                return d ? format(new Date(d), "MMM d, yyyy") : "—";
            },
        },
        {
            header: "Article",
            cell: (row) => (_jsx("span", { className: "font-medium", children: row.articleName ?? "—" })),
        },
        {
            header: "Type",
            cell: (row) => (_jsx(Badge, { variant: "outline", className: `text-xs ${TYPE_COLORS[row.movementType] ?? ""}`, children: row.movementType })),
        },
        {
            header: "Quantity",
            cell: (row) => {
                const color = row.movementType === "IN"
                    ? "text-success"
                    : row.movementType === "RESERVED"
                        ? "text-warning"
                        : "text-destructive";
                const sign = row.movementType === "IN"
                    ? "+"
                    : row.movementType === "RESERVED"
                        ? "~"
                        : "-";
                return (_jsxs("span", { className: `font-semibold ${color}`, children: [sign, row.quantity] }));
            },
        },
        {
            header: "Project",
            cell: (row) => (_jsx("span", { className: "text-xs text-muted-foreground", children: row.projectName ?? "—" })),
        },
        {
            header: "Notes",
            cell: (row) => (_jsx("span", { className: "text-xs text-muted-foreground truncate max-w-[120px] block", children: row.notes ?? "—" })),
        },
        {
            header: "",
            cell: (row) => (_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setShowDetail(row), children: _jsx(Eye, { className: "w-4 h-4" }) })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(PageHeader, { title: "Stock Movements", subtitle: `${movements.length} movements`, searchValue: search, onSearch: setSearch, children: [_jsx(Input, { type: "date", className: "w-36 bg-card h-9", value: dateFilter, onChange: (e) => setDateFilter(e.target.value) }), _jsxs(Select, { value: typeFilter, onValueChange: (v) => setTypeFilter(v), children: [_jsx(SelectTrigger, { className: "w-32 bg-card", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), _jsx(SelectItem, { value: "IN", children: "IN" }), _jsx(SelectItem, { value: "OUT", children: "OUT" }), _jsx(SelectItem, { value: "RESERVED", children: "RESERVED" })] })] })] }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), showDetail && (_jsx(FormDialog, { open: !!showDetail, onOpenChange: () => setShowDetail(null), title: "Movement Details", children: _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Article:" }), " ", _jsx("span", { className: "font-medium", children: showDetail.articleName ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Type:" }), " ", _jsx("span", { className: "font-medium", children: showDetail.movementType })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Quantity:" }), " ", _jsx("span", { className: "font-medium", children: showDetail.quantity })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Date:" }), " ", _jsx("span", { className: "font-medium", children: showDetail.date || showDetail.createdAt
                                                ? format(new Date((showDetail.date ?? showDetail.createdAt)), "MMM d, yyyy")
                                                : "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Project:" }), " ", _jsx("span", { className: "font-medium", children: showDetail.projectName ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Task:" }), " ", _jsx("span", { className: "font-medium", children: showDetail.taskName ?? "—" })] })] }), showDetail.notes && (_jsxs("div", { className: "p-3 rounded-lg bg-muted/30", children: [_jsx("p", { className: "text-muted-foreground text-xs mb-1", children: "Notes" }), _jsx("p", { children: showDetail.notes })] }))] }) }))] }));
}
