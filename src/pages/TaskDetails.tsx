import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Users, Package, Wrench, TrendingUp } from "lucide-react";

import { tasksService, projectsService } from "@/services/wape.service";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/shared/StatusBadge";

// ── Types for task sub-resources ──────────────────────────────────────────────

interface TaskPersonnel {
  id: string;
  personnelId: string;
  plannedHours: number;
  personnel?: { fullName: string; role: string; costPerHour: number };
}

interface TaskArticle {
  id: string;
  articleId: string;
  plannedQuantity: number;
  article?: { name: string; unit?: string; unitPrice: number };
}

interface TaskTool {
  id: string;
  toolId: string;
  plannedDays: number;
  tool?: { name: string; category: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(amount: number, currency = "MAD") {
  return `${amount.toLocaleString()} ${currency}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TaskDetails() {
  const { id: taskId } = useParams<{ id: string }>();

  // ── Task
  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => tasksService.get(taskId!),
    enabled: !!taskId,
  });

  // ── Task sub-resources
  const { data: taskPersonnel = [] } = useQuery({
    queryKey: ["task-personnel", taskId],
    queryFn: () => tasksService.listPersonnel(taskId!),
    enabled: !!taskId,
  });

  const { data: taskArticles = [] } = useQuery({
    queryKey: ["task-articles", taskId],
    queryFn: () => tasksService.listArticles(taskId!),
    enabled: !!taskId,
  });

  const { data: taskTools = [] } = useQuery({
    queryKey: ["task-tools", taskId],
    queryFn: () => tasksService.listTools(taskId!),
    enabled: !!taskId,
  });

  // ── Parent project (for name display)
  const { data: project } = useQuery({
    queryKey: ["project", task?.projectId],
    queryFn: () => projectsService.get(task!.projectId),
    enabled: !!task?.projectId,
  });

  const personnel = taskPersonnel as TaskPersonnel[];
  const articles = taskArticles as TaskArticle[];
  const tools = taskTools as TaskTool[];

  // ── Loading / not found
  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Task not found.
      </div>
    );
  }

  // ── Cost estimates from sub-resources
  const personnelCost = personnel.reduce((sum, p) => {
    const rate = p.personnel?.costPerHour ?? 0;
    return sum + rate * (p.plannedHours ?? 0);
  }, 0);

  const articlesCost = articles.reduce((sum, a) => {
    const price = a.article?.unitPrice ?? 0;
    return sum + price * (a.plannedQuantity ?? 0);
  }, 0);

  const totalEstimated = task.estimatedCost ?? personnelCost + articlesCost;
  const totalActual = task.actualCost ?? 0;

  // ── Render
  return (
    <div className="space-y-6">
      {/* ── Header */}
      <div className="flex items-center gap-3">
        <Link to="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">{task.name}</h2>
          {project && (
            <p className="text-sm text-muted-foreground">{project.name}</p>
          )}
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-medium ml-2">
                    {task.startDate
                      ? format(new Date(task.startDate), "MMM d, yyyy")
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">End:</span>
                  <span className="font-medium ml-2">
                    {task.endDate
                      ? format(new Date(task.endDate), "MMM d, yyyy")
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-medium ml-2">
                    {task.progress ?? 0}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-medium ml-2">{task.currency}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <Progress value={task.progress ?? 0} className="h-2" />
              </div>

              {task.description && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {task.description}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Financial summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-primary/5">
                  <p className="text-xs text-muted-foreground">Estimated</p>
                  <p className="text-xl font-bold text-primary">
                    {fmt(totalEstimated, task.currency)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-warning/5">
                  <p className="text-xs text-muted-foreground">Actual</p>
                  <p className="text-xl font-bold text-warning">
                    {fmt(totalActual, task.currency)}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    totalActual <= totalEstimated
                      ? "bg-success/5"
                      : "bg-destructive/5"
                  }`}
                >
                  <p className="text-xs text-muted-foreground">Variance</p>
                  <p
                    className={`text-xl font-bold ${
                      totalActual <= totalEstimated
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {fmt(totalEstimated - totalActual, task.currency)}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              {(personnelCost > 0 || articlesCost > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground">Personnel</p>
                    <p className="text-sm font-semibold">
                      {fmt(personnelCost, task.currency)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 text-center">
                    <p className="text-xs text-muted-foreground">Materials</p>
                    <p className="text-sm font-semibold">
                      {fmt(articlesCost, task.currency)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar */}
        <div className="space-y-6">
          {/* Personnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4" /> Personnel ({personnel.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {personnel.length === 0 ? (
                <p className="text-sm text-muted-foreground">None assigned</p>
              ) : (
                <div className="space-y-2">
                  {personnel.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                        {p.personnel?.fullName?.[0] ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {p.personnel?.fullName ?? p.personnelId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.plannedHours}h
                          {p.personnel?.role ? ` · ${p.personnel.role}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" /> Materials ({articles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {articles.length === 0 ? (
                <p className="text-sm text-muted-foreground">None assigned</p>
              ) : (
                <div className="space-y-2">
                  {articles.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <span className="text-sm">
                        {a.article?.name ?? a.articleId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        qty: {a.plannedQuantity}{" "}
                        {a.article?.unit ? `${a.article.unit}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Tools ({tools.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tools.length === 0 ? (
                <p className="text-sm text-muted-foreground">None assigned</p>
              ) : (
                <div className="space-y-2">
                  {tools.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <p className="text-sm">{t.tool?.name ?? t.toolId}</p>
                      <span className="text-xs text-muted-foreground">
                        {t.plannedDays}d
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
