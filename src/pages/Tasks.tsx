import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { Eye, BarChart2, List, Kanban } from "lucide-react";

import {
  tasksService,
  projectsService,
  personnelService,
  articlesService,
  toolsService,
} from "@/services/wape.service";
import type { Task, Project, Personnel, Article, Tool } from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import TaskForm from "@/components/tasks/TaskForm";
import GanttChart from "@/components/tasks/GanttChart";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Types ─────────────────────────────────────────────────────────────────────

type TaskStatus = "planned" | "on_progress" | "completed";
type ViewMode = "list" | "kanban" | "gantt";

// ── Component ─────────────────────────────────────────────────────────────────

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get("projectId") ?? "all";

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [view, setView] = useState<ViewMode>("list");

  const queryClient = useQueryClient();

  // ── Queries
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks", projectFilter],
    queryFn: () =>
      tasksService.list({
        limit: 100,
        ...(projectFilter !== "all" ? { projectId: projectFilter } : {}),
      }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const { data: personnelData } = useQuery({
    queryKey: ["personnel"],
    queryFn: () => personnelService.list({ limit: 100 }),
  });

  const { data: articlesData } = useQuery({
    queryKey: ["articles"],
    queryFn: () => articlesService.list({ limit: 100 }),
  });

  const { data: toolsData } = useQuery({
    queryKey: ["tools"],
    queryFn: () => toolsService.list({ limit: 100 }),
  });

  const tasks = tasksData?.items ?? [];
  const projects = projectsData?.items ?? [];
  const personnel = personnelData?.items ?? [];
  const articles = articlesData?.items ?? [];
  const tools = (toolsData?.items ?? []) as Tool[];

  // ── Status change mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksService.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  // ── Save (create / update) mutation
  const saveMutation = useMutation({
    mutationFn: (data: Parameters<typeof tasksService.create>[0]) =>
      editing
        ? tasksService.update(editing.id, data)
        : tasksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowForm(false);
      setEditing(null);
    },
  });

  // ── Helpers
  const openForm = (task?: Task) => {
    setEditing(task ?? null);
    setShowForm(true);
  };

  // ── Client-side filtering
  const filtered = tasks.filter((t) => {
    const matchSearch =
      !search || t.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Table columns
  const columns = [
    {
      header: "Task",
      cell: (row: Task) => {
        const project = projects.find((p) => p.id === row.projectId);
        return (
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground">
              {project?.name ?? "No project"}
            </p>
          </div>
        );
      },
    },
    {
      header: "Duration",
      cell: (row: Task) => (
        <span className="text-xs">
          {row.startDate ? format(new Date(row.startDate), "MMM d") : "—"}
          {" → "}
          {row.endDate ? format(new Date(row.endDate), "MMM d") : "—"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row: Task) => <StatusBadge status={row.status} />,
    },
    {
      header: "Est. Cost",
      cell: (row: Task) =>
        row.estimatedCost ? (
          <span className="text-xs font-semibold text-warning">
            {row.estimatedCost.toLocaleString()} {row.currency}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: "Progress",
      cell: (row: Task) => (
        <span className="text-xs text-muted-foreground">
          {row.progress ?? 0}%
        </span>
      ),
    },
    {
      header: "",
      cell: (row: Task) => (
        <div className="flex gap-1">
          <Link to={`/tasks/${row.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              openForm(row);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  // ── Render
  return (
    <div className="space-y-4">
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.length} total tasks`}
        onAdd={() => openForm()}
        addLabel="New Task"
        searchValue={search}
        onSearch={setSearch}
      >
        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-32 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="on_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* View switcher */}
        <div className="flex border border-border rounded-md overflow-hidden">
          <Button
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            className="h-9 rounded-none gap-1"
            onClick={() => setView("list")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "ghost"}
            size="sm"
            className="h-9 rounded-none gap-1"
            onClick={() => setView("kanban")}
          >
            <Kanban className="w-4 h-4" /> Kanban
          </Button>
          <Button
            variant={view === "gantt" ? "default" : "ghost"}
            size="sm"
            className="h-9 rounded-none gap-1"
            onClick={() => setView("gantt")}
          >
            <BarChart2 className="w-4 h-4" /> Gantt
          </Button>
        </div>
      </PageHeader>

      {/* ── List view */}
      {view === "list" && (
        <DataTable columns={columns} data={filtered} isLoading={isLoading} />
      )}

      {/* ── Kanban view */}
      {view === "kanban" && (
        <KanbanBoard
          tasks={filtered}
          onStatusChange={(id: string, status: string) =>
            updateStatusMutation.mutate({ id, status: status as TaskStatus })
          }
          onEdit={openForm}
        />
      )}

      {/* ── Gantt view */}
      {view === "gantt" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Gantt Chart — Project Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GanttChart
              tasks={filtered}
              personnel={personnel as Personnel[]}
              tools={tools}
              articles={articles as Article[]}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Form dialog */}
      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editing ? "Edit Task" : "New Task"}
      >
        <TaskForm
          task={editing}
          projects={projects as Project[]}
          onSave={(data) => saveMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          saving={saveMutation.isPending}
        />
      </FormDialog>
    </div>
  );
}
