import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye } from "lucide-react";

import { stockService } from "@/services/wape.service";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

type MovementType = "IN" | "OUT" | "RESERVED";

interface StockMovement {
  id: string;
  articleId?: string;
  articleName?: string;
  movementType: MovementType;
  quantity: number;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  notes?: string;
  createdAt?: string;
  date?: string;
}

const TYPE_COLORS: Record<MovementType, string> = {
  IN: "bg-success/10 text-success border-success/20",
  OUT: "bg-destructive/10 text-destructive border-destructive/20",
  RESERVED: "bg-warning/10 text-warning border-warning/20",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Stock() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | MovementType>("all");
  const [showDetail, setShowDetail] = useState<StockMovement | null>(null);

  // ── Query
  const { data: movementsData, isLoading } = useQuery({
    queryKey: ["stock-movements"],
    queryFn: () => stockService.movements({ limit: 100 }),
  });

  const movements = (movementsData?.items ?? []) as StockMovement[];

  // ── Filtering
  const filtered = movements.filter((m) => {
    const matchSearch =
      !search ||
      m.articleName?.toLowerCase().includes(search.toLowerCase()) ||
      m.projectName?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || m.movementType === typeFilter;
    const matchDate =
      !dateFilter ||
      m.date === dateFilter ||
      m.createdAt?.startsWith(dateFilter);
    return matchSearch && matchType && matchDate;
  });

  // ── Columns
  const columns = [
    {
      header: "Date",
      cell: (row: StockMovement) => {
        const d = row.date ?? row.createdAt;
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
          {row.movementType}
        </Badge>
      ),
    },
    {
      header: "Quantity",
      cell: (row: StockMovement) => {
        const color =
          row.movementType === "IN"
            ? "text-success"
            : row.movementType === "RESERVED"
              ? "text-warning"
              : "text-destructive";
        const sign =
          row.movementType === "IN"
            ? "+"
            : row.movementType === "RESERVED"
              ? "~"
              : "-";
        return (
          <span className={`font-semibold ${color}`}>
            {sign}
            {row.quantity}
          </span>
        );
      },
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
            <SelectItem value="IN">IN</SelectItem>
            <SelectItem value="OUT">OUT</SelectItem>
            <SelectItem value="RESERVED">RESERVED</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

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
                <span className="font-medium">{showDetail.movementType}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Quantity:</span>{" "}
                <span className="font-medium">{showDetail.quantity}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>{" "}
                <span className="font-medium">
                  {showDetail.date || showDetail.createdAt
                    ? format(
                        new Date(
                          (showDetail.date ?? showDetail.createdAt) as string,
                        ),
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
