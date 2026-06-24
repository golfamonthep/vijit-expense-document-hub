import { NextResponse } from "next/server";

import {
  buildWebUploadSuccessPayload,
  isDocumentType,
  validateAdminUploadSecret,
  validateWebUploadFile,
} from "@/lib/admin/webUpload";
import { createDocumentFromWebUpload } from "@/lib/documents/intake";
import { MissingServerEnvError, getOptionalServerEnv } from "@/lib/env";
import { ensureDefaultCompany } from "@/lib/repositories/companies";

export const runtime = "nodejs";

function jsonError(status: number, error: string, message: string) {
  return NextResponse.json({ ok: false, error, message }, { status });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const fileValue = formData.get("file");
  const documentTypeValue = String(formData.get("document_type") ?? "unknown");
  const noteValue = String(formData.get("note") ?? "").trim();
  const adminSecretValue = String(formData.get("admin_secret") ?? "");

  const env = getOptionalServerEnv();
  const secretValidation = validateAdminUploadSecret({
    configuredSecret: env.adminSecret,
    submittedSecret: adminSecretValue,
  });

  if (!secretValidation.ok) {
    return jsonError(
      secretValidation.status,
      secretValidation.error,
      secretValidation.message,
    );
  }

  if (!(fileValue instanceof File)) {
    return jsonError(400, "missing_file", "Please choose a file to upload.");
  }

  if (!isDocumentType(documentTypeValue)) {
    return jsonError(400, "invalid_document_type", "Unsupported document type.");
  }

  const fileValidation = validateWebUploadFile({
    size: fileValue.size,
    type: fileValue.type,
    name: fileValue.name,
  });

  if (!fileValidation.ok) {
    return jsonError(
      fileValidation.status,
      fileValidation.error,
      fileValidation.message,
    );
  }

  try {
    const company = await ensureDefaultCompany();
    const document = await createDocumentFromWebUpload({
      companyId: company.id,
      sourceType: "web_upload",
      sourceChannelId: "admin_upload",
      sourceUserId: null,
      originalFileName: fileValue.name,
      mimeType: fileValidation.normalizedMimeType,
      arrayBuffer: await fileValue.arrayBuffer(),
      documentType: documentTypeValue,
      note: noteValue || null,
    });

    return NextResponse.json(
      buildWebUploadSuccessPayload({
        documentId: document.id,
        documentType: document.document_type,
        originalFileName: document.original_file_name ?? fileValue.name,
        status: document.status,
        warning: secretValidation.warning,
      }),
    );
  } catch (error) {
    if (error instanceof MissingServerEnvError) {
      return jsonError(503, "storage_not_configured", error.message);
    }

    console.error(
      "Failed to upload admin document:",
      error instanceof Error ? error.message : error,
    );
    return jsonError(500, "upload_failed", "Unable to upload document.");
  }
}
