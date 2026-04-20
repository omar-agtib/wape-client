import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Users, ShieldCheck, UserPlus, Mail, CheckCircle2, XCircle, Edit, } from "lucide-react";
import { usersService, projectsService, tasksService, personnelService, } from "@/services/wape.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import FormDialog from "@/components/shared/FormDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
const ROLE_COLORS = {
    admin: "bg-primary/10 text-primary border-primary/20",
    project_manager: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    site_manager: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    accountant: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    viewer: "bg-muted/50 text-muted-foreground border-border",
};
// ── Component ─────────────────────────────────────────────────────────────────
export default function AdministrationPage() {
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [inviteForm, setInviteForm] = useState({
        fullName: "",
        email: "",
        role: "viewer",
        password: "",
    });
    const [editForm, setEditForm] = useState({});
    const queryClient = useQueryClient();
    // ── Queries
    const { data: usersRaw, isLoading } = useQuery({
        queryKey: ["team-users"],
        queryFn: () => usersService.listTeam(),
    });
    const { data: meData } = useQuery({
        queryKey: ["me"],
        queryFn: () => usersService.me(),
    });
    const { data: projectsData } = useQuery({
        queryKey: ["projects"],
        queryFn: () => projectsService.list({ limit: 100 }),
    });
    const { data: tasksData } = useQuery({
        queryKey: ["tasks"],
        queryFn: () => tasksService.list({ limit: 100 }),
    });
    const { data: personnelData } = useQuery({
        queryKey: ["personnel"],
        queryFn: () => personnelService.list({ limit: 100 }),
    });
    const users = (usersRaw ?? []);
    const me = meData;
    const projects = (projectsData?.items ?? []);
    const tasks = (tasksData?.items ?? []);
    const personnel = (personnelData?.items ?? []);
    // ── Mutations
    const inviteMutation = useMutation({
        mutationFn: (data) => usersService.invite(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-users"] });
            setShowInviteForm(false);
            setInviteForm({ fullName: "", email: "", role: "viewer", password: "" });
        },
    });
    const updateMutation = useMutation({
        mutationFn: ({ id, body }) => usersService.update(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-users"] });
            setShowEditForm(false);
            setEditingUser(null);
        },
    });
    const deactivateMutation = useMutation({
        mutationFn: (id) => usersService.deactivate(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-users"] }),
    });
    // ── Helpers
    const openEdit = (user) => {
        setEditingUser(user);
        setEditForm({
            fullName: user.fullName,
            role: user.role,
        });
        setShowEditForm(true);
    };
    const activeUsers = users.filter((u) => u.isActive !== false);
    // ── Platform overview stats
    const overviewStats = [
        {
            label: "Active Projects",
            value: projects.filter((p) => p.status === "on_progress" || p.status === "planned").length,
        },
        {
            label: "Completed Projects",
            value: projects.filter((p) => p.status === "completed").length,
        },
        {
            label: "Tasks Completed",
            value: tasks.filter((t) => t.status === "completed").length,
        },
        {
            label: "Tasks In Progress",
            value: tasks.filter((t) => t.status === "on_progress").length,
        },
        { label: "Total Personnel", value: personnel.length },
        { label: "Total Tasks", value: tasks.length },
    ];
    // ── Render
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
                    {
                        label: "Team Members",
                        value: activeUsers.length,
                        icon: Users,
                        color: "text-primary bg-primary/10",
                    },
                    {
                        label: "Projects",
                        value: projects.length,
                        icon: ShieldCheck,
                        color: "text-success bg-success/10",
                    },
                    {
                        label: "Tasks",
                        value: tasks.length,
                        icon: CheckCircle2,
                        color: "text-warning bg-warning/10",
                    },
                    {
                        label: "Personnel",
                        value: personnel.length,
                        icon: UserPlus,
                        color: "text-blue-600 bg-blue-500/10",
                    },
                ].map(({ label, value, icon: Icon, color }) => (_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx("div", { className: `p-2 rounded-lg ${color}`, children: _jsx(Icon, { className: "w-4 h-4" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: label }), _jsx("p", { className: "text-xl font-bold", children: value })] })] }) }, label))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(UserPlus, { className: "w-4 h-4" }), " Invite Team Member"] }) }), _jsxs(CardContent, { children: [_jsxs(Button, { className: "w-full gap-2", onClick: () => setShowInviteForm(true), children: [_jsx(Mail, { className: "w-4 h-4" }), " Invite New User"] }), _jsx("p", { className: "text-xs text-muted-foreground mt-3 text-center", children: "Invited users will receive access to the platform based on their assigned role." })] })] }), me && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(ShieldCheck, { className: "w-4 h-4" }), " Your Account"] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-muted/30", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary", children: (me.fullName ?? me.email ?? "?")[0].toUpperCase() }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-sm", children: me.fullName ?? "—" }), _jsx("p", { className: "text-xs text-muted-foreground", children: me.email })] }), _jsx(Badge, { variant: "outline", className: `text-xs ${ROLE_COLORS[me.role ?? "viewer"] ?? ""}`, children: me.role })] }), me.lastLoginAt && (_jsxs("p", { className: "text-xs text-muted-foreground mt-2 text-center", children: ["Last login:", " ", format(new Date(me.lastLoginAt), "MMM d, yyyy HH:mm")] }))] })] }))] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4" }), " Team Members (", activeUsers.length, ")"] }) }), _jsx(CardContent, { children: isLoading ? (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "Loading\u2026" })) : (_jsxs("div", { className: "space-y-2", children: [users.length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "No team members yet" })), users.map((u) => (_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-muted/30", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.isActive !== false
                                                        ? "bg-primary/10 text-primary"
                                                        : "bg-muted text-muted-foreground"}`, children: (u.fullName ?? u.email ?? "?")[0].toUpperCase() }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-medium", children: [u.fullName ?? "—", u.isActive === false && (_jsx("span", { className: "ml-2 text-xs text-destructive", children: "(inactive)" }))] }), _jsx("p", { className: "text-xs text-muted-foreground", children: u.email })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "outline", className: `text-xs ${ROLE_COLORS[u.role ?? "viewer"] ?? ""}`, children: u.role ?? "viewer" }), u.id !== me?.id && (_jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: () => openEdit(u), children: _jsx(Edit, { className: "w-3.5 h-3.5" }) }), u.isActive !== false && (_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-destructive hover:text-destructive", onClick: () => {
                                                                if (confirm(`Deactivate ${u.fullName ?? u.email}?`)) {
                                                                    deactivateMutation.mutate(u.id);
                                                                }
                                                            }, children: _jsx(XCircle, { className: "w-3.5 h-3.5" }) }))] }))] })] }, u.id)))] })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-sm font-semibold", children: "Platform Overview" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-4 text-center", children: overviewStats.map((item) => (_jsxs("div", { className: "p-4 rounded-lg bg-muted/30", children: [_jsx("p", { className: "text-2xl font-bold text-foreground", children: item.value }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: item.label })] }, item.label))) }) })] }), _jsx(FormDialog, { open: showInviteForm, onOpenChange: setShowInviteForm, title: "Invite Team Member", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Full Name *" }), _jsx(Input, { value: inviteForm.fullName, onChange: (e) => setInviteForm({ ...inviteForm, fullName: e.target.value }), placeholder: "Mohammed Alami" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Email *" }), _jsx(Input, { type: "email", value: inviteForm.email, onChange: (e) => setInviteForm({ ...inviteForm, email: e.target.value }), placeholder: "user@company.com" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Temporary Password *" }), _jsx(Input, { type: "password", value: inviteForm.password, onChange: (e) => setInviteForm({ ...inviteForm, password: e.target.value }), placeholder: "Min 8 characters" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Role *" }), _jsxs(Select, { value: inviteForm.role, onValueChange: (v) => setInviteForm({
                                        ...inviteForm,
                                        role: v,
                                    }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "project_manager", children: "Project Manager" }), _jsx(SelectItem, { value: "site_manager", children: "Site Manager" }), _jsx(SelectItem, { value: "accountant", children: "Accountant" }), _jsx(SelectItem, { value: "viewer", children: "Viewer (read-only)" })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowInviteForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => inviteMutation.mutate(inviteForm), disabled: inviteMutation.isPending ||
                                        !inviteForm.fullName ||
                                        !inviteForm.email ||
                                        !inviteForm.password, children: inviteMutation.isPending ? "Inviting..." : "Send Invite" })] })] }) }), _jsx(FormDialog, { open: showEditForm, onOpenChange: setShowEditForm, title: `Edit — ${editingUser?.fullName ?? editingUser?.email}`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Full Name" }), _jsx(Input, { value: editForm.fullName ?? "", onChange: (e) => setEditForm({ ...editForm, fullName: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Role" }), _jsxs(Select, { value: editForm.role ?? "viewer", onValueChange: (v) => setEditForm({
                                        ...editForm,
                                        role: v,
                                    }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "project_manager", children: "Project Manager" }), _jsx(SelectItem, { value: "site_manager", children: "Site Manager" }), _jsx(SelectItem, { value: "accountant", children: "Accountant" }), _jsx(SelectItem, { value: "viewer", children: "Viewer" })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowEditForm(false), children: "Cancel" }), _jsx(Button, { onClick: () => updateMutation.mutate({ id: editingUser.id, body: editForm }), disabled: updateMutation.isPending, children: updateMutation.isPending ? "Saving..." : "Save Changes" })] })] }) })] }));
}
