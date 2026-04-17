import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Users,
  ShieldCheck,
  UserPlus,
  Mail,
  CheckCircle2,
  XCircle,
  Edit,
} from "lucide-react";

import {
  usersService,
  projectsService,
  tasksService,
  personnelService,
  type InviteUserPayload,
  type UpdateUserPayload,
} from "@/services/wape.service";
import type { Project, Task, Personnel } from "@/types/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import FormDialog from "@/components/shared/FormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamUser {
  id: string;
  fullName?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

const ROLE_COLORS: Record<string, string> = {
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
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteUserPayload>({
    fullName: "",
    email: "",
    role: "viewer",
    password: "",
  });
  const [editForm, setEditForm] = useState<UpdateUserPayload>({});

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

  const users = (usersRaw ?? []) as TeamUser[];
  const me = meData as any;
  const projects = (projectsData?.items ?? []) as Project[];
  const tasks = (tasksData?.items ?? []) as Task[];
  const personnel = (personnelData?.items ?? []) as Personnel[];

  // ── Mutations
  const inviteMutation = useMutation({
    mutationFn: (data: InviteUserPayload) => usersService.invite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      setShowInviteForm(false);
      setInviteForm({ fullName: "", email: "", role: "viewer", password: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserPayload }) =>
      usersService.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-users"] });
      setShowEditForm(false);
      setEditingUser(null);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersService.deactivate(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["team-users"] }),
  });

  // ── Helpers
  const openEdit = (user: TeamUser) => {
    setEditingUser(user);
    setEditForm({ fullName: user.fullName, role: user.role as any });
    setShowEditForm(true);
  };

  const activeUsers = users.filter((u) => u.isActive !== false);

  // ── Platform overview stats
  const overviewStats = [
    {
      label: "Active Projects",
      value: projects.filter(
        (p) => p.status === "on_progress" || p.status === "planned",
      ).length,
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
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
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
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Invite User */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Invite Team Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full gap-2"
              onClick={() => setShowInviteForm(true)}
            >
              <Mail className="w-4 h-4" /> Invite New User
            </Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Invited users will receive access to the platform based on their
              assigned role.
            </p>
          </CardContent>
        </Card>

        {/* ── Current User */}
        {me && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Your Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(me.fullName ?? me.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{me.fullName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{me.email}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${ROLE_COLORS[me.role] ?? ""}`}
                >
                  {me.role}
                </Badge>
              </div>
              {me.lastLoginAt && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Last login:{" "}
                  {format(new Date(me.lastLoginAt), "MMM d, yyyy HH:mm")}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4" /> Team Members ({activeUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading…
            </p>
          ) : (
            <div className="space-y-2">
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No team members yet
                </p>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        u.isActive !== false
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {(u.fullName ?? u.email ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {u.fullName ?? "—"}
                        {u.isActive === false && (
                          <span className="ml-2 text-xs text-destructive">
                            (inactive)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${ROLE_COLORS[u.role ?? "viewer"] ?? ""}`}
                    >
                      {u.role ?? "viewer"}
                    </Badge>
                    {u.id !== me?.id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(u)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        {u.isActive !== false && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (
                                confirm(`Deactivate ${u.fullName ?? u.email}?`)
                              ) {
                                deactivateMutation.mutate(u.id);
                              }
                            }}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Platform Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            {overviewStats.map((item) => (
              <div key={item.label} className="p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-foreground">
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Invite Dialog */}
      <FormDialog
        open={showInviteForm}
        onOpenChange={setShowInviteForm}
        title="Invite Team Member"
      >
        <div className="space-y-4">
          <div>
            <Label>Full Name *</Label>
            <Input
              value={inviteForm.fullName}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, fullName: e.target.value })
              }
              placeholder="Mohammed Alami"
            />
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={inviteForm.email}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, email: e.target.value })
              }
              placeholder="user@company.com"
            />
          </div>
          <div>
            <Label>Temporary Password *</Label>
            <Input
              type="password"
              value={inviteForm.password}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, password: e.target.value })
              }
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <Label>Role *</Label>
            <Select
              value={inviteForm.role}
              onValueChange={(v) =>
                setInviteForm({
                  ...inviteForm,
                  role: v as InviteUserPayload["role"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="site_manager">Site Manager</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="viewer">Viewer (read-only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowInviteForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate(inviteForm)}
              disabled={
                inviteMutation.isPending ||
                !inviteForm.fullName ||
                !inviteForm.email ||
                !inviteForm.password
              }
            >
              {inviteMutation.isPending ? "Inviting..." : "Send Invite"}
            </Button>
          </div>
        </div>
      </FormDialog>

      {/* ── Edit User Dialog */}
      <FormDialog
        open={showEditForm}
        onOpenChange={setShowEditForm}
        title={`Edit — ${editingUser?.fullName ?? editingUser?.email}`}
      >
        <div className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={editForm.fullName ?? ""}
              onChange={(e) =>
                setEditForm({ ...editForm, fullName: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Role</Label>
            <Select
              value={editForm.role ?? "viewer"}
              onValueChange={(v) =>
                setEditForm({
                  ...editForm,
                  role: v as UpdateUserPayload["role"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="site_manager">Site Manager</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateMutation.mutate({ id: editingUser!.id, body: editForm })
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
