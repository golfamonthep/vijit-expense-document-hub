import assert from "node:assert/strict";
import test from "node:test";

import { createDocumentFromLineMessage } from "../../lib/documents/intake.ts";
import type { Document } from "../../types/database.ts";

test("createDocumentFromLineMessage uploads content, creates a document row, and writes an audit log", async () => {
  const uploads: Array<{ bucket: string; path: string; contentType: string }> = [];
  const createdDocuments: Array<Record<string, unknown>> = [];
  const auditEntries: Array<Record<string, unknown>> = [];

  const createdDocument: Document = {
    id: "11111111-2222-4333-8444-555555555555",
    company_id: "company-123",
    source_type: "line",
    source_channel_id: "group-123",
    source_user_id: "user-456",
    original_file_name: "receipt.pdf",
    mime_type: "application/pdf",
    storage_bucket: "documents",
    storage_path: "companies/company-123/documents/2026/06/11111111-2222-4333-8444-555555555555.pdf",
    document_type: "pdf",
    status: "received",
    received_at: "2026-06-24T10:30:00.000Z",
    created_at: "2026-06-24T10:30:00.000Z",
    updated_at: "2026-06-24T10:30:00.000Z",
  };

  const result = await createDocumentFromLineMessage(
    {
      companyId: "company-123",
      sourceType: "line",
      sourceChannelId: "group-123",
      sourceUserId: "user-456",
      messageId: "line-message-1",
      originalFileName: "receipt.pdf",
      mimeType: "application/pdf",
      arrayBuffer: new Uint8Array([1, 2, 3]).buffer,
      documentType: "pdf",
    },
    {
      generateDocumentId: () => createdDocument.id,
      getDocumentsBucket: () => "documents",
      uploadDocumentFile: async (input) => {
        uploads.push({
          bucket: input.bucket,
          path: input.path,
          contentType: input.contentType,
        });
      },
      createDocument: async (input) => {
        createdDocuments.push(input as unknown as Record<string, unknown>);
        return createdDocument;
      },
      addAuditLog: async (input) => {
        auditEntries.push(input as unknown as Record<string, unknown>);
      },
      now: () => new Date("2026-06-24T10:30:00.000Z"),
    },
  );

  assert.equal(result.id, createdDocument.id);
  assert.deepEqual(uploads, [
    {
      bucket: "documents",
      path: "companies/company-123/documents/2026/06/11111111-2222-4333-8444-555555555555.pdf",
      contentType: "application/pdf",
    },
  ]);
  assert.equal(createdDocuments.length, 1);
  assert.equal(createdDocuments[0]?.id, createdDocument.id);
  assert.equal(auditEntries.length, 1);
  assert.equal(auditEntries[0]?.action, "line_document_saved");
  assert.equal(auditEntries[0]?.entityId, createdDocument.id);
});
