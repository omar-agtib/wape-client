import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, Plus } from "lucide-react";

import {
  stockService,
  articlesService,
  personnelService,
  projectsService,
  type CreateStockMovementPayload,
} from "@/services/wape.service";
import type { Article, Personnel, Project } from "@/types/api";

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

// Backend stores: 'incoming' | 'consumed' | 'reserved'
type BackendMovementType = "incoming" | "consumed" | "reserved";

interface StockMovement {
  id: string;
  articleId?: string;
  articleName?: string;
  movementType: BackendMovementType;
  quantity: number;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  responsibleId?: string;
  responsibleName?: string;
  notes?: string;
  createdAt?: string;
  movementDate?: string;
  date?: string;
}

interface MovementFormState {
  articleId: string;
  movementType: "incoming" | "consumed";
  quantity: number;
  movementDate: string;
  responsibleId: string;
  projectId: string;
  notes: string;
}

const defaultMovForm: MovementFormState = {
  articleId: "",
  movementType: "incoming",
  quantity: 1,
  movementDate: "",
  responsibleId: "",
  projectId: "",
  notes: "",
};

// Display label + styling per backend type
const TYPE_LABEL: Record<BackendMovementType, string> = {
  incoming: "IN",
  consumed: "OUT",
  reserved: "RESERVED",
};

const TYPE_COLORS: Record<BackendMovementType, string> = {
  incoming: "bg-success/10 text-success border-success/20",
  consumed: "bg-destructive/10 text-destructive border-destructive/20",
  reserved: "bg-warning/10 text-warning border-warning/20",
};

const TYPE_SIGN: Record<BackendMovementType, string> = {
  incoming: "+",
  consumed: "-",
  reserved: "~",
};

