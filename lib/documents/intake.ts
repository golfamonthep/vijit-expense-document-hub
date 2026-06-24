import type { Document, DocumentType } from "../../types/database.ts";
import { getDocumentsBucket } from "../env.ts";
import {
  addAuditLog as addAuditLogRepository,
  type AddAuditLogInput,
} from "../repositories/auditLogs.ts";
import {
  createDocument as createDocumentRepository,
  type CreateDocumentInput,
} from "../repositories/documents.ts";
import {
  buildDocumentStoragePath,
  uploadDocumentFile as uploadDocumentFileToStorage,
} from "../storage/documents.ts";

export type CreateDocumentFromLineMessageInput = {
  companyId: string;
  sourceType: "line";
  sourceChannelId?: string | null;
  sourceUserId?: string | null;
  messageId: string;
  originalFileName?: string | null;
  mimeType?: string | null;
  arrayBuffer: ArrayBuffer;
  documentType: DocumentType;
};

type CreateDocumentFromLineMessageDeps = {
  generateDocumentId: () => string;
  getDocumentsBucket: () => string;
  uploadDocumentFile: (input: {
    bucket: string;
    path: string;
    arrayBuffer: ArrayBuffer;
    contentType: string;
  }) => Promise<void>;
  createDocument: (input: CreateDocumentInput) => Promise<Document>;
  addAuditLog: (input: AddAuditLogInput) => Promise<unknown>;
  now: () => Date;
};

const defaultDeps: CreateDocumentFromLineMessageDeps = {
  generateDocumentId: () => crypto.randomUUID(),
  getDocumentsBucket,
  uploadDocumentFile: uploadDocumentFileToStorage,
  createDocument: createDocumentRepository,
  addAuditLog: addAuditLogRepository,
  now: () => new Date(),
};

function inferStorageExtension(
  mimeType: string | null | undefined,
  fileName: string | null | undefined,
): string {
  switch (mimeType?.toLowerCase()) {
    case "application/pdf":
      return ".pdf";
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/heic":
    case "image/heif":
      return ".heic";
    default:
      return fileName?.toLowerCase().endsWith(".pdf") ? ".pdf" : ".bin";
  }
}

export async function createDocumentFromLineMessage(
  input: CreateDocumentFromLineMessageInput,
  deps: Partial<CreateDocumentFromLineMessageDeps> = {},
): Promise<Document> {
  const resolvedDeps = { ...defaultDeps, ...deps };
  const documentId = resolvedDeps.generateDocumentId();
  const bucket = resolvedDeps.getDocumentsBucket();
  const receivedAt = resolvedDeps.now().toISOString();
  const storagePath = buildDocumentStoragePath({
    companyId: input.companyId,
    documentId,
    extension: inferStorageExtension(input.mimeType, input.originalFileName),
    receivedAt,
  });
  const mimeType = input.mimeType ?? "application/octet-stream";

  await resolvedDeps.uploadDocumentFile({
    bucket,
    path: storagePath,
    arrayBuffer: input.arrayBuffer,
    contentType: mimeType,
  });

  const document = await resolvedDeps.createDocument({
    id: documentId,
    companyId: input.companyId,
    sourceType: input.sourceType,
    sourceChannelId: input.sourceChannelId ?? null,
    sourceUserId: input.sourceUserId ?? null,
    originalFileName: input.originalFileName ?? null,
    mimeType,
    storageBucket: bucket,
    storagePath,
    documentType: input.documentType,
    status: "received",
    receivedAt,
  });

  await resolvedDeps.addAuditLog({
    companyId: input.companyId,
    actorLineUserId: input.sourceUserId ?? null,
    action: "line_document_saved",
    entityType: "document",
    entityId: document.id,
    payload: {
      sourceType: input.sourceType,
      sourceChannelId: input.sourceChannelId ?? null,
      messageId: input.messageId,
      storageBucket: bucket,
      storagePath,
      documentType: input.documentType,
    },
  });

  return document;
}
