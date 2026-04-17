import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExternalLink, Upload, Eye, Download, FileText } from "lucide-react";

import {
  documentsService,
  projectsService,
  uploadService,
  type CreateDocumentPayload,
} from "@/services/wape.service";
import type { Project } from "@/types/api";

import PageHeader from "@/components/shared/PageHeader";
import DataTable from "@/components/shared/DataTable";
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

type FileType = "pdf" | "image" | "xlsx" | "docx" | "other";
type SourceType =
  | "project"
  | "task"
  | "contact"
  | "nc"
  | "purchase_order"
  | "attachment";

interface DocRecord {
  id: string;
  documentName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  sourceType?: string;
  sourceId?: string;
  description?: string;
  createdAt?: string;
}

interface FormState {
  documentName: string;
  sourceType: SourceType;
  sourceId: string;
  fileType: FileType;
  fileUrl: string;
  fileSize: number;
  description: string;
}

const defaultForm: FormState = {
  documentName: "",
  sourceType: "project",
  sourceId: "",
  fileType: "other",
  fileUrl: "",
  fileSize: 0,
  description: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isImage(url?: string): boolean {
  return !!url && /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
}

function detectFileType(file: File): FileType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return "xlsx";
  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  return "other";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocRecord | null>(null);

  const queryClient = useQueryClient();

  // ── Queries
  const { data: docsData, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => documentsService.list({ limit: 100 }),
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsService.list({ limit: 100 }),
  });

  const documents = (docsData?.items ?? []) as DocRecord[];
  const projects = (projectsData?.items ?? []) as Project[];

  // ── Mutations
  const saveMutation = useMutation({
    mutationFn: (data: CreateDocumentPayload) => documentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setShowForm(false);
      setForm(defaultForm);
    },
  });

  // ── Helpers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadService.file(file, "documents");
      const fileUrl = result.secureUrl ?? result.url ?? "";
      setForm((f) => ({
        ...f,
        fileUrl,
        fileSize: file.size,
        fileType: detectFileType(file),
        documentName: f.documentName || file.name,
      }));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    const payload: CreateDocumentPayload = {
      documentName: form.documentName,
      sourceType: form.sourceType,
      sourceId: form.sourceId,
      fileUrl: form.fileUrl,
      fileType: form.fileType,
      fileSize: form.fileSize,
      description: form.description || undefined,
    };
    saveMutation.mutate(payload);
  };

  // ── Filtering
  const filtered = documents.filter((d) => {
    const matchSearch =
      !search || d.documentName?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.fileType === typeFilter;
    const matchSource = sourceFilter === "all" || d.sourceType === sourceFilter;
    const matchProj = projectFilter === "all" || d.sourceId === projectFilter;
    return matchSearch && matchType && matchSource && matchProj;
  });

  // ── Columns
  const columns = [
    {
      header: "Name",
      cell: (row: DocRecord) => (
        <div className="flex items-center gap-2">
          {isImage(row.fileUrl) ? (
            <img
              src={row.fileUrl}
              className="w-8 h-8 rounded object-cover border border-border shrink-0"
              alt={row.documentName}
            />
          ) : (
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{row.documentName}</p>
            <p className="text-xs text-muted-foreground">
              {row.fileType ?? "—"}
              {row.fileSize ? ` • ${(row.fileSize / 1024).toFixed(0)} KB` : ""}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Source",
      cell: (row: DocRecord) =>
        row.sourceType ? (
          <Badge variant="outline" className="text-xs capitalize">
            {row.sourceType.replace(/_/g, " ")}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      header: "Date",
      cell: (row: DocRecord) =>
        row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "—",
    },
    {
      header: "",
      cell: (row: DocRecord) => (
        <div className="flex gap-1">
          {row.fileUrl && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPreviewDoc(row)}
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <a
                href={row.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </a>
            </>
          )}
        </div>
      ),
    },
  ];

  // ── Render
  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        subtitle={`${documents.length} documents`}
        onAdd={() => {
          setForm(defaultForm);
          setShowForm(true);
        }}
        addLabel="Add Document"
        searchValue={search}
        onSearch={setSearch}
      >
        {/* Source filter */}
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-36 bg-card">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="project">Project</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="nc">Non Conformity</SelectItem>
            <SelectItem value="purchase_order">Purchase Order</SelectItem>
            <SelectItem value="attachment">Attachment</SelectItem>
          </SelectContent>
        </Select>

        {/* Type filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="xlsx">Excel</SelectItem>
            <SelectItem value="docx">Word</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Project filter */}
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <DataTable columns={columns} data={filtered} isLoading={isLoading} />

      {/* ── Preview Dialog */}
      {previewDoc && (
        <FormDialog
          open={!!previewDoc}
          onOpenChange={() => setPreviewDoc(null)}
          title={previewDoc.documentName ?? "Document"}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                <span className="font-medium capitalize">
                  {previewDoc.fileType ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Source:</span>{" "}
                <span className="font-medium capitalize">
                  {previewDoc.sourceType?.replace(/_/g, " ") ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Size:</span>{" "}
                <span className="font-medium">
                  {previewDoc.fileSize
                    ? `${(previewDoc.fileSize / 1024).toFixed(0)} KB`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>{" "}
                <span className="font-medium">
                  {previewDoc.createdAt
                    ? format(new Date(previewDoc.createdAt), "MMM d, yyyy")
                    : "—"}
                </span>
              </div>
            </div>

            {previewDoc.description && (
              <div className="p-3 rounded-lg bg-muted/30 text-sm">
                {previewDoc.description}
              </div>
            )}

            {previewDoc.fileUrl && (
              <div className="rounded-lg border border-border overflow-hidden">
                {isImage(previewDoc.fileUrl) ? (
                  <img
                    src={previewDoc.fileUrl}
                    className="w-full max-h-96 object-contain"
                    alt={previewDoc.documentName}
                  />
                ) : (
                  <div className="p-6 text-center bg-muted/20">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Preview not available for this file type.
                    </p>
                    <a
                      href={previewDoc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="gap-2">
                        <ExternalLink className="w-4 h-4" /> Open in new tab
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <a
                href={previewDoc.fileUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </a>
            </div>
          </div>
        </FormDialog>
      )}

      {/* ── Add Document Form */}
      <FormDialog
        open={showForm}
        onOpenChange={setShowForm}
        title="Add Document"
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Document Name */}
          <div className="col-span-2">
            <Label>Document Name *</Label>
            <Input
              value={form.documentName}
              onChange={(e) =>
                setForm({ ...form, documentName: e.target.value })
              }
            />
          </div>

          {/* Source Type */}
          <div>
            <Label>Source Type *</Label>
            <Select
              value={form.sourceType}
              onValueChange={(v) =>
                setForm({ ...form, sourceType: v as SourceType, sourceId: "" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="nc">Non Conformity</SelectItem>
                <SelectItem value="purchase_order">Purchase Order</SelectItem>
                <SelectItem value="attachment">Attachment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source ID — project picker or free text */}
          <div>
            <Label>
              {form.sourceType === "project" ? "Project *" : "Source ID *"}
            </Label>
            {form.sourceType === "project" ? (
              <Select
                value={form.sourceId}
                onValueChange={(v) => setForm({ ...form, sourceId: v })}
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
            ) : (
              <Input
                value={form.sourceId}
                onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
                placeholder="UUID of the source record"
              />
            )}
          </div>

          {/* File upload */}
          <div className="col-span-2">
            <Label>File *</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/30 text-sm text-muted-foreground">
                <Upload className="w-4 h-4" />
                {uploading
                  ? "Uploading..."
                  : form.fileUrl
                    ? "Replace file"
                    : "Upload file"}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              {form.fileUrl && (
                <a
                  href={form.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> View
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="col-span-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saveMutation.isPending ||
                !form.documentName ||
                !form.fileUrl ||
                !form.sourceId
              }
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
