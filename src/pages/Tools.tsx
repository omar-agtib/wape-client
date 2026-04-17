import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Plus, Upload } from "lucide-react";

import {
  toolsService,
  personnelService,
  uploadService,
  type CreateToolPayload,
  type UpdateToolPayload,
  type ToolMovementPayload,
} from "@/services/wape.service";
import type { Tool, Personnel } from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
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

type ToolStatus = "available" | "in_use" | "maintenance" | "retired";
type ToolCategory =
  | "hand_tools"
  | "power_tools"
  | "heavy_equipment"
  | "safety_equipment"
  | "measurement"
  | "other";
type MovementType = "OUT" | "IN";

interface ToolFormState {
  name: string;
  category: ToolCategory;
  serialNumber: string;
  photoUrl: string;
  status: ToolStatus;
}

interface MovementFormState {
  movementType: MovementType;
  responsibleId: string;
  notes: string;
}

const defaultToolForm: ToolFormState = {
  name: "",
  category: "other",
  serialNumber: "",
  photoUrl: "",
  status: "available",
};

const defaultMovForm: MovementFormState = {
  movementType: "OUT",
  responsibleId: "",
  notes: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Tools() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ToolStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [editing, setEditing] = useState<Tool | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [form, setForm] = useState<ToolFormState>(defaultToolForm);
  const [movForm, setMovForm] = useState<MovementFormState>(defaultMovForm);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: toolsData, isLoading } = useQuery({
    queryKey: ["tools"],
    queryFn: () => toolsService.list({ limit: 100 }),
  });

  const { data: personnelData } = useQuery({
    queryKey: ["personnel"],
    queryFn: () => personnelService.list({ limit: 100 }),
  });

  // Movements for selected tool (only loaded when movement form is open)
  const { data: movementsData } = useQuery({
    queryKey: ["tool-movements", selectedToolId],
    queryFn: () => toolsService.listMovements(selectedToolId, { limit: 20 }),
    enabled: !!selectedToolId,
  });

  const toolsList = toolsData?.items ?? [];
  const personnelList = (personnelData?.items ?? []) as Personnel[];
  const movements = (movementsData?.items ?? []) as any[];

  // ── Mutations
  const saveMutation = useMutation({
    mutationFn: (data: CreateToolPayload | UpdateToolPayload) =>
      editing
        ? toolsService.update(editing.id, data as UpdateToolPayload)
        : toolsService.create(data as CreateToolPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      setShowForm(false);
      setEditing(null);
    },
  });

  const movementMutation = useMutation({
    mutationFn: (data: ToolMovementPayload) =>
      toolsService.addMovement(selectedToolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({
        queryKey: ["tool-movements", selectedToolId],
      });
      setShowMovementForm(false);
      setMovForm(defaultMovForm);
      setSelectedToolId("");
    },
  });

  // ── Helpers
  const openForm = (tool?: Tool) => {
    setEditing(tool ?? null);
    setForm(
      tool
        ? {
            name: tool.name ?? "",
            category: (tool.category as ToolCategory) ?? "other",
            serialNumber: tool.serialNumber ?? "",
            photoUrl: tool.photoUrl ?? "",
            status: (tool.status as ToolStatus) ?? "available",
          }
        : defaultToolForm,
    );
    setShowForm(true);
  };

  const openMovementForm = (toolId?: string) => {
    setSelectedToolId(toolId ?? "");
    setMovForm(defaultMovForm);
    setShowMovementForm(true);
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadService.image(file, "nc-images");
      setForm((f) => ({
        ...f,
        photoUrl: result.secureUrl ?? result.url ?? "",
      }));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTool = () => {
    if (editing) {
      const payload: UpdateToolPayload = {
        name: form.name || undefined,
        category: form.category,
        serialNumber: form.serialNumber || undefined,
        photoUrl: form.photoUrl || undefined,
      };
      saveMutation.mutate(payload);
    } else {
      const payload: CreateToolPayload = {
        name: form.name,
        category: form.category,
        serialNumber: form.serialNumber || undefined,
        photoUrl: form.photoUrl || undefined,
      };
      saveMutation.mutate(payload);
    }
  };

  const handleSaveMovement = () => {
    const payload: ToolMovementPayload = {
      movementType: movForm.movementType,
      responsibleId: movForm.responsibleId,
      notes: movForm.notes || undefined,
    };
    movementMutation.mutate(payload);
  };

  // ── Filtering
  const filtered = toolsList.filter((t) => {
    const matchSearch =
      !search || t.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Columns
  const columns = [
    {
      header: "Tool",
      cell: (row: Tool) => (
        <div className="flex items-center gap-3">
          {row.photoUrl ? (
            <img
              src={row.photoUrl}
              className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
              alt={row.name}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground text-xs">
              No photo
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.serialNumber}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (row: Tool) => (
        <span className="capitalize text-xs">
          {row.category?.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row: Tool) => <StatusBadge status={row.status} />,
    },
    {
      header: "",
      cell: (row: Tool) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => openForm(row)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => openMovementForm(row.id)}
          >
            Move
          </Button>
        </div>
      ),
    },
  ];

  const movementColumns = [
    {
      header: "Type",
      cell: (row: any) => (
        <Badge
          variant="outline"
          className={`text-xs ${
            row.movementType === "OUT"
              ? "bg-destructive/10 text-destructive"
              : "bg-success/10 text-success"
          }`}
        >
          {row.movementType === "OUT" ? (
            <ArrowRight className="w-3 h-3 inline mr-1" />
          ) : (
            <ArrowLeft className="w-3 h-3 inline mr-1" />
          )}
          {row.movementType}
        </Badge>
      ),
    },
    {
      header: "Notes",
      cell: (row: any) => (
        <span className="text-xs text-muted-foreground">
          {row.notes ?? "—"}
        </span>
      ),
    },
  ];

  console.log("movements.length ==>", movements.length);
  console.log("SelectedToolId ==>", selectedToolId);
  // ── Render
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tools & Equipment"
        subtitle={`${toolsList.length} items`}
        onAdd={() => openForm()}
        addLabel="New Tool"
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
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="in_use">In Use</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => openMovementForm()}>
          <Plus className="w-4 h-4 mr-1" /> Tool Movement
        </Button>
      </PageHeader>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* Recent movements for selected tool */}
      {selectedToolId && movements.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Recent Movements
          </h3>
          <DataTable columns={movementColumns} data={movements} />
        </div>
      )}

      {/* ── Tool Form */}
      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editing ? "Edit Tool" : "New Tool"}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <Label>Tool Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Photo upload */}
          <div className="col-span-2">
            <Label>Tool Photo</Label>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground w-fit">
              <Upload className="w-4 h-4" />
              {uploading
                ? "Uploading..."
                : form.photoUrl
                  ? "Replace photo"
                  : "Upload photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadPhoto}
                disabled={uploading}
              />
            </label>
            {form.photoUrl && (
              <img
                src={form.photoUrl}
                className="mt-2 w-24 h-24 rounded-lg object-cover border border-border"
                alt="Tool preview"
              />
            )}
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm({ ...form, category: v as ToolCategory })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hand_tools">Hand Tools</SelectItem>
                <SelectItem value="power_tools">Power Tools</SelectItem>
                <SelectItem value="heavy_equipment">Heavy Equipment</SelectItem>
                <SelectItem value="safety_equipment">
                  Safety Equipment
                </SelectItem>
                <SelectItem value="measurement">Measurement</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Serial Number */}
          <div className={editing ? "col-span-2" : ""}>
            <Label>Serial Number</Label>
            <Input
              value={form.serialNumber}
              onChange={(e) =>
                setForm({ ...form, serialNumber: e.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTool}
              disabled={saveMutation.isPending || !form.name}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </FormDialog>

      {/* ── Movement Form */}
      <FormDialog
        open={showMovementForm}
        onOpenChange={setShowMovementForm}
        title="New Tool Movement"
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Tool selector */}
          <div className="col-span-2">
            <Label>Tool *</Label>
            <Select value={selectedToolId} onValueChange={setSelectedToolId}>
              <SelectTrigger>
                <SelectValue placeholder="Select tool" />
              </SelectTrigger>
              <SelectContent>
                {toolsList.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    <span className="ml-2 text-xs text-muted-foreground capitalize">
                      ({t.status})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Movement type */}
          <div>
            <Label>Movement Type *</Label>
            <Select
              value={movForm.movementType}
              onValueChange={(v) =>
                setMovForm({ ...movForm, movementType: v as MovementType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OUT">OUT — Dispatched</SelectItem>
                <SelectItem value="IN">IN — Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Responsible person */}
          <div>
            <Label>Responsible Person *</Label>
            <Select
              value={movForm.responsibleId}
              onValueChange={(v) =>
                setMovForm({ ...movForm, responsibleId: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {personnelList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={movForm.notes}
              onChange={(e) =>
                setMovForm({ ...movForm, notes: e.target.value })
              }
            />
          </div>

          {/* Actions */}
          <div className="col-span-2 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMovementForm(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMovement}
              disabled={
                movementMutation.isPending ||
                !selectedToolId ||
                !movForm.responsibleId
              }
            >
              {movementMutation.isPending ? "Saving..." : "Save Movement"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
