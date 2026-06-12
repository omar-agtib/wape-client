import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { X, Package, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  purchaseOrdersService,
  projectsService,
  articlesService,
  contactsService,
  type CreatePurchaseOrderPayload,
  type PurchaseOrderLine,
} from "@/services/wape.service";
import type {
  PurchaseOrderListRow,
  PurchaseOrderStatus,
  Project,
  Article,
  Contact,
} from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FormDialog from "@/components/shared/FormDialog";
import SearchableSelect from "@/components/shared/SearchableSelect";
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

interface LineRow extends PurchaseOrderLine {
  articleName: string;
}

interface FormState {
  supplierId: string;
  projectId: string;
  currency: string;
  orderDate: string;
  expectedDelivery: string;
  notes: string;
  lines: LineRow[];
}

const defaultForm: FormState = {
  supplierId: "",
  projectId: "",
  currency: "MAD",
  orderDate: "",
  expectedDelivery: "",
  notes: "",
  lines: [],
};

// ── Status display ──────────────────────────────────────────────────────────

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  draft: "Draft",
  confirmed: "Ordered",
  partial: "Partially Received",
  completed: "Received",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<PurchaseOrderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  partial: "bg-amber-100 text-amber-700",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PurchaseOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseOrderStatus>(
    "all",
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ── Queries
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => purchaseOrdersService.list({ limit: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const { data: articlesData } = useQuery({
    queryKey: ["articles"],
    queryFn: () => articlesService.list({ limit: 100 }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => contactsService.listSuppliers({ limit: 100 }),
  });

  const orders = (ordersData?.items ?? []) as PurchaseOrderListRow[];
  const projects = (projectsData?.items ?? []) as Project[];
  const articles = (articlesData?.items ?? []) as Article[];
  const suppliers = (suppliersData?.items ?? []) as Contact[];

  // ── Mutations
  const saveMutation = useMutation({
    mutationFn: (data: CreatePurchaseOrderPayload) =>
      purchaseOrdersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setShowForm(false);
      setForm(defaultForm);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersService.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  // ── Line helpers
  const addLine = (item: { id: string | number; label: string }) => {
    const id = String(item.id);
    if (form.lines.some((l) => l.articleId === id)) return;
    const found = articles.find((a) => a.id === id);
    setForm((f) => ({
      ...f,
      lines: [
        ...f.lines,
        {
          articleId: id,
          articleName: found?.name ?? item.label,
          orderedQuantity: 1,
          unitPrice: found?.unitPrice ?? 0,
          currency: f.currency || undefined,
        },
      ],
    }));
  };

  const updateLine = (
    idx: number,
    field: "orderedQuantity" | "unitPrice",
    val: string,
  ) => {
    const lines = [...form.lines];
    lines[idx] = { ...lines[idx], [field]: parseFloat(val) || 0 };
    setForm((f) => ({ ...f, lines }));
  };

  const removeLine = (idx: number) => {
    setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
  };

  const totalAmount = form.lines.reduce(
    (s, l) => s + (l.orderedQuantity ?? 0) * (l.unitPrice ?? 0),
    0,
  );

  const handleSave = () => {
    const payload: CreatePurchaseOrderPayload = {
      supplierId: form.supplierId,
      projectId: form.projectId || undefined,
      currency: form.currency || undefined,
      orderDate: form.orderDate || undefined,
      expectedDelivery: form.expectedDelivery || undefined,
      notes: form.notes || undefined,
      lines: form.lines.map((l) => ({
        articleId: l.articleId,
        orderedQuantity: l.orderedQuantity,
        unitPrice: l.unitPrice,
        currency: l.currency,
      })),
    };
    saveMutation.mutate(payload);
  };

  // ── Filtering
  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Columns (match design: Order#, Project, Items, Total, Order Date, Expected Delivery, Status)
  const columns = [
    {
      header: "Order #",
      cell: (row: PurchaseOrderListRow) => (
        <div>
          <p className="font-medium text-foreground">{row.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {row.supplierName ?? "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Project",
      cell: (row: PurchaseOrderListRow) => (
        <span className="text-sm">{row.projectName ?? "—"}</span>
      ),
    },
    {
      header: "Items",
      cell: (row: PurchaseOrderListRow) => (
        <span className="text-sm text-muted-foreground">
          {Number(row.lineCount ?? 0)} article
          {Number(row.lineCount ?? 0) === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      header: "Total",
      cell: (row: PurchaseOrderListRow) => (
        <span className="font-semibold">
          {row.currency ?? "MAD"}{" "}
          {Number(row.totalAmount ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Order Date",
      cell: (row: PurchaseOrderListRow) =>
        row.orderDate ? (
          <span className="text-sm">
            {format(new Date(row.orderDate), "MMM d, yyyy")}
          </span>
        ) : (
          "—"
        ),
    },
    {
      header: "Expected Delivery",
      cell: (row: PurchaseOrderListRow) =>
        row.expectedDelivery ? (
          <span className="text-sm">
            {format(new Date(row.expectedDelivery), "MMM d, yyyy")}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      header: "Status",
      cell: (row: PurchaseOrderListRow) => (
        <Badge
          variant="outline"
          className={`text-xs ${STATUS_STYLE[row.status] ?? ""}`}
        >
          {STATUS_LABEL[row.status] ?? row.status}
        </Badge>
      ),
    },
    {
      header: "",
      cell: (row: PurchaseOrderListRow) => (
        <div className="flex gap-1 justify-end">
          {row.status === "draft" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => confirmMutation.mutate(row.id)}
              disabled={confirmMutation.isPending}
            >
              Confirm
            </Button>
          )}
          {(row.status === "draft" || row.status === "confirmed") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-destructive hover:text-destructive"
              onClick={() => cancelMutation.mutate(row.id)}
              disabled={cancelMutation.isPending}
            >
              Cancel
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
        title="Purchase Orders"
        subtitle={`${orders.length} orders`}
        onAdd={() => {
          setForm(defaultForm);
          setShowForm(true);
        }}
        addLabel="New Order"
        searchValue={search}
        onSearch={setSearch}
      >
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Ordered</SelectItem>
            <SelectItem value="partial">Partially Received</SelectItem>
            <SelectItem value="completed">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── Form Dialog (create only — backend doesn't allow update) */}
      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title="New Purchase Order"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Supplier */}
            <div className="col-span-2">
              <Label>Supplier *</Label>
              {suppliers.length === 0 ? (
                // Smart no-supplier UX: nudge the user to create a supplier first
                <div className="flex h-10 items-center rounded-md border border-input bg-background px-3">
                  <button
                    type="button"
                    onClick={() => navigate("/contacts/suppliers")}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add a supplier
                  </button>
                </div>
              ) : (
                <Select
                  value={form.supplierId}
                  onValueChange={(v) => setForm({ ...form, supplierId: v })}
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
              )}
            </div>

            {/* Project */}
            <div>
              <Label>Project</Label>
              <Select
                value={form.projectId}
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

            {/* Order Date */}
            <div>
              <Label>Order Date</Label>
              <Input
                type="date"
                value={form.orderDate}
                onChange={(e) =>
                  setForm({ ...form, orderDate: e.target.value })
                }
              />
            </div>

            {/* Expected Delivery */}
            <div>
              <Label>Expected Delivery</Label>
              <Input
                type="date"
                value={form.expectedDelivery}
                onChange={(e) =>
                  setForm({ ...form, expectedDelivery: e.target.value })
                }
              />
            </div>
          </div>

          {/* Lines */}
          <div>
            <Label className="mb-2 block">Order Items *</Label>
            <SearchableSelect
              items={articles.map((a) => ({ id: a.id, label: a.name }))}
              onSelect={addLine}
              placeholder="Add article..."
            />
            {form.lines.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2">
                  <span className="col-span-4">Article</span>
                  <span className="col-span-3">Qty</span>
                  <span className="col-span-3">Unit Price</span>
                  <span className="col-span-1">Total</span>
                </div>
                {form.lines.map((line, i) => (
                  <div
                    key={line.articleId}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/30"
                  >
                    <span className="col-span-3 text-sm flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {line.articleName}
                    </span>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min={1}
                        className="h-9"
                        value={line.orderedQuantity}
                        onChange={(e) =>
                          updateLine(i, "orderedQuantity", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min={0}
                        className="h-9"
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(i, "unitPrice", e.target.value)
                        }
                      />
                    </div>
                    <span className="col-span-2 text-sm font-semibold">
                      {form.currency}{" "}
                      {(
                        (line.orderedQuantity ?? 0) * (line.unitPrice ?? 0)
                      ).toLocaleString()}
                    </span>
                    <div className="col-span-1 flex justify-end">
                      <X
                        className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-destructive"
                        onClick={() => removeLine(i)}
                      />
                    </div>
                  </div>
                ))}
                <div className="text-right text-sm font-bold pt-2 pr-2">
                  Total: {totalAmount.toLocaleString()} {form.currency}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saveMutation.isPending ||
                !form.supplierId ||
                form.lines.length === 0
              }
            >
              {saveMutation.isPending ? "Saving..." : "Save Order"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
