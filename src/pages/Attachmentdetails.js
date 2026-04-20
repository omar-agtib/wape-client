import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, Package, Users, Wrench, FileText, Info, } from "lucide-react";
import { attachmentsService, projectsService, contactsService, tasksService, } from "@/services/wape.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import { useState } from "react";
// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(amount, currency = "MAD") {
    if (!amount)
        return "—";
    return `${amount.toLocaleString()} ${currency}`;
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function AttachmentDetails() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [showConfirmForm, setShowConfirmForm] = useState(false);
    const [confirmForm, setConfirmForm] = useState({
        personnelCost: 0,
        articlesCost: 0,
        toolsCost: 0,
    });
    // ── Queries
    const { data: attachmentRaw, isLoading } = useQuery({
        queryKey: ["attachment", id],
        queryFn: () => attachmentsService.get(id),
        enabled: !!id,
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const { data: subcontractorsData } = useQuery({
        queryKey: ["subcontractors"],
        queryFn: () => contactsService.listSubcontractors({ limit: 100 }),
    });
    const { data: tasksData } = useQuery({
        queryKey: ["tasks"],
        queryFn: () => tasksService.list({ limit: 100 }),
    });
    const attachment = attachmentRaw;
    const projects = (projectsData?.items ?? []);
    const subcontractors = (subcontractorsData?.items ?? []);
    const allTasks = (tasksData?.items ?? []);
    // ── Mutations
    const confirmMutation = useMutation({
        mutationFn: (body) => attachmentsService.confirm(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attachment", id] });
            queryClient.invalidateQueries({ queryKey: ["attachments"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            setShowConfirmForm(false);
        },
    });
    // ── Helpers
    const project = projects.find((p) => p.id === attachment?.projectId);
    const subcontractor = subcontractors.find((s) => s.id === attachment?.subcontractorId);
    // Resolve tasks — prefer embedded, fallback to lookup
    const attachedTasks = attachment?.tasks?.length
        ? attachment.tasks
        : (attachment?.taskIds ?? []).map((tid) => {
            const t = allTasks.find((x) => x.id === tid);
            return {
                id: tid,
                name: t?.name ?? tid,
                status: t?.status,
                estimatedCost: t?.estimatedCost,
                progress: t?.progress,
            };
        });
    const totalCost = attachment?.totalCost ??
        (attachment?.personnelCost ?? 0) +
            (attachment?.articlesCost ?? 0) +
            (attachment?.toolsCost ?? 0);
    const totalConfirm = confirmForm.personnelCost +
        confirmForm.articlesCost +
        confirmForm.toolsCost;
    const canConfirm = attachment?.status === "draft" || attachment?.status === "pending";
    // ── Loading
    if (isLoading) {
        return (_jsx("div", { className: "text-center py-12 text-muted-foreground", children: "Loading\u2026" }));
    }
    if (!attachment) {
        return (_jsx("div", { className: "text-center py-12 text-muted-foreground", children: "Attachment not found." }));
    }
    // ── Render
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Link, { to: "/attachments", children: _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(ArrowLeft, { className: "w-4 h-4" }) }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-xl font-bold text-foreground", children: attachment.title }), _jsx("p", { className: "text-sm text-muted-foreground", children: project?.name ?? attachment.projectId ?? "—" })] }), _jsx(StatusBadge, { status: attachment.status ?? "draft" }), canConfirm && (_jsxs(Button, { onClick: () => {
                            setConfirmForm({
                                personnelCost: attachment.personnelCost ?? 0,
                                articlesCost: attachment.articlesCost ?? 0,
                                toolsCost: attachment.toolsCost ?? 0,
                            });
                            setShowConfirmForm(true);
                        }, children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Confirm"] }))] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs("div", { className: "lg:col-span-2 space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(Info, { className: "w-4 h-4" }), " Details"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Project:" }), " ", _jsx("span", { className: "font-medium", children: project?.name ?? "—" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Subcontractor:" }), " ", _jsx("span", { className: "font-medium", children: subcontractor?.legalName ?? "Internal" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Currency:" }), " ", _jsx("span", { className: "font-medium", children: attachment.currency ?? "MAD" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Created:" }), " ", _jsx("span", { className: "font-medium", children: attachment.createdAt
                                                                ? format(new Date(attachment.createdAt), "MMM d, yyyy")
                                                                : "—" })] }), attachment.confirmedAt && (_jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Confirmed:" }), " ", _jsx("span", { className: "font-medium", children: format(new Date(attachment.confirmedAt), "MMM d, yyyy") })] })), _jsxs("div", { children: [_jsx("span", { className: "text-muted-foreground", children: "Tasks:" }), " ", _jsxs("span", { className: "font-medium", children: [attachedTasks.length, " task(s)"] })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(FileText, { className: "w-4 h-4" }), " Attached Tasks (", attachedTasks.length, ")"] }) }), _jsx(CardContent, { children: attachedTasks.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "No tasks" })) : (_jsx("div", { className: "space-y-2", children: attachedTasks.map((t) => (_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/30", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: t.name ?? t.id }), t.estimatedCost != null && (_jsxs("p", { className: "text-xs text-muted-foreground", children: ["Est. ", fmt(t.estimatedCost, attachment.currency)] }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [t.progress != null && (_jsxs("span", { className: "text-xs text-muted-foreground", children: [t.progress, "%"] })), t.status && _jsx(StatusBadge, { status: t.status })] })] }, t.id))) })) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Cost Summary" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/30", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-sm", children: "Personnel" })] }), _jsx("span", { className: "text-sm font-semibold", children: fmt(attachment.personnelCost, attachment.currency) })] }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/30", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Package, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-sm", children: "Articles" })] }), _jsx("span", { className: "text-sm font-semibold", children: fmt(attachment.articlesCost, attachment.currency) })] }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/30", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Wrench, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-sm", children: "Tools" })] }), _jsx("span", { className: "text-sm font-semibold", children: fmt(attachment.toolsCost, attachment.currency) })] }), _jsxs("div", { className: "p-3 rounded-lg bg-primary/5 border border-primary/20 flex justify-between items-center", children: [_jsx("span", { className: "text-sm font-bold", children: "Total" }), _jsx("span", { className: "text-lg font-bold text-primary", children: fmt(totalCost, attachment.currency) })] })] })] }), attachment.invoice && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Generated Invoice" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Number:" }), _jsx("span", { className: "font-medium", children: attachment.invoice.invoiceNumber ?? "—" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Status:" }), _jsx(StatusBadge, { status: attachment.invoice.status ?? "—" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Amount:" }), _jsx("span", { className: "font-bold text-primary", children: fmt(attachment.invoice.amount, attachment.currency) })] }), attachment.invoice.pdfUrl && (_jsx("a", { href: attachment.invoice.pdfUrl, target: "_blank", rel: "noopener noreferrer", children: _jsx(Button, { variant: "outline", size: "sm", className: "w-full mt-2 text-xs", children: "Download PDF" }) }))] }) })] }))] })] }), _jsx(FormDialog, { open: showConfirmForm, onOpenChange: setShowConfirmForm, title: `Confirm — ${attachment.title}`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm", children: [_jsx(Info, { className: "w-4 h-4 text-primary mt-0.5 shrink-0" }), _jsx("p", { className: "text-muted-foreground", children: subcontractor
                                        ? "Confirming will auto-generate an invoice for the subcontractor."
                                        : "Enter the actual costs for this internal attachment." })] }), !subcontractor && (_jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-xs", children: "Personnel Cost" }), _jsx(Input, { type: "number", min: 0, value: confirmForm.personnelCost, onChange: (e) => setConfirmForm({
                                                ...confirmForm,
                                                personnelCost: parseFloat(e.target.value) || 0,
                                            }) })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs", children: "Articles Cost" }), _jsx(Input, { type: "number", min: 0, value: confirmForm.articlesCost, onChange: (e) => setConfirmForm({
                                                ...confirmForm,
                                                articlesCost: parseFloat(e.target.value) || 0,
                                            }) })] }), _jsxs("div", { children: [_jsx(Label, { className: "text-xs", children: "Tools Cost" }), _jsx(Input, { type: "number", min: 0, value: confirmForm.toolsCost, onChange: (e) => setConfirmForm({
                                                ...confirmForm,
                                                toolsCost: parseFloat(e.target.value) || 0,
                                            }) })] }), _jsxs("div", { className: "col-span-3 p-2 rounded-lg bg-muted/30 text-center", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Total" }), _jsxs("p", { className: "text-lg font-bold text-primary", children: [totalConfirm.toLocaleString(), " ", attachment.currency ?? "MAD"] })] })] })), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowConfirmForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => confirmMutation.mutate(subcontractor
                                        ? undefined
                                        : {
                                            personnelCost: confirmForm.personnelCost,
                                            articlesCost: confirmForm.articlesCost,
                                            toolsCost: confirmForm.toolsCost,
                                        }), disabled: confirmMutation.isPending, children: confirmMutation.isPending
                                        ? "Confirming..."
                                        : "Confirm & Validate" })] })] }) })] }));
}
