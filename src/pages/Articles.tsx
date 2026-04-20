import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Eye } from "lucide-react";

import {
  articlesService,
  type CreateArticlePayload,
  type UpdateArticlePayload,
} from "@/services/wape.service";
import type { Article } from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FormDialog from "@/components/shared/FormDialog";
import BarcodeDisplay from "@/components/articles/BarcodeDisplay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  currency: string;
  initialStock: number;
}

const defaultForm: FormState = {
  name: "",
  category: "",
  unit: "piece",
  unitPrice: 0,
  currency: "MAD",
  initialStock: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Articles() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Article | null>(null);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: () => articlesService.list({ limit: 100 }),
  });

  const articlesList = articlesData?.items ?? [];

  // ── Mutations
  const saveMutation = useMutation({
    mutationFn: (data: CreateArticlePayload | UpdateArticlePayload) =>
      editing
        ? articlesService.update(editing.id, data as UpdateArticlePayload)
        : articlesService.create(data as CreateArticlePayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setShowForm(false);
      setEditing(null);
    },
  });

  // ── Helpers
  const openForm = (article?: Article) => {
    setEditing(article ?? null);
    setForm(
      article
        ? {
            name: article.name ?? "",
            category: article.category ?? "",
            unit: article.unit ?? "piece",
            unitPrice: article.unitPrice ?? 0,
            currency: article.currency ?? "MAD",
            initialStock: article.stockQuantity ?? 0,
          }
        : defaultForm,
    );
    setShowForm(true);
  };

  const handleSave = () => {
    if (editing) {
      const payload: UpdateArticlePayload = {
        name: form.name || undefined,
        category: form.category || undefined,
        unit: form.unit || undefined,
        unitPrice: form.unitPrice,
        currency: form.currency || undefined,
      };
      saveMutation.mutate(payload);
    } else {
      const payload: CreateArticlePayload = {
        name: form.name,
        category: form.category,
        unit: form.unit || undefined,
        unitPrice: form.unitPrice,
        currency: form.currency || undefined,
        initialStock: form.initialStock || undefined,
      };
      saveMutation.mutate(payload);
    }
  };

  // ── Filtering
  const filtered = articlesList.filter(
    (a) =>
      !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.category?.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Low stock check
  const isLowStock = (article: Article) => (article.stockQuantity ?? 0) <= 0;

  // ── Columns
  const columns = [
    {
      header: "Article",
      cell: (row: Article) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.category}</p>
        </div>
      ),
    },
    {
      header: "Unit",
      cell: (row: Article) => (
        <span className="text-xs">{row.unit ?? "—"}</span>
      ),
    },
    {
      header: "Unit Price",
      cell: (row: Article) => (
        <span className="text-xs font-medium">
          {row.unitPrice?.toLocaleString()} {row.currency ?? "MAD"}
        </span>
      ),
    },
    {
      header: "Stock",
      cell: (row: Article) => {
        const low = isLowStock(row);
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold ${low ? "text-destructive" : "text-foreground"}`}
            >
              {row.stockQuantity ?? 0}
            </span>
            {low && <AlertTriangle className="w-3 h-3 text-destructive" />}
          </div>
        );
      },
    },
    {
      header: "Status",
      cell: (row: Article) => {
        const low = isLowStock(row);
        return low ? (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/20 text-xs"
          >
            Low Stock
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-success/10 text-success border-success/20 text-xs"
          >
            OK
          </Badge>
        );
      },
    },
    {
      header: "",
      cell: (row: Article) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowDetail(row)}
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
        title="Articles"
        subtitle={`${articlesList.length} articles`}
        onAdd={() => openForm()}
        addLabel="New Article"
        searchValue={search}
        onSearch={setSearch}
      />

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── Detail Dialog */}
      {showDetail && (
        <FormDialog
          open={!!showDetail}
          onOpenChange={() => setShowDetail(null)}
          title={showDetail.name}
        >
          <div className="space-y-4">
            {/* Barcode — generated from article id as fallback */}
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-2">Barcode</p>
              <BarcodeDisplay
                barcodeId={showDetail.barcodeId}
                articleName={showDetail.name}
                showDownload={true}
              />
            </div>

            {/* Stock summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                <p className="text-2xl font-bold text-success">
                  {showDetail.stockQuantity ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current Stock
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-2xl font-bold text-primary">
                  {showDetail.unitPrice?.toLocaleString() ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unit Price ({showDetail.currency ?? "MAD"})
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Category:</span>{" "}
                <span className="font-medium">
                  {showDetail.category ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Unit:</span>{" "}
                <span className="font-medium">{showDetail.unit ?? "—"}</span>
              </div>
            </div>
          </div>
        </FormDialog>
      )}

      {/* ── Form Dialog */}
      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editing ? "Edit Article" : "New Article"}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Name */}
          <div className="col-span-2">
            <Label>Article Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Category */}
          <div>
            <Label>Category *</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Cement, Steel, Timber"
            />
          </div>

          {/* Unit */}
          <div>
            <Label>Unit</Label>
            <Select
              value={form.unit}
              onValueChange={(v) => setForm({ ...form, unit: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="piece">Piece</SelectItem>
                <SelectItem value="kg">Kg</SelectItem>
                <SelectItem value="m">Meter</SelectItem>
                <SelectItem value="m2">m²</SelectItem>
                <SelectItem value="m3">m³</SelectItem>
                <SelectItem value="litre">Litre</SelectItem>
                <SelectItem value="box">Box</SelectItem>
                <SelectItem value="pallet">Pallet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unit Price */}
          <div>
            <Label>Unit Price *</Label>
            <Input
              type="number"
              min={0}
              value={form.unitPrice}
              onChange={(e) =>
                setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })
              }
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

          {/* Initial stock — create only */}
          {!editing && (
            <div className="col-span-2">
              <Label>Initial Stock</Label>
              <Input
                type="number"
                min={0}
                value={form.initialStock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    initialStock: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          )}

          {/* Actions */}
          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !form.name || !form.category}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
