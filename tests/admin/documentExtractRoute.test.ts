import assert from "node:assert/strict";
import test from "node:test";

import {
  POST,
  createAdminDocumentExtractHandler,
} from "../../app/api/admin/documents/[id]/extract/route.ts";
import { MissingServerEnvError } from "../../lib/env.ts";
import type { Document, DocumentExtraction } from "../../types/database.ts";

function buildDocumentStub(): Document {
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
    document_type: "receipt",
    status: "extracted",
    received_at: "2026-06-25T00:00:00.000Z",
    created_at: "2026-06-25T00:00:00.000Z",
    updated_at: "2026-06-25T00:00:00.000Z",
  };
}

function buildExtractionStub(): DocumentExtraction {
  return {
    id: "extract-123",
    document_id: "doc-123",
    model_name: "gpt-4.1-mini",
    raw_text: "Receipt summary",
    extracted_payload: {},
    confidence_score: 0.92,
    warnings: [],
    created_at: "2026-06-25T00:01:00.000Z",
  };
}

test("createAdminDocumentExtractHandler returns success payload for a protected extraction request", async () => {
  const handler = createAdminDocumentExtractHandler({
    getEnv: () => ({ adminSecret: "top-secret" }),
    validateAdminSecret: () => ({ ok: true }),
    runDocumentExtraction: async () => ({
      document: buildDocumentStub(),
      extraction: buildExtractionStub(),
      warnings: [],
    }),
  });

  const request = new Request("http://localhost/api/admin/documents/doc-123/extract", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ admin_secret: "top-secret" }),
  });

  const response = await handler(request, {
    params: Promise.resolve({ id: "doc-123" }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    document_id: "doc-123",
    status: "extracted",
    document_type: "receipt",
    confidence_score: 0.92,
    warnings: [],
  });
});

test("createAdminDocumentExtractHandler returns 401 for an invalid admin secret", async () => {
  const handler = createAdminDocumentExtractHandler({
    getEnv: () => ({ adminSecret: "top-secret" }),
    validateAdminSecret: () => ({
      ok: false,
      status: 401,
      error: "invalid_admin_secret",
      message: "Invalid admin secret.",
    }),
    runDocumentExtraction: async () => {
      throw new Error("should not run");
    },
  });

  const response = await handler(
    new Request("http://localhost/api/admin/documents/doc-123/extract", {
      method: "POST",
      body: JSON.stringify({ admin_secret: "wrong-secret" }),
    }),
    {
      params: Promise.resolve({ id: "doc-123" }),
    },
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "invalid_admin_secret",
    message: "Invalid admin secret.",
  });
});

test("createAdminDocumentExtractHandler returns a safe 503 when runtime env is missing", async () => {
  const handler = createAdminDocumentExtractHandler({
    getEnv: () => ({ adminSecret: undefined }),
    validateAdminSecret: () => ({ ok: true }),
    runDocumentExtraction: async () => {
      throw new MissingServerEnvError(["OPENAI_API_KEY"], "OpenAI extraction");
    },
  });

  const response = await handler(
    new Request("http://localhost/api/admin/documents/doc-123/extract", {
      method: "POST",
      body: JSON.stringify({}),
    }),
    {
      params: Promise.resolve({ id: "doc-123" }),
    },
  );

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    ok: false,
    error: "extraction_not_configured",
    message:
      "Missing required server environment variables for OpenAI extraction: OPENAI_API_KEY. Update .env.example-backed local env values before calling this runtime path.",
  });
});

test("POST delegates to the default admin document extract handler", async () => {
  process.env.ADMIN_SECRET = "top-secret";

  const originalJson = globalThis.JSON.parse;
  try {
    const response = await POST(
      new Request("http://localhost/api/admin/documents/doc-123/extract", {
        method: "POST",
        body: JSON.stringify({ admin_secret: "wrong-secret" }),
      }),
      { params: Promise.resolve({ id: "doc-123" }) },
    );

    assert.equal(response.status, 401);
  } finally {
    globalThis.JSON.parse = originalJson;
    delete process.env.ADMIN_SECRET;
  }
});
