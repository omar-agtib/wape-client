import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Upload, CheckCircle2, Clock, AlertCircle } from "lucide-react";

import {
  financeService,
  contactsService,
  projectsService,
  uploadService,
  type CreateSupplierPaymentPayload,
  type PaySupplierPayload,
} from "@/services/wape.service";
import type { Project, Contact } from "@/types/api";

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

interface SupplierPayment {
  id: string;
  supplierId?: string;
  projectId?: string;
  invoiceNumber?: string;
  amount?: number;
  amountPaid?: number;
  remaining?: number;
  dueDate?: string;
  currency?: string;
  status?: string;
  notes?: string;
  invoiceUrl?: string;
  createdAt?: string;
}

interface CreateFormState {
  supplierId: string;
  projectId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  currency: string;
  notes: string;
  invoiceUrl: string;
}

interface PayFormState {
  amount: number;
  paymentMethod: "credit_card" | "bank_transfer" | "check" | "cash";
  transactionReference: string;
}

const defaultCreate: CreateFormState = {
  supplierId: "",
  projectId: "",
  invoiceNumber: "",
  amount: 0,
  dueDate: "",
  currency: "MAD",
  notes: "",
  invoiceUrl: "",
};

const defaultPay: PayFormState = {
  amount: 0,
  paymentMethod: "bank_transfer",
  transactionReference: "",
};

