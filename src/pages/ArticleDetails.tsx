import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";

import { articlesService } from "@/services/wape.service";
import BarcodeDisplay from "@/components/articles/BarcodeDisplay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ArticleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["article", id],
    queryFn: () => articlesService.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading article…</div>
    );
  }

  if (isError || !article) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate("/articles")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Articles
        </Button>
        <p className="text-sm text-destructive">Article not found.</p>
      </div>
    );
  }

  const available = article.availableQuantity ?? 0;
  const low = (article.stockQuantity ?? 0) <= (article.minimumStock ?? 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/articles")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {article.name}
            </h1>
            <p className="text-sm text-muted-foreground">{article.category}</p>
          </div>
        </div>
        {low ? (
          <Badge
            variant="outline"
            className="bg-destructive/10 text-destructive border-destructive/20"
          >
            <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-success/10 text-success border-success/20"
          >
            OK
          </Badge>
        )}
      </div>

      {/* Stock summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <p className="text-2xl font-bold text-foreground">
            {article.stockQuantity ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Current Stock</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <p className="text-2xl font-bold text-amber-600">
            {article.reservedQuantity ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Reserved</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <p className="text-2xl font-bold text-success">{available}</p>
          <p className="text-xs text-muted-foreground mt-1">Available</p>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border text-center">
          <p className="text-2xl font-bold text-primary">
            {article.unitPrice?.toLocaleString() ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Purchase Cost ({article.currency ?? "MAD"})
          </p>
        </div>
      </div>

      {/* Details + barcode */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
              Details
            </h3>
            <dl className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <Detail label="Category" value={article.category} />
              <Detail label="Unit" value={article.unit} />
              <Detail
                label="Minimum Stock"
                value={String(article.minimumStock ?? 0)}
              />
              <Detail
                label="Consumed (total)"
                value={String(article.consumedQuantity ?? 0)}
              />
              <Detail
                label="Storage Location"
                value={article.storageLocation}
              />
              <Detail
                label="Created"
                value={
                  article.createdAt
                    ? new Date(article.createdAt).toLocaleDateString()
                    : undefined
                }
              />
            </dl>

            {article.description && (
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {article.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: barcode */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
            Barcode
          </h3>
          <div className="text-center">
            <BarcodeDisplay
              barcodeId={article.barcodeId}
              articleName={article.name}
              showDownload={true}
            />
            <p className="text-xs font-mono text-muted-foreground mt-3 break-all">
              {article.barcodeId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small detail row ────────────────────────────────────────────────────────
function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}
