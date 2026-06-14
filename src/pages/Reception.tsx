import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Package, Upload } from "lucide-react";

import {
  receptionsService,
  purchaseOrdersService,
  personnelService,
  projectsService,
  contactsService,
  articlesService,
} from "@/services/wape.service";
import type {
  Contact,
  Article,
  Personnel,
  Project,
  PurchaseOrder,
  PurchaseOrderListRow,
  ReceptionListRow,
  ReceptionStatus,
  CreateReceptionPayload,
} from "@/types/api";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Status display mapping (enum → label + color) ─────────────────────────────
const STATUS_COLORS: Record<ReceptionStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  partial: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-success/10 text-success border-success/20",
};

const STATUS_LABELS: Record<ReceptionStatus, string> = {
  pending: "Pending Reception",
  partial: "Partial Reception",
  completed: "Reception Completed",
};

const DOC_TYPES = ["BL", "BC", "invoice", "other"] as const;

// A PO line shape (from PO detail) used to auto-fill the articles table
interface PoLineRow {
  id: string;
  articleId: string;
  articleName?: string;
  orderedQuantity: number;
}

// One editable row in the create modal's articles table
interface CreateLineState {
  articleId: string;
  articleName: string;
  ordered: number;
  received: string; // strings for controlled number inputs
  rejected: string;
}

interface CreateFormState {
  purchaseOrderId: string;
  supplierId: string;
  supplierName: string;
  projectId: string;
  deliveryDate: string;
  receivedById: string;
  receivedByName: string;
  notes: string;
}

const EMPTY_FORM: CreateFormState = {
  purchaseOrderId: "",
  supplierId: "",
  supplierName: "",
  projectId: "",
  deliveryDate: "",
  receivedById: "",
  receivedByName: "",
  notes: "",
};

interface ReceiveFormState {
  receivedQuantity: string;
  rejectedQuantity: string;
  notes: string;
  receivedById: string;
  receivedByName: string;
}

const EMPTY_RECEIVE: ReceiveFormState = {
  receivedQuantity: "",
  rejectedQuantity: "",
  notes: "",
  receivedById: "",
  receivedByName: "",
};