const TYPE_TEXT_COLOR: Record<BackendMovementType, string> = {
  incoming: "text-success",
  consumed: "text-destructive",
  reserved: "text-warning",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function movementDate(m: StockMovement): string | undefined {
  return m.movementDate ?? m.date ?? m.createdAt;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Stock() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | BackendMovementType>(
    "all",
  );
  const [showDetail, setShowDetail] = useState<StockMovement | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MovementFormState>(defaultMovForm);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ["stock-movements"],
    queryFn: () => stockService.movements({ limit: 100 }),
  });

  const { data: articlesData } = useQuery({
    queryKey: ["articles"],
    queryFn: () => articlesService.list({ limit: 100 }),
  });

  const { data: personnelData } = useQuery({
    queryKey: ["personnel"],
    queryFn: () => personnelService.list({ limit: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const movements = (movementsData?.items ?? []) as StockMovement[];
  const articles = (articlesData?.items ?? []) as Article[];
  const personnelList = (personnelData?.items ?? []) as Personnel[];
  const projects = (projectsData?.items ?? []) as Project[];

  // ── Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStockMovementPayload) => stockService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setShowForm(false);
      setForm(defaultMovForm);
    },
  });

  const handleSave = () => {
    const payload: CreateStockMovementPayload = {
      articleId: form.articleId,
      movementType: form.movementType,
      quantity: form.quantity,
      movementDate: form.movementDate || undefined,
      responsibleId: form.responsibleId || undefined,
      projectId: form.projectId || undefined,
      notes: form.notes || undefined,
    };
    createMutation.mutate(payload);
  };

  // ── Filtering
  const filtered = movements.filter((m) => {
    const matchSearch =
      !search ||
      m.articleName?.toLowerCase().includes(search.toLowerCase()) ||
      m.projectName?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || m.movementType === typeFilter;
    const d = movementDate(m);
    const matchDate = !dateFilter || d?.startsWith(dateFilter);
    return matchSearch && matchType && matchDate;
  });

  // ── Columns
  const columns = [
    {
      header: "Date",
      cell: (row: StockMovement) => {
        const d = movementDate(row);
        return d ? format(new Date(d), "MMM d, yyyy") : "—";
      },
    },
    {
      header: "Article",
      cell: (row: StockMovement) => (
        <span className="font-medium">{row.articleName ?? "—"}</span>
      ),
    },
    {
      header: "Type",
      cell: (row: StockMovement) => (
        <Badge
          variant="outline"
          className={`text-xs ${TYPE_COLORS[row.movementType] ?? ""}`}
        >
          {TYPE_LABEL[row.movementType] ?? row.movementType}
        </Badge>
      ),
    },
    {
      header: "Quantity",
      cell: (row: StockMovement) => (
        <span
          className={`font-semibold ${TYPE_TEXT_COLOR[row.movementType] ?? ""}`}
        >
          {TYPE_SIGN[row.movementType] ?? ""}
          {row.quantity}
        </span>
      ),
    },
    {
      header: "Project",
      cell: (row: StockMovement) => (
        <span className="text-xs text-muted-foreground">
          {row.projectName ?? "—"}
        </span>
      ),
    },
    {
      header: "Task",
      cell: (row: StockMovement) => (
        <span className="text-xs text-muted-foreground">
          {row.taskName ?? "—"}
        </span>
      ),
    },
    {
      header: "Responsible",
      cell: (row: StockMovement) => (
        <span className="text-xs">{row.responsibleName ?? "—"}</span>
      ),
    },
    {
      header: "Notes",
      cell: (row: StockMovement) => (
        <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
          {row.notes ?? "—"}
        </span>
      ),
    },
    {
      header: "",
      cell: (row: StockMovement) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowDetail(row)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  // ── Render
  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock Movements"
        subtitle={`${movements.length} movements`}
        searchValue={search}
        onSearch={setSearch}
      >
        <Input
          type="date"
          className="w-36 bg-card h-9"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
        >
          <SelectTrigger className="w-32 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="incoming">IN</SelectItem>
            <SelectItem value="consumed">OUT</SelectItem>
            <SelectItem value="reserved">RESERVED</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> New Movement
        </Button>
      </PageHeader>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── New Movement Form */}
      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title="New Stock Movement"
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Article */}
          <div className="col-span-2">
            <Label>Article *</Label>
            <Select
              value={form.articleId || undefined}
              onValueChange={(v) => setForm({ ...form, articleId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select article" />
              </SelectTrigger>
              <SelectContent>
                {articles.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      (stock: {a.stockQuantity})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div>
            <Label>Type *</Label>
            <Select
              value={form.movementType}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  movementType: v as "incoming" | "consumed",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incoming">IN (Entry)</SelectItem>
                <SelectItem value="consumed">OUT (Exit)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div>
            <Label>Quantity *</Label>
            <Input
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) =>
                setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          {/* Date */}
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={form.movementDate}
              onChange={(e) =>
                setForm({ ...form, movementDate: e.target.value })
              }
            />
          </div>

          {/* Responsible */}
          <div>
            <Label>Responsible</Label>
            <Select
              value={form.responsibleId || undefined}
              onValueChange={(v) => setForm({ ...form, responsibleId: v })}
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

          {/* Project */}
          <div className="col-span-2">
            <Label>Project</Label>
            <Select
              value={form.projectId || undefined}
              onValueChange={(v) => setForm({ ...form, projectId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project (optional)" />
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

          {/* Notes */}
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                createMutation.isPending || !form.articleId || !form.quantity
              }
            >
              {createMutation.isPending ? "Saving..." : "Save Movement"}
            </Button>
          </div>
        </div>
      </FormDialog>

      {/* ── Detail Dialog */}
      {showDetail && (
        <FormDialog
          open={!!showDetail}
          onOpenChange={() => setShowDetail(null)}
          title="Movement Details"
        >
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-muted-foreground">Article:</span>{" "}
                <span className="font-medium">
                  {showDetail.articleName ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                <span className="font-medium">
                  {TYPE_LABEL[showDetail.movementType] ??
                    showDetail.movementType}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Quantity:</span>{" "}
                <span className="font-medium">{showDetail.quantity}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>{" "}
                <span className="font-medium">
                  {movementDate(showDetail)
                    ? format(
                        new Date(movementDate(showDetail) as string),
                        "MMM d, yyyy",
                      )
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Project:</span>{" "}
                <span className="font-medium">
                  {showDetail.projectName ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Task:</span>{" "}
                <span className="font-medium">
                  {showDetail.taskName ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Responsible:</span>{" "}
                <span className="font-medium">
                  {showDetail.responsibleName ?? "—"}
                </span>
              </div>
            </div>
            {showDetail.notes && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-xs mb-1">Notes</p>
                <p>{showDetail.notes}</p>
              </div>
            )}
          </div>
        </FormDialog>
      )}
    </div>
  );
}
