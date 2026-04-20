import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { X, Package } from "lucide-react";

import {
  purchaseOrdersService,
  projectsService,
  articlesService,
  contactsService,
  type CreatePurchaseOrderPayload,
  type PurchaseOrderLine,
} from "@/services/wape.service";
import type { PurchaseOrder, Project, Article, Contact } from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import SearchableSelect from "@/components/shared/SearchableSelect";
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface LineRow extends PurchaseOrderLine {
  articleName: string;
}

interface FormState {
  supplierId: string;
  projectId: string;
  currency: string;
  notes: string;
  lines: LineRow[];
}

const defaultForm: FormState = {
  supplierId: "",
  projectId: "",
  currency: "MAD",
  notes: "",
  lines: [],
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PurchaseOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const queryClient = useQueryClient();

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

  const orders = ordersData?.items ?? [];
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
  const filtered = (orders as PurchaseOrder[]).filter((o) => {
    const matchSearch =
      !search ||
      o.supplierId?.toLowerCase().includes(search.toLowerCase()) ||
      o.id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Columns
  const columns = [
    {
      header: "Order",
      cell: (row: PurchaseOrder) => (
        <div>
          <p className="font-medium text-foreground">{row.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {suppliers.find((s) => s.id === row.supplierId)?.legalName ?? "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Currency",
      cell: (row: PurchaseOrder) => (
        <span className="text-xs">{row.currency ?? "MAD"}</span>
      ),
    },
    {
      header: "Date",
      cell: (row: PurchaseOrder) =>
        row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "—",
    },
    {
      header: "Status",
      cell: (row: PurchaseOrder) => <StatusBadge status={row.status} />,
    },
    {
      header: "",
      cell: (row: PurchaseOrder) =>
        row.status === "draft" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => confirmMutation.mutate(row.id)}
            disabled={confirmMutation.isPending}
          >
            Confirm
          </Button>
        ) : null,
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="partially_received">
              Partially Received
            </SelectItem>
            <SelectItem value="received">Received</SelectItem>
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
          </div>

          {/* Lines */}
          <div>
            <Label className="mb-2 block">Order Lines *</Label>
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
                    <span className="col-span-4 text-sm flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      {line.articleName}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      className="col-span-3 h-7 text-xs"
                      value={line.orderedQuantity}
                      onChange={(e) =>
                        updateLine(i, "orderedQuantity", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      className="col-span-3 h-7 text-xs"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(i, "unitPrice", e.target.value)
                      }
                    />
                    <span className="col-span-1 text-xs font-semibold">
                      {(
                        (line.orderedQuantity ?? 0) * (line.unitPrice ?? 0)
                      ).toFixed(0)}
                    </span>
                    <X
                      className="w-3.5 h-3.5 cursor-pointer text-muted-foreground hover:text-destructive"
                      onClick={() => removeLine(i)}
                    />
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
