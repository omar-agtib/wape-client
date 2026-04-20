import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Upload, X, List, Kanban } from "lucide-react";

import {
  ncService,
  projectsService,
  plansService,
  uploadService,
  type CreateNcPayload,
  type UpdateNcPayload,
} from "@/services/wape.service";
import type { NonConformity, Project } from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import NCKanbanBoard from "@/components/nc/Nckanbanboard";
import PlanAnnotator from "@/components/nc/Planannotator";
import PlanViewer from "@/components/nc/Planviewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

type NcStatus = "open" | "in_review" | "closed";
type NcSeverity = "low" | "medium" | "high" | "critical";
type ViewMode = "list" | "kanban";

interface FormState {
  title: string;
  projectId: string;
  description: string;
  markerX?: number;
  markerY?: number;
  // ⚠️ Fields below need backend DTO update to persist
  severity: NcSeverity;
  location: string;
  deadline: string;
  planId: string;
}

interface PlanRecord {
  id: string;
  nom?: string;
  name?: string;
  fileUrl?: string;
}

const defaultForm: FormState = {
  title: "",
  projectId: "",
  description: "",
  severity: "medium",
  location: "",
  deadline: "",
  planId: "",
};

const SEVERITY_COLORS: Record<NcSeverity, string> = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200",
};

// ── Image Preview ─────────────────────────────────────────────────────────────

