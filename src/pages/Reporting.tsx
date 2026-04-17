import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FolderKanban,
  CheckSquare,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

import {
  reportingService,
  projectsService,
  tasksService,
  personnelService,
  toolsService,
  ncService,
} from "@/services/wape.service";
import type { Project, Task, NonConformity, Tool } from "@/types/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { Progress } from "@/components/ui/progress";

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS = [
  "hsl(221,83%,53%)",
  "hsl(142,71%,45%)",
  "hsl(38,92%,50%)",
  "hsl(0,84%,60%)",
  "hsl(199,89%,48%)",
];

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-blue-500/10 text-blue-600",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`p-2 rounded-lg shrink-0 ${colorMap[color] ?? colorMap.primary}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReportingPage() {
  // ── Queries — use reportingService dedicated endpoints
  const { data: overviewData } = useQuery({
    queryKey: ["reporting-overview"],
    queryFn: () => reportingService.overview(),
  });

  const { data: reportingTasksData } = useQuery({
    queryKey: ["reporting-tasks"],
    queryFn: () => reportingService.tasks(),
  });

  const { data: reportingNcData } = useQuery({
    queryKey: ["reporting-ncs"],
    queryFn: () => reportingService.nonConformities(),
  });

  const { data: reportingFinanceData } = useQuery({
    queryKey: ["reporting-finance"],
    queryFn: () => reportingService.finance(6),
  });

  // ── Fallback queries for project health table
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => tasksService.list({ limit: 100 }),
  });

  const { data: personnelData } = useQuery({
    queryKey: ["personnel"],
    queryFn: () => personnelService.list({ limit: 100 }),
  });

  const { data: toolsData } = useQuery({
    queryKey: ["tools"],
    queryFn: () => toolsService.list({ limit: 100 }),
  });

  const { data: ncsData } = useQuery({
    queryKey: ["ncs"],
    queryFn: () => ncService.list({ limit: 100 }),
  });

  const projects = (projectsData?.items ?? []) as Project[];
  const tasks = (tasksData?.items ?? []) as Task[];
  const tools = (toolsData?.items ?? []) as Tool[];
  const ncs = (ncsData?.items ?? []) as NonConformity[];
  const overview = overviewData as any;

  // ── Task status chart — use real backend statuses
  const tasksByStatus = ["planned", "on_progress", "completed"].map((s) => ({
    name:
      s === "on_progress"
        ? "In Progress"
        : s.charAt(0).toUpperCase() + s.slice(1),
    count: tasks.filter((t) => t.status === s).length,
  }));

  // ── NC by severity chart
  const ncsBySeverity = ["low", "medium", "high", "critical"]
    .map((s) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      open: ncs.filter(
        (nc) => (nc as any).severity === s && nc.status !== "closed",
      ).length,
      closed: ncs.filter(
        (nc) => (nc as any).severity === s && nc.status === "closed",
      ).length,
    }))
    .filter((s) => s.open > 0 || s.closed > 0);

  // ── Finance chart from reporting endpoint
  const financeData = (reportingFinanceData as any)?.monthly ?? [];

  // ── KPI values — prefer reporting overview, fallback to local counts
  const kpis = {
    projects: overview?.totalProjects ?? projects.length,
    tasks: overview?.totalTasks ?? tasks.length,
    personnel: overview?.totalPersonnel ?? personnelData?.items?.length ?? 0,
    tools: tools.filter((t) => t.status === "available").length,
    openNcs: ncs.filter((nc) => nc.status === "open").length,
    budgetConsumed:
      overview?.budgetConsumedPercent != null
        ? `${Math.round(overview.budgetConsumedPercent)}%`
        : "N/A",
  };

  // ── Render
  return (
    <div className="space-y-6">
      {/* Global KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Projects"
          value={kpis.projects}
          icon={FolderKanban}
          color="primary"
        />
        <KPICard
          title="Tasks"
          value={kpis.tasks}
          icon={CheckSquare}
          color="info"
        />
        <KPICard
          title="Personnel"
          value={kpis.personnel}
          icon={Users}
          color="success"
        />
        <KPICard
          title="Available Tools"
          value={kpis.tools}
          icon={Package}
          color="warning"
        />
        <KPICard
          title="Open NCs"
          value={kpis.openNcs}
          icon={AlertTriangle}
          color="destructive"
        />
        <KPICard
          title="Budget Used"
          value={kpis.budgetConsumed}
          icon={TrendingUp}
          color="info"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Task Distribution by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tasksByStatus}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(221,83%,53%)"
                  radius={[4, 4, 0, 0]}
                  name="Tasks"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* NCs by severity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Non Conformities by Severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ncsBySeverity.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-16">
                No non-conformities recorded
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ncsBySeverity}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="open"
                    fill="hsl(0,84%,60%)"
                    radius={[4, 4, 0, 0]}
                    name="Open"
                  />
                  <Bar
                    dataKey="closed"
                    fill="hsl(142,71%,45%)"
                    radius={[4, 4, 0, 0]}
                    name="Closed"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Finance chart */}
      {financeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Financial Overview — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={financeData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="spent"
                  fill="hsl(0,84%,60%)"
                  radius={[4, 4, 0, 0]}
                  name="Spent"
                />
                <Bar
                  dataKey="budget"
                  fill="hsl(221,83%,53%)"
                  radius={[4, 4, 0, 0]}
                  name="Budget"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Project health table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Project Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No projects
              </p>
            )}
            {projects.map((p) => {
              const ptasks = tasks.filter((t) => t.projectId === p.id);
              const pncs = ncs.filter(
                (nc) => nc.projectId === p.id && nc.status === "open",
              ).length;
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{p.name}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{ptasks.length} tasks</span>
                      <span
                        className={
                          pncs > 0 ? "text-destructive font-medium" : ""
                        }
                      >
                        {pncs} open NCs
                      </span>
                      <span>
                        {p.budget?.toLocaleString()} {p.currency ?? "MAD"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20">
                      Progress
                    </span>
                    <Progress
                      value={p.progress ?? 0}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-xs font-medium w-10 text-right">
                      {p.progress ?? 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
