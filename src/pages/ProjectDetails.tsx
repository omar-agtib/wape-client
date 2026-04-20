import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckSquare,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import {
  projectsService,
  contactsService,
  documentsService,
  tasksService,
} from "@/services/wape.service";
import type { Task, Project } from "@/types/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/shared/StatusBadge";

interface DocRecord {
  id?: string;
  documentName?: string;
  fileUrl?: string;
}
// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number, currency = "MAD") {
  return `${amount.toLocaleString()} ${currency}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProjectDetails() {
  const { id: projectId } = useParams<{ id: string }>();

  // ── Project
  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsService.get(projectId!),
    enabled: !!projectId,
  });

  // ── Finance snapshot (budget breakdown)
  const { data: finance } = useQuery({
    queryKey: ["project-finance", projectId],
    queryFn: () => projectsService.getFinance(projectId!),
    enabled: !!projectId,
  });

  // ── Tasks for this project
  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksService.list({ limit: 100, projectId }),
    enabled: !!projectId,
  });

  // ── Attachments (subcontractor work orders)
  // const { data: attachmentsData } = useQuery({
  //   queryKey: ["attachments"],
  //   queryFn: () => attachmentsService.list({ limit: 100 }),
  //   enabled: !!projectId,
  // });

  // // ── Purchase orders linked to project
  // const { data: purchaseOrdersData } = useQuery({
  //   queryKey: ["project-purchase-orders", projectId],
  //   queryFn: () => projectsService.getPurchaseOrders(projectId!),
  //   enabled: !!projectId,
  // });

  // ── Documents
  const { data: docsData } = useQuery({
    queryKey: ["documents", projectId],
    queryFn: () =>
      documentsService.list({
        sourceType: "project",
        sourceId: projectId,
        limit: 20,
      }),
    enabled: !!projectId,
  });

  // ── Client name
  const { data: clientData } = useQuery({
    queryKey: ["contact", project?.clientId],
    queryFn: () => contactsService.get(project!.clientId!),
    enabled: !!project?.clientId,
  });

  const tasks = (tasksData?.items ?? []).filter(
    (t: Task) => t.projectId === projectId,
  );
  const docs = docsData?.items ?? [];
  const financeSnap =
    (finance as Project["financeSnapshot"]) ?? project?.financeSnapshot;

  if (loadingProject) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Project not found.
      </div>
    );
  }

  // ── Budget numbers from finance snapshot or project root
  const totalBudget = financeSnap?.totalBudget ?? project.budget ?? 0;
  const totalSpent = financeSnap?.totalSpent ?? 0;
  const remaining = financeSnap?.remainingBudget ?? totalBudget - totalSpent;
  const alertLevel = financeSnap?.alertLevel ?? "normal";

  const alertColors: Record<string, string> = {
    normal: "bg-success/5 text-success",
    warning: "bg-warning/5 text-warning",
    critical: "bg-destructive/5 text-destructive",
  };

  return (
    <div className="space-y-6">
      {/* ── Header */}
      <div className="flex items-center gap-3">
        <Link to="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">{project.name}</h2>
          {clientData && (
            <p className="text-sm text-muted-foreground">
              {clientData.legalName}
            </p>
          )}
        </div>
        <StatusBadge status={project.status} className="ml-auto" />
      </div>

      {/* ── Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="text-sm font-medium">
                {project.startDate
                  ? format(new Date(project.startDate), "MMM d, yyyy")
                  : "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Calendar className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="text-sm font-medium">
                {project.endDate
                  ? format(new Date(project.endDate), "MMM d, yyyy")
                  : "—"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <DollarSign className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-medium">
                {fmt(project.budget, project.currency)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3 w-full">
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <Progress
                  value={project.progress ?? 0}
                  className="h-2 flex-1 min-w-[100px]"
                />
                <span className="text-sm font-bold">
                  {project.progress ?? 0}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Financial Overview
            {alertLevel !== "normal" && (
              <AlertTriangle
                className={`w-4 h-4 ${
                  alertLevel === "critical"
                    ? "text-destructive"
                    : "text-warning"
                }`}
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-primary/5">
              <p className="text-xs text-muted-foreground">Total Budget</p>
              <p className="text-xl font-bold text-primary">
                {fmt(totalBudget, project.currency)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-warning/5">
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-xl font-bold text-warning">
                {fmt(totalSpent, project.currency)}
              </p>
              {financeSnap?.percentConsumed !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  {financeSnap.percentConsumed.toFixed(1)}% consumed
                </p>
              )}
            </div>
            <div
              className={`p-4 rounded-lg ${alertColors[alertLevel] ?? alertColors.normal}`}
            >
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-xl font-bold">
                {fmt(remaining, project.currency)}
              </p>
            </div>
          </div>

          {/* Cost breakdown */}
          {financeSnap?.breakdown && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {(
                [
                  ["Personnel", financeSnap.breakdown.personnel],
                  ["Materials", financeSnap.breakdown.articles],
                  ["Tools", financeSnap.breakdown.tools],
                ] as [string, number][]
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="p-3 rounded-lg bg-muted/30 text-center"
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold">
                    {fmt(val, project.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Tasks ({tasks.length})
          </CardTitle>
          <Link to={`/tasks?projectId=${projectId}`}>
            <Button variant="outline" size="sm" className="text-xs">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tasks yet
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 5).map((t: Task) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{t.name}</span>
                      {t.estimatedCost ? (
                        <p className="text-xs text-muted-foreground">
                          Est. {fmt(t.estimatedCost, t.currency)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 min-w-[80px]">
                      <Progress
                        value={t.progress ?? 0}
                        className="h-1.5 w-14"
                      />
                      <span className="text-xs text-muted-foreground">
                        {t.progress ?? 0}%
                      </span>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Documents ({docs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No documents
            </p>
          ) : (
            <div className="space-y-2">
              {(docs as DocRecord[]).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {d.documentName ?? "Document"}
                    </span>
                  </div>
                  {d.fileUrl ? (
                    <a href={d.fileUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm" className="text-xs h-7">
                        Open
                      </Button>
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
