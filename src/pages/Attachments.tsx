import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, Info } from "lucide-react";
import { Link } from "react-router-dom";

import {
  attachmentsService,
  tasksService,
  projectsService,
  contactsService,
  type CreateAttachmentPayload,
  type ConfirmAttachmentPayload,
} from "@/services/wape.service";
import type { Project, Task, Contact } from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string;
  projectId?: string;
  subcontractorId?: string;
  title?: string;
  currency?: string;
  status?: string;
  taskIds?: string[];
  createdAt?: string;
  personnelCost?: number;
  articlesCost?: number;
  toolsCost?: number;
}

interface CreateFormState {
  projectId: string;
  subcontractorId: string;
  title: string;
  currency: string;
  taskIds: string[];
}

interface ConfirmFormState {
  personnelCost: number;
  articlesCost: number;
  toolsCost: number;
}

const defaultCreateForm: CreateFormState = {
  projectId: "",
  subcontractorId: "",
  title: "",
  currency: "MAD",
  taskIds: [],
};

const defaultConfirmForm: ConfirmFormState = {
  personnelCost: 0,
  articlesCost: 0,
  toolsCost: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AttachmentsPage() {
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);
  const [createForm, setCreateForm] =
    useState<CreateFormState>(defaultCreateForm);
  const [confirmForm, setConfirmForm] =
    useState<ConfirmFormState>(defaultConfirmForm);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: attachmentsData, isLoading } = useQuery({
    queryKey: ["attachments"],
    queryFn: () => attachmentsService.list({ limit: 100 }),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksService.list({ limit: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const { data: subcontractorsData } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => contactsService.listSubcontractors({ limit: 100 }),
  });

  const attachments = (attachmentsData?.items ?? []) as Attachment[];
  const tasks = (tasksData?.items ?? []) as Task[];
  const projects = (projectsData?.items ?? []) as Project[];
  const subcontractors = (subcontractorsData?.items ?? []) as Contact[];

  // Only completed tasks can be in an attachment (RG03)
  const completedTasks = tasks.filter((t) => t.status === "completed");

  // Filter tasks by selected project
  const projectTasks = completedTasks.filter(
    (t) => !createForm.projectId || t.projectId === createForm.projectId,
  );

  // ── Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateAttachmentPayload) =>
      attachmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowCreateForm(false);
      setCreateForm(defaultCreateForm);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body?: ConfirmAttachmentPayload;
    }) => attachmentsService.confirm(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowConfirmForm(false);
      setSelectedAttachment(null);
      setConfirmForm(defaultConfirmForm);
    },
  });

  // ── Helpers
  const toggleTaskId = (id: string) => {
    setCreateForm((f) => ({
      ...f,
      taskIds: f.taskIds.includes(id)
        ? f.taskIds.filter((t) => t !== id)
        : [...f.taskIds, id],
    }));
  };

  const openConfirmDialog = (att: Attachment) => {
    setSelectedAttachment(att);
    setConfirmForm({
      personnelCost: att.personnelCost ?? 0,
      articlesCost: att.articlesCost ?? 0,
      toolsCost: att.toolsCost ?? 0,
    });
    setShowConfirmForm(true);
  };

  const getProjectName = (id?: string) =>
    projects.find((p) => p.id === id)?.name ?? id ?? "—";

  const getSubcontractorName = (id?: string) =>
    subcontractors.find((s) => s.id === id)?.legalName ?? "—";

  const totalConfirmCost =
    confirmForm.personnelCost +
    confirmForm.articlesCost +
    confirmForm.toolsCost;

  // ── Filtering
  const filtered = attachments.filter(
    (a) =>
      !search ||
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      getProjectName(a.projectId).toLowerCase().includes(search.toLowerCase()),
  );

  // ── Columns
  const columns = [
    {
      header: "Title",
      cell: (row: Attachment) => (
        <div>
          <p className="font-medium text-foreground">{row.title}</p>
          <p className="text-xs text-muted-foreground">
            {getProjectName(row.projectId)}
          </p>
        </div>
      ),
    },
    {
      header: "Tasks",
      cell: (row: Attachment) => (
        <span className="text-xs">{row.taskIds?.length ?? 0} tasks</span>
      ),
    },
    {
      header: "Subcontractor",
      cell: (row: Attachment) =>
        row.subcontractorId ? (
          <span className="text-xs">
            {getSubcontractorName(row.subcontractorId)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Internal</span>
        ),
    },
    {
      header: "Status",
      cell: (row: Attachment) => <StatusBadge status={row.status ?? "draft"} />,
    },
    {
      header: "Currency",
      cell: (row: Attachment) => (
        <span className="text-xs">{row.currency ?? "MAD"}</span>
      ),
    },
    {
      header: "Date",
      cell: (row: Attachment) =>
        row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "—",
    },
    {
      header: "",
      cell: (row: Attachment) => (
        <div className="flex gap-1">
          <Link to={`/attachments/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          {(row.status === "draft" || row.status === "pending") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-primary"
              onClick={() => openConfirmDialog(row)}
            >
              Confirm
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render
  return (
    <div className="space-y-4">
      <PageHeader
        title="Attachments & Validation"
        subtitle={`${attachments.length} entries`}
        onAdd={() => setShowCreateForm(true)}
        addLabel="New Attachment"
        searchValue={search}
        onSearch={setSearch}
      />

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── Create Form */}
      <FormDialog
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        title="New Attachment"
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              value={createForm.title}
              onChange={(e) =>
                setCreateForm({ ...createForm, title: e.target.value })
              }
              placeholder="Ex: Fondations Bloc A — Lot 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <Label>Project *</Label>
              <Select
                value={createForm.projectId}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, projectId: v, taskIds: [] })
                }
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

            {/* Currency */}
            <div>
              <Label>Currency</Label>
              <Select
                value={createForm.currency}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, currency: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAD">MAD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subcontractor */}
            <div className="col-span-2">
              <Label>
                Subcontractor (optional — triggers auto-invoice on confirm)
              </Label>
              <Select
                value={createForm.subcontractorId || "none"}
                onValueChange={(v) =>
                  setCreateForm({
                    ...createForm,
                    subcontractorId: v === "none" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Internal (no subcontractor)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Internal — no subcontractor
                  </SelectItem>
                  {subcontractors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task selection */}
          <div>
            <Label className="mb-2 block">
              Completed Tasks * (only completed tasks can be attached — RG03)
            </Label>
            {!createForm.projectId ? (
              <p className="text-xs text-muted-foreground">
                Select a project first
              </p>
            ) : projectTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No completed tasks for this project yet
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
                {projectTasks.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={createForm.taskIds.includes(t.id)}
                      onChange={() => toggleTaskId(t.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{t.name}</span>
                  </label>
                ))}
              </div>
            )}
            {createForm.taskIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {createForm.taskIds.length} task(s) selected
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createMutation.mutate({
                  projectId: createForm.projectId,
                  subcontractorId: createForm.subcontractorId || undefined,
                  title: createForm.title,
                  currency: createForm.currency || undefined,
                  taskIds: createForm.taskIds,
                })
              }
              disabled={
                createMutation.isPending ||
                !createForm.title ||
                !createForm.projectId ||
                createForm.taskIds.length === 0
              }
            >
              {createMutation.isPending ? "Saving..." : "Create Attachment"}
            </Button>
          </div>
        </div>
      </FormDialog>

      {/* ── Confirm Form */}
      <FormDialog
        open={showConfirmForm}
        onOpenChange={setShowConfirmForm}
        title={`Confirm Attachment — ${selectedAttachment?.title ?? ""}`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-primary">
                Confirmation calculates costs
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedAttachment?.subcontractorId
                  ? "An invoice will be auto-generated for the subcontractor."
                  : "Enter the actual costs for this internal attachment."}
              </p>
            </div>
          </div>

          {/* Cost inputs — only for internal (no subcontractor) */}
          {!selectedAttachment?.subcontractorId && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Personnel Cost</Label>
                <Input
                  type="number"
                  min={0}
                  value={confirmForm.personnelCost}
                  onChange={(e) =>
                    setConfirmForm({
                      ...confirmForm,
                      personnelCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Articles Cost</Label>
                <Input
                  type="number"
                  min={0}
                  value={confirmForm.articlesCost}
                  onChange={(e) =>
                    setConfirmForm({
                      ...confirmForm,
                      articlesCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Tools Cost</Label>
                <Input
                  type="number"
                  min={0}
                  value={confirmForm.toolsCost}
                  onChange={(e) =>
                    setConfirmForm({
                      ...confirmForm,
                      toolsCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="col-span-3 p-2 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">
                  {totalConfirmCost.toLocaleString()}{" "}
                  {selectedAttachment?.currency ?? "MAD"}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                confirmMutation.mutate({
                  id: selectedAttachment!.id,
                  body: selectedAttachment?.subcontractorId
                    ? undefined
                    : {
                        personnelCost: confirmForm.personnelCost,
                        articlesCost: confirmForm.articlesCost,
                        toolsCost: confirmForm.toolsCost,
                      },
                })
              }
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending
                ? "Confirming..."
                : "Confirm & Validate"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
