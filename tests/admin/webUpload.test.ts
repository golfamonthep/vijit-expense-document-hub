import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_WEB_UPLOAD_FILE_SIZE_BYTES,
  buildWebUploadSuccessPayload,
  validateAdminUploadSecret,
  validateWebUploadFile,
} from "../../lib/admin/webUpload.ts";

test("validateWebUploadFile rejects files larger than 10 MB", () => {
  const result = validateWebUploadFile({
    size: MAX_WEB_UPLOAD_FILE_SIZE_BYTES + 1,
    type: "image/png",
    name: "too-large.png",
  });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    error: "file_too_large",
    message: "File size must be 10 MB or less.",
  });
});

test("validateWebUploadFile rejects unsupported mime types", () => {
  const result = validateWebUploadFile({
    size: 1024,
    type: "application/javascript",
    name: "script.js",
  });

  assert.deepEqual(result, {
    ok: false,
    status: 400,
    error: "unsupported_file_type",
    message: "Supported file types are JPEG, PNG, WEBP, and PDF.",
  });
});

test("validateAdminUploadSecret requires an exact match when ADMIN_SECRET is configured", () => {
  const result = validateAdminUploadSecret({
    configuredSecret: "top-secret",
    submittedSecret: "wrong-secret",
  });

  assert.deepEqual(result, {
    ok: false,
    status: 401,
    error: "invalid_admin_secret",
    message: "Invalid admin secret.",
  });
});

test("validateAdminUploadSecret allows upload when ADMIN_SECRET is not configured", () => {
  const result = validateAdminUploadSecret({
    configuredSecret: undefined,
    submittedSecret: "",
  });

  assert.deepEqual(result, {
    ok: true,
    warning: "ADMIN_SECRET is not configured. Upload protection is disabled for this environment.",
  });
});

test("buildWebUploadSuccessPayload returns the expected response shape", () => {
  const result = buildWebUploadSuccessPayload({
    documentId: "doc-123",
    documentType: "receipt",
    originalFileName: "receipt.pdf",
    status: "received",
    warning: "ADMIN_SECRET is not configured. Upload protection is disabled for this environment.",
  });

  assert.deepEqual(result, {
    ok: true,
    documentId: "doc-123",
    documentType: "receipt",
    originalFileName: "receipt.pdf",
    status: "received",
    warning: "ADMIN_SECRET is not configured. Upload protection is disabled for this environment.",
  });
});
