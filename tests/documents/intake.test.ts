import assert from "node:assert/strict";
import test from "node:test";

import {
  createDocumentFromLineMessage,
  createDocumentFromWebUpload,
} from "../../lib/documents/intake.ts";
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

test("createDocumentFromWebUpload uploads content, creates a document row, and writes an audit log", async () => {
  const uploads: Array<{ bucket: string; path: string; contentType: string }> = [];
  const createdDocuments: Array<Record<string, unknown>> = [];
  const auditEntries: Array<Record<string, unknown>> = [];

  const createdDocument: Document = {
    id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    company_id: "company-123",
    source_type: "web_upload",
    source_channel_id: "admin_upload",
    source_user_id: null,
    original_file_name: "slip.png",
    mime_type: "image/png",
    storage_bucket: "documents",
    storage_path: "companies/company-123/documents/2026/06/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png",
    document_type: "slip",
    status: "received",
    received_at: "2026-06-24T11:00:00.000Z",
    created_at: "2026-06-24T11:00:00.000Z",
    updated_at: "2026-06-24T11:00:00.000Z",
  };

  const result = await createDocumentFromWebUpload(
    {
      companyId: "company-123",
      sourceType: "web_upload",
      sourceChannelId: "admin_upload",
      sourceUserId: null,
      originalFileName: "slip.png",
      mimeType: "image/png",
      arrayBuffer: new Uint8Array([1, 2, 3]).buffer,
      documentType: "slip",
      note: "Uploaded from admin page",
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
      now: () => new Date("2026-06-24T11:00:00.000Z"),
    },
  );

  assert.equal(result.id, createdDocument.id);
  assert.deepEqual(uploads, [
    {
      bucket: "documents",
      path: "companies/company-123/documents/2026/06/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png",
      contentType: "image/png",
    },
  ]);
  assert.equal(createdDocuments.length, 1);
  assert.equal(createdDocuments[0]?.id, createdDocument.id);
  assert.equal(auditEntries.length, 1);
  assert.equal(auditEntries[0]?.action, "web_document_uploaded");
  assert.deepEqual(auditEntries[0]?.payload, {
    sourceType: "web_upload",
    sourceChannelId: "admin_upload",
    storageBucket: "documents",
    storagePath: "companies/company-123/documents/2026/06/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.png",
    documentType: "slip",
    note: "Uploaded from admin page",
  });
});
