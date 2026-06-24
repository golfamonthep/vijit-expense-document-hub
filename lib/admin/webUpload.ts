import type { DocumentStatus, DocumentType } from "../../types/database.ts";

export const MAX_WEB_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const WEB_UPLOAD_DOCUMENT_TYPES: DocumentType[] = [
  "unknown",
  "slip",
  "receipt",
  "tax_invoice",
  "cash_bill",
  "utility_bill",
  "order_screenshot",
  "pdf",
  "text_note",
  "other",
];

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const SAFE_EXTENSION_TO_MIME_TYPE: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export type WebUploadValidationError = {
  ok: false;
  status: number;
  error: string;
  message: string;
};

export type WebUploadValidationSuccess = {
  ok: true;
  normalizedMimeType: string;
};

export type AdminSecretValidationResult =
  | WebUploadValidationError
  | {
      ok: true;
      warning?: string;
    };

export const ADMIN_SECRET_DISABLED_WARNING =
  "ADMIN_SECRET is not configured. Upload protection is disabled for this environment.";

function getFileExtension(fileName: string): string | null {
  const normalized = fileName.trim().toLowerCase();
  const lastDot = normalized.lastIndexOf(".");

  if (lastDot <= 0) {
    return null;
  }

  return normalized.slice(lastDot);
}

function inferMimeTypeFromFileName(fileName: string): string | null {
  const extension = getFileExtension(fileName);
  return extension ? SAFE_EXTENSION_TO_MIME_TYPE[extension] ?? null : null;
}

export function isDocumentType(value: string): value is DocumentType {
  return WEB_UPLOAD_DOCUMENT_TYPES.includes(value as DocumentType);
}

export function validateWebUploadFile(input: {
  size: number;
  type: string;
  name: string;
}): WebUploadValidationError | WebUploadValidationSuccess {
  if (input.size > MAX_WEB_UPLOAD_FILE_SIZE_BYTES) {
    return {
      ok: false,
      status: 400,
      error: "file_too_large",
      message: "File size must be 10 MB or less.",
    };
  }

  const reportedMimeType = input.type.trim().toLowerCase();
  if (SUPPORTED_MIME_TYPES.has(reportedMimeType)) {
    return {
      ok: true,
      normalizedMimeType: reportedMimeType,
    };
  }

  if (reportedMimeType === "application/octet-stream" || reportedMimeType === "") {
    const inferredMimeType = inferMimeTypeFromFileName(input.name);
    if (inferredMimeType) {
      return {
        ok: true,
        normalizedMimeType: inferredMimeType,
      };
    }
  }

  return {
    ok: false,
    status: 400,
    error: "unsupported_file_type",
    message: "Supported file types are JPEG, PNG, WEBP, and PDF.",
  };
}

export function validateAdminUploadSecret(input: {
  configuredSecret: string | undefined;
  submittedSecret: string;
}): AdminSecretValidationResult {
  if (!input.configuredSecret) {
    return {
      ok: true,
      warning: ADMIN_SECRET_DISABLED_WARNING,
    };
  }

  if (input.submittedSecret !== input.configuredSecret) {
    return {
      ok: false,
      status: 401,
      error: "invalid_admin_secret",
      message: "Invalid admin secret.",
    };
  }

  return { ok: true };
}

export function buildWebUploadSuccessPayload(input: {
  documentId: string;
  documentType: DocumentType;
  originalFileName: string;
  status: DocumentStatus;
  warning?: string;
}) {
  return {
    ok: true as const,
    documentId: input.documentId,
    documentType: input.documentType,
    originalFileName: input.originalFileName,
    status: input.status,
    ...(input.warning ? { warning: input.warning } : {}),
  };
}
