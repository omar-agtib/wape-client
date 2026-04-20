import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
export default function DataTable({ columns, data, isLoading, onRowClick, emptyMessage = "No data found", }) {
    if (isLoading) {
        return (_jsx("div", { className: "rounded-lg border border-border bg-card overflow-hidden", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsx(TableRow, { className: "bg-muted/50", children: columns.map((col, i) => (_jsx(TableHead, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: col.header }, i))) }) }), _jsx(TableBody, { children: Array(5)
                            .fill(0)
                            .map((_, i) => (_jsx(TableRow, { children: columns.map((_, j) => (_jsx(TableCell, { children: _jsx(Skeleton, { className: "h-4 w-24" }) }, j))) }, i))) })] }) }));
    }
    return (_jsx("div", { className: "rounded-lg border border-border bg-card overflow-hidden", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsx(TableRow, { className: "bg-muted/50 hover:bg-muted/50", children: columns.map((col, i) => (_jsx(TableHead, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: col.header }, i))) }) }), _jsx(TableBody, { children: data.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: columns.length, className: "text-center py-12 text-muted-foreground", children: emptyMessage }) })) : (data.map((row, i) => (_jsx(TableRow, { className: onRowClick ? "cursor-pointer hover:bg-muted/30" : "", onClick: () => onRowClick?.(row), children: columns.map((col, j) => (_jsx(TableCell, { className: "text-sm", children: col.cell
                                ? col.cell(row)
                                : col.accessor !== undefined
                                    ? String(row[col.accessor] ?? "")
                                    : null }, j))) }, row.id ?? i)))) })] }) }));
}
