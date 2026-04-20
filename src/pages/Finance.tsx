import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Building2,
  HardHat,
  CreditCard,
} from "lucide-react";
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

import { financeService, projectsService } from "@/services/wape.service";
import type { Project } from "@/types/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS = [
  "hsl(221,83%,53%)",
  "hsl(142,71%,45%)",
  "hsl(38,92%,50%)",
  "hsl(0,84%,60%)",
  "hsl(199,89%,48%)",
];

interface FinanceDashboardRaw {
  currency?: string;
  totalBudget?: number;
  totalSpent?: number;
  remainingBudget?: number;
  percentConsumed?: number;
  monthly?: unknown[];
  monthlyChart?: unknown[];
  supplierPaymentsTotal?: number;
  subcontractorPaymentsTotal?: number;
  subscriptionTotal?: number;
  subscription?: {
    status?: string;
    daysUntilRenewal?: number;
  };
  projects?: ProjectFinance[];
  kpis?: {
    totalPaymentsThisMonth?: number;
    pendingSupplierAmount?: number;
    pendingSubcontractorAmount?: number;
    overduePayments?: number;
  };
}

interface ProjectFinance {
  id: string;
  name: string;
  status?: string;
  budget?: number;
  spent?: number;
  currency?: string;
  percentConsumed?: number;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    info: "bg-blue-500/10 text-blue-600",
    purple: "bg-purple-500/10 text-purple-600",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div
          className={`p-2 rounded-lg shrink-0 ${colorMap[color] ?? colorMap.primary}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="text-xl font-bold leading-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function fmt(amount?: number, currency = "MAD") {
  if (amount == null) return "—";
  return `${amount.toLocaleString()} ${currency}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const { data: dashboardRaw } = useQuery({
    queryKey: ["finance-dashboard"],
    queryFn: () => financeService.dashboard(),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const dashboard = dashboardRaw as FinanceDashboardRaw | undefined;
  const projects = (projectsData?.items ?? []) as Project[];

  const currency = dashboard?.currency ?? "MAD";

  // KPI values from dashboard
  const totalBudget = dashboard?.totalBudget ?? 0;
  const totalSpent = dashboard?.totalSpent ?? 0;
  const remaining = dashboard?.remainingBudget ?? totalBudget - totalSpent;
  const usagePct =
    dashboard?.percentConsumed ??
    (totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0);

  // Monthly chart data
  const monthlyData = dashboard?.monthly ?? [];

  // Supplier vs subcontractor breakdown
  const supplierTotal = dashboard?.supplierPaymentsTotal ?? 0;
  const subcontractorTotal = dashboard?.subcontractorPaymentsTotal ?? 0;
  const subscriptionTotal = dashboard?.subscriptionTotal ?? 0;

  const pieData = [
    supplierTotal > 0 && { name: "Suppliers", value: supplierTotal },
    subcontractorTotal > 0 && {
      name: "Subcontractors",
      value: subcontractorTotal,
    },
    subscriptionTotal > 0 && {
      name: "Subscriptions",
      value: subscriptionTotal,
    },
  ].filter(Boolean) as { name: string; value: number }[];

  // Subscription status
  const subscription = dashboard?.subscription;

  // Per-project from dashboard or fallback
  const projectFinance: ProjectFinance[] =
    dashboard?.projects ??
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      budget: p.budget ?? 0,
      spent: 0,
      currency: p.currency ?? "MAD",
      percentConsumed: 0,
    }));

  return (
    <div className="space-y-6">
      {/* Subscription alert */}
      {subscription &&
        subscription.status === "active" &&
        (subscription.daysUntilRenewal ?? 8) <= 7 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Your subscription renews in{" "}
              <strong>{subscription.daysUntilRenewal} days</strong>.
            </span>
          </div>
        )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Budget"
          value={fmt(totalBudget, currency)}
          icon={DollarSign}
          color="primary"
          subtitle={`${projects.length} projects`}
        />
        <KPICard
          title="Total Spent"
          value={fmt(totalSpent, currency)}
          icon={TrendingDown}
          color="warning"
        />
        <KPICard
          title="Remaining Budget"
          value={fmt(remaining, currency)}
          icon={TrendingUp}
          color={remaining >= 0 ? "success" : "destructive"}
          subtitle={remaining < 0 ? "Over budget!" : "Available"}
        />
        <KPICard
          title="Budget Used"
          value={`${Math.round(usagePct)}%`}
          icon={AlertCircle}
          color={
            usagePct > 90
              ? "destructive"
              : usagePct > 70
                ? "warning"
                : "success"
          }
          subtitle={`${100 - Math.round(usagePct)}% remaining`}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/finance/supplier-payments">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Supplier Payments</p>
                <p className="text-xs text-muted-foreground">
                  {fmt(supplierTotal, currency)} paid
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/finance/transactions">
          <Card className="hover:border-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Transactions</p>
                <p className="text-xs text-muted-foreground">
                  {fmt(subcontractorTotal, currency)} paid
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${subscription?.status === "active" ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"}`}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Subscription</p>
              <p className="text-xs text-muted-foreground">
                {subscription ? (
                  <Badge variant="outline" className="text-xs">
                    {subscription.status}
                  </Badge>
                ) : (
                  "No active plan"
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly spending */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Monthly Spending — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-16">
                No financial data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
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
                    formatter={(v) => fmt(Number(v), currency)}
                  />
                  <Legend />
                  <Bar
                    dataKey="budget"
                    fill="hsl(221,83%,53%)"
                    name="Budget"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="spent"
                    fill="hsl(38,92%,50%)"
                    name="Spent"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Spending breakdown pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {pieData.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-16">
                No spending data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(Number(v), currency)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project budget breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Project Budget Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectFinance.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No projects
              </p>
            )}
            {projectFinance.map((p) => {
              const pct =
                p.percentConsumed ??
                ((p.budget ?? 0) > 0
                  ? Math.round(((p.spent ?? 0) / (p.budget ?? 1)) * 100)
                  : 0);
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        {p.name}
                      </Link>
                      {p.status && <StatusBadge status={p.status} />}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <span className="text-warning font-semibold">
                        {fmt(p.spent, p.currency ?? currency)}
                      </span>
                      <span> / {fmt(p.budget, p.currency ?? currency)}</span>
                      <span
                        className={`ml-2 font-bold ${pct > 100 ? "text-destructive" : pct > 80 ? "text-warning" : "text-success"}`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(pct, 100)}
                    className={`h-2 ${pct > 100 ? "[&>div]:bg-destructive" : pct > 80 ? "[&>div]:bg-warning" : ""}`}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
