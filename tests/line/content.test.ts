import assert from "node:assert/strict";
import test from "node:test";

import {
  inferDocumentTypeFromLineMessage,
  inferFileExtensionFromContentType,
} from "../../lib/line/content.ts";

test("inferFileExtensionFromContentType maps known content types and falls back to .bin", () => {
  assert.equal(inferFileExtensionFromContentType("application/pdf"), ".pdf");
  assert.equal(inferFileExtensionFromContentType("image/jpeg"), ".jpg");
  assert.equal(inferFileExtensionFromContentType("image/png"), ".png");
  assert.equal(inferFileExtensionFromContentType("application/octet-stream"), ".bin");
  assert.equal(inferFileExtensionFromContentType(null), ".bin");
});

test("inferDocumentTypeFromLineMessage returns pdf only for obvious pdf file inputs", () => {
  assert.equal(
    inferDocumentTypeFromLineMessage({
      messageType: "file",
      contentType: "application/pdf",
      originalFileName: "receipt.bin",
    }),
    "pdf",
  );

  assert.equal(
    inferDocumentTypeFromLineMessage({
      messageType: "file",
      contentType: "application/octet-stream",
      originalFileName: "receipt.PDF",
    }),
    "pdf",
  );

  assert.equal(
    inferDocumentTypeFromLineMessage({
      messageType: "image",
      contentType: "image/jpeg",
      originalFileName: null,
    }),
    "other",
  );

  assert.equal(
    inferDocumentTypeFromLineMessage({
      messageType: "file",
      contentType: "application/octet-stream",
      originalFileName: "receipt.zip",
    }),
    "other",
  );
});
