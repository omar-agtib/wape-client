import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
export default function PageHeader({ title, subtitle, onAdd, addLabel, searchValue, onSearch, children, }) {
    return (_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", children: [_jsxs("div", { children: [title && _jsx("h1", { className: "text-xl font-semibold", children: title }), subtitle && (_jsx("p", { className: "text-sm text-muted-foreground", children: subtitle }))] }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [onSearch && (_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search...", value: searchValue || "", onChange: (e) => onSearch(e.target.value), className: "pl-9 w-48 bg-card" })] })), children, onAdd && (_jsxs(Button, { onClick: onAdd, className: "bg-primary hover:bg-primary/90", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), addLabel || "Add New"] }))] })] }));
}
