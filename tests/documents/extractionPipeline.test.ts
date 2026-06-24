import assert from "node:assert/strict";
import test from "node:test";

import { runDocumentExtraction } from "../../lib/documents/extractionPipeline.ts";
import type { Document, DocumentExtraction } from "../../types/database.ts";

function buildDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: "doc-123",
    company_id: "company-123",
    source_type: "web_upload",
    source_channel_id: "admin_upload",
    source_user_id: null,
    original_file_name: "receipt.png",
    mime_type: "image/png",
    storage_bucket: "documents",
    storage_path: "companies/company-123/documents/2026/06/doc-123.png",
    document_type: "unknown",
    status: "received",
    received_at: "2026-06-25T00:00:00.000Z",
    created_at: "2026-06-25T00:00:00.000Z",
    updated_at: "2026-06-25T00:00:00.000Z",
    ...overrides,
  };
}

function buildExtractionRecord(): DocumentExtraction {
  return {
    id: "extract-123",
    document_id: "doc-123",
    model_name: "gpt-4.1-mini",
    raw_text: "Receipt summary",
    extracted_payload: {},
    confidence_score: 0.91,
    warnings: [],
    created_at: "2026-06-25T00:05:00.000Z",
  };
}

test("runDocumentExtraction downloads the file, creates an extraction, updates the document, and writes an audit log", async () => {
  const calls = {
    status: [] as string[],
    type: [] as string[],
    audit: [] as Array<Record<string, unknown>>,
  };

  const result = await runDocumentExtraction("doc-123", {
    getDocumentById: async () => buildDocument(),
    downloadDocumentFile: async () => Buffer.from([1, 2, 3]),
    extractDocumentWithAI: async () => ({
      modelName: "gpt-4.1-mini",
      rawTextSummary: "Receipt summary",
      warnings: [],
      extractionResult: {
        document_type: "receipt",
        expense_date: "2026-06-24",
        payment_date: null,
        vendor: "Vendor A",
        vendor_tax_id: null,
        description: "Printer ink",
        amount_before_vat: 100,
        vat_amount: 7,
        withholding_tax: 0,
        net_amount: 107,
        currency: "THB",
        payment_method: "cash",
        bank_name: null,
        transfer_ref: null,
        category_suggestion: "office_expense",
        confidence_score: 0.91,
        warnings: [],
        extracted_text_summary: "Receipt summary",
      },
    }),
    createDocumentExtraction: async (input) => {
      assert.equal(input.documentId, "doc-123");
      assert.equal(input.modelName, "gpt-4.1-mini");
      return {
        ...buildExtractionRecord(),
        extracted_payload: input.extractedPayload ?? {},
        warnings: input.warnings ?? [],
      };
    },
    updateDocumentStatus: async (_documentId, status) => {
      calls.status.push(status);
      return buildDocument({ status });
    },
    updateDocumentType: async (_documentId, documentType) => {
      calls.type.push(documentType);
      return buildDocument({ status: "extracted", document_type: documentType });
    },
    addAuditLog: async (input) => {
      calls.audit.push(input as unknown as Record<string, unknown>);
      return {} as never;
    },
  });

  assert.equal(result.document.status, "extracted");
  assert.equal(result.document.document_type, "receipt");
  assert.equal(result.extraction.id, "extract-123");
  assert.deepEqual(calls.status, ["extracted"]);
  assert.deepEqual(calls.type, ["receipt"]);
  assert.equal(calls.audit.length, 1);
  assert.equal(calls.audit[0]?.action, "ai_extraction_run");
});

test("runDocumentExtraction does not overwrite document_type when AI returns unknown", async () => {
  const updatedTypes: string[] = [];

  const result = await runDocumentExtraction("doc-123", {
    getDocumentById: async () => buildDocument({ document_type: "slip" }),
    downloadDocumentFile: async () => Buffer.from([1, 2, 3]),
    extractDocumentWithAI: async () => ({
      modelName: "gpt-4.1-mini",
      rawTextSummary: "Unable to classify",
      warnings: ["uncertain type"],
      extractionResult: {
        document_type: "unknown",
        expense_date: null,
        payment_date: null,
        vendor: null,
        vendor_tax_id: null,
        description: null,
        amount_before_vat: null,
        vat_amount: null,
        withholding_tax: null,
        net_amount: null,
        currency: "THB",
        payment_method: "unknown",
        bank_name: null,
        transfer_ref: null,
        category_suggestion: null,
        confidence_score: 0.4,
        warnings: ["uncertain type"],
        extracted_text_summary: "Unable to classify",
      },
    }),
    createDocumentExtraction: async () => buildExtractionRecord(),
    updateDocumentStatus: async (_documentId, status) => buildDocument({ status, document_type: "slip" }),
    updateDocumentType: async (_documentId, documentType) => {
      updatedTypes.push(documentType);
      return buildDocument({ status: "extracted", document_type: documentType });
    },
    addAuditLog: async () => ({} as never),
  });

  assert.equal(result.document.document_type, "slip");
  assert.deepEqual(updatedTypes, []);
});

test("runDocumentExtraction surfaces missing documents clearly", async () => {
  await assert.rejects(
    () =>
      runDocumentExtraction("missing-doc", {
        getDocumentById: async () => null,
      }),
    /not found/i,
  );
});
