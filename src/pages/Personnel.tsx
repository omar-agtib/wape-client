import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  personnelService,
  projectsService,
  type CreatePersonnelPayload,
  type UpdatePersonnelPayload,
} from "@/services/wape.service";
import type {
  Personnel,
  Project,
  PersonnelStatus,
  ContractType,
} from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | PersonnelStatus;

interface FormState {
  fullName: string;
  role: string; // Function
  jobTitle: string;
  status: PersonnelStatus;
  contractType: ContractType | "";
  contractStart: string;
  contractEnd: string;
  weeklyHours: number;
  salary: number;
  assignedProjectId: string;
  costPerHour: number;
  currency: "MAD" | "USD" | "EUR" | "GBP";
  email: string;
  phone: string;
  address: string;
}

const defaultForm: FormState = {
  fullName: "",
  role: "",
  jobTitle: "",
  status: "active",
  contractType: "",
  contractStart: "",
  contractEnd: "",
  weeklyHours: 0,
  salary: 0,
  assignedProjectId: "",
  costPerHour: 0,
  currency: "MAD",
  email: "",
  phone: "",
  address: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  on_leave: "bg-amber-100 text-amber-700",
  inactive: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  on_leave: "On Leave",
  inactive: "Inactive",
};

const CONTRACT_LABELS: Record<string, string> = {
  cdi: "CDI",
  cdd: "CDD",
  temporary: "Temporary",
  internship: "Internship",
  freelance: "Freelance",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Personnel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: personnelData, isLoading } = useQuery({
    queryKey: ["personnel"],
    queryFn: () => personnelService.list({ limit: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const personnelList = personnelData?.items ?? [];
  const projects = (projectsData?.items ?? []) as Project[];

  // ── Mutations
  const saveMutation = useMutation({
    mutationFn: (data: CreatePersonnelPayload | UpdatePersonnelPayload) =>
      editing
        ? personnelService.update(editing.id, data as UpdatePersonnelPayload)
        : personnelService.create(data as CreatePersonnelPayload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personnel"] });
      setShowForm(false);
      setEditing(null);
    },
  });

  // ── Helpers
  const openForm = (person?: Personnel) => {
    setEditing(person ?? null);
    setForm(
      person
        ? {
            fullName: person.fullName ?? "",
            role: person.role ?? "",
            jobTitle: person.jobTitle ?? "",
            status: person.status ?? "active",
            contractType: (person.contractType as ContractType) ?? "",
            contractStart: person.contractStart ?? "",
            contractEnd: person.contractEnd ?? "",
            weeklyHours: person.weeklyHours ?? 0,
            salary: person.salary ?? 0,
            assignedProjectId: person.assignedProjectId ?? "",
            costPerHour: person.costPerHour ?? 0,
            currency: (person.currency as FormState["currency"]) ?? "MAD",
            email: person.email ?? "",
            phone: person.phone ?? "",
            address: person.address ?? "",
          }
        : defaultForm,
    );
    setShowForm(true);
  };

  const buildPayload = (): CreatePersonnelPayload => ({
    fullName: form.fullName,
    role: form.role,
    jobTitle: form.jobTitle || undefined,
    status: form.status,
    contractType: form.contractType || undefined,
    contractStart: form.contractStart || undefined,
    contractEnd: form.contractEnd || undefined,
    weeklyHours: form.weeklyHours || undefined,
    salary: form.salary || undefined,
    assignedProjectId: form.assignedProjectId || undefined,
    costPerHour: form.costPerHour,
    currency: form.currency,
    email: form.email || undefined,
    phone: form.phone || undefined,
    address: form.address || undefined,
  });

  const handleSave = () => {
    saveMutation.mutate(buildPayload());
  };

  // ── Filtering
  const filtered = personnelList.filter((p) => {
    const matchSearch =
      !search ||
      p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.role?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Columns (match design: Name, Function, Contract, Project, Hours/Week, Status, Contact)
  const columns = [
    {
      header: "Name",
      cell: (row: Personnel) => (
        <div>
          <p className="font-medium text-foreground">{row.fullName}</p>
          {row.jobTitle && (
            <p className="text-xs text-muted-foreground">{row.jobTitle}</p>
          )}
        </div>
      ),
    },
    {
      header: "Function",
      cell: (row: Personnel) => (
        <span className="text-sm">{row.role || "—"}</span>
      ),
    },
    {
      header: "Contract",
      cell: (row: Personnel) => (
        <span className="text-sm">
          {row.contractType ? CONTRACT_LABELS[row.contractType] : "—"}
        </span>
      ),
    },
    {
      header: "Project",
      cell: (row: Personnel) => {
        const project = projects.find((p) => p.id === row.assignedProjectId);
        return (
          <span className="text-sm text-muted-foreground">
            {project?.name ?? "—"}
          </span>
        );
      },
    },
    {
      header: "Hours/Week",
      cell: (row: Personnel) => (
        <span className="text-sm">
          {row.weeklyHours ? `${row.weeklyHours}h` : "—"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row: Personnel) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
            STATUS_STYLES[row.status] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {STATUS_LABELS[row.status] ?? row.status}
        </span>
      ),
    },
    {
      header: "Contact",
      cell: (row: Personnel) => (
        <div className="text-xs text-muted-foreground">
          {row.email && <p>{row.email}</p>}
          {row.phone && <p>{row.phone}</p>}
          {!row.email && !row.phone && <p>—</p>}
        </div>
      ),
    },
    {
      header: "",
      cell: (row: Personnel) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => openForm(row)}
        >
          Edit
        </Button>
      ),
    },
  ];

  // ── Render
  return (
    <div className="space-y-4">
      <PageHeader
        title="Personnel"
        subtitle={`${personnelList.length} employees`}
        onAdd={() => openForm()}
        addLabel="New Employee"
        searchValue={search}
        onSearch={setSearch}
      >
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editing ? "Edit Employee" : "New Employee"}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="col-span-2">
            <Label>Full Name *</Label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          {/* Job Title */}
          <div>
            <Label>Job Title</Label>
            <Input
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              placeholder="e.g. Senior Engineer"
            />
          </div>

          {/* Function (role) */}
          <div>
            <Label>Function *</Label>
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. ferrayeur, Worker"
            />
          </div>

          {/* Contract Type */}
          <div>
            <Label>Contract Type</Label>
            <Select
              value={form.contractType || undefined}
              onValueChange={(v) =>
                setForm({ ...form, contractType: v as ContractType })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cdi">CDI</SelectItem>
                <SelectItem value="cdd">CDD</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm({ ...form, status: v as PersonnelStatus })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contract Start */}
          <div>
            <Label>Contract Start</Label>
            <Input
              type="date"
              value={form.contractStart}
              onChange={(e) =>
                setForm({ ...form, contractStart: e.target.value })
              }
            />
          </div>

          {/* Contract End */}
          <div>
            <Label>Contract End</Label>
            <Input
              type="date"
              value={form.contractEnd}
              onChange={(e) =>
                setForm({ ...form, contractEnd: e.target.value })
              }
            />
          </div>

          {/* Salary */}
          <div>
            <Label>Salary</Label>
            <Input
              type="number"
              min={0}
              value={form.salary}
              onChange={(e) =>
                setForm({ ...form, salary: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          {/* Weekly Hours */}
          <div>
            <Label>Weekly Hours</Label>
            <Input
              type="number"
              min={0}
              value={form.weeklyHours}
              onChange={(e) =>
                setForm({
                  ...form,
                  weeklyHours: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          {/* Cost per hour — needed for task costing */}
          <div>
            <Label>Cost / Hour *</Label>
            <Input
              type="number"
              min={0}
              value={form.costPerHour}
              onChange={(e) =>
                setForm({
                  ...form,
                  costPerHour: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Used to calculate task costs
            </p>
          </div>

          {/* Currency */}
          <div>
            <Label>Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(v) =>
                setForm({ ...form, currency: v as FormState["currency"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAD">MAD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Project */}
          <div className="col-span-2">
            <Label>Assigned Project</Label>
            <Select
              value={form.assignedProjectId || undefined}
              onValueChange={(v) => setForm({ ...form, assignedProjectId: v })}
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

          {/* Email */}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          {/* Address */}
          <div className="col-span-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !form.fullName || !form.role}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
