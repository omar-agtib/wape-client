import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import {
  Upload,
  File,
  Image,
  Trash2,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { uploadService } from "../../services/wape.service";
import type { UploadResult } from "../../types/api";

type UploadFolder =
  | "documents"
  | "nc-images"
  | "nc-plans"
  | "contact-documents"
  | "supplier-invoices"
  | "avatars";
type UploadMode = "file" | "image";

interface UploadedFile {
  name: string;
  url: string;
  publicId: string;
  size: number;
  format: string;
}

interface FileUploadProps {
  folder: UploadFolder;
  mode?: UploadMode;
  onUpload: (result: UploadedFile) => void;
  onError?: (message: string) => void;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  hint?: string;
  className?: string;
  value?: string; // existing URL (edit mode)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  folder,
  mode = "file",
  onUpload,
  onError,
  accept,
  maxSizeMb = 50,
  label,
  hint,
  className,
  value,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    if (file.size > maxSizeMb * 1024 * 1024) {
      const msg = `File exceeds ${maxSizeMb}MB limit`;
      setError(msg);
      onError?.(msg);
      return;
    }

    setUploading(true);
    try {
      const result = (await (mode === "image"
        ? uploadService.image(file, folder)
        : uploadService.file(file, folder))) as UploadResult;

      const uploaded: UploadedFile = {
        name: result.originalFilename,
        url: result.secureUrl,
        publicId: result.publicId,
        size: result.bytes,
        format: result.format,
      };
      setUploaded(uploaded);
      onUpload(uploaded);
    } catch {
      const msg = "Upload failed. Please try again.";
      setError(msg);
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const defaultAccept =
    mode === "image"
      ? "image/jpeg,image/png,image/webp"
      : "application/pdf,.doc,.docx,.xlsx,.xls";

  // If already uploaded or has existing value — show result
  if (uploaded || value) {
    const url = uploaded?.url ?? value ?? "";
    const isImage = mode === "image" || /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <p className="text-sm font-medium text-foreground">{label}</p>
        )}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-success/40 bg-success/5">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
            {isImage ? (
              <Image className="w-5 h-5 text-success" />
            ) : (
              <File className="w-5 h-5 text-success" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {uploaded?.name ?? "File uploaded"}
            </p>
            {uploaded && (
              <p className="text-xs text-muted-foreground">
                {formatBytes(uploaded.size)} · {uploaded.format.toUpperCase()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle className="w-5 h-5 text-success" />
            <button
              onClick={() => {
                setUploaded(null);
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-2",
          "rounded-xl border-2 border-dashed p-8 cursor-pointer",
          "transition-all duration-150",
          dragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-70",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept ?? defaultAccept}
          onChange={onChange}
        />

        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              {mode === "image" ? (
                <Image className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drop your file here, or{" "}
                <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hint ??
                  `Max ${maxSizeMb}MB · ${mode === "image" ? "JPG, PNG, WebP" : "PDF, DOCX, XLSX"}`}
              </p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-xs text-destructive">⚠ {error}</p>}
    </div>
  );
}
