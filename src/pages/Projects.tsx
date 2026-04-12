/**
 * EXAMPLE PAGE — Projects
 * Shows how all components compose together for a full CRUD page.
 * Copy this pattern for every other page in Sprint 13.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FolderKanban,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// UI
import { Button } from "../components/ui/Button";
import { Table } from "../components/ui/Table";
import { Pagination } from "../components/ui/Pagination";
import { Dropdown } from "../components/ui/Controls";
import { FilterBar } from "../components/ui/Controls";
import { Confirm } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/Misc";
import { Progress } from "../components/ui/Misc";
import { useToast } from "../components/ui/Toast";

// Shared
import { PageHeader } from "../components/layout/PageLayout";
import KPICard from "../components/shared/KPICard";
import StatusBadge from "../components/shared/StatusBadge";

// Hooks
import { usePaginatedQuery, useDisclosure } from "../hooks/useTable";

// Services + types
import { projectsService } from "../services/wape.service";
import type { Project } from "../types/api";
import type { Column } from "../components/ui/Table";

export default function Projects() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success, error } = useToast();
  const deleteModal = useDisclosure();
  const [targetId, setTargetId] = React.useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    data,
    total,
    totalPages,
    loading,
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
  } = usePaginatedQuery(["projects"], projectsService.list, { limit: 15 });

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const active = data.filter((p) => p.status === "on_progress").length;
  const completed = data.filter((p) => p.status === "completed").length;
  const planned = data.filter((p) => p.status === "planned").length;

  // ── Delete mutation ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsService.list({ id }), // replace with projectsService.delete(id)
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      success("Project deleted", "The project has been removed successfully.");
      deleteModal.close();
    },
    onError: () => error("Delete failed", "Could not delete this project."),
  });

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns: Column<Project>[] = [
    {
      key: "name",
      header: "Project",
      render: (row) => (
        <div>
          <p className="font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {row.startDate} → {row.endDate}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "progress",
      header: "Progress",
      width: "160px",
      render: (row) => <Progress value={row.progress} showValue size="sm" />,
    },
    {
      key: "budget",
      header: "Budget",
      align: "right",
      width: "120px",
      render: (row) => (
        <span className="text-sm font-medium">
          {new Intl.NumberFormat("fr-MA").format(row.budget)} {row.currency}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "48px",
      align: "right",
      render: (row) => (
        <Dropdown
          align="right"
          trigger={
            <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          }
          items={[
            {
              key: "view",
              label: "View details",
              icon: Eye,
              onClick: () => navigate(`/projects/${row.id}`),
            },
            {
              key: "edit",
              label: "Edit",
              icon: Edit,
              onClick: () => navigate(`/projects/${row.id}?edit=true`),
            },
            { key: "div", label: "", divider: true },
            {
              key: "delete",
              label: "Delete",
              icon: Trash2,
              variant: "danger",
              onClick: () => {
                setTargetId(row.id);
                deleteModal.open();
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle={`${total} projects total`}
        actions={
          <Button onClick={() => navigate("/projects/new")}>
            <Plus className="w-4 h-4" /> New Project
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          title="In Progress"
          value={active}
          icon={FolderKanban}
          color="primary"
        />
        <KPICard
          title="Completed"
          value={completed}
          icon={FolderKanban}
          color="success"
        />
        <KPICard
          title="Planned"
          value={planned}
          icon={FolderKanban}
          color="muted"
        />
      </div>

      {/* Filter bar */}
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search projects...",
        }}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { value: "planned", label: "Planned" },
              { value: "on_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
            ],
          },
        ]}
        values={filters}
        onFilterChange={setFilter}
        onReset={resetFilters}
      />

      {/* Table */}
      <Table
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        loading={loading}
        onRowClick={(row) => navigate(`/projects/${row.id}`)}
        emptyState={
          <EmptyState
            icon={<FolderKanban className="w-6 h-6 text-muted-foreground" />}
            title="No projects yet"
            description="Create your first project to get started."
            action={
              <Button size="sm" onClick={() => navigate("/projects/new")}>
                <Plus className="w-4 h-4" /> New Project
              </Button>
            }
          />
        }
      />

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={15}
        onPageChange={setPage}
      />

      {/* Delete confirm */}
      <Confirm
        open={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={() => targetId && deleteMutation.mutate(targetId)}
        loading={deleteMutation.isPending}
        title="Delete project?"
        message="This will permanently delete the project and all associated data. This action cannot be undone."
        confirmLabel="Delete project"
        variant="danger"
      />
    </div>
  );
}
