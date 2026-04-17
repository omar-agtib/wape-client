import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Eye, Upload, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";

import {
  contactsService,
  purchaseOrdersService,
  uploadService,
  type CreateContactPayload,
  type UpdateContactPayload,
  type CreateContactDocumentPayload,
} from "@/services/wape.service";
import type { Contact, PurchaseOrder } from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import FormDialog from "@/components/shared/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  legalName: string;
  ifNumber: string;
  iceNumber: string;
  email: string;
  phone: string;
  address: string;
}

interface DocUpload {
  documentName: string;
  documentType: string;
  fileUrl: string;
}

const defaultForm: FormState = {
  legalName: "",
  ifNumber: "",
  iceNumber: "",
  email: "",
  phone: "",
  address: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [viewingSupplier, setViewingSupplier] = useState<Contact | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingDocs, setPendingDocs] = useState<DocUpload[]>([]);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => contactsService.listSuppliers({ limit: 100 }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => purchaseOrdersService.list({ limit: 100 }),
  });

  const { data: viewingDocsData } = useQuery({
    queryKey: ["contact-docs", viewingSupplier?.id],
    queryFn: () => contactsService.listDocuments(viewingSupplier!.id),
    enabled: !!viewingSupplier?.id,
  });

  const suppliers = suppliersData?.items ?? [];
  const purchaseOrders = (ordersData?.items ?? []) as PurchaseOrder[];
  const viewingDocs = (viewingDocsData ?? []) as any[];

  // ── Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: FormState) => {
      let contact: Contact;
      if (editing) {
        const payload: UpdateContactPayload = {
          legalName: data.legalName || undefined,
          ifNumber: data.ifNumber || undefined,
          iceNumber: data.iceNumber || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
        };
        contact = await contactsService.update(editing.id, payload);
      } else {
        const payload: CreateContactPayload = {
          contactType: "supplier",
          legalName: data.legalName,
          ifNumber: data.ifNumber || undefined,
          iceNumber: data.iceNumber || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
        };
        contact = await contactsService.create(payload);
      }
      for (const doc of pendingDocs) {
        await contactsService.addDocument(contact.id, doc);
      }
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setShowForm(false);
      setEditing(null);
      setPendingDocs([]);
    },
  });

  // ── Helpers
  const openForm = (supplier?: Contact) => {
    setEditing(supplier ?? null);
    setPendingDocs([]);
    setForm(
      supplier
        ? {
            legalName: supplier.legalName ?? "",
            ifNumber: (supplier as any).ifNumber ?? "",
            iceNumber: (supplier as any).iceNumber ?? "",
            email: (supplier as any).email ?? "",
            phone: (supplier as any).phone ?? "",
            address: (supplier as any).address ?? "",
          }
        : defaultForm,
    );
    setShowForm(true);
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadService.file(file, "contact-documents");
      const fileUrl = result.secureUrl ?? result.url ?? "";
      setPendingDocs((prev) => [
        ...prev,
        { documentName: file.name, documentType: "other", fileUrl },
      ]);
    } finally {
      setUploading(false);
    }
  };

  const filtered = suppliers.filter(
    (s) => !search || s.legalName?.toLowerCase().includes(search.toLowerCase()),
  );

  const supplierOrders = viewingSupplier
    ? purchaseOrders.filter((o) => o.supplierId === viewingSupplier.id)
    : [];

  // ── Columns
  const columns = [
    {
      header: "Supplier",
      cell: (row: Contact) => (
        <div>
          <p className="font-medium text-foreground">{row.legalName}</p>
          <p className="text-xs text-muted-foreground">
            {(row as any).iceNumber ?? "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Email / Phone",
      cell: (row: Contact) => (
        <div className="text-xs space-y-0.5">
          {(row as any).email && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-muted-foreground" />
              {(row as any).email}
            </div>
          )}
          {(row as any).phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-muted-foreground" />
              {(row as any).phone}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "IF / ICE",
      cell: (row: Contact) => (
        <div className="text-xs space-y-0.5">
          {(row as any).ifNumber && (
            <div>
              <span className="text-muted-foreground">IF:</span>{" "}
              {(row as any).ifNumber}
            </div>
          )}
          {(row as any).iceNumber && (
            <div>
              <span className="text-muted-foreground">ICE:</span>{" "}
              {(row as any).iceNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Orders",
      cell: (row: Contact) => {
        const count = purchaseOrders.filter(
          (o) => o.supplierId === row.id,
        ).length;
        return (
          <Badge variant="outline" className="text-xs">
            {count} POs
          </Badge>
        );
      },
    },
    {
      header: "",
      cell: (row: Contact) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewingSupplier(row)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => openForm(row)}
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
        title="Suppliers"
        subtitle={`${suppliers.length} suppliers`}
        onAdd={() => openForm()}
        addLabel="New Supplier"
        searchValue={search}
        onSearch={setSearch}
      />

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── View Dialog */}
      {viewingSupplier && (
        <FormDialog
          open={!!viewingSupplier}
          onOpenChange={() => setViewingSupplier(null)}
          title={`Supplier: ${viewingSupplier.legalName}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">IF:</span>{" "}
                <span className="font-medium">
                  {(viewingSupplier as any).ifNumber ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">ICE:</span>{" "}
                <span className="font-medium">
                  {(viewingSupplier as any).iceNumber ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">
                  {(viewingSupplier as any).email ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>{" "}
                <span className="font-medium">
                  {(viewingSupplier as any).phone ?? "—"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Address:</span>{" "}
                <span className="font-medium">
                  {(viewingSupplier as any).address ?? "—"}
                </span>
              </div>
            </div>

            {/* Documents */}
            {viewingDocs.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Documents ({viewingDocs.length})
                </h4>
                <div className="space-y-1">
                  {viewingDocs.map((doc: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded bg-muted/30 text-xs"
                    >
                      <span className="flex-1 truncate">
                        {doc.documentName ?? doc.name}
                      </span>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3 text-primary" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Orders */}
            <div>
              <h4 className="font-semibold text-sm mb-2">
                Purchase Orders ({supplierOrders.length})
              </h4>
              {supplierOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No purchase orders.
                </p>
              ) : (
                <div className="space-y-2">
                  {supplierOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                    >
                      <span className="font-medium">
                        PO-{o.id.slice(-6).toUpperCase()}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FormDialog>
      )}

      {/* ── Form Dialog */}
      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title={editing ? "Edit Supplier" : "New Supplier"}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Legal Name *</Label>
            <Input
              value={form.legalName}
              onChange={(e) => setForm({ ...form, legalName: e.target.value })}
            />
          </div>
          <div>
            <Label>IF (Fiscal Identifier)</Label>
            <Input
              value={form.ifNumber}
              onChange={(e) => setForm({ ...form, ifNumber: e.target.value })}
            />
          </div>
          <div>
            <Label>ICE (Company ID)</Label>
            <Input
              value={form.iceNumber}
              onChange={(e) => setForm({ ...form, iceNumber: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          {/* Documents */}
          <div className="col-span-2">
            <Label className="mb-1 block">Documents</Label>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground w-fit">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload document"}
              <input
                type="file"
                className="hidden"
                onChange={handleUploadDoc}
                disabled={uploading}
              />
            </label>
            <div className="mt-2 space-y-1">
              {pendingDocs.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded bg-muted/30 text-xs"
                >
                  <span className="flex-1 truncate">{doc.documentName}</span>
                  <X
                    className="w-3 h-3 cursor-pointer text-muted-foreground"
                    onClick={() =>
                      setPendingDocs((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={saveMutation.isPending || !form.legalName}
            >
              {saveMutation.isPending ? "Saving..." : "Save Supplier"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
