import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FolderKanban,
  CheckSquare,
  Users,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import { projectsService } from "../services/wape.service";
import { tasksService } from "../services/wape.service";
import { personnelService } from "../services/wape.service";
import { articlesService } from "../services/wape.service";
import { ncService } from "../services/wape.service";
import { financeService } from "../services/wape.service";
import KPICard from "../components/shared/KPICard";
import StatusBadge from "../components/shared/StatusBadge";
import type { Project, Task } from "../types/api";
import { createPageUrl } from "../lib/utils";

const CHART_COLORS = [
  "hsl(221,83%,53%)",
  "hsl(142,71%,45%)",
  "hsl(38,92%,50%)",
  "hsl(0,84%,60%)",
  "hsl(199,89%,48%)",
];

const TOOLTIP_STYLE = {
  borderRadius: "8px",
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

export default function Dashboard() {
  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: projectsData } = useQuery({
    queryKey: ["projects", "dashboard"],
    queryFn: () => projectsService.list(),
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks", "dashboard"],
    queryFn: () => tasksService.list(),
  });

  const { data: personnelData } = useQuery({
    queryKey: ["personnel", "dashboard"],
    queryFn: () => personnelService.list(),
  });

  const { data: articlesData } = useQuery({
    queryKey: ["articles", "dashboard"],
    queryFn: () => articlesService.list(),
  });

  const { data: ncsData } = useQuery({
    queryKey: ["ncs", "dashboard"],
    queryFn: () => ncService.list(),
  });

  const { data: financeDashboard } = useQuery({
    queryKey: ["finance", "dashboard"],
    queryFn: () => financeService.dashboard(),
  });

  // ── Aggregations ────────────────────────────────────────────────────────────
  const projects: Project[] = projectsData?.items ?? [];
  const tasks: Task[] = tasksData?.items ?? [];
  const personnel = personnelData?.items ?? [];
  const articles = articlesData?.items ?? [];
  const ncs = ncsData?.items ?? [];

  const activeProjects = projects.filter(
    (p) => p.status === "on_progress",
  ).length;
  const tasksInProgress = tasks.filter(
    (t) => t.status === "on_progress",
  ).length;
  const totalPersonnel = personnel.length;

  // Stock alerts: articles where availableQuantity is 0 or very low
  const stockAlerts = articles.filter((a) => a.availableQuantity === 0).length;

  const openNCs = ncs.filter(
    (nc) => nc.status === "open" || nc.status === "in_review",
  ).length;

  // Budget usage from finance dashboard
  const totalBudget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);
  const totalSpent = projects.reduce(
    (s, p) => s + ((p as any).financeSnapshot?.totalSpent ?? 0),
    0,
  );
  const budgetUsage =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // ── Chart data ──────────────────────────────────────────────────────────────

  // Project progress chart
  const projectProgress = projects.slice(0, 6).map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
    progress: p.progress ?? 0,
  }));

  // Task status distribution
  const taskStatuses = [
    {
      name: "Planned",
      value: tasks.filter((t) => t.status === "planned").length,
    },
    {
      name: "In Progress",
      value: tasks.filter((t) => t.status === "on_progress").length,
    },
    {
      name: "Completed",
      value: tasks.filter((t) => t.status === "completed").length,
    },
  ].filter((s) => s.value > 0);

  // NC status distribution
  const ncStatuses = [
    { name: "Open", value: ncs.filter((nc) => nc.status === "open").length },
    {
      name: "In Review",
      value: ncs.filter((nc) => nc.status === "in_review").length,
    },
    {
      name: "Closed",
      value: ncs.filter((nc) => nc.status === "closed").length,
    },
  ].filter((s) => s.value > 0);

  // Monthly payment chart from finance dashboard
  const monthlyChart = financeDashboard?.monthlyChart ?? [];

  // Recent tasks
  const recentTasks = tasks
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Active Projects"
          value={activeProjects}
          icon={FolderKanban}
          color="primary"
          subtitle={`${projects.length} total`}
        />
        <KPICard
          title="Tasks In Progress"
          value={tasksInProgress}
          icon={CheckSquare}
          color="warning"
          subtitle={`${tasks.length} total`}
        />
        <KPICard
          title="Personnel"
          value={totalPersonnel}
          icon={Users}
          color="success"
        />
        <KPICard
          title="Stock Alerts"
          value={stockAlerts}
          icon={Package}
          color={stockAlerts > 0 ? "destructive" : "success"}
          subtitle="Out of stock articles"
        />
        <KPICard
          title="Open NC"
          value={openNCs}
          icon={AlertTriangle}
          color={openNCs > 0 ? "warning" : "success"}
          subtitle="Non-conformities"
        />
        <KPICard
          title="Budget Usage"
          value={`${budgetUsage}%`}
          icon={DollarSign}
          color={
            budgetUsage >= 100
              ? "destructive"
              : budgetUsage >= 80
                ? "warning"
                : "info"
          }
          subtitle="Across all projects"
        />
      </div>

      {/* ── Finance KPIs from backend ── */}
      {financeDashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Payments this month",
              value: financeDashboard.kpis.totalPaymentsThisMonth,
              color: "bg-primary/10 text-primary",
            },
            {
              label: "Pending supplier",
              value: financeDashboard.kpis.pendingSupplierAmount,
              color: "bg-warning/10 text-warning",
            },
            {
              label: "Pending subcontractor",
              value: financeDashboard.kpis.pendingSubcontractorAmount,
              color: "bg-info/10 text-info",
            },
            {
              label: "Overdue payments",
              value: financeDashboard.kpis.overduePayments,
              color:
                financeDashboard.kpis.overduePayments > 0
                  ? "bg-destructive/10 text-destructive"
                  : "bg-success/10 text-success",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-card rounded-xl border border-border p-4"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold mt-1 ${color.split(" ")[1]}`}>
                {typeof value === "number" && value > 100
                  ? new Intl.NumberFormat("fr-MA").format(value)
                  : value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Project Progress
            </h3>
            <Link
              to={createPageUrl("Projects")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {projectProgress.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No projects yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectProgress}>
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
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number) => [`${v}%`, "Progress"]}
                />
                <Bar
                  dataKey="progress"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Payments Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Monthly Payments
            </h3>
            <Link
              to={createPageUrl("Finance")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Finance <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {monthlyChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No payment data yet
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyChart}>
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
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number) => [
                    new Intl.NumberFormat("fr-MA").format(v),
                    "Amount",
                  ]}
                />
                <Bar
                  dataKey="total"
                  fill={CHART_COLORS[1]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Task Distribution
            </h3>
            <Link
              to={createPageUrl("Tasks")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {taskStatuses.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={taskStatuses}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {taskStatuses.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* NC Status Distribution */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Non-Conformities
            </h3>
            <Link
              to={createPageUrl("NonConformities")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {ncStatuses.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No non-conformities reported
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={ncStatuses}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {ncStatuses.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Tasks ── */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Recent Activity
          </h3>
          <Link
            to={createPageUrl("Tasks")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {recentTasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </p>
          )}
          {recentTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {task.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {task.projectId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <StatusBadge status={task.status} />
                <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.createdAt
                    ? format(new Date(task.createdAt), "MMM d")
                    : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Coming Soon notice for missing modules ── */}
      <div className="bg-muted/30 border border-border rounded-xl p-5">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Planned modules
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The following modules are planned for upcoming sprints:{" "}
              <span className="font-medium">
                Pointage (Attendance tracking)
              </span>
              , <span className="font-medium">Expenses</span>,{" "}
              <span className="font-medium">Plans (Site plans)</span>,{" "}
              <span className="font-medium">Communication</span>,{" "}
              <span className="font-medium">Reporting</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
