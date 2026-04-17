import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink, Upload, Eye } from "lucide-react";

import {
  plansService,
  projectsService,
  uploadService,
} from "@/services/wape.service";
import type { Project } from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FormDialog from "@/components/shared/FormDialog";
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

interface PlanRecord {
  id: string;
  nom?: string;
  name?: string;
  categorie?: string;
  fileUrl?: string;
  fileType?: string;
  reference?: string;
  description?: string;
  projetId?: string;
  projectId?: string;
  createdAt?: string;
  statut?: string;
}

interface FormState {
  nom: string;
  projetId: string;
  categorie: string;
  reference: string;
  description: string;
  fileUrl: string;
  fileType: string;
}

const defaultForm: FormState = {
  nom: "",
  projetId: "",
  categorie: "architectural",
  reference: "",
  description: "",
  fileUrl: "",
  fileType: "pdf",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PlanRecord | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<PlanRecord | null>(null);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: plansData, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => plansService.list({ limit: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const plans = ((plansData as any)?.items ?? []) as PlanRecord[];
  const projects = (projectsData?.items ?? []) as Project[];

  // ── Mutations
  const saveMutation = useMutation({
    mutationFn: (data: FormState) => {
      if (editing) {
        return plansService.update(editing.id, {
          nom: data.nom,
          categorie: data.categorie,
          reference: data.reference || undefined,
          description: data.description || undefined,
        });
      } else {
        return plansService.create({
          projetId: data.projetId,
          nom: data.nom,
          categorie: data.categorie,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          reference: data.reference || undefined,
          description: data.description || undefined,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      setShowForm(false);
      setEditing(null);
    },
  });

  const newVersionMutation = useMutation({
    mutationFn: ({
      id,
      fileUrl,
      fileType,
    }: {
      id: string;
      fileUrl: string;
      fileType: string;
    }) => plansService.nouvelleVersion(id, { fileUrl, fileType }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["plans"] }),
  });

  // ── Helpers
  const openForm = (plan?: PlanRecord) => {
    setEditing(plan ?? null);
    setForm(
      plan
        ? {
            nom: plan.nom ?? plan.name ?? "",
            projetId: plan.projetId ?? plan.projectId ?? "",
            categorie: plan.categorie ?? "architectural",
            reference: plan.reference ?? "",
            description: plan.description ?? "",
            fileUrl: plan.fileUrl ?? "",
            fileType: plan.fileType ?? "pdf",
          }
        : defaultForm,
    );
    setShowForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadService.image(file, "nc-plans");
      const fileUrl = result.secureUrl ?? result.url ?? "";
      const fileType = file.name.split(".").pop()?.toLowerCase() ?? "png";
      setForm((f) => ({ ...f, fileUrl, fileType }));

      // If editing, create new version automatically
      if (editing) {
        await newVersionMutation.mutateAsync({
          id: editing.id,
          fileUrl,
          fileType,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Filtering
  const filtered = plans.filter((p) => {
    const matchSearch =
      !search ||
      (p.nom ?? p.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchProj =
      projectFilter === "all" ||
      p.projetId === projectFilter ||
      p.projectId === projectFilter;
    return matchSearch && matchProj;
  });

  const getProjectName = (plan: PlanRecord) => {
    const proj = projects.find(
      (p) => p.id === plan.projetId || p.id === plan.projectId,
    );
    return proj?.name ?? "—";
  };

  // ── Columns
  const columns = [
    {
      header: "Name",
      cell: (row: PlanRecord) => (
        <div>
          <p className="font-medium text-foreground">{row.nom ?? row.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.reference ? `Ref: ${row.reference}` : (row.categorie ?? "")}
          </p>
        </div>
      ),
    },
    {
      header: "Project",
      cell: (row: PlanRecord) => (
        <span className="text-xs text-muted-foreground">
          {getProjectName(row)}
        </span>
      ),
    },
    {
      header: "Category",
      cell: (row: PlanRecord) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.categorie?.replace(/_/g, " ") ?? "—"}
        </Badge>
      ),
    },
    {
      header: "Date",
      cell: (row: PlanRecord) =>
        row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "—",
    },
    {
      header: "File",
      cell: (row: PlanRecord) =>
        row.fileUrl ? (
          <a href={row.fileUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-primary"
            >
              <ExternalLink className="w-3 h-3" /> Open
            </Button>
          </a>
        ) : (
          "—"
        ),
    },
    {
      header: "",
      cell: (row: PlanRecord) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPreviewPlan(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>
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
      <PageHeader
        title="Plans"
        subtitle={`${plans.length} plans`}
        onAdd={() => openForm()}
        addLabel="Upload Plan"
        searchValue={search}
        onSearch={setSearch}
      >
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── Preview Dialog */}
      {previewPlan && (
        <FormDialog
          open={!!previewPlan}
          onOpenChange={() => setPreviewPlan(null)}
          title={previewPlan.nom ?? previewPlan.name ?? "Plan"}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Project:</span>{" "}
                <span className="font-medium">
                  {getProjectName(previewPlan)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>{" "}
                <span className="font-medium capitalize">
                  {previewPlan.categorie?.replace(/_/g, " ") ?? "—"}
                </span>
              </div>
              {previewPlan.reference && (
                <div>
                  <span className="text-muted-foreground">Reference:</span>{" "}
                  <span className="font-medium">{previewPlan.reference}</span>
                </div>
              )}
              {previewPlan.createdAt && (
                <div>
                  <span className="text-muted-foreground">Date:</span>{" "}
                  <span className="font-medium">
                    {format(new Date(previewPlan.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>
            {previewPlan.description && (
              <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                {previewPlan.description}
              </p>
            )}
            {previewPlan.fileUrl && (
              <div className="rounded-lg border border-border overflow-hidden">
                {previewPlan.fileType === "image" ||
                /\.(jpg|jpeg|png|webp)$/i.test(previewPlan.fileUrl) ? (
                  <img
                    src={previewPlan.fileUrl}
                    className="w-full max-h-96 object-contain"
                    alt={previewPlan.nom ?? "Plan"}
                  />
                ) : (
                  <div className="p-6 text-center bg-muted/20">
                    <p className="text-sm text-muted-foreground mb-3">
                      Preview not available for this file type.
                    </p>
                    <a
                      href={previewPlan.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="gap-2">
                        <ExternalLink className="w-4 h-4" /> Open in new tab
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </FormDialog>
      )}

      {/* ── Form Dialog */}
      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editing ? "Edit Plan" : "Upload Plan"}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <Label>Plan Name *</Label>
            <Input
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
            />
          </div>

          {/* Project — create only */}
          {!editing && (
            <div className="col-span-2">
              <Label>Project *</Label>
              <Select
                value={form.projetId}
                onValueChange={(v) => setForm({ ...form, projetId: v })}
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
          )}

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select
              value={form.categorie}
              onValueChange={(v) => setForm({ ...form, categorie: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="architectural">Architectural</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div>
            <Label>Reference</Label>
            <Input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="e.g. PLN-001"
            />
          </div>

          {/* File Upload */}
          <div className="col-span-2">
            <Label>
              File {editing ? "(upload to create new version)" : "*"}
            </Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground">
                <Upload className="w-4 h-4" />
                {uploading
                  ? "Uploading..."
                  : form.fileUrl
                    ? "Replace file"
                    : "Upload file"}
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              {form.fileUrl && (
                <a
                  href={form.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> View
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={
                saveMutation.isPending ||
                !form.nom ||
                (!editing && (!form.projetId || !form.fileUrl))
              }
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
