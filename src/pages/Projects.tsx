import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Eye } from "lucide-react";

import type { Project } from "@/types/api";

import PageHeader from "../components/shared/PageHeader";
import DataTable from "../components/shared/DataTable";
import StatusBadge from "../components/shared/StatusBadge";
import FormDialog from "../components/shared/FormDialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import CurrencyInput from "../components/shared/CurrencyInput";
import {
  projectsService,
  contactsService,
  CreateProjectPayload,
  UpdateProjectPayload,
} from "@/services/wape.service";

// ── Types ─────────────────────────────────────────────────────────────────────

type ProjectStatus = "planned" | "on_progress" | "completed";

type FormState = Partial<
  CreateProjectPayload & { id: string; progress: number; description: string }
>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function Projects() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>(
    "all",
  );
  const [form, setForm] = useState<FormState>({});

  const queryClient = useQueryClient();

  // ── Queries
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const { data: clientsData } = useQuery({
    queryKey: ["clients"],
    queryFn: () => contactsService.listClients({ limit: 100 }),
  });

  const projects = projectsData?.items ?? [];
  const clients = clientsData?.items ?? [];

  // ── Mutations
  const saveMutation = useMutation({
    mutationFn: (data: FormState) => {
      const payload: CreateProjectPayload = {
        name: data.name!,
        clientId: data.clientId,
        description: data.description,
        budget: data.budget ?? 0,
        currency: data.currency ?? "MAD",
        startDate: data.startDate!,
        endDate: data.endDate!,
        status: data.status as ProjectStatus,
      };

      return editing
        ? projectsService.update(editing.id, payload as UpdateProjectPayload)
        : projectsService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
      setEditing(null);
      setForm({});
    },
  });

  // ── Helpers
  const openForm = (project?: Project) => {
    if (project) {
      setEditing(project);
      setForm({
        name: project.name,
        clientId: project.clientId,
        description: project.description,
        budget: project.budget,
        currency: project.currency,
        startDate: project.startDate,
        endDate: project.endDate,
        status: project.status,
      });
    } else {
      setEditing(null);
      setForm({ status: "planned", budget: 0, currency: "MAD" });
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    saveMutation.mutate(form);
  };

  // ── Filtering (client-side on loaded page)
  const filtered = projects.filter((p) => {
    const matchSearch =
      !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Table columns
  const columns = [
    {
      header: "Project",
      cell: (row: Project) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          {row.clientId && (
            <p className="text-xs text-muted-foreground">
              {clients.find((c) => c.id === row.clientId)?.legalName ?? "—"}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Duration",
      cell: (row: Project) => (
        <span className="text-xs">
          {row.startDate ? format(new Date(row.startDate), "MMM d, yy") : "—"}
          {" → "}
          {row.endDate ? format(new Date(row.endDate), "MMM d, yy") : "—"}
        </span>
      ),
    },
    {
      header: "Budget",
      cell: (row: Project) =>
        row.budget ? `${row.budget.toLocaleString()} ${row.currency}` : "—",
    },
    {
      header: "Status",
      cell: (row: Project) => <StatusBadge status={row.status} />,
    },
    {
      header: "Progress",
      cell: (row: Project) => (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={row.progress ?? 0} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground w-8">
            {row.progress ?? 0}%
          </span>
        </div>
      ),
    },
    {
      header: "",
      cell: (row: Project) => (
        <div className="flex gap-1">
          <Link to={`/projects/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              openForm(row);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  // ── Render
  return (
    <div className="space-y-4">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} total projects`}
        onAdd={() => openForm()}
        addLabel="New Project"
        searchValue={search}
        onSearch={setSearch}
      >
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="on_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── Form Dialog */}
      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editing ? "Edit Project" : "New Project"}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <Label>Project Name *</Label>
            <Input
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Client */}
          <div>
            <Label>Client</Label>
            <Select
              value={form.clientId ?? "none"}
              onValueChange={(v) =>
                setForm({ ...form, clientId: v === "none" ? undefined : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.legalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select
              value={form.status ?? "planned"}
              onValueChange={(v) =>
                setForm({ ...form, status: v as ProjectStatus })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="on_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div>
            <Label>Start Date *</Label>
            <Input
              type="date"
              value={form.startDate ?? ""}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label>End Date *</Label>
            <Input
              type="date"
              value={form.endDate ?? ""}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          {/* Budget */}
          <div className="col-span-2">
            <Label>Budget</Label>
            <CurrencyInput
              value={form.budget}
              onChange={(v) => setForm({ ...form, budget: v })}
              currency={form.currency}
              onCurrencyChange={(c) => setForm({ ...form, currency: c })}
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saveMutation.isPending ||
                !form.name ||
                !form.startDate ||
                !form.endDate
              }
            >
              {saveMutation.isPending ? "Saving..." : "Save Project"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
