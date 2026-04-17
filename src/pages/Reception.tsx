import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Package } from "lucide-react";

import {
  receptionsService,
  purchaseOrdersService,
  personnelService,
} from "@/services/wape.service";
import type { PurchaseOrder, Personnel } from "@/types/api";

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

interface ReceptionItem {
  id: string;
  articleId?: string;
  articleName?: string;
  orderedQuantity?: number;
  receivedQuantity?: number;
  remainingQuantity?: number;
  status?: string;
}

interface Reception {
  id: string;
  purchaseOrderId?: string;
  status?: string;
  createdAt?: string;
  items?: ReceptionItem[];
  notes?: string;
}

interface ReceiveFormState {
  receptionId: string;
  receivedQuantity: number;
  notes: string;
  receivedBy: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  partial: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  complete: "bg-success/10 text-success border-success/20",
  received: "bg-success/10 text-success border-success/20",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Reception",
  partial: "Partial Reception",
  complete: "Reception Completed",
  received: "Received",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReceptionPage() {
  const [search, setSearch] = useState("");
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [selectedReception, setSelectedReception] = useState<Reception | null>(
    null,
  );
  const [selectedItem, setSelectedItem] = useState<ReceptionItem | null>(null);
  const [receiveForm, setReceiveForm] = useState<ReceiveFormState>({
    receptionId: "",
    receivedQuantity: 0,
    notes: "",
    receivedBy: "",
  });

  const queryClient = useQueryClient();

  // ── Queries
  const { data: receptionsData, isLoading } = useQuery({
    queryKey: ["receptions"],
    queryFn: () => receptionsService.list({ limit: 100 }),
  });

  const { data: purchaseOrdersData } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => purchaseOrdersService.list({ limit: 100 }),
  });
  const { data: personnelData } = useQuery({
    queryKey: ["personnel"],
    queryFn: () => personnelService.list({ limit: 100 }),
  });

  const personnelList = (personnelData?.items ?? []) as Personnel[];
  const receptions = (receptionsData?.items ?? []) as Reception[];
  const purchaseOrders = (purchaseOrdersData?.items ?? []) as PurchaseOrder[];

  // ── Mutations
  const receiveMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { receivedQuantity: number; notes?: string; receivedBy?: string };
    }) => receptionsService.receive(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receptions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setShowReceiveForm(false);
      setSelectedReception(null);
      setSelectedItem(null);
    },
  });

  // ── Helpers
  const openReceiveForm = (reception: Reception, item?: ReceptionItem) => {
    setSelectedReception(reception);
    setSelectedItem(item ?? null);
    setReceiveForm({
      receptionId: item?.id ?? reception.id,
      receivedQuantity: item?.remainingQuantity ?? 0,
      notes: "",
      receivedBy: "",
    });
    setShowReceiveForm(true);
  };

  const getPORef = (poId?: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    return po ? `PO-${po.id.slice(-6).toUpperCase()}` : (poId ?? "—");
  };

  // ── Filtering
  const filtered = receptions.filter(
    (r) =>
      !search ||
      r.purchaseOrderId?.toLowerCase().includes(search.toLowerCase()) ||
      r.id?.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Columns
  const columns = [
    {
      header: "Reception",
      cell: (row: Reception) => (
        <div>
          <p className="font-medium text-foreground">
            REC-{row.id?.slice(-6).toUpperCase()}
          </p>
          <p className="text-xs text-muted-foreground">
            {getPORef(row.purchaseOrderId)}
          </p>
        </div>
      ),
    },
    {
      header: "Date",
      cell: (row: Reception) =>
        row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "—",
    },
    {
      header: "Items",
      cell: (row: Reception) => (
        <span className="text-xs">{row.items?.length ?? 0} articles</span>
      ),
    },
    {
      header: "Status",
      cell: (row: Reception) => (
        <Badge
          variant="outline"
          className={`text-xs ${STATUS_COLORS[row.status ?? ""] ?? ""}`}
        >
          {STATUS_LABELS[row.status ?? ""] ?? row.status ?? "—"}
        </Badge>
      ),
    },
    {
      header: "",
      cell: (row: Reception) =>
        row.status !== "completed" && row.status !== "received" ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => openReceiveForm(row)}
          >
            Process
          </Button>
        ) : (
          <span className="text-xs text-success font-medium">Done</span>
        ),
    },
  ];

  // ── Render
  return (
    <div className="space-y-4">
      <PageHeader
        title="Reception"
        subtitle={`${receptions.length} receptions`}
        searchValue={search}
        onSearch={setSearch}
      />

      {receptions.length === 0 && !isLoading && (
        <div className="p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground text-center">
          Receptions are created automatically when a Purchase Order is
          confirmed. Go to{" "}
          <a href="/purchase-orders" className="text-primary underline">
            Purchase Orders
          </a>{" "}
          and click Confirm to generate receptions.
        </div>
      )}

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── Receive Form */}
      <FormDialog
        open={showReceiveForm}
        onOpenChange={setShowReceiveForm}
        title={
          selectedReception
            ? `Process Reception — REC-${selectedReception.id?.slice(-6).toUpperCase()}`
            : "Process Reception"
        }
      >
        <div className="space-y-4">
          {/* Items list */}
          {selectedReception?.items && selectedReception.items.length > 0 && (
            <div>
              <Label className="mb-2 block">Reception Lines</Label>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-2">
                  <span className="col-span-5">Article</span>
                  <span className="col-span-3">Ordered</span>
                  <span className="col-span-4">Received</span>
                </div>
                {selectedReception.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/30"
                  >
                    <span className="col-span-5 text-sm flex items-center gap-1">
                      <Package className="w-3 h-3 text-muted-foreground" />
                      {item.articleName ?? item.articleId}
                    </span>
                    <span className="col-span-3 text-sm font-medium">
                      {item.orderedQuantity ?? "—"}
                    </span>
                    <span className="col-span-3 text-sm text-success font-medium">
                      {item.receivedQuantity ?? 0}
                    </span>
                    {item.status !== "complete" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="col-span-1 h-6 text-xs p-1"
                        onClick={() => openReceiveForm(selectedReception, item)}
                      >
                        ✓
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Receive quantity */}
          <div>
            <Label>
              Received Quantity
              {selectedItem ? ` for ${selectedItem.articleName}` : ""}*
            </Label>
            <Input
              type="number"
              min={0}
              value={receiveForm.receivedQuantity}
              onChange={(e) =>
                setReceiveForm({
                  ...receiveForm,
                  receivedQuantity: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={receiveForm.notes}
              onChange={(e) =>
                setReceiveForm({ ...receiveForm, notes: e.target.value })
              }
            />
          </div>

          {/* Received By */}
          <div>
            <Label>Received By</Label>
            <Select
              value={receiveForm.receivedBy}
              onValueChange={(v) =>
                setReceiveForm({ ...receiveForm, receivedBy: v })
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReceiveForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                receiveMutation.mutate({
                  id: receiveForm.receptionId,
                  body: {
                    receivedQuantity: receiveForm.receivedQuantity,
                    notes: receiveForm.notes,
                    receivedBy: receiveForm.receivedBy,
                  },
                })
              }
              disabled={
                receiveMutation.isPending || receiveForm.receivedQuantity <= 0
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
