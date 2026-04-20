import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BookOpen, Video, FileText, HelpCircle, Plus, CheckCircle2, Clock, AlertCircle, LifeBuoy, GraduationCap, FolderKanban, Package, DollarSign, ChevronDown, ChevronUp, } from "lucide-react";
import { tutorialsService, supportService, } from "@/services/wape.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
// ── Static onboarding guides ──────────────────────────────────────────────────
const ONBOARDING_GUIDES = [
    {
        icon: FolderKanban,
        title: "Getting Started with Projects",
        description: "Create and manage construction projects, assign teams, and track progress.",
        category: "Projects",
        duration: "5 min",
    },
    {
        icon: CheckCircle2,
        title: "Task Management & Kanban",
        description: "Use tasks, assign resources, set deadlines, and visualize work with Kanban views.",
        category: "Tasks",
        duration: "7 min",
    },
    {
        icon: Package,
        title: "Stock & Inventory Management",
        description: "Track articles, create purchase orders, manage receptions, and monitor stock.",
        category: "Stock",
        duration: "8 min",
    },
    {
        icon: AlertCircle,
        title: "Non Conformities Workflow",
        description: "Report, assign, and resolve non-conformities. Annotate plans and link photos.",
        category: "Quality",
        duration: "6 min",
    },
    {
        icon: DollarSign,
        title: "Finance & Invoicing",
        description: "Track expenses, create invoices, and monitor project budgets.",
        category: "Finance",
        duration: "6 min",
    },
    {
        icon: FileText,
        title: "Document Centralization",
        description: "All files uploaded anywhere in the platform are automatically indexed here.",
        category: "Documents",
        duration: "4 min",
    },
];
// ── Component ─────────────────────────────────────────────────────────────────
export default function TrainingSupportPage() {
    const [tab, setTab] = useState("tutorials");
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [showMessageForm, setShowMessageForm] = useState(null);
    const [expandedTicket, setExpandedTicket] = useState(null);
    const [ticketForm, setTicketForm] = useState({
        subject: "",
        description: "",
        priority: "medium",
    });
    const [replyMessage, setReplyMessage] = useState("");
    const queryClient = useQueryClient();
    // ── Queries
    const { data: ticketsData, isLoading: loadingTickets } = useQuery({
        queryKey: ["support-tickets"],
        queryFn: () => supportService.listTickets({ limit: 50 }),
    });
    const { data: tutorialsData } = useQuery({
        queryKey: ["tutorials"],
        queryFn: () => tutorialsService.list({ limit: 50 }),
    });
    const tickets = (ticketsData?.items ?? []);
    const tutorials = (tutorialsData?.items ?? []);
    // ── Mutations
    const createTicketMutation = useMutation({
        mutationFn: (data) => supportService.createTicket(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            setShowTicketForm(false);
            setTicketForm({ subject: "", description: "", priority: "medium" });
        },
    });
    const replyMutation = useMutation({
        mutationFn: ({ id, message }) => supportService.addMessage(id, { message }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            setShowMessageForm(null);
            setReplyMessage("");
        },
    });
    // ── Stats
    const openTickets = tickets.filter((t) => t.status === "open").length;
    const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
    const closedTickets = tickets.filter((t) => t.status === "closed").length;
    // ── Render
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Training & Support" }), _jsx("p", { className: "text-sm text-muted-foreground mt-0.5", children: "Tutorials, guides and technical support" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: tab === "tutorials" ? "default" : "outline", size: "sm", className: "gap-2", onClick: () => setTab("tutorials"), children: [_jsx(GraduationCap, { className: "w-4 h-4" }), " Tutorials"] }), _jsxs(Button, { variant: tab === "support" ? "default" : "outline", size: "sm", className: "gap-2", onClick: () => setTab("support"), children: [_jsx(LifeBuoy, { className: "w-4 h-4" }), " Support"] })] })] }), tab === "tutorials" && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx(Card, { className: "bg-primary/5 border-primary/10", children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center", children: _jsx(BookOpen, { className: "w-5 h-5 text-primary" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: ONBOARDING_GUIDES.length + tutorials.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Guides available" })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-muted flex items-center justify-center", children: _jsx(Video, { className: "w-5 h-5 text-muted-foreground" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: tutorials.filter((t) => t.videoUrl).length + 6 }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Video tutorials" })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-muted flex items-center justify-center", children: _jsx(FileText, { className: "w-5 h-5 text-muted-foreground" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: "12" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Documentation pages" })] })] }) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3", children: "Onboarding Guides" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: ONBOARDING_GUIDES.map((tut, i) => (_jsxs(Card, { className: "hover:shadow-md transition-shadow cursor-pointer group", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0", children: _jsx(tut.icon, { className: "w-4 h-4 text-primary" }) }), _jsxs("div", { className: "flex-1", children: [_jsx(CardTitle, { className: "text-sm font-semibold leading-tight", children: tut.title }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx(Badge, { variant: "outline", className: "text-xs", children: tut.category }), _jsxs("span", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), " ", tut.duration] })] })] })] }) }), _jsxs(CardContent, { className: "pt-0", children: [_jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: tut.description }), _jsxs(Button, { variant: "ghost", size: "sm", className: "mt-2 h-7 text-xs w-full group-hover:bg-primary/5", children: [_jsx(Video, { className: "w-3 h-3 mr-1" }), " Watch Tutorial"] })] })] }, i))) })] }), tutorials.filter((t) => t.published).length > 0 && (_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3", children: "Platform Tutorials" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: tutorials
                                    .filter((t) => t.published)
                                    .map((tut) => (_jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-semibold", children: tut.title }), tut.category && (_jsx(Badge, { variant: "outline", className: "text-xs", children: tut.category }))] }) }), _jsx(CardContent, { className: "pt-0", children: tut.videoUrl && (_jsx("a", { href: tut.videoUrl, target: "_blank", rel: "noopener noreferrer", children: _jsxs(Button, { variant: "outline", size: "sm", className: "h-7 text-xs gap-1", children: [_jsx(Video, { className: "w-3 h-3" }), " Watch Video"] }) })) })] }, tut.id))) })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm flex items-center gap-2", children: [_jsx(FileText, { className: "w-4 h-4" }), " Platform Documentation"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
                                        "User Manual",
                                        "Admin Guide",
                                        "API Reference",
                                        "Integrations Guide",
                                        "Reporting Guide",
                                        "Mobile App Guide",
                                        "Data Export",
                                        "Troubleshooting",
                                    ].map((doc) => (_jsxs(Button, { variant: "outline", size: "sm", className: "h-8 text-xs justify-start gap-2", children: [_jsx(FileText, { className: "w-3 h-3" }), " ", doc] }, doc))) }) })] })] })), tab === "support" && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx(AlertCircle, { className: "w-8 h-8 text-warning" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: openTickets }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Open tickets" })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx(Clock, { className: "w-8 h-8 text-blue-500" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: inProgressTickets }), _jsx("p", { className: "text-xs text-muted-foreground", children: "In progress" })] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx(CheckCircle2, { className: "w-8 h-8 text-success" }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: closedTickets }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Closed" })] })] }) })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "font-semibold", children: "Support Tickets" }), _jsxs(Button, { size: "sm", className: "gap-2", onClick: () => setShowTicketForm(true), children: [_jsx(Plus, { className: "w-4 h-4" }), " New Ticket"] })] }), _jsxs("div", { className: "space-y-2", children: [loadingTickets && (_jsx("p", { className: "text-center text-muted-foreground py-8", children: "Loading\u2026" })), !loadingTickets && tickets.length === 0 && (_jsx(Card, { children: _jsxs(CardContent, { className: "p-8 text-center text-muted-foreground", children: [_jsx(HelpCircle, { className: "w-10 h-10 mx-auto mb-2 opacity-30" }), _jsx("p", { children: "No support tickets yet. Create one if you need help." })] }) })), tickets.map((ticket) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsxs("span", { className: "text-xs text-muted-foreground font-mono", children: ["#", ticket.id?.slice(-6)] }), _jsx(StatusBadge, { status: ticket.status ?? "open" }), ticket.priority && (_jsx(Badge, { variant: "outline", className: `text-xs ${ticket.priority === "urgent"
                                                                        ? "bg-destructive/10 text-destructive border-destructive/20"
                                                                        : ticket.priority === "high"
                                                                            ? "bg-warning/10 text-warning border-warning/20"
                                                                            : ""}`, children: ticket.priority }))] }), _jsx("p", { className: "font-medium text-sm", children: ticket.subject }), _jsx("p", { className: "text-xs text-muted-foreground mt-1 line-clamp-2", children: ticket.description })] }), _jsxs("div", { className: "flex flex-col items-end gap-2 shrink-0", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: ticket.createdAt
                                                                ? format(new Date(ticket.createdAt), "MMM d, yyyy")
                                                                : "" }), _jsxs("div", { className: "flex gap-1", children: [_jsxs(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs gap-1", onClick: () => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id), children: [expandedTicket === ticket.id ? (_jsx(ChevronUp, { className: "w-3 h-3" })) : (_jsx(ChevronDown, { className: "w-3 h-3" })), "Messages"] }), ticket.status !== "closed" && (_jsx(Button, { variant: "outline", size: "sm", className: "h-7 text-xs", onClick: () => setShowMessageForm(ticket.id), children: "Reply" }))] })] })] }), expandedTicket === ticket.id && (_jsx("div", { className: "mt-3 space-y-2 border-t border-border pt-3", children: (ticket.messages ?? []).length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground", children: "No messages yet." })) : ((ticket.messages ?? []).map((msg) => (_jsxs("div", { className: `p-2 rounded-lg text-xs ${msg.isSupportAgent
                                                    ? "bg-primary/5 border border-primary/10 ml-4"
                                                    : "bg-muted/30"}`, children: [_jsxs("div", { className: "flex justify-between mb-1", children: [_jsx("span", { className: "font-medium", children: msg.isSupportAgent ? "Support Agent" : "You" }), _jsx("span", { className: "text-muted-foreground", children: msg.createdAt
                                                                    ? format(new Date(msg.createdAt), "MMM d, HH:mm")
                                                                    : "" })] }), _jsx("p", { children: msg.message })] }, msg.id)))) }))] }) }, ticket.id)))] })] })), _jsx(FormDialog, { open: showTicketForm, onOpenChange: setShowTicketForm, title: "New Support Ticket", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Subject *" }), _jsx(Input, { value: ticketForm.subject, onChange: (e) => setTicketForm({ ...ticketForm, subject: e.target.value }), placeholder: "Briefly describe your issue" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Priority" }), _jsxs(Select, { value: ticketForm.priority ?? "medium", onValueChange: (v) => setTicketForm({
                                        ...ticketForm,
                                        priority: v,
                                    }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "low", children: "Low" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "urgent", children: "Urgent" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Description *" }), _jsx(Textarea, { value: ticketForm.description, onChange: (e) => setTicketForm({ ...ticketForm, description: e.target.value }), placeholder: "Describe your issue in detail...", className: "min-h-[100px]" })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowTicketForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => createTicketMutation.mutate(ticketForm), disabled: createTicketMutation.isPending ||
                                        !ticketForm.subject ||
                                        !ticketForm.description, children: createTicketMutation.isPending
                                        ? "Submitting..."
                                        : "Submit Ticket" })] })] }) }), _jsx(FormDialog, { open: !!showMessageForm, onOpenChange: (o) => !o && setShowMessageForm(null), title: "Reply to Ticket", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Message *" }), _jsx(Textarea, { value: replyMessage, onChange: (e) => setReplyMessage(e.target.value), placeholder: "Type your message\u2026", className: "min-h-[100px]" })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowMessageForm(null), children: "Cancel" }), _jsx(Button, { onClick: () => replyMutation.mutate({
                                        id: showMessageForm,
                                        message: replyMessage,
                                    }), disabled: replyMutation.isPending || !replyMessage, children: replyMutation.isPending ? "Sending..." : "Send" })] })] }) })] }));
}
