import type { Document, DocumentType, Json } from "../../types/database.ts";
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

type CreateStoredDocumentInput = {
  companyId: string;
  sourceType: "line" | "web_upload";
  sourceChannelId?: string | null;
  sourceUserId?: string | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  arrayBuffer: ArrayBuffer;
  documentType: DocumentType;
  auditAction: "line_document_saved" | "web_document_uploaded";
  buildAuditPayload: (context: {
    bucket: string;
    storagePath: string;
    mimeType: string;
  }) => Json;
};

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

export type CreateDocumentFromWebUploadInput = {
  companyId: string;
  sourceType: "web_upload";
  sourceChannelId?: string | null;
  sourceUserId?: string | null;
  originalFileName: string;
  mimeType: string;
  arrayBuffer: ArrayBuffer;
  documentType: DocumentType;
  note?: string | null;
};

export type CreateStoredDocumentDeps = {
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

const defaultDeps: CreateStoredDocumentDeps = {
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
    case "image/webp":
      return ".webp";
    case "image/heic":
    case "image/heif":
      return ".heic";
    default:
      return fileName?.toLowerCase().endsWith(".pdf") ? ".pdf" : ".bin";
  }
}

async function createStoredDocument(
  input: CreateStoredDocumentInput,
  deps: Partial<CreateStoredDocumentDeps> = {},
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
    action: input.auditAction,
    entityType: "document",
    entityId: document.id,
    payload: input.buildAuditPayload({
      bucket,
      storagePath,
      mimeType,
    }),
  });

  return document;
}

export async function createDocumentFromLineMessage(
  input: CreateDocumentFromLineMessageInput,
  deps: Partial<CreateStoredDocumentDeps> = {},
): Promise<Document> {
  return createStoredDocument(
    {
      ...input,
      auditAction: "line_document_saved",
      buildAuditPayload: ({ bucket, storagePath }) => ({
        sourceType: input.sourceType,
        sourceChannelId: input.sourceChannelId ?? null,
        messageId: input.messageId,
        storageBucket: bucket,
        storagePath,
        documentType: input.documentType,
      }),
    },
    deps,
  );
}

export async function createDocumentFromWebUpload(
  input: CreateDocumentFromWebUploadInput,
  deps: Partial<CreateStoredDocumentDeps> = {},
): Promise<Document> {
  return createStoredDocument(
    {
      ...input,
      auditAction: "web_document_uploaded",
      buildAuditPayload: ({ bucket, storagePath }) => ({
        sourceType: input.sourceType,
        sourceChannelId: input.sourceChannelId ?? null,
        storageBucket: bucket,
        storagePath,
        documentType: input.documentType,
        note: input.note ?? null,
      }),
    },
    deps,
  );
}
