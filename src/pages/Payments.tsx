import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Download,
  CheckCircle2,
  Building2,
  HardHat,
  CreditCard,
  Search,
  X,
} from "lucide-react";

import {
  financeService,
  contactsService,
  projectsService,
  type CreateSubcontractorPaymentPayload,
  type PaySubcontractorPayload,
} from "@/services/wape.service";
import type { Project, Contact } from "@/types/api";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormDialog from "@/components/shared/FormDialog";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  paymentType?: string;
  status?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  transactionReference?: string;
  projectId?: string;
  supplierId?: string;
  subcontractorId?: string;
  notes?: string;
  createdAt?: string;
  validatedAt?: string;
}

interface SubcontractorPayment {
  id: string;
  subcontractorId?: string;
  projectId?: string;
  contractAmount?: number;
  amountPaid?: number;
  remaining?: number;
  currency?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
}

interface CreateSubFormState {
  subcontractorId: string;
  projectId: string;
  contractAmount: number;
  currency: string;
  notes: string;
}

interface PaySubFormState {
  amount: number;
  paymentMethod: "credit_card" | "bank_transfer" | "check" | "cash";
  transactionReference: string;
}

const defaultCreateSub: CreateSubFormState = {
  subcontractorId: "",
  projectId: "",
  contractAmount: 0,
  currency: "MAD",
  notes: "",
};

const defaultPaySub: PaySubFormState = {
  amount: 0,
  paymentMethod: "bank_transfer",
  transactionReference: "",
};

function fmt(amount?: number, currency = "MAD") {
  if (amount == null) return "—";
  return `${amount.toLocaleString()} ${currency}`;
}

