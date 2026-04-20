// ── Types ─────────────────────────────────────────────────────────────────────

import { documentsService, uploadService } from "@/services/wape.service";

interface UploadAndRegisterOptions {
  module?: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  docType?: "pdf" | "image" | "xlsx" | "docx" | "other";
  sourceType?:
    | "project"
    | "task"
    | "contact"
    | "nc"
    | "purchase_order"
    | "attachment";
  sourceId?: string;
  description?: string;
}

interface UploadResult {
  fileUrl: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Uploads a file to Cloudinary and registers it in the documents repository.
 * Returns { fileUrl }
 */
export async function uploadAndRegister(
  file: File,
  options: UploadAndRegisterOptions = {},
): Promise<UploadResult> {
  const {
    module = "upload",
    sourceType = "project",
    sourceId,
    docType = "other",
    description,
  } = options;

  // 1. Upload file to Cloudinary
  const uploaded = await uploadService.file(file, "documents");
  const fileUrl = uploaded.secureUrl ?? "";

  // 2. Register in documents if we have a sourceId
  if (sourceId) {
    await documentsService.create({
      sourceType,
      sourceId,
      documentName: file.name,
      fileUrl,
      fileType: docType,
      fileSize: file.size,
      description: description ?? `Auto-imported from ${module}`,
    });
  }

  return { fileUrl };
}