function fmt(amount?: number, currency = "MAD") {
  if (amount == null) return "—";
  return `${amount.toLocaleString()} ${currency}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<SupplierPayment | null>(null);
  const [createForm, setCreateForm] = useState<CreateFormState>(defaultCreate);
  const [payForm, setPayForm] = useState<PayFormState>(defaultPay);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["supplier-payments"],
    queryFn: () => financeService.listSupplierPayments({ limit: 100 }),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => contactsService.listSuppliers({ limit: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const payments = (paymentsData?.items ?? []) as SupplierPayment[];
  const suppliers = (suppliersData?.items ?? []) as Contact[];
  const projects = (projectsData?.items ?? []) as Project[];

  // ── Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierPaymentPayload) =>
      financeService.createSupplierPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      setShowCreateForm(false);
      setCreateForm(defaultCreate);
    },
  });

  const payMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PaySupplierPayload }) =>
      financeService.paySupplier(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] });
      setShowPayForm(false);
      setSelectedPayment(null);
      setPayForm(defaultPay);
    },
  });

  const attachInvoiceMutation = useMutation({
    mutationFn: ({ id, fileUrl }: { id: string; fileUrl: string }) =>
      financeService.attachSupplierInvoice(id, fileUrl),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["supplier-payments"] }),
  });

  // ── Helpers
  const getSupplierName = (id?: string) =>
    suppliers.find((s) => s.id === id)?.legalName ?? "—";

  const getProjectName = (id?: string) =>
    projects.find((p) => p.id === id)?.name ?? "—";

  const openPayDialog = (p: SupplierPayment) => {
    setSelectedPayment(p);
    setPayForm({
      amount: p.remaining ?? p.amount ?? 0,
      paymentMethod: "bank_transfer",
      transactionReference: "",
    });
    setShowPayForm(true);
  };

  const handleUploadInvoice = async (
    e: React.ChangeEvent<HTMLInputElement>,
    paymentId?: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadService.file(file, "supplier-invoices");
      const url = result.secureUrl ?? result.url ?? "";
      if (paymentId) {
        attachInvoiceMutation.mutate({ id: paymentId, fileUrl: url });
      } else {
        setCreateForm((f) => ({ ...f, invoiceUrl: url }));
      }
    } finally {
      setUploading(false);
    }
  };

  // ── Filtering
  const filtered = payments.filter((p) => {
    const matchSearch =
      !search ||
      getSupplierName(p.supplierId)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      p.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Summary stats
  const totalAmount = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.amountPaid ?? 0), 0);
  const pendingCount = payments.filter((p) => p.status === "pending").length;

  // ── Columns
  const columns = [
    {
      header: "Supplier",
      cell: (row: SupplierPayment) => (
        <div>
          <p className="font-medium">{getSupplierName(row.supplierId)}</p>
          <p className="text-xs text-muted-foreground">
            {row.invoiceNumber ?? "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Project",
      cell: (row: SupplierPayment) => (
        <span className="text-xs text-muted-foreground">
          {getProjectName(row.projectId)}
        </span>
      ),
    },
    {
      header: "Amount",
      cell: (row: SupplierPayment) => (
        <div>
          <p className="font-semibold">{fmt(row.amount, row.currency)}</p>
          {(row.amountPaid ?? 0) > 0 && (
            <p className="text-xs text-success">
              Paid: {fmt(row.amountPaid, row.currency)}
            </p>
          )}
          {(row.remaining ?? 0) > 0 && (
            <p className="text-xs text-warning">
              Remaining: {fmt(row.remaining, row.currency)}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Due Date",
      cell: (row: SupplierPayment) =>
        row.dueDate ? format(new Date(row.dueDate), "MMM d, yyyy") : "—",
    },
    {
      header: "Status",
      cell: (row: SupplierPayment) => (
        <StatusBadge status={row.status ?? "pending"} />
      ),
    },
    {
      header: "Invoice",
      cell: (row: SupplierPayment) =>
        row.invoiceUrl ? (
          <a href={row.invoiceUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary"
            >
              View
            </Button>
          </a>
        ) : (
          <label className="cursor-pointer text-xs text-muted-foreground hover:text-primary">
            Upload
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.png"
              onChange={(e) => handleUploadInvoice(e, row.id)}
              disabled={uploading}
            />
          </label>
        ),
    },
    {
      header: "",
      cell: (row: SupplierPayment) =>
        row.status !== "paid" ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 text-success border-success/30"
            onClick={() => openPayDialog(row)}
          >
            <CheckCircle2 className="w-3 h-3" /> Pay
          </Button>
        ) : (
          <Badge
            variant="outline"
            className="text-xs bg-success/10 text-success border-success/20"
          >
            Paid
          </Badge>
        ),
    },
  ];

  // ── Render
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Invoiced",
            value: fmt(totalAmount),
            icon: AlertCircle,
            color: "text-primary bg-primary/10",
          },
          {
            label: "Total Paid",
            value: fmt(totalPaid),
            icon: CheckCircle2,
            color: "text-success bg-success/10",
          },
          {
            label: "Pending",
            value: pendingCount,
            icon: Clock,
            color: "text-warning bg-warning/10",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card"
          >
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <PageHeader
        title="Supplier Payments"
        subtitle={`${payments.length} payments`}
        onAdd={() => setShowCreateForm(true)}
        addLabel="New Payment"
        searchValue={search}
        onSearch={setSearch}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── Create Form */}
      <FormDialog
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        title="New Supplier Payment"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Supplier *</Label>
            <Select
              value={createForm.supplierId}
              onValueChange={(v) =>
                setCreateForm({ ...createForm, supplierId: v })
              }
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

          <div>
            <Label>Project</Label>
            <Select
              value={createForm.projectId || "none"}
              onValueChange={(v) =>
                setCreateForm({
                  ...createForm,
                  projectId: v === "none" ? "" : v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Invoice Number *</Label>
            <Input
              value={createForm.invoiceNumber}
              onChange={(e) =>
                setCreateForm({ ...createForm, invoiceNumber: e.target.value })
              }
              placeholder="INV-2026-001"
            />
          </div>

          <div>
            <Label>Amount *</Label>
            <Input
              type="number"
              min={0}
              value={createForm.amount || ""}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div>
            <Label>Currency</Label>
            <Select
              value={createForm.currency}
              onValueChange={(v) =>
                setCreateForm({ ...createForm, currency: v })
              }
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

          <div>
            <Label>Due Date *</Label>
            <Input
              type="date"
              value={createForm.dueDate}
              onChange={(e) =>
                setCreateForm({ ...createForm, dueDate: e.target.value })
              }
            />
          </div>

          <div className="col-span-2">
            <Label>Invoice File (PDF)</Label>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground w-fit">
              <Upload className="w-4 h-4" />
              {uploading
                ? "Uploading..."
                : createForm.invoiceUrl
                  ? "Uploaded ✓"
                  : "Upload invoice"}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.png"
                onChange={(e) => handleUploadInvoice(e)}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={createForm.notes}
              onChange={(e) =>
                setCreateForm({ ...createForm, notes: e.target.value })
              }
            />
          </div>

          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createMutation.mutate({
                  supplierId: createForm.supplierId,
                  projectId: createForm.projectId || undefined,
                  invoiceNumber: createForm.invoiceNumber,
                  amount: createForm.amount,
                  dueDate: createForm.dueDate,
                  currency: createForm.currency || undefined,
                  notes: createForm.notes || undefined,
                })
              }
              disabled={
                createMutation.isPending ||
                !createForm.supplierId ||
                !createForm.invoiceNumber ||
                !createForm.amount ||
                !createForm.dueDate
              }
            >
              {createMutation.isPending ? "Saving..." : "Create Payment"}
            </Button>
          </div>
        </div>
      </FormDialog>

      {/* ── Pay Form */}
      <FormDialog
        open={showPayForm}
        onOpenChange={setShowPayForm}
        title={`Pay — ${getSupplierName(selectedPayment?.supplierId)}`}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/30 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Invoice:</span>{" "}
              <span className="font-medium">
                {selectedPayment?.invoiceNumber}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-medium">
                {fmt(selectedPayment?.amount, selectedPayment?.currency)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Already paid:</span>{" "}
              <span className="font-medium text-success">
                {fmt(selectedPayment?.amountPaid, selectedPayment?.currency)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining:</span>{" "}
              <span className="font-bold text-warning">
                {fmt(
                  selectedPayment?.remaining ?? selectedPayment?.amount,
                  selectedPayment?.currency,
                )}
              </span>
            </div>
          </div>

          <div>
            <Label>Amount to Pay *</Label>
            <Input
              type="number"
              min={0}
              max={selectedPayment?.remaining ?? selectedPayment?.amount ?? 0}
              value={payForm.amount || ""}
              onChange={(e) =>
                setPayForm({
                  ...payForm,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div>
            <Label>Payment Method *</Label>
            <Select
              value={payForm.paymentMethod}
              onValueChange={(v) =>
                setPayForm({
                  ...payForm,
                  paymentMethod: v as PayFormState["paymentMethod"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Transaction Reference</Label>
            <Input
              value={payForm.transactionReference}
              onChange={(e) =>
                setPayForm({ ...payForm, transactionReference: e.target.value })
              }
              placeholder="Bank ref, check number…"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPayForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                payMutation.mutate({
                  id: selectedPayment!.id,
                  body: {
                    amount: payForm.amount,
                    paymentMethod: payForm.paymentMethod,
                    transactionReference:
                      payForm.transactionReference || undefined,
                  },
                })
              }
              disabled={payMutation.isPending || !payForm.amount}
            >
              {payMutation.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
