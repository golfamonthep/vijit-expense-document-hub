import { extractDocumentWithAI } from "../ai/extractDocument.ts";
import type { Document, DocumentExtraction, DocumentType } from "../../types/database.ts";
import type { AddAuditLogInput } from "../repositories/auditLogs.ts";
import type { CreateDocumentExtractionInput } from "../repositories/documentExtractions.ts";

export type RunDocumentExtractionResult = {
  document: Document;
  extraction: DocumentExtraction;
  warnings: string[];
};

export type RunDocumentExtractionDeps = {
  getDocumentById: (documentId: string) => Promise<Document | null>;
  downloadDocumentFile: (input: { bucket: string; path: string }) => Promise<Buffer>;
  extractDocumentWithAI: typeof extractDocumentWithAI;
  createDocumentExtraction: (
    input: CreateDocumentExtractionInput,
  ) => Promise<DocumentExtraction>;
  updateDocumentStatus: (documentId: string, status: Document["status"]) => Promise<Document>;
  updateDocumentType: (documentId: string, documentType: DocumentType) => Promise<Document>;
  addAuditLog: (input: AddAuditLogInput) => Promise<unknown>;
};

const defaultDeps: RunDocumentExtractionDeps = {
  getDocumentById: async (documentId) => {
    const documentsRepository = await import("../repositories/documents.ts");
    return documentsRepository.getDocumentById(documentId);
  },
  downloadDocumentFile: async (input) => {
    const documentStorage = await import("../storage/documents.ts");
    return documentStorage.downloadDocumentFile(input);
  },
  extractDocumentWithAI,
  createDocumentExtraction: async (input) => {
    const documentExtractionsRepository = await import(
      "../repositories/documentExtractions.ts"
    );
    return documentExtractionsRepository.createDocumentExtraction(input);
  },
  updateDocumentStatus: async (documentId, status) => {
    const documentsRepository = await import("../repositories/documents.ts");
    return documentsRepository.updateDocumentStatus(documentId, status);
  },
  updateDocumentType: async (documentId, documentType) => {
    const documentsRepository = await import("../repositories/documents.ts");
    return documentsRepository.updateDocumentType(documentId, documentType);
  },
  addAuditLog: async (input) => {
    const auditLogsRepository = await import("../repositories/auditLogs.ts");
    return auditLogsRepository.addAuditLog(input);
  },
};

export async function runDocumentExtraction(
  documentId: string,
  deps: Partial<RunDocumentExtractionDeps> = {},
): Promise<RunDocumentExtractionResult> {
  const resolvedDeps = { ...defaultDeps, ...deps };
  const document = await resolvedDeps.getDocumentById(documentId);

  if (!document) {
    throw new Error(`Document not found: ${documentId}.`);
  }

  const fileBuffer = await resolvedDeps.downloadDocumentFile({
    bucket: document.storage_bucket,
    path: document.storage_path,
  });

  const extractionResult = await resolvedDeps.extractDocumentWithAI({
    documentId: document.id,
    companyId: document.company_id,
    mimeType: document.mime_type,
    fileName: document.original_file_name,
    fileBuffer,
  });

  const extraction = await resolvedDeps.createDocumentExtraction({
    documentId: document.id,
    modelName: extractionResult.modelName,
    rawText: extractionResult.rawTextSummary,
    extractedPayload: extractionResult.extractionResult,
    confidenceScore: extractionResult.extractionResult.confidence_score,
    warnings: extractionResult.warnings,
  });

  let updatedDocument = await resolvedDeps.updateDocumentStatus(document.id, "extracted");

  if (extractionResult.extractionResult.document_type !== "unknown") {
    updatedDocument = await resolvedDeps.updateDocumentType(
      document.id,
      extractionResult.extractionResult.document_type,
    );
  }

  await resolvedDeps.addAuditLog({
    companyId: document.company_id,
    actorLineUserId: null,
    action: "ai_extraction_run",
    entityType: "document",
    entityId: document.id,
    payload: {
      modelName: extractionResult.modelName,
      documentType: extractionResult.extractionResult.document_type,
      confidenceScore: extractionResult.extractionResult.confidence_score,
      warningCount: extractionResult.warnings.length,
    },
  });

  return {
    document: updatedDocument,
    extraction,
    warnings: extractionResult.warnings,
  };
}
