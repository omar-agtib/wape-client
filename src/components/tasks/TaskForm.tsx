import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";

import {
  personnelService,
  articlesService,
  toolsService,
  contactsService,
  type CreateTaskPayload,
} from "@/services/wape.service";
import type { Project, Personnel, Article, Tool, Task } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from "@/components/shared/SearchableSelect";

// ── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = "planned" | "on_progress" | "completed";

// Local row types used only inside the form UI
interface PersonnelRow {
  personnelId: string;
  fullName: string;
  plannedHours: number;
  costPerHour: number;
}

interface ArticleRow {
  articleId: string;
  name: string;
  plannedQuantity: number;
  unitPrice: number;
  unit?: string;
}

interface ToolRow {
  toolId: string;
  name: string;
  plannedDays: number;
}

interface FormState {
  name: string;
  projectId: string;
  description: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  estimatedCost: number;
  currency: string;
}

interface Props {
  task?: Task | null;
  projects: Project[];
  onSave: (payload: CreateTaskPayload) => void;
  onCancel: () => void;
  saving: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TaskForm({
  task,
  projects,
  onSave,
  onCancel,
  saving,
}: Props) {
  const queryClient = useQueryClient();

  // ── Form state
  const [form, setForm] = useState<FormState>({
    name: task?.name ?? "",
    projectId: task?.projectId ?? "",
    description: task?.description ?? "",
    startDate: task?.startDate ?? "",
    endDate: task?.endDate ?? "",
    status: (task?.status as TaskStatus) ?? "planned",
    estimatedCost: task?.estimatedCost ?? 0,
    currency: task?.currency ?? "MAD",
  });

  // Sub-resource rows (local UI state — saved separately after task create/update)
  const [personnelRows, setPersonnelRows] = useState<PersonnelRow[]>([]);
  const [articleRows, setArticleRows] = useState<ArticleRow[]>([]);
  const [toolRows, setToolRows] = useState<ToolRow[]>([]);

  // ── Lookup queries
  const { data: personnelData } = useQuery({
    queryKey: ["personnel"],
    queryFn: () => personnelService.list({ limit: 100 }),
  });

  const { data: articlesData } = useQuery({
    queryKey: ["articles"],
    queryFn: () => articlesService.list({ limit: 100 }),
  });

  const { data: toolsData } = useQuery({
    queryKey: ["tools"],
    queryFn: () => toolsService.list({ limit: 100 }),
  });

  const { data: subsData } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => contactsService.listSubcontractors({ limit: 100 }),
  });

  const personnelList = (personnelData?.items ?? []) as Personnel[];
  const articlesList = (articlesData?.items ?? []) as Article[];
  const toolsList = (toolsData?.items ?? []) as Tool[];

  // ── Quick-create mutations
  const quickCreatePersonnel = useMutation({
    mutationFn: (name: string) =>
      personnelService.create({
        fullName: name,
        role: "Worker",
        costPerHour: 0,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personnel"] }),
  });

  const quickCreateArticle = useMutation({
    mutationFn: (name: string) =>
      articlesService.create({ name, category: "General", unitPrice: 0 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }),
  });

  // ── Personnel helpers
  const addPersonnel = (item: { id: string; label: string }) => {
    if (personnelRows.some((r) => r.personnelId === item.id)) return;
    const found = personnelList.find((p) => p.id === item.id);
    setPersonnelRows((prev) => [
      ...prev,
      {
        personnelId: item.id,
        fullName: found?.fullName ?? item.label,
        plannedHours: 8,
        costPerHour: found?.costPerHour ?? 0,
      },
    ]);
  };

  const updatePersonnelRow = (
    id: string,
    field: keyof Pick<PersonnelRow, "plannedHours" | "costPerHour">,
    val: string,
  ) => {
    setPersonnelRows((prev) =>
      prev.map((r) =>
        r.personnelId === id ? { ...r, [field]: parseFloat(val) || 0 } : r,
      ),
    );
  };

  // ── Article helpers
  const addArticle = (item: { id: string; label: string }) => {
    if (articleRows.some((r) => r.articleId === item.id)) return;
    const found = articlesList.find((a) => a.id === item.id);
    setArticleRows((prev) => [
      ...prev,
      {
        articleId: item.id,
        name: found?.name ?? item.label,
        plannedQuantity: 1,
        unitPrice: found?.unitPrice ?? 0,
        unit: found?.unit,
      },
    ]);
  };

  const updateArticleRow = (
    id: string,
    field: keyof Pick<ArticleRow, "plannedQuantity" | "unitPrice">,
    val: string,
  ) => {
    setArticleRows((prev) =>
      prev.map((r) =>
        r.articleId === id ? { ...r, [field]: parseFloat(val) || 0 } : r,
      ),
    );
  };

  // ── Tool helpers
  const addTool = (item: { id: string; label: string }) => {
    if (toolRows.some((r) => r.toolId === item.id)) return;
    const found = toolsList.find((t) => t.id === item.id);
    setToolRows((prev) => [
      ...prev,
      {
        toolId: item.id,
        name: found?.name ?? item.label,
        plannedDays: 1,
      },
    ]);
  };

  const updateToolRow = (id: string, val: string) => {
    setToolRows((prev) =>
      prev.map((r) =>
        r.toolId === id ? { ...r, plannedDays: parseFloat(val) || 0 } : r,
      ),
    );
  };

  // ── Cost estimates
  const estPersonnel = personnelRows.reduce(
    (s, p) => s + p.costPerHour * p.plannedHours,
    0,
  );
  const estArticles = articleRows.reduce(
    (s, a) => s + a.unitPrice * a.plannedQuantity,
    0,
  );
  const totalEst = estPersonnel + estArticles;

  // ── Submit
  const handleSave = () => {
    const payload: CreateTaskPayload = {
      name: form.name,
      projectId: form.projectId,
      description: form.description || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      estimatedCost: totalEst > 0 ? totalEst : form.estimatedCost,
      currency: form.currency,
    };
    onSave(payload);
  };

  // ── Render
  return (
    <div className="grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Name */}
      <div className="col-span-2">
        <Label>Task Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      {/* Project */}
      <div>
        <Label>Project *</Label>
        <Select
          value={form.projectId}
          onValueChange={(v) => setForm({ ...form, projectId: v })}
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

      {/* Status */}
      <div>
        <Label>Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}
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
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
      </div>
      <div>
        <Label>End Date *</Label>
        <Input
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        />
      </div>

      {/* Currency */}
      <div>
        <Label>Currency</Label>
        <Select
          value={form.currency}
          onValueChange={(v) => setForm({ ...form, currency: v })}
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

      {/* ── Personnel */}
      <div className="col-span-2">
        <Label>Assign Personnel</Label>
        <SearchableSelect
          items={personnelList.map((p) => ({ id: p.id, label: p.fullName }))}
          onSelect={addPersonnel}
          onQuickCreate={(name) => quickCreatePersonnel.mutate(name)}
          placeholder="Search personnel..."
        />
        <div className="mt-2 space-y-1">
          {personnelRows.map((p) => (
            <div
              key={p.personnelId}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs"
            >
              <span className="flex-1 font-medium">{p.fullName}</span>
              <span className="text-muted-foreground">Hours:</span>
              <Input
                type="number"
                className="w-16 h-6 text-xs"
                value={p.plannedHours}
                onChange={(e) =>
                  updatePersonnelRow(
                    p.personnelId,
                    "plannedHours",
                    e.target.value,
                  )
                }
              />
              <span className="text-muted-foreground">Rate:</span>
              <Input
                type="number"
                className="w-20 h-6 text-xs"
                value={p.costPerHour}
                onChange={(e) =>
                  updatePersonnelRow(
                    p.personnelId,
                    "costPerHour",
                    e.target.value,
                  )
                }
              />
              <X
                className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive"
                onClick={() =>
                  setPersonnelRows((prev) =>
                    prev.filter((r) => r.personnelId !== p.personnelId),
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Articles */}
      <div className="col-span-2">
        <Label>Assign Materials</Label>
        <SearchableSelect
          items={articlesList.map((a) => ({ id: a.id, label: a.name }))}
          onSelect={addArticle}
          onQuickCreate={(name) => quickCreateArticle.mutate(name)}
          placeholder="Search materials..."
        />
        <div className="mt-2 space-y-1">
          {articleRows.map((a) => (
            <div
              key={a.articleId}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs"
            >
              <span className="flex-1 font-medium">{a.name}</span>
              <span className="text-muted-foreground">
                Qty{a.unit ? ` (${a.unit})` : ""}:
              </span>
              <Input
                type="number"
                className="w-16 h-6 text-xs"
                value={a.plannedQuantity}
                onChange={(e) =>
                  updateArticleRow(
                    a.articleId,
                    "plannedQuantity",
                    e.target.value,
                  )
                }
              />
              <span className="text-muted-foreground">Unit price:</span>
              <Input
                type="number"
                className="w-20 h-6 text-xs"
                value={a.unitPrice}
                onChange={(e) =>
                  updateArticleRow(a.articleId, "unitPrice", e.target.value)
                }
              />
              <X
                className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive"
                onClick={() =>
                  setArticleRows((prev) =>
                    prev.filter((r) => r.articleId !== a.articleId),
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Tools */}
      <div className="col-span-2">
        <Label>Assign Tools</Label>
        <SearchableSelect
          items={toolsList.map((t) => ({ id: t.id, label: t.name }))}
          onSelect={addTool}
          placeholder="Search tools..."
        />
        <div className="mt-2 space-y-1">
          {toolRows.map((t) => (
            <div
              key={t.toolId}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs"
            >
              <span className="flex-1 font-medium">{t.name}</span>
              <span className="text-muted-foreground">Days:</span>
              <Input
                type="number"
                className="w-16 h-6 text-xs"
                value={t.plannedDays}
                onChange={(e) => updateToolRow(t.toolId, e.target.value)}
              />
              <X
                className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive"
                onClick={() =>
                  setToolRows((prev) =>
                    prev.filter((r) => r.toolId !== t.toolId),
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Cost summary */}
      {totalEst > 0 && (
        <div className="col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
          <div className="flex justify-between text-muted-foreground flex-wrap gap-2">
            <span>
              Personnel:{" "}
              <strong>
                {estPersonnel.toFixed(0)} {form.currency}
              </strong>
            </span>
            <span>
              Materials:{" "}
              <strong>
                {estArticles.toFixed(0)} {form.currency}
              </strong>
            </span>
          </div>
          <p className="mt-1 font-bold text-primary">
            Estimated: {totalEst.toFixed(0)} {form.currency}
          </p>
        </div>
      )}

      {/* ── Description */}
      <div className="col-span-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      {/* ── Note about sub-resources */}
      {task && (
        <p className="col-span-2 text-xs text-muted-foreground bg-muted/30 rounded p-2">
          ℹ️ To manage assigned personnel, materials and tools on an existing
          task, open the task details page.
        </p>
      )}

      {/* ── Actions */}
      <div className="col-span-2 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={
            saving ||
            !form.name ||
            !form.projectId ||
            !form.startDate ||
            !form.endDate
          }
        >
          {saving ? "Saving..." : "Save Task"}
        </Button>
      </div>
    </div>
  );
}
