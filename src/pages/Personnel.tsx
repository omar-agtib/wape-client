import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  personnelService,
  type CreatePersonnelPayload,
  type UpdatePersonnelPayload,
} from "@/services/wape.service";
import type { Personnel } from "@/types/api";

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

type RoleFilter = "all" | string;

interface FormState {
  fullName: string;
  role: string;
  costPerHour: number;
  currency: "MAD" | "USD" | "EUR" | "GBP";
  email: string;
  phone: string;
  address: string;
}

const defaultForm: FormState = {
  fullName: "",
  role: "",
  costPerHour: 0,
  currency: "MAD",
  email: "",
  phone: "",
  address: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Personnel() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: personnelData, isLoading } = useQuery({
    queryKey: ["personnel"],
    queryFn: () => personnelService.list({ limit: 100 }),
  });

  const personnelList = personnelData?.items ?? [];

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

  const handleSave = () => {
    if (editing) {
      const payload: UpdatePersonnelPayload = {
        fullName: form.fullName || undefined,
        role: form.role || undefined,
        costPerHour: form.costPerHour,
        currency: form.currency,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      };
      saveMutation.mutate(payload);
    } else {
      const payload: CreatePersonnelPayload = {
        fullName: form.fullName,
        role: form.role,
        costPerHour: form.costPerHour,
        currency: form.currency,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
      };
      saveMutation.mutate(payload);
    }
  };

  // ── Filtering
  const filtered = personnelList.filter((p) => {
    const matchSearch =
      !search ||
      p.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      p.role?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Derive unique roles for filter
  const uniqueRoles = Array.from(
    new Set(personnelList.map((p) => p.role).filter(Boolean)),
  );

  // ── Columns
  const columns = [
    {
      header: "Name",
      cell: (row: Personnel) => (
        <div>
          <p className="font-medium text-foreground">{row.fullName}</p>
          <p className="text-xs text-muted-foreground">{row.role}</p>
        </div>
      ),
    },
    {
      header: "Cost / Hour",
      cell: (row: Personnel) => (
        <span className="text-xs font-medium">
          {row.costPerHour?.toLocaleString()} {row.currency ?? "MAD"}
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
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {uniqueRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
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

          {/* Role */}
          <div>
            <Label>Role *</Label>
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Engineer, Worker, Manager"
            />
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

          {/* Cost per hour */}
          <div className="col-span-2">
            <Label>Cost per Hour *</Label>
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
