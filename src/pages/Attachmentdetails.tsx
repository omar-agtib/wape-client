import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  Package,
  Users,
  Wrench,
  FileText,
  Info,
} from "lucide-react";

import {
  attachmentsService,
  projectsService,
  contactsService,
  tasksService,
  type ConfirmAttachmentPayload,
} from "@/services/wape.service";
import type { Project, Contact, Task } from "@/types/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AttachmentDetail {
  id: string;
  projectId?: string;
  subcontractorId?: string;
  title?: string;
  currency?: string;
  status?: string;
  taskIds?: string[];
  createdAt?: string;
  confirmedAt?: string;
  personnelCost?: number;
  articlesCost?: number;
  toolsCost?: number;
  totalCost?: number;
  tasks?: AttachmentTask[];
  invoice?: AttachmentInvoice;
}

interface AttachmentTask {
  id: string;
  name?: string;
  status?: string;
  estimatedCost?: number;
  actualCost?: number;
  progress?: number;
}

interface AttachmentInvoice {
  id: string;
  invoiceNumber?: string;
  status?: string;
  amount?: number;
  pdfUrl?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount?: number, currency = "MAD") {
  if (!amount) return "—";
  return `${amount.toLocaleString()} ${currency}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AttachmentDetails() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [confirmForm, setConfirmForm] = useState({
    personnelCost: 0,
    articlesCost: 0,
    toolsCost: 0,
  });

  // ── Queries
  const { data: attachmentRaw, isLoading } = useQuery({
    queryKey: ["attachment", id],
    queryFn: () => attachmentsService.get(id!),
    enabled: !!id,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const { data: subcontractorsData } = useQuery({
    queryKey: ["subcontractors"],
    queryFn: () => contactsService.listSubcontractors({ limit: 100 }),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksService.list({ limit: 100 }),
  });

  const attachment = attachmentRaw as AttachmentDetail | undefined;
  const projects = (projectsData?.items ?? []) as Project[];
  const subcontractors = (subcontractorsData?.items ?? []) as Contact[];
  const allTasks = (tasksData?.items ?? []) as Task[];

  // ── Mutations
  const confirmMutation = useMutation({
    mutationFn: (body?: ConfirmAttachmentPayload) =>
      attachmentsService.confirm(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachment", id] });
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowConfirmForm(false);
    },
  });

  // ── Helpers
  const project = projects.find((p) => p.id === attachment?.projectId);
  const subcontractor = subcontractors.find(
    (s) => s.id === attachment?.subcontractorId,
  );

  // Resolve tasks — prefer embedded, fallback to lookup
  const attachedTasks: AttachmentTask[] = attachment?.tasks?.length
    ? attachment.tasks
    : (attachment?.taskIds ?? []).map((tid) => {
        const t = allTasks.find((x) => x.id === tid);
        return {
          id: tid,
          name: t?.name ?? tid,
          status: t?.status,
          estimatedCost: t?.estimatedCost,
          progress: t?.progress,
        };
      });

  const totalCost =
    attachment?.totalCost ??
    (attachment?.personnelCost ?? 0) +
      (attachment?.articlesCost ?? 0) +
      (attachment?.toolsCost ?? 0);

  const totalConfirm =
    confirmForm.personnelCost +
    confirmForm.articlesCost +
    confirmForm.toolsCost;

  const canConfirm =
    attachment?.status === "draft" || attachment?.status === "pending";

  // ── Loading
  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading…</div>
    );
  }

  if (!attachment) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Attachment not found.
      </div>
    );
  }

  // ── Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/attachments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">
            {attachment.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {project?.name ?? attachment.projectId ?? "—"}
          </p>
        </div>
        <StatusBadge status={attachment.status ?? "draft"} />
        {canConfirm && (
          <Button
            onClick={() => {
              setConfirmForm({
                personnelCost: attachment.personnelCost ?? 0,
                articlesCost: attachment.articlesCost ?? 0,
                toolsCost: attachment.toolsCost ?? 0,
              });
              setShowConfirmForm(true);
            }}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4" /> Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Project:</span>{" "}
                  <span className="font-medium">{project?.name ?? "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Subcontractor:</span>{" "}
                  <span className="font-medium">
                    {subcontractor?.legalName ?? "Internal"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Currency:</span>{" "}
                  <span className="font-medium">
                    {attachment.currency ?? "MAD"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  <span className="font-medium">
                    {attachment.createdAt
                      ? format(new Date(attachment.createdAt), "MMM d, yyyy")
                      : "—"}
                  </span>
                </div>
                {attachment.confirmedAt && (
                  <div>
                    <span className="text-muted-foreground">Confirmed:</span>{" "}
                    <span className="font-medium">
                      {format(new Date(attachment.confirmedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Tasks:</span>{" "}
                  <span className="font-medium">
                    {attachedTasks.length} task(s)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" /> Attached Tasks (
                {attachedTasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks</p>
              ) : (
                <div className="space-y-2">
                  {attachedTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="text-sm font-medium">{t.name ?? t.id}</p>
                        {t.estimatedCost != null && (
                          <p className="text-xs text-muted-foreground">
                            Est. {fmt(t.estimatedCost, attachment.currency)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {t.progress != null && (
                          <span className="text-xs text-muted-foreground">
                            {t.progress}%
                          </span>
                        )}
                        {t.status && <StatusBadge status={t.status} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar */}
        <div className="space-y-6">
          {/* Cost summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Personnel</span>
                </div>
                <span className="text-sm font-semibold">
                  {fmt(attachment.personnelCost, attachment.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Articles</span>
                </div>
                <span className="text-sm font-semibold">
                  {fmt(attachment.articlesCost, attachment.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Tools</span>
                </div>
                <span className="text-sm font-semibold">
                  {fmt(attachment.toolsCost, attachment.currency)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex justify-between items-center">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-bold text-primary">
                  {fmt(totalCost, attachment.currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Invoice card */}
          {attachment.invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Generated Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Number:</span>
                    <span className="font-medium">
                      {attachment.invoice.invoiceNumber ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <StatusBadge status={attachment.invoice.status ?? "—"} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold text-primary">
                      {fmt(attachment.invoice.amount, attachment.currency)}
                    </span>
                  </div>
                  {attachment.invoice.pdfUrl && (
                    <a
                      href={attachment.invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 text-xs"
                      >
                        Download PDF
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Confirm Dialog */}
      <FormDialog
        open={showConfirmForm}
        onOpenChange={setShowConfirmForm}
        title={`Confirm — ${attachment.title}`}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              {subcontractor
                ? "Confirming will auto-generate an invoice for the subcontractor."
                : "Enter the actual costs for this internal attachment."}
            </p>
          </div>

          {!subcontractor && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Personnel Cost</Label>
                <Input
                  type="number"
                  min={0}
                  value={confirmForm.personnelCost}
                  onChange={(e) =>
                    setConfirmForm({
                      ...confirmForm,
                      personnelCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Articles Cost</Label>
                <Input
                  type="number"
                  min={0}
                  value={confirmForm.articlesCost}
                  onChange={(e) =>
                    setConfirmForm({
                      ...confirmForm,
                      articlesCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Tools Cost</Label>
                <Input
                  type="number"
                  min={0}
                  value={confirmForm.toolsCost}
                  onChange={(e) =>
                    setConfirmForm({
                      ...confirmForm,
                      toolsCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="col-span-3 p-2 rounded-lg bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">
                  {totalConfirm.toLocaleString()} {attachment.currency ?? "MAD"}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                confirmMutation.mutate(
                  subcontractor
                    ? undefined
                    : {
                        personnelCost: confirmForm.personnelCost,
                        articlesCost: confirmForm.articlesCost,
                        toolsCost: confirmForm.toolsCost,
                      },
                )
              }
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending
                ? "Confirming..."
                : "Confirm & Validate"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