const METHOD_LABELS: Record<string, string> = {
  credit_card: "Credit Card",
  bank_transfer: "Bank Transfer",
  check: "Check",
  cash: "Cash",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  subscription: CreditCard,
  supplier: Building2,
  subcontractor: HardHat,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("transactions");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [showPaySub, setShowPaySub] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubcontractorPayment | null>(
    null,
  );
  const [createSubForm, setCreateSubForm] =
    useState<CreateSubFormState>(defaultCreateSub);
  const [paySubForm, setPaySubForm] = useState<PaySubFormState>(defaultPaySub);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: transactionsData, isLoading: loadingTx } = useQuery({
    queryKey: ["transactions", typeFilter],
    queryFn: () =>
      financeService.listTransactions({
        limit: 100,
        paymentType: typeFilter !== "all" ? (typeFilter as any) : undefined,
      }),
  });

  const { data: subPaymentsData, isLoading: loadingSub } = useQuery({
    queryKey: ["subcontractor-payments"],
    queryFn: () => financeService.listSubcontractorPayments({ limit: 100 }),
  });

  const { data: subcontractorsData } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => contactsService.listSubcontractors({ limit: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const transactions = (transactionsData?.items ?? []) as Transaction[];
  const subPayments = (subPaymentsData?.items ?? []) as SubcontractorPayment[];
  const subcontractors = (subcontractorsData?.items ?? []) as Contact[];
  const projects = (projectsData?.items ?? []) as Project[];

  // ── Mutations
  const createSubMutation = useMutation({
    mutationFn: (data: CreateSubcontractorPaymentPayload) =>
      financeService.createSubcontractorPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractor-payments"] });
      setShowCreateSub(false);
      setCreateSubForm(defaultCreateSub);
    },
  });

  const paySubMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PaySubcontractorPayload }) =>
      financeService.paySubcontractor(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcontractor-payments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setShowPaySub(false);
      setSelectedSub(null);
      setPaySubForm(defaultPaySub);
    },
  });

  const validateTxMutation = useMutation({
    mutationFn: (id: string) => financeService.validateTransaction(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  // ── Helpers
  const getSubcontractorName = (id?: string) =>
    subcontractors.find((s) => s.id === id)?.legalName ?? "—";

  const getProjectName = (id?: string) =>
    projects.find((p) => p.id === id)?.name ?? "—";

  const openPaySub = (p: SubcontractorPayment) => {
    setSelectedSub(p);
    setPaySubForm({
      amount: p.remaining ?? p.contractAmount ?? 0,
      paymentMethod: "bank_transfer",
      transactionReference: "",
    });
    setShowPaySub(true);
  };

  // ── Filtered transactions
  const filteredTx = useMemo(
    () =>
      transactions.filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          t.transactionReference?.toLowerCase().includes(q) ||
          t.paymentType?.toLowerCase().includes(q)
        );
      }),
    [transactions, search],
  );

  // ── Export CSV
  const exportCSV = () => {
    const rows = [
      ["ID", "Type", "Amount", "Method", "Status", "Reference", "Date"],
      ...filteredTx.map((t) => [
        t.id?.slice(-8),
        t.paymentType ?? "—",
        `${t.amount ?? 0} ${t.currency ?? "MAD"}`,
        METHOD_LABELS[t.paymentMethod ?? ""] ?? "—",
        t.status ?? "—",
        t.transactionReference ?? "—",
        t.createdAt ? format(new Date(t.createdAt), "yyyy-MM-dd") : "—",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Transactions & Payments</h1>
          <p className="text-sm text-muted-foreground">Finance → Payments</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={exportCSV}
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowCreateSub(true)}
          >
            New Subcontractor Payment
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transactions">
            Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="subcontractors">
            Subcontractor Payments ({subPayments.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Transactions tab */}
        <TabsContent value="transactions" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or type…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-card">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="subcontractor">Subcontractor</SelectItem>
              </SelectContent>
            </Select>
            {(search || typeFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                }}
              >
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {[
                        "ID",
                        "Type",
                        "Amount",
                        "Method",
                        "Status",
                        "Reference",
                        "Date",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingTx && (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-10 text-muted-foreground"
                        >
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!loadingTx && filteredTx.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No transactions found
                        </td>
                      </tr>
                    )}
                    {filteredTx.map((t) => {
                      const TypeIcon =
                        TYPE_ICONS[t.paymentType ?? ""] ?? CreditCard;
                      return (
                        <tr
                          key={t.id}
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {t.id?.slice(-8)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs capitalize">
                                {t.paymentType}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {fmt(t.amount, t.currency)}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {METHOD_LABELS[t.paymentMethod ?? ""] ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={t.status ?? "pending"} />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                            {t.transactionReference ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            {t.createdAt
                              ? format(new Date(t.createdAt), "MMM d, yyyy")
                              : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {t.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 text-success border-success/30"
                                onClick={() => validateTxMutation.mutate(t.id)}
                                disabled={validateTxMutation.isPending}
                              >
                                <CheckCircle2 className="w-3 h-3" /> Validate
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Subcontractor Payments tab */}
        <TabsContent value="subcontractors" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {[
                        "Subcontractor",
                        "Project",
                        "Contract",
                        "Paid",
                        "Remaining",
                        "Status",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSub && (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-10 text-muted-foreground"
                        >
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!loadingSub && subPayments.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-10 text-muted-foreground"
                        >
                          No subcontractor payments yet
                        </td>
                      </tr>
                    )}
                    {subPayments.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {getSubcontractorName(p.subcontractorId)}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {getProjectName(p.projectId)}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {fmt(p.contractAmount, p.currency)}
                        </td>
                        <td className="px-4 py-3 text-success font-medium">
                          {fmt(p.amountPaid, p.currency)}
                        </td>
                        <td className="px-4 py-3 text-warning font-medium">
                          {fmt(p.remaining, p.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.status ?? "pending"} />
                        </td>
                        <td className="px-4 py-3">
                          {p.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1 text-success border-success/30"
                              onClick={() => openPaySub(p)}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Pay
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Create Subcontractor Payment Form */}
      <FormDialog
        open={showCreateSub}
        onOpenChange={setShowCreateSub}
        title="New Subcontractor Payment"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Subcontractor *</Label>
            <Select
              value={createSubForm.subcontractorId}
              onValueChange={(v) =>
                setCreateSubForm({ ...createSubForm, subcontractorId: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcontractor" />
              </SelectTrigger>
              <SelectContent>
                {subcontractors.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.legalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label>Project *</Label>
            <Select
              value={createSubForm.projectId}
              onValueChange={(v) =>
                setCreateSubForm({ ...createSubForm, projectId: v })
              }
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

          <div>
            <Label>Contract Amount *</Label>
            <Input
              type="number"
              min={0}
              value={createSubForm.contractAmount || ""}
              onChange={(e) =>
                setCreateSubForm({
                  ...createSubForm,
                  contractAmount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div>
            <Label>Currency</Label>
            <Select
              value={createSubForm.currency}
              onValueChange={(v) =>
                setCreateSubForm({ ...createSubForm, currency: v })
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

          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={createSubForm.notes}
              onChange={(e) =>
                setCreateSubForm({ ...createSubForm, notes: e.target.value })
              }
            />
          </div>

          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateSub(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createSubMutation.mutate({
                  subcontractorId: createSubForm.subcontractorId,
                  projectId: createSubForm.projectId,
                  contractAmount: createSubForm.contractAmount,
                  currency: createSubForm.currency || undefined,
                  notes: createSubForm.notes || undefined,
                })
              }
              disabled={
                createSubMutation.isPending ||
                !createSubForm.subcontractorId ||
                !createSubForm.projectId ||
                !createSubForm.contractAmount
              }
            >
              {createSubMutation.isPending ? "Saving..." : "Create"}
            </Button>
          </div>
        </div>
      </FormDialog>

      {/* ── Pay Subcontractor Form */}
      <FormDialog
        open={showPaySub}
        onOpenChange={setShowPaySub}
        title={`Pay — ${getSubcontractorName(selectedSub?.subcontractorId)}`}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/30 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Contract:</span>{" "}
              <span className="font-medium">
                {fmt(selectedSub?.contractAmount, selectedSub?.currency)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Paid:</span>{" "}
              <span className="font-medium text-success">
                {fmt(selectedSub?.amountPaid, selectedSub?.currency)}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Remaining:</span>{" "}
              <span className="font-bold text-warning">
                {fmt(selectedSub?.remaining, selectedSub?.currency)}
              </span>
            </div>
          </div>

          <div>
            <Label>Amount to Pay *</Label>
            <Input
              type="number"
              min={0}
              value={paySubForm.amount || ""}
              onChange={(e) =>
                setPaySubForm({
                  ...paySubForm,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div>
            <Label>Payment Method *</Label>
            <Select
              value={paySubForm.paymentMethod}
              onValueChange={(v) =>
                setPaySubForm({
                  ...paySubForm,
                  paymentMethod: v as PaySubFormState["paymentMethod"],
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
              value={paySubForm.transactionReference}
              onChange={(e) =>
                setPaySubForm({
                  ...paySubForm,
                  transactionReference: e.target.value,
                })
              }
              placeholder="Bank ref, check number…"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPaySub(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                paySubMutation.mutate({
                  id: selectedSub!.id,
                  body: {
                    amount: paySubForm.amount,
                    paymentMethod: paySubForm.paymentMethod,
                    transactionReference:
                      paySubForm.transactionReference || undefined,
                  },
                })
              }
              disabled={paySubMutation.isPending || !paySubForm.amount}
            >
              {paySubMutation.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