function ImagePreviewModal({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  if (!url) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-0 right-0 bg-white/20 hover:bg-white/40 rounded-full p-1 m-1"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <img
          src={url}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
          alt="Preview"
        />
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NonConformitiesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | NcStatus>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | NcSeverity>(
    "all",
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NonConformity | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<ViewMode>("list");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [planViewerData, setPlanViewerData] = useState<{
    nc: NonConformity;
    planUrl: string;
  } | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: ncsData, isLoading } = useQuery({
    queryKey: ["ncs"],
    queryFn: () => ncService.list({ limit: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const { data: plansData } = useQuery({
    queryKey: ["plans-by-project", form.projectId],
    queryFn: () => plansService.listByProjet(form.projectId),
    enabled: !!form.projectId,
  });

  const ncs = ncsData?.items ?? [];
  const projects = (projectsData?.items ?? []) as Project[];
  interface PlansResponse {
    items?: PlanRecord[];
  }
  const projectPlans = ((plansData as PlansResponse)?.items ??
    []) as PlanRecord[];
  const selectedPlan = projectPlans.find((p) => p.id === form.planId);
  const selectedPlanUrl = selectedPlan?.fileUrl ?? "";

  // ── Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: NcStatus }) =>
      ncService.changeStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ncs"] }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormState) => {
      let nc: NonConformity;

      if (editing) {
        const payload: UpdateNcPayload = {
          title: data.title || undefined,
          description: data.description || undefined,
          markerX: data.markerX,
          markerY: data.markerY,
          severity: data.severity,
          location: data.location || undefined,
          deadline: data.deadline || undefined,
        };
        nc = await ncService.update(editing.id, payload);
      } else {
        const payload: CreateNcPayload = {
          projectId: data.projectId,
          title: data.title,
          description: data.description,
          markerX: data.markerX,
          markerY: data.markerY,
          severity: data.severity,
          location: data.location || undefined,
          deadline: data.deadline || undefined,
        };
        nc = await ncService.create(payload);
      }

      // Upload plan with marker
      if (selectedPlanUrl) {
        await ncService.uploadPlan(nc.id, {
          planUrl: selectedPlanUrl,
          markerX: data.markerX,
          markerY: data.markerY,
        });
      }

      // Attach images
      for (const imageUrl of pendingImages) {
        await ncService.addImage(nc.id, imageUrl);
      }

      return nc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ncs"] });
      setShowForm(false);
      setEditing(null);
      setPendingImages([]);
    },
  });

  // ── Helpers
  const openForm = (nc?: NonConformity) => {
    setEditing(nc ?? null);
    setPendingImages([]);
    setForm(
      nc
        ? {
            title: nc.title ?? "",
            projectId: nc.projectId ?? "",
            description: nc.description ?? "",
            markerX: nc.markerX,
            markerY: nc.markerY,
            severity: (nc.severity as NcSeverity) ?? "medium",
            location: nc.location ?? "",
            deadline: nc.deadline ?? "",
            planId: nc.planId ?? "",
          }
        : defaultForm,
    );
    setShowForm(true);
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setUploading(true);
    try {
      for (const file of files) {
        const result = await uploadService.image(file, "nc-images");
        setPendingImages((prev) => [...prev, result.secureUrl ?? ""]);
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Filtering
  const filtered = ncs.filter((nc) => {
    const matchSearch =
      !search || nc.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || nc.status === statusFilter;
    const matchSev = severityFilter === "all" || nc.severity === severityFilter;
    return matchSearch && matchStatus && matchSev;
  });

  // ── Columns
  const columns = [
    {
      header: "Title",
      cell: (row: NonConformity) => (
        <div>
          <p className="font-medium text-foreground">{row.title}</p>
          <p className="text-xs text-muted-foreground">{row.location ?? ""}</p>
        </div>
      ),
    },
    {
      header: "Project",
      cell: (row: NonConformity) => {
        const proj = projects.find((p) => p.id === row.projectId);
        return (
          <span className="text-xs text-muted-foreground">
            {proj?.name ?? "—"}
          </span>
        );
      },
    },
    {
      header: "Severity",
      cell: (row: NonConformity) => {
        const sev = row.severity as NcSeverity;
        return sev ? (
          <Badge
            variant="outline"
            className={`text-xs capitalize ${SEVERITY_COLORS[sev] ?? ""}`}
          >
            {sev}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      header: "Status",
      cell: (row: NonConformity) => (
        <StatusBadge status={row.status ?? "open"} />
      ),
    },
    {
      header: "Deadline",
      cell: (row: NonConformity) =>
        row.deadline ? format(new Date(row.deadline), "MMM d, yyyy") : "—",
    },
    {
      header: "",
      cell: (row: NonConformity) => (
        <div className="flex gap-1">
          {row.planUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-primary"
              onClick={() =>
                setPlanViewerData({ nc: row, planUrl: row.planUrl! })
              }
            >
              View Plan
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => openForm(row)}
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
      <ImagePreviewModal
        url={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {planViewerData && (
        <PlanViewer
          planUrl={planViewerData.planUrl}
          markerX={planViewerData.nc.markerX}
          markerY={planViewerData.nc.markerY}
          onClose={() => setPlanViewerData(null)}
        />
      )}

      <PageHeader
        title="Non Conformities"
        subtitle={`${ncs.filter((nc) => nc.status === "open").length} open`}
        onAdd={() => openForm()}
        addLabel="New NC"
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
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={severityFilter}
          onValueChange={(v) => setSeverityFilter(v as typeof severityFilter)}
        >
          <SelectTrigger className="w-32 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border border-border rounded-md overflow-hidden">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="h-9 rounded-none"
            onClick={() => setView("list")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "ghost"}
            size="sm"
            className="h-9 rounded-none gap-1"
            onClick={() => setView("kanban")}
          >
            <Kanban className="w-4 h-4" /> Kanban
          </Button>
        </div>
      </PageHeader>

      {view === "list" && (
        <DataTable columns={columns} data={filtered} isLoading={isLoading} />
      )}
      {view === "kanban" && (
        <NCKanbanBoard
          ncs={filtered}
          onStatusChange={(id, status) =>
            updateStatusMutation.mutate({ id, status })
          }
          onEdit={openForm}
        />
      )}

      {/* ── Form */}
      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editing ? "Edit Non Conformity" : "New Non Conformity"}
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <Label>Project {!editing && "*"}</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) =>
                  setForm({ ...form, projectId: v, planId: "" })
                }
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div>
              <Label>Severity</Label>
              <Select
                value={form.severity}
                onValueChange={(v) =>
                  setForm({ ...form, severity: v as NcSeverity })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editing && (
              <div>
                <Label>Status</Label>
                <Select
                  value={editing.status ?? "open"}
                  onValueChange={(v) =>
                    updateStatusMutation.mutate({
                      id: editing.id,
                      status: v as NcStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Related Plan */}
          <div>
            <Label className="mb-1 block">Related Plan</Label>
            {form.projectId ? (
              <Select
                value={form.planId}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    planId: v === "none" ? "" : v,
                    markerX: undefined,
                    markerY: undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No plan</SelectItem>
                  {projectPlans.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.nom ?? pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select a project first
              </p>
            )}

            {form.planId && selectedPlanUrl && (
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground mb-1 block">
                  Annotate Plan — mark the NC location
                </Label>
                <PlanAnnotator
                  planUrl={selectedPlanUrl}
                  marker={
                    form.markerX != null
                      ? { x: form.markerX, y: form.markerY! }
                      : null
                  }
                  onChange={(marker) =>
                    setForm({ ...form, markerX: marker.x, markerY: marker.y })
                  }
                />
              </div>
            )}
          </div>

          {/* Photos */}
          <div>
            <Label className="mb-1 block">Photos</Label>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground w-fit">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload photos"}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleUploadPhotos}
                disabled={uploading}
              />
            </label>
            {pendingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {pendingImages.map((url, i) => (
                  <div key={i} className="relative">
                    <img
                      src={url}
                      className="w-16 h-16 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80"
                      onClick={() => setPreviewImage(url)}
                      alt={`Photo ${i + 1}`}
                    />
                    <button
                      className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5"
                      onClick={() =>
                        setPendingImages((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={
                saveMutation.isPending ||
                !form.title ||
                !form.description ||
                (!editing && !form.projectId)
              }
            >
              {saveMutation.isPending ? "Saving..." : "Save & Notify"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