export default function ReceptionPage() {
  const [search, setSearch] = useState("");

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateFormState>(EMPTY_FORM);
  const [lines, setLines] = useState<CreateLineState[]>([]);

  // Receive (Process) modal state
  const [showReceive, setShowReceive] = useState(false);
  const [receiveRow, setReceiveRow] = useState<ReceptionListRow | null>(null);
  const [receiveForm, setReceiveForm] =
    useState<ReceiveFormState>(EMPTY_RECEIVE);

  const queryClient = useQueryClient();

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: receptionsData, isLoading } = useQuery({
    queryKey: ["receptions"],
    queryFn: () => receptionsService.list({ limit: 100 }),
  });
  const { data: poData } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => purchaseOrdersService.list({ limit: 100 }),
  });
  const { data: personnelData } = useQuery({
    queryKey: ["personnel"],
    queryFn: () => personnelService.list({ limit: 100 }),
  });
  const { data: projectsResp } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });
  const { data: suppliersResp } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => contactsService.listSuppliers({ limit: 100 }),
  });

  const { data: articlesResp } = useQuery({
    queryKey: ["articles"],
    queryFn: () => articlesService.list({ limit: 100 }),
  });

  const receptions = (receptionsData?.items ?? []) as ReceptionListRow[];
  const purchaseOrders = (poData?.items ?? []) as PurchaseOrderListRow[];
  const personnelList = (personnelData?.items ?? []) as Personnel[];
  const projects = (projectsResp?.items ?? []) as Project[];
  const suppliers = (suppliersResp?.items ?? []) as Contact[];
  const articles = (articlesResp?.items ?? []) as Article[];

  // ── Lookups for the list table ───────────────────────────────────────────────
  const poById = useMemo(
    () => new Map(purchaseOrders.map((p) => [p.id, p])),
    [purchaseOrders],
  );
  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );
  const supplierById = useMemo(
    () => new Map(suppliers.map((s) => [s.id, s])),
    [suppliers],
  );

  const articleById = useMemo(
    () => new Map(articles.map((a) => [a.id, a])),
    [articles],
  );

  // ── PO detail (auto-fill the articles table when a PO is linked) ──────────────
  const poDetailQuery = useQuery({
    queryKey: ["po-detail", form.purchaseOrderId],
    queryFn: () => purchaseOrdersService.get(form.purchaseOrderId),
    enabled: !!form.purchaseOrderId,
  });

  const applyPoToForm = (po: PurchaseOrder) => {
    const poLines = ((po as PurchaseOrder & { lines?: PoLineRow[] }).lines ??
      []) as PoLineRow[];
    setLines(
      poLines.map((l) => ({
        articleId: l.articleId,
        articleName: articleById.get(l.articleId)?.name ?? l.articleId,
        ordered: Number(l.orderedQuantity),
        received: "",
        rejected: "",
      })),
    );
    setForm((f) => ({
      ...f,
      supplierId:
        (po as PurchaseOrder & { supplierId?: string }).supplierId ??
        f.supplierId,
      projectId:
        (po as PurchaseOrder & { projectId?: string }).projectId ?? f.projectId,
    }));
  };

  // Fill from the fetched PO once, while lines are still empty.
  if (
    poDetailQuery.data &&
    form.purchaseOrderId &&
    lines.length === 0 &&
    !poDetailQuery.isFetching
  ) {
    applyPoToForm(poDetailQuery.data as PurchaseOrder);
  }

  // ── Mutations (global error handler in App.tsx shows toasts) ──────────────────
  const createMutation = useMutation({
    mutationFn: (body: CreateReceptionPayload) =>
      receptionsService.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receptions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      closeCreate();
    },
  });

  const receiveMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        receivedQuantity: number;
        rejectedQuantity?: number;
        notes?: string;
        receivedByName?: string;
        receivedBy?: string;
      };
    }) => receptionsService.receive(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receptions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setShowReceive(false);
      setReceiveRow(null);
    },
  });

  // ── Create helpers ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setLines([]);
    setShowCreate(true);
  };
  const closeCreate = () => {
    setShowCreate(false);
    setForm(EMPTY_FORM);
    setLines([]);
  };

  const onSelectPo = (poId: string) => {
    setLines([]); // reset so the auto-fill guard re-runs for the new PO
    setForm((f) => ({ ...f, purchaseOrderId: poId }));
  };

  const updateLine = (
    idx: number,
    field: "received" | "rejected",
    value: string,
  ) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    );
  };

  const submitCreate = () => {
    const payload: CreateReceptionPayload = {
      purchaseOrderId: form.purchaseOrderId || undefined,
      supplierId: form.supplierId || undefined,
      supplierName: form.supplierName || undefined,
      projectId: form.projectId || undefined,
      deliveryDate: form.deliveryDate || undefined,
      receivedBy: form.receivedById || undefined,
      receivedByName: form.receivedByName || undefined,
      notes: form.notes || undefined,
    };
    // Only send manual lines when there's no PO (PO lines are built server-side).
    if (!form.purchaseOrderId && lines.length > 0) {
      payload.lines = lines.map((l) => ({
        articleId: l.articleId,
        expectedQuantity: l.ordered || 0,
        receivedQuantity: l.received ? Number(l.received) : undefined,
        rejectedQuantity: l.rejected ? Number(l.rejected) : undefined,
      }));
    }
    createMutation.mutate(payload);
  };

  // ── Receive helpers ───────────────────────────────────────────────────────────
  const openReceive = (r: ReceptionListRow) => {
    setReceiveRow(r);
    const remaining =
      (r.expectedQuantity ?? 0) - r.receivedQuantity - r.rejectedQuantity;
    setReceiveForm({
      receivedQuantity: String(remaining > 0 ? remaining : 0),
      rejectedQuantity: "",
      notes: "",
      receivedById: "",
      receivedByName: "",
    });
    setShowReceive(true);
  };

  const submitReceive = () => {
    if (!receiveRow) return;
    receiveMutation.mutate({
      id: receiveRow.id,
      body: {
        receivedQuantity: Number(receiveForm.receivedQuantity) || 0,
        rejectedQuantity: receiveForm.rejectedQuantity
          ? Number(receiveForm.rejectedQuantity)
          : undefined,
        receivedBy: receiveForm.receivedById || undefined,
        receivedByName: receiveForm.receivedByName || undefined,
        notes: receiveForm.notes || undefined,
      },
    });
  };

  // ── List display helpers ──────────────────────────────────────────────────────
  const supplierLabel = (r: ReceptionListRow) => {
    if (r.supplierId && supplierById.has(r.supplierId))
      return supplierById.get(r.supplierId)!.legalName;
    if (r.supplierName) return r.supplierName;
    const po = r.purchaseOrderId ? poById.get(r.purchaseOrderId) : undefined;
    return po?.supplierName ?? "—";
  };
  const poRef = (r: ReceptionListRow) =>
    r.purchaseOrderId
      ? `PO-${r.purchaseOrderId.slice(-6).toUpperCase()}`
      : "Manual";
  const projectLabel = (r: ReceptionListRow) =>
    r.projectId ? (projectById.get(r.projectId)?.name ?? "—") : "—";

  // ── Filtering ─────────────────────────────────────────────────────────────────
  const filtered = receptions.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      supplierLabel(r).toLowerCase().includes(q) ||
      poRef(r).toLowerCase().includes(q) ||
      projectLabel(r).toLowerCase().includes(q)
    );
  });

  // ── Columns ───────────────────────────────────────────────────────────────────
  const columns = [
    {
      header: "Supplier",
      cell: (r: ReceptionListRow) => (
        <div>
          <p className="font-medium text-foreground">{supplierLabel(r)}</p>
          <p className="text-xs text-muted-foreground">{poRef(r)}</p>
        </div>
      ),
    },
    {
      header: "Project",
      cell: (r: ReceptionListRow) => (
        <span className="text-sm">{projectLabel(r)}</span>
      ),
    },
    {
      header: "Delivery Date",
      cell: (r: ReceptionListRow) =>
        r.deliveryDate ? format(new Date(r.deliveryDate), "MMM d, yyyy") : "—",
    },
    {
      header: "Received By",
      cell: (r: ReceptionListRow) => (
        <span className="text-sm">{r.receivedByName ?? "—"}</span>
      ),
    },
    {
      header: "Items",
      cell: (r: ReceptionListRow) => (
        <span className="text-xs">{r.articleId ? "1 article" : "—"}</span>
      ),
    },
    {
      header: "Status",
      cell: (r: ReceptionListRow) => (
        <Badge
          variant="outline"
          className={`text-xs ${STATUS_COLORS[r.status] ?? ""}`}
        >
          {STATUS_LABELS[r.status] ?? r.status}
        </Badge>
      ),
    },
    {
      header: "",
      cell: (r: ReceptionListRow) =>
        r.purchaseOrderLineId && r.status !== "completed" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => openReceive(r)}
          >
            Process
          </Button>
        ) : r.status === "completed" ? (
          <span className="text-xs text-success font-medium">Done</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <PageHeader
        title="Reception"
        subtitle={`${receptions.length} receptions`}
        searchValue={search}
        onSearch={setSearch}
        onAdd={openCreate}
        addLabel="New Reception"
      />

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── New Reception modal ────────────────────────────────────────────── */}
      <FormDialog
        open={showCreate}
        onOpenChange={(o) => (o ? setShowCreate(true) : closeCreate())}
        title="New Reception"
      >
        <div className="space-y-4">
          {/* Link to PO */}
          <div>
            <Label>Link to Purchase Order</Label>
            <Select value={form.purchaseOrderId} onValueChange={onSelectPo}>
              <SelectTrigger>
                <SelectValue placeholder="Select a PO to auto-fill..." />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrders.map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    PO-{po.id.slice(-6).toUpperCase()}
                    {po.supplierName ? ` — ${po.supplierName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Supplier */}
            <div>
              <Label>Supplier *</Label>
              <Select
                value={form.supplierId}
                onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v }))}
                disabled={!!form.purchaseOrderId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!form.purchaseOrderId && (
                <Input
                  className="mt-2"
                  placeholder="Or type supplier name"
                  value={form.supplierName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, supplierName: e.target.value }))
                  }
                />
              )}
            </div>

            {/* Delivery Date */}
            <div>
              <Label>Delivery Date</Label>
              <Input
                type="date"
                value={form.deliveryDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deliveryDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Received By (personnel dropdown) */}
            <div>
              <Label>Received By</Label>
              <Select
                value={form.receivedById}
                onValueChange={(v) => {
                  const person = personnelList.find((p) => p.id === v);
                  setForm((f) => ({
                    ...f,
                    receivedById: v,
                    receivedByName: person?.fullName ?? "",
                  }));
                }}
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
            <div>
              <Label>Project</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}
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
          </div>

          {/* Received Articles */}
          <div>
            <Label className="mb-2 block">Received Articles</Label>
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {form.purchaseOrderId
                  ? "Loading articles from the purchase order..."
                  : "Link a Purchase Order above to auto-fill articles."}
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
                  <span className="flex-1 min-w-0">Article</span>
                  <span className="w-12 text-center shrink-0">Ordered</span>
                  <span className="w-16 text-center shrink-0">Received</span>
                  <span className="w-16 text-center shrink-0">Rejected</span>
                  <span className="w-14 text-center shrink-0">Left</span>
                </div>
                {lines.map((l, idx) => {
                  const articleName =
                    articleById.get(l.articleId)?.name ?? l.articleId;
                  const remaining =
                    l.ordered -
                    (Number(l.received) || 0) -
                    (Number(l.rejected) || 0);
                  return (
                    <div
                      key={l.articleId + idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      <span className="flex-1 min-w-0 text-sm flex items-center gap-1">
                        <Package className="w-3 h-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{articleName}</span>
                      </span>
                      <span className="w-12 text-sm font-medium text-center shrink-0">
                        {l.ordered}
                      </span>
                      <Input
                        className="w-16 h-9 shrink-0 text-center px-1"
                        type="number"
                        min={0}
                        placeholder="0"
                        value={l.received}
                        onChange={(e) =>
                          updateLine(idx, "received", e.target.value)
                        }
                      />
                      <Input
                        className="w-16 h-9 shrink-0 text-center px-1"
                        type="number"
                        min={0}
                        placeholder="0"
                        value={l.rejected}
                        onChange={(e) =>
                          updateLine(idx, "rejected", e.target.value)
                        }
                      />
                      <span className="w-14 text-sm text-warning font-medium text-center shrink-0">
                        {remaining}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents — disabled until Round B (Supabase storage) */}
          <div>
            <Label className="mb-2 block">Documents</Label>
            <TooltipProvider>
              <div className="flex gap-2">
                {DOC_TYPES.map((d) => (
                  <Tooltip key={d}>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          {d}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Coming soon</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeCreate}>
              Cancel
            </Button>
            <Button
              onClick={submitCreate}
              disabled={
                createMutation.isPending ||
                (!form.purchaseOrderId &&
                  !form.supplierId &&
                  !form.supplierName)
              }
            >
              {createMutation.isPending ? "Saving..." : "Validate Reception"}
            </Button>
          </div>
        </div>
      </FormDialog>

      {/* ── Process / Receive modal (W6) ───────────────────────────────────── */}
      <FormDialog
        open={showReceive}
        onOpenChange={setShowReceive}
        title={
          receiveRow
            ? `Process — ${STATUS_LABELS[receiveRow.status]}`
            : "Process Reception"
        }
      >
        <div className="space-y-4">
          {receiveRow && (
            <div className="grid grid-cols-3 gap-2 text-sm p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-xs text-muted-foreground">Ordered</p>
                <p className="font-medium">
                  {receiveRow.expectedQuantity ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Already received
                </p>
                <p className="font-medium">{receiveRow.receivedQuantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-medium text-warning">
                  {(receiveRow.expectedQuantity ?? 0) -
                    receiveRow.receivedQuantity -
                    receiveRow.rejectedQuantity}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Received Quantity *</Label>
              <Input
                type="number"
                min={0}
                value={receiveForm.receivedQuantity}
                onChange={(e) =>
                  setReceiveForm((f) => ({
                    ...f,
                    receivedQuantity: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Rejected Quantity</Label>
              <Input
                type="number"
                min={0}
                value={receiveForm.rejectedQuantity}
                onChange={(e) =>
                  setReceiveForm((f) => ({
                    ...f,
                    rejectedQuantity: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <Label>Received By</Label>
            <Select
              value={receiveForm.receivedById}
              onValueChange={(v) => {
                const person = personnelList.find((p) => p.id === v);
                setReceiveForm((f) => ({
                  ...f,
                  receivedById: v,
                  receivedByName: person?.fullName ?? "",
                }));
              }}
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

          <div>
            <Label>Notes</Label>
            <Textarea
              value={receiveForm.notes}
              onChange={(e) =>
                setReceiveForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReceive(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitReceive}
              disabled={
                receiveMutation.isPending ||
                Number(receiveForm.receivedQuantity) <= 0
              }
            >
              {receiveMutation.isPending
                ? "Processing..."
                : "Validate Reception"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
