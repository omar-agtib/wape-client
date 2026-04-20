import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { personnelService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const defaultForm = {
    fullName: "",
    role: "",
    costPerHour: 0,
    currency: "MAD",
    email: "",
    phone: "",
    address: "",
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function Personnel() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: personnelData, isLoading } = useQuery({
        queryKey: ["personnel"],
        queryFn: () => personnelService.list({ limit: 100 }),
    });
    const personnelList = personnelData?.items ?? [];
    // ── Mutations
    const saveMutation = useMutation({
        mutationFn: (data) => editing
            ? personnelService.update(editing.id, data)
            : personnelService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["personnel"] });
            setShowForm(false);
            setEditing(null);
        },
    });
    // ── Helpers
    const openForm = (person) => {
        setEditing(person ?? null);
        setForm(person
            ? {
                fullName: person.fullName ?? "",
                role: person.role ?? "",
                costPerHour: person.costPerHour ?? 0,
                currency: person.currency ?? "MAD",
                email: person.email ?? "",
                phone: person.phone ?? "",
                address: person.address ?? "",
            }
            : defaultForm);
        setShowForm(true);
    };
    const handleSave = () => {
        if (editing) {
            const payload = {
                fullName: form.fullName || undefined,
                role: form.role || undefined,
                costPerHour: form.costPerHour,
                currency: form.currency,
                email: form.email || undefined,
                phone: form.phone || undefined,
                address: form.address || undefined,
            };
            saveMutation.mutate(payload);
        }
        else {
            const payload = {
                fullName: form.fullName,
                role: form.role,
                costPerHour: form.costPerHour,
                currency: form.currency,
                email: form.email || undefined,
                phone: form.phone || undefined,
                address: form.address || undefined,
            };
            saveMutation.mutate(payload);
        }
    };
    // ── Filtering
    const filtered = personnelList.filter((p) => {
        const matchSearch = !search ||
            p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            p.role?.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || p.role === roleFilter;
        return matchSearch && matchRole;
    });
    // Derive unique roles for filter
    const uniqueRoles = Array.from(new Set(personnelList.map((p) => p.role).filter(Boolean)));
    // ── Columns
    const columns = [
        {
            header: "Name",
            cell: (row) => (_jsxs("div", { children: [_jsx("p", { className: "font-medium text-foreground", children: row.fullName }), _jsx("p", { className: "text-xs text-muted-foreground", children: row.role })] })),
        },
        {
            header: "Cost / Hour",
            cell: (row) => (_jsxs("span", { className: "text-xs font-medium", children: [row.costPerHour?.toLocaleString(), " ", row.currency ?? "MAD"] })),
        },
        {
            header: "Contact",
            cell: (row) => (_jsxs("div", { className: "text-xs text-muted-foreground", children: [row.email && _jsx("p", { children: row.email }), row.phone && _jsx("p", { children: row.phone }), !row.email && !row.phone && _jsx("p", { children: "\u2014" })] })),
        },
        {
            header: "",
            cell: (row) => (_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: () => openForm(row), children: "Edit" })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(PageHeader, { title: "Personnel", subtitle: `${personnelList.length} employees`, onAdd: () => openForm(), addLabel: "New Employee", searchValue: search, onSearch: setSearch, children: _jsxs(Select, { value: roleFilter, onValueChange: setRoleFilter, children: [_jsx(SelectTrigger, { className: "w-36 bg-card", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Roles" }), uniqueRoles.map((role) => (_jsx(SelectItem, { value: role, children: role }, role)))] })] }) }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: editing ? "Edit Employee" : "New Employee", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Full Name *" }), _jsx(Input, { value: form.fullName, onChange: (e) => setForm({ ...form, fullName: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Role *" }), _jsx(Input, { value: form.role, onChange: (e) => setForm({ ...form, role: e.target.value }), placeholder: "e.g. Engineer, Worker, Manager" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Currency" }), _jsxs(Select, { value: form.currency, onValueChange: (v) => setForm({ ...form, currency: v }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "MAD", children: "MAD" }), _jsx(SelectItem, { value: "EUR", children: "EUR" }), _jsx(SelectItem, { value: "USD", children: "USD" }), _jsx(SelectItem, { value: "GBP", children: "GBP" })] })] })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Cost per Hour *" }), _jsx(Input, { type: "number", min: 0, value: form.costPerHour, onChange: (e) => setForm({
                                        ...form,
                                        costPerHour: parseFloat(e.target.value) || 0,
                                    }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Email" }), _jsx(Input, { type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Phone" }), _jsx(Input, { value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Address" }), _jsx(Input, { value: form.address, onChange: (e) => setForm({ ...form, address: e.target.value }) })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { onClick: handleSave, disabled: saveMutation.isPending || !form.fullName || !form.role, children: saveMutation.isPending ? "Saving..." : "Save" })] })] }) })] }));
}
