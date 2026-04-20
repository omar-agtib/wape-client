import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Eye, Upload, X, ExternalLink } from "lucide-react";
import { contactsService, projectsService, uploadService, } from "@/services/wape.service";
import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
const defaultForm = {
    legalName: "",
    ifNumber: "",
    iceNumber: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function ClientsPage() {
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [viewingClient, setViewingClient] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [pendingDocs, setPendingDocs] = useState([]);
    const queryClient = useQueryClient();
    // ── Queries
    const { data: clientsData, isLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: () => contactsService.listClients({ limit: 100 }),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const { data: viewingDocsData } = useQuery({
        queryKey: ["contact-docs", viewingClient?.id],
        queryFn: () => contactsService.listDocuments(viewingClient.id),
        enabled: !!viewingClient?.id,
    });
    const clients = clientsData?.items ?? [];
    const projects = (projectsData?.items ?? []);
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
                    contactType: "client",
                    legalName: data.legalName,
                    ifNumber: data.ifNumber || undefined,
                    iceNumber: data.iceNumber || undefined,
                    email: data.email || undefined,
                    phone: data.phone || undefined,
                    address: data.address || undefined,
                };
                contact = await contactsService.create(payload);
            }
            // Attach pending documents
            for (const doc of pendingDocs) {
                await contactsService.addDocument(contact.id, doc);
            }
            return contact;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            setShowForm(false);
            setEditing(null);
            setPendingDocs([]);
        },
    });
    // ── Helpers
    const openForm = (client) => {
        setEditing(client ?? null);
        setPendingDocs([]);
        setForm(client
            ? {
                legalName: client.legalName ?? "",
                ifNumber: client.ifNumber ?? "",
                iceNumber: client.iceNumber ?? "",
                email: client.email ?? "",
                phone: client.phone ?? "",
                address: client.address ?? "",
                notes: "",
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
    const filtered = clients.filter((c) => !search || c.legalName?.toLowerCase().includes(search.toLowerCase()));
    const clientProjects = viewingClient
        ? projects.filter((p) => p.clientId === viewingClient.id)
        : [];
    // ── Columns
    const columns = [
        {
            header: "Client",
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
            header: "Projects",
            cell: (row) => {
                const count = projects.filter((p) => p.clientId === row.id).length;
                return (_jsxs(Badge, { variant: "outline", className: "text-xs", children: [count, " projects"] }));
            },
        },
        {
            header: "",
            cell: (row) => (_jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setViewingClient(row), children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 text-xs", onClick: () => openForm(row), children: "Edit" })] })),
        },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(PageHeader, { title: "Clients", subtitle: `${clients.length} clients`, onAdd: () => openForm(), addLabel: "New Client", searchValue: search, onSearch: setSearch }), _jsx(DataTable, { columns: columns, data: filtered, isLoading: isLoading }), viewingClient && (_jsx(FormDialog, { open: !!viewingClient, onOpenChange: () => setViewingClient(null), title: `Client: ${viewingClient.legalName}`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "IF:" }), " ", _jsx("span", { className: "font-medium", children: viewingClient.ifNumber ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "ICE:" }), " ", _jsx("span", { className: "font-medium", children: viewingClient.iceNumber ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Email:" }), " ", _jsx("span", { className: "font-medium", children: viewingClient.email ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Phone:" }), " ", _jsx("span", { className: "font-medium", children: viewingClient.phone ?? "—" })] }), _jsxs("div", { className: "col-span-2", children: [_jsx("span", { className: "text-muted-foreground", children: "Address:" }), " ", _jsx("span", { className: "font-medium", children: viewingClient.address ?? "—" })] })] }), viewingDocs.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-semibold text-sm mb-2", children: ["Documents (", viewingDocs.length, ")"] }), _jsx("div", { className: "space-y-1", children: viewingDocs.map((doc, i) => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded bg-muted/30 text-xs", children: [_jsx("span", { className: "flex-1 truncate", children: doc.documentName ?? doc.name }), doc.fileUrl && (_jsx("a", { href: doc.fileUrl, target: "_blank", rel: "noopener noreferrer", children: _jsx(ExternalLink, { className: "w-3 h-3 text-primary" }) }))] }, i))) })] })), _jsxs("div", { children: [_jsxs("h4", { className: "font-semibold text-sm mb-2", children: ["Projects (", clientProjects.length, ")"] }), clientProjects.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No projects linked to this client." })) : (_jsx("div", { className: "space-y-2", children: clientProjects.map((p) => (_jsxs("div", { className: "p-2 rounded-lg bg-muted/30 text-sm", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "font-medium", children: p.name }), _jsx(StatusBadge, { status: p.status })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: p.progress ?? 0, className: "h-1.5 flex-1" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [p.progress ?? 0, "%"] })] })] }, p.id))) }))] })] }) })), _jsx(FormDialog, { open: showForm, onOpenChange: setShowForm, title: editing ? "Edit Client" : "New Client", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Legal Name *" }), _jsx(Input, { value: form.legalName, onChange: (e) => setForm({ ...form, legalName: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "IF (Fiscal Identifier)" }), _jsx(Input, { value: form.ifNumber, onChange: (e) => setForm({ ...form, ifNumber: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "ICE (Company ID)" }), _jsx(Input, { value: form.iceNumber, onChange: (e) => setForm({ ...form, iceNumber: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Email" }), _jsx(Input, { type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Phone" }), _jsx(Input, { value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { children: "Address" }), _jsx(Input, { value: form.address, onChange: (e) => setForm({ ...form, address: e.target.value }) })] }), _jsxs("div", { className: "col-span-2", children: [_jsx(Label, { className: "mb-1 block", children: "Documents" }), _jsxs("label", { className: "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground w-fit", children: [_jsx(Upload, { className: "w-4 h-4" }), uploading ? "Uploading..." : "Upload document", _jsx("input", { type: "file", className: "hidden", onChange: handleUploadDoc, disabled: uploading })] }), _jsx("div", { className: "mt-2 space-y-1", children: pendingDocs.map((doc, i) => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded bg-muted/30 text-xs", children: [_jsx("span", { className: "flex-1 truncate", children: doc.documentName }), _jsx(X, { className: "w-3 h-3 cursor-pointer text-muted-foreground", onClick: () => setPendingDocs((prev) => prev.filter((_, idx) => idx !== i)) })] }, i))) })] }), _jsxs("div", { className: "col-span-2 flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => saveMutation.mutate(form), disabled: saveMutation.isPending || !form.legalName, children: saveMutation.isPending ? "Saving..." : "Save Client" })] })] }) })] }));
}
